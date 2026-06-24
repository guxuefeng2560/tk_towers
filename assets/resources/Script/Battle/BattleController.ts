import { GameConfig, DebugConfig } from "../Core/GameConfig";
import { GamePhase } from "../Core/GameDefines";
import GameRuntime from "../Core/GameRuntime";
import { MonsterKind, MonsterRuntime, SkillType } from "../Entity/EntityTypes";
import { clamp, distance, randomRange, rectIntersects, rotateVector } from "../Util/MathUtil";
import { BattleViewData } from "../UI/BattleView";
import CameraFollow from "./CameraFollow";
import SkillController from "../Skill/SkillController";

interface BattleCallbacks {
    onNeedQuestion: (skillType: SkillType, cost: number) => void;
    onBattleFinished: (isWin: boolean) => void;
}

export default class BattleController {
    private static readonly BOSS_ONLY_BULLET_COUNT = 0;
    private static readonly SEARCH_MOVE_SPEED_MULTIPLIER = 2;
    private static readonly MONSTER_LANE_OFFSETS = [-20, 0, 20];
    private static readonly MONSTER_LANE_MIN_SPACING = 30;
    private static readonly MONSTER_CAR_CONTACT_SHRINK = 10;
    private static readonly MONSTER_STACK_JUMP_CHANCE = 0.5;
    private static readonly MONSTER_STACK_JUMP_DURATION = 0.8;
    private static readonly MONSTER_STACK_JUMP_ARC_HEIGHT = 22;
    private static readonly MONSTER_STACK_Y_OFFSET = 46;
    private static readonly MONSTER_STACK_FALL_SPEED = 280;
    private static readonly MONSTER_KNOCKBACK_DECAY = 9;
    private static readonly MONSTER_KNOCKBACK_MIN_SPEED = 18;
    private static readonly ROLLER_KNOCKBACK_X = 180;
    private static readonly ROLLER_KNOCKBACK_Y = 55;
    private static readonly BOMB_KNOCKBACK_SPEED = 220;
    private static readonly DEFENSE_DAMAGE_MULTIPLIER = 0.2;
    private static readonly BOSS_PRE_SPAWN_SPACING = 90;
    private static readonly BOSS_PRE_SPAWN_INTERVAL = 0.28;
    private static readonly BULLET_GRAVITY = 800;
    private static readonly MANUAL_BULLET_SPEED_BASE_DISTANCE = 600;
    private static readonly MANUAL_BULLET_SPEED_MIN = 600;
    private static readonly MANUAL_BULLET_SPEED_MAX = 1400;

    private readonly runtime: GameRuntime;
    private readonly cameraFollow: CameraFollow;
    private readonly skillController: SkillController;
    private readonly callbacks: BattleCallbacks;

    public constructor(runtime: GameRuntime, callbacks: BattleCallbacks) {
        this.runtime = runtime;
        this.cameraFollow = new CameraFollow(runtime);
        this.skillController = new SkillController(runtime);
        this.callbacks = callbacks;
    }

    public startBattle(): void {
        this.runtime.clearBattleObjects();
        this.runtime.resetTransientFlow();
        this.runtime.bossHp = GameConfig.boss.hp;
        this.runtime.resetActorPlacement();
        this.runtime.context.phase = GamePhase.Battle;
    }

    public update(dt: number): void {
        this.runtime.context.battleTime += dt;
        this.skillController.updateCooldowns(dt);

        this.updateEnergy(dt);
        this.updateSpawning(dt);
        this.runtime.updateActorPlacement();
        this.updateAutoShooting(dt);
        this.updateBullets(dt);
        this.updateMonsters(dt);
        this.updateSawDamage(dt);
        this.updateCarMovement(dt);
        this.runtime.updateActorPlacement();
        this.skillController.updateRollers(dt, (monsterId, damage) => {
            this.damageMonsterById(monsterId, damage, "roller");
            this.applyRollerKnockback(monsterId);
        });
        this.updateEffects(dt);
        this.tryEnterBossPhase();
        this.checkFailState();
    }

    public updateVisuals(): void {
        this.cameraFollow.update();
        this.runtime.getActiveCarViews().forEach((carView) => {
            if (!carView || !carView.sawNode || !cc.isValid(carView.sawNode)) {
                return;
            }
            const carIndex = this.runtime.getCarIndexByView(carView);
            const sawNode = carView.sawNode;
            const sawVisible = carView.node.active
                && carIndex >= 0
                && this.runtime.context.getCarSkillUnlocked(carIndex);
            sawNode.active = sawVisible;
            if (sawVisible) {
                const sawNodeAny = sawNode as any;
                if (!sawNodeAny.__spinStarted) {
                    sawNodeAny.__spinStarted = true;
                    sawNode.runAction(
                        cc.repeatForever(cc.rotateBy(1, this.runtime.sawRotationSpeed)),
                    );
                }
            } else {
                sawNode.stopAllActions();
                (sawNode as any).__spinStarted = false;
            }
        });
        if (this.runtime.refs.bossNode) {
            const keepBossVisibleInQuestionPause = this.runtime.context.phase === GamePhase.QuestionPause
                && this.runtime.context.lastBattlePhaseBeforeQuestionPause === GamePhase.Boss;
            this.runtime.refs.bossNode.active = this.runtime.context.phase === GamePhase.Boss
                || this.runtime.context.phase === GamePhase.Win
                || keepBossVisibleInQuestionPause;
        }
    }

    public tryUseSkill(skillType: SkillType): void {
        const result = this.skillController.tryUseSkill(skillType, (monsterId, damage, center) => {
            this.damageMonsterById(monsterId, damage, "bomb");
            this.applyBombKnockback(monsterId, center);
        });
        if (result.kind === "needs_energy") {
            this.callbacks.onNeedQuestion(result.skillType, result.cost);
            return;
        }
        if (result.kind === "invalid") {
            this.runtime.spawnFloatText(0, 12, result.reason, new cc.Color(255, 220, 110, 255));
        }
    }

    public tryUseSkillAfterQuestion(skillType: SkillType): boolean {
        return this.skillController.useSkillWithoutEnergyCost(
            skillType,
            (monsterId, damage, center) => {
                this.damageMonsterById(monsterId, damage, "bomb");
                this.applyBombKnockback(monsterId, center);
            },
        );
    }

    public enterQuestionPauseVisualState(): void {
        this.runtime.playHeroIdle();
        this.runtime.monsters.forEach((monster) => {
            if (!monster.dying) {
                this.runtime.playMonsterIdle(monster.node);
            }
        });
    }

    public resumeBattleVisualState(): void {
        this.runtime.monsters.forEach((monster) => {
            if (!monster.dying) {
                this.runtime.playMonsterMove(monster.node);
            }
        });
    }

    public getViewData(): BattleViewData {
        const roundDistance = Math.max(0, this.runtime.context.reachedDistance - this.runtime.context.roundStartDistance);
        return {
            playerHp: this.runtime.context.playerHp,
            playerMaxHp: this.runtime.context.playerMaxHp,
            energy: this.runtime.context.energy,
            energyMax: this.runtime.context.energyMax,
            battleProgress: this.getBattleProgress(),
            completedRounds: this.getCompletedRounds(),
            showBattleProgress: this.shouldShowBattleProgress(),
            phase: this.runtime.context.phase,
            sawUnlocked: this.runtime.context.sawCarUnlocked,
            sawAlive: this.runtime.context.sawCarAlive,
            sawHp: this.runtime.context.sawCarHp,
            sawMaxHp: this.runtime.context.sawCarMaxHp,
            showBoss: this.runtime.context.phase === GamePhase.Boss || this.runtime.context.phase === GamePhase.Win,
            bossHp: this.runtime.bossHp,
            bossMaxHp: GameConfig.boss.hp,
            infoText: [
                `\u7b2c${this.runtime.context.currentRound}/${GameConfig.campaign.totalRounds} \u8f6e`,
                `\u9636\u6bb5\uff1a${GamePhase[this.runtime.context.phase]}`,
                `\u51fb\u6740\uff1a${this.runtime.context.killCount}`,
                `\u672c\u8f6e\u63a8\u8fdb\uff1a${Math.floor(roundDistance)} / ${GameConfig.car.bossTriggerX}`,
                `\u6eda\u8f6e\u51b7\u5374\uff1a${this.runtime.rollerCooldown.toFixed(1)}s`,
                `\u70b8\u5f39\u51b7\u5374\uff1a${this.runtime.bombCooldown.toFixed(1)}s`,
            ].join("\n"),
            debugText: DebugConfig.showCarSpeed
                ? `\u8f66\u901f ${this.getCurrentCarSpeed().toFixed(1)}  \u602a\u7269 ${this.runtime.monsters.length}  \u5b50\u5f39 ${this.runtime.bullets.length}  \u955c\u5934 ${this.runtime.cameraTrackX.toFixed(1)}`
                : "",
            rollerSkillVisible: this.runtime.context.hasAliveCarSkillUnlocked(),
            canUseRoller: this.runtime.context.hasAliveCarSkillUnlocked() && this.runtime.rollerCooldown <= 0,
            canUseBomb: this.runtime.bombCooldown <= 0,
            pauseLabel: this.runtime.context.phase === GamePhase.NormalPause ? "\u7ee7\u7eed" : "\u6682\u505c",
        };
    }

    public onQuestionRewardGranted(): void {
        if (this.runtime.context.phase === GamePhase.Battle || this.runtime.context.phase === GamePhase.Boss) {
            return;
        }
    }

    public clearBattle(): void {
        this.runtime.clearBattleObjects();
    }

    private updateEnergy(dt: number): void {
        this.runtime.context.energy = clamp(this.runtime.context.energy + this.runtime.context.energyRegen * dt, 0, this.runtime.context.energyMax);
    }

    private updateSpawning(dt: number): void {
        if (this.runtime.context.phase === GamePhase.Battle) {
            const spawnRate = this.getBattleSpawnRate(this.runtime.context.battleTime);
            if (spawnRate <= 0) {
                return;
            }
            this.runtime.spawnTimer += dt;
            const spawnInterval = 1 / spawnRate;
            while (this.runtime.spawnTimer >= spawnInterval) {
                this.runtime.spawnTimer -= spawnInterval;
                this.spawnMonster(this.getRightScreenMonsterSpawnX(), undefined, "normal");
            }
            return;
        }

        if (this.runtime.context.phase !== GamePhase.Boss) {
            return;
        }

        this.runtime.bossSpawnTimer += dt;
        const spawnInterval = this.runtime.bossPreSpawnRemaining > 0
            ? BattleController.BOSS_PRE_SPAWN_INTERVAL
            : 1 / GameConfig.monster.bossSpawnPerSecond;
        while (this.runtime.bossSpawnTimer >= spawnInterval) {
            this.runtime.bossSpawnTimer -= spawnInterval;
            if (this.runtime.bossPreSpawnRemaining > 0) {
                const spawnPosition = this.getBossCenterMonsterSpawnPosition();
                this.spawnMonster(spawnPosition.x, spawnPosition.y, this.rollBossMonsterKind());
                this.runtime.bossPreSpawnRemaining -= 1;
                continue;
            }
            if (this.canSpawnBossMonster()) {
                const spawnPosition = this.getBossPhaseMonsterSpawnPosition();
                this.spawnMonster(spawnPosition.x, spawnPosition.y, this.rollBossMonsterKind());
            }
        }
    }

    private updateAutoShooting(dt: number): void {
        if (!this.runtime.refs.heroNode) {
            return;
        }

        this.runtime.shootTimer += dt;
        if (this.runtime.shootTimer < GameConfig.player.shootInterval) {
            return;
        }
        this.runtime.shootTimer = 0;

        const firePosition = this.runtime.getHeroFireWorldPosition();
        const manualAimDirection = this.runtime.forcedAimDirection;
        const manualAimTargetPosition = this.runtime.forcedAimTargetPosition;
        const manualAiming = !!manualAimDirection;
        let baseDirection = manualAimDirection;
        if (!baseDirection) {
            const target = this.findShootTarget();
            if (!target) {
                return;
            }
            baseDirection = cc.v2(target.x - firePosition.x, target.y - firePosition.y);
            if (baseDirection.magSqr() <= 1) {
                baseDirection = cc.v2(1, 0);
            } else {
                baseDirection = baseDirection.normalize();
            }
        }

        this.runtime.playHeroAttack();
        const bulletSpeed = manualAiming
            ? this.getManualBulletSpeed(firePosition, manualAimTargetPosition)
            : GameConfig.player.bulletSpeed;

        const bossTarget = manualAiming ? null : this.getBossBulletTarget();
        for (let index = 0; index < GameConfig.player.bulletsPerShot; index += 1) {
            const useBossOnlyBullet = !!bossTarget && index < BattleController.BOSS_ONLY_BULLET_COUNT;
            const shotBaseDirection = useBossOnlyBullet
                ? this.getDirectionToTarget(firePosition, bossTarget)
                : baseDirection;
            const direction = rotateVector(shotBaseDirection, randomRange(-GameConfig.player.bulletRandomAngle, GameConfig.player.bulletRandomAngle));
            const delay = randomRange(0, GameConfig.player.bulletRandomDelayMax);
            this.spawnBullet(firePosition, direction, delay, useBossOnlyBullet, manualAiming ? 1 : 0.5, bulletSpeed);
        }
    }

    private findShootTarget(): cc.Vec2 | null {
        if (!this.runtime.getCarAnchorNode()) {
            return null;
        }

        const bossPriorityTarget = this.getBossPriorityTarget();
        if (bossPriorityTarget) {
            return bossPriorityTarget;
        }

        const carPosition = this.runtime.getCarWorldPosition();
        const attackRange = GameConfig.player.attackRange;
        let target: cc.Node | null = null;
        let nearestDistance = Number.MAX_SAFE_INTEGER;
        for (const monster of this.runtime.monsters) {
            if (monster.dying) {
                continue;
            }
            const monsterPosition = cc.v2(monster.node.x, monster.node.y);
            const targetDistance = Math.abs(carPosition.x - monsterPosition.x);
            if (targetDistance <= attackRange && targetDistance < nearestDistance) {
                nearestDistance = targetDistance;
                target = monster.node;
            }
        }

        return target ? cc.v2(target.x, target.y) : null;
    }

    private spawnBullet(
        position: cc.Vec2,
        direction: cc.Vec2,
        delay: number,
        bossOnly: boolean = false,
        gravityScale: number = 1,
        bulletSpeed: number = GameConfig.player.bulletSpeed,
    ): void {
        const node = this.runtime.poolManager.get("bullet", this.runtime.bulletRoot, () => this.runtime.createBulletNode());
        node.x = position.x;
        node.y = position.y;
        node.opacity = 255;
        node.scale = 1;
        const motionStreak = node.getComponent(cc.MotionStreak);
        if (motionStreak) {
            motionStreak.reset();
        }
        const normalizedDirection = direction.magSqr() <= 0.0001
            ? cc.v2(1, 0)
            : direction.normalize();
        const velocity = cc.v2(
            normalizedDirection.x * bulletSpeed,
            normalizedDirection.y * bulletSpeed,
        );
        node.angle = -Math.atan2(velocity.x, velocity.y) * 180 / Math.PI + GameConfig.player.bulletAngleOffset;

        this.runtime.bullets.push({
            node,
            velocity,
            gravityScale,
            delay,
            damage: this.runtime.context.playerAttack,
            bossOnly,
        });
    }

    private getManualBulletSpeed(firePosition: cc.Vec2, targetPosition: cc.Vec2 | null): number {
        if (!targetPosition) {
            return GameConfig.player.bulletSpeed;
        }

        const touchDistance = distance(firePosition, targetPosition);
        const speedByDistance = GameConfig.player.bulletSpeed
            * (touchDistance / BattleController.MANUAL_BULLET_SPEED_BASE_DISTANCE);
        return clamp(
            speedByDistance,
            BattleController.MANUAL_BULLET_SPEED_MIN,
            BattleController.MANUAL_BULLET_SPEED_MAX,
        );
    }

    private updateBullets(dt: number): void {
        const visibleLeft = this.runtime.cameraTrackX - GameConfig.designWidth / 2 - 280;
        const visibleRight = this.runtime.cameraTrackX + GameConfig.designWidth / 2 + 280;

        for (let index = this.runtime.bullets.length - 1; index >= 0; index -= 1) {
            const bullet = this.runtime.bullets[index];
            if (!cc.isValid(bullet) || !cc.isValid(bullet.node)) {
                this.runtime.bullets.splice(index, 1);
                continue;
            }

            if (bullet.delay > 0) {
                bullet.delay = Math.max(0, bullet.delay - dt);
                continue;
            }

            bullet.velocity.y -= BattleController.BULLET_GRAVITY * bullet.gravityScale * dt;
            bullet.node.x += bullet.velocity.x * dt;
            bullet.node.y += bullet.velocity.y * dt;
            bullet.node.angle = -Math.atan2(bullet.velocity.x, bullet.velocity.y) * 180 / Math.PI + GameConfig.player.bulletAngleOffset;

            if (bullet.node.y < -40) {
                if (bullet.pendingCraterDelay === undefined) {
                    bullet.pendingCraterDelay = randomRange(0.01, 0.05);
                } else {
                    bullet.pendingCraterDelay -= dt;
                    if (bullet.pendingCraterDelay <= 0) {
                        this.runtime.spawnBulletCrater(bullet.node.x, bullet.node.y, bullet.node.angle);
                        this.recycleBullet(index);
                        continue;
                    }
                }
            }

            const hit = this.findBulletHitTarget(bullet.node, !!bullet.bossOnly);
            if (hit.type === "monster" && hit.monsterId > 0) {
                this.damageMonsterById(hit.monsterId, bullet.damage);
                this.recycleBullet(index);
                continue;
            }
            if (hit.type === "boss") {
                this.damageBoss(bullet.damage);
                this.recycleBullet(index);
                continue;
            }

            const waitingCrater = bullet.pendingCraterDelay !== undefined;
            if (bullet.node.x < visibleLeft || bullet.node.x > visibleRight || (!waitingCrater && bullet.node.y < -430) || bullet.node.y > 430) {
                this.recycleBullet(index);
            }
        }
    }

    private findBulletHitTarget(bulletNode: cc.Node, bossOnly: boolean = false): { type: "none" | "monster" | "boss"; monsterId: number } {
        const bulletRect = this.runtime.makeRect(bulletNode.x, bulletNode.y, 22, 10);
        const hits: Array<{ type: "monster" | "boss"; monsterId: number; distance: number }> = [];

        if (!bossOnly) {
            for (const monster of this.runtime.monsters) {
                if (monster.dying) {
                    continue;
                }
                if (rectIntersects(bulletRect, this.runtime.getNodeColliderRect(monster.node, GameConfig.monster.width, GameConfig.monster.height))) {
                    hits.push({
                        type: "monster",
                        monsterId: monster.id,
                        distance: distance(cc.v2(bulletNode.x, bulletNode.y), cc.v2(monster.node.x, monster.node.y)),
                    });
                }
            }
        }

        if (this.runtime.context.phase === GamePhase.Boss && this.runtime.refs.bossNode && this.runtime.refs.bossNode.active) {
            const bossCenter = this.runtime.getBossCenterWorldPosition();
            if (rectIntersects(bulletRect, this.runtime.makeRect(bossCenter.x, bossCenter.y, GameConfig.boss.width, GameConfig.boss.height))) {
                hits.push({
                    type: "boss",
                    monsterId: 0,
                    distance: distance(cc.v2(bulletNode.x, bulletNode.y), bossCenter),
                });
            }
        }

        if (hits.length === 0) {
            return { type: "none", monsterId: 0 };
        }

        hits.sort((left, right) => left.distance - right.distance);
        return { type: hits[0].type, monsterId: hits[0].monsterId };
    }

    private getBossBulletTarget(): cc.Vec2 | null {
        return this.getBossPriorityTarget();
    }

    private getBossPriorityTarget(): cc.Vec2 | null {
        if (this.runtime.context.phase !== GamePhase.Boss || !this.runtime.refs.bossNode || !this.runtime.refs.bossNode.active) {
            return null;
        }

        const carPosition = this.runtime.getCarWorldPosition();
        const bossCenter = this.runtime.getBossCenterWorldPosition();
        const bossInAttackRange = distance(carPosition, bossCenter) <= GameConfig.player.attackRange;
        const bossCenteredOnScreen = this.isBossCenteredOnScreen(bossCenter);

        return bossInAttackRange || bossCenteredOnScreen ? bossCenter : null;
    }

    private isBossCenteredOnScreen(bossCenter: cc.Vec2): boolean {
        const screenCenterX = this.runtime.cameraTrackX;
        const centerTolerance = Math.max(GameConfig.boss.width * 0.5, 30);
        return Math.abs(bossCenter.x - screenCenterX) <= centerTolerance;
    }

    private getDirectionToTarget(from: cc.Vec2, target: cc.Vec2): cc.Vec2 {
        const direction = cc.v2(target.x - from.x, target.y - from.y);
        if (direction.magSqr() <= 1) {
            return cc.v2(1, 0);
        }
        return direction.normalize();
    }

    private updateMonsters(dt: number): void {
        const carRect = this.getCarRect();
        const contactCarFrontX = carRect.x + carRect.width / 2 - BattleController.MONSTER_CAR_CONTACT_SHRINK;
        const previousXById: Record<number, number> = {};

        for (let index = this.runtime.monsters.length - 1; index >= 0; index -= 1) {
            const monster = this.runtime.monsters[index];
            if (!cc.isValid(monster.node)) {
                this.runtime.monsters.splice(index, 1);
                continue;
            }

            if (monster.dying) {
                monster.contactCar = false;
                monster.contactCarIndex = -1;
                monster.contactHero = false;
                continue;
            }

            previousXById[monster.id] = monster.node.x;
            monster.contactCar = false;
            monster.contactCarIndex = -1;
            monster.contactHero = false;
            const laneY = this.getMonsterLaneY(monster.laneIndex);
            const supportMonster = this.getSupportedMonster(monster);

            if (monster.stackedOnMonsterId > 0 && !supportMonster) {
                monster.stackedOnMonsterId = 0;
                monster.stackJumpProgress = 1;
            }

            if (monster.stackedOnMonsterId > 0) {
                if (!this.isMonsterJumping(monster)) {
                    monster.node.x -= GameConfig.monster.speed * dt;
                }
            } else {
                monster.stackedOnMonsterId = 0;
                monster.node.x -= GameConfig.monster.speed * dt;

                if (monster.node.y > laneY) {
                    monster.node.y = Math.max(laneY, monster.node.y - BattleController.MONSTER_STACK_FALL_SPEED * dt);
                } else if (monster.node.y < laneY) {
                    monster.node.y = laneY;
                }
            }

            const monsterRect = this.runtime.getNodeColliderRect(monster.node, GameConfig.monster.width, GameConfig.monster.height);
            const heroRect = this.getHeroRect();
            const heroContactFrontX = heroRect.x + heroRect.width / 2 - BattleController.MONSTER_CAR_CONTACT_SHRINK;
            const reachesHeroFront = monster.node.x - GameConfig.monster.width / 2 <= heroContactFrontX;
            const carContact = this.getContactCarHit(monsterRect, monster.node.y + monster.node.parent.y);
            const hitsCar = !!carContact;
            const hitsHero = rectIntersects(monsterRect, heroRect) || (reachesHeroFront && this.rectOverlapsY(monsterRect, heroRect));
            const shouldAttackHero = !hitsCar && hitsHero;
            if (shouldAttackHero) {
                monster.contactHero = true;
                monster.node.x = heroContactFrontX + GameConfig.monster.width / 2;
                monster.attackTimer += dt;
                if (monster.attackTimer >= GameConfig.monster.attackInterval) {
                    monster.attackTimer = 0;
                    this.runtime.playMonsterAttack(monster.node);
                    this.attackHeroSide(monster.attack);
                }
            } else if (hitsCar) {
                monster.contactCar = true;
                monster.contactCarIndex = carContact.index;
                monster.node.x = carContact.contactFrontX + GameConfig.monster.width / 2;
                monster.attackTimer += dt;
                if (monster.attackTimer >= GameConfig.monster.attackInterval) {
                    monster.attackTimer = 0;
                    this.runtime.playMonsterAttack(monster.node);
                    this.attackCarSide(monster.attack, monster.node.y, monster.contactCarIndex);
                }
            } else if (monster.stackedOnMonsterId > 0) {
                monster.attackTimer = 0;
            }

            this.updateMonsterKnockback(monster, dt);
            monster.node.zIndex = Math.round(-monster.node.y * 10);

            if (monster.node.x < this.runtime.cameraTrackX - GameConfig.designWidth) {
                this.recycleMonster(index);
            }
        }

        this.resolveMonsterLaneSpacing(contactCarFrontX, previousXById);
        this.resolveMonsterVerticalStacking(dt);
    }

    private updateSawDamage(dt: number): void {
        if (!this.runtime.context.sawCarAlive) {
            return;
        }

        this.runtime.sawAttackTimer += dt;
        if (this.runtime.sawAttackTimer < GameConfig.sawCar.attackInterval) {
            return;
        }
        this.runtime.sawAttackTimer = 0;

        this.runtime.monsters.forEach((monster) => {
            if (!monster.contactCar || !cc.isValid(monster.node) || monster.dying) {
                return;
            }

            const attackCarIndex = monster.contactCarIndex;
            const damage = attackCarIndex >= 0
                ? this.runtime.context.getCarAttack(attackCarIndex)
                : this.runtime.context.sawCarAttack;
            this.damageMonsterById(monster.id, damage);
        });
    }

    private updateCarMovement(dt: number): void {
        if (this.runtime.context.phase === GamePhase.Boss && !this.runtime.bossEntranceActive) {
            return;
        }

        const contactCount = this.runtime.monsters.filter((monster) => monster.contactCar).length;
        const speedFactor = 1 - GameConfig.monster.slowFactorPerMonster * contactCount;
        const searchSpeedMultiplier = this.hasAttackableTargetInRange() ? 1 : BattleController.SEARCH_MOVE_SPEED_MULTIPLIER;
        const moveSpeed = Math.max(0, GameConfig.car.baseSpeed * speedFactor * searchSpeedMultiplier);
        this.runtime.context.reachedDistance += moveSpeed * dt;

        if (moveSpeed > 0) {
            this.runtime.monsters.forEach((monster) => {
                if (monster.contactCar) {
                    monster.node.x += moveSpeed * dt;
                }
            });
        }
    }

    private tryEnterBossPhase(): void {
        const bossTriggerDistance = this.runtime.context.roundStartDistance + GameConfig.car.bossTriggerX;
        if (this.runtime.context.phase !== GamePhase.Battle || this.runtime.context.reachedDistance < bossTriggerDistance) {
            return;
        }

        this.runtime.context.reachedDistance = bossTriggerDistance;
        this.runtime.updateActorPlacement();
        this.runtime.bossHp = GameConfig.boss.hp;
        this.runtime.bossSpawnTimer = 0;
        this.runtime.bossPreSpawnRemaining = GameConfig.monster.bossPreSpawnCount;
        this.spawnBossPreWave();
        this.runtime.placeBossAtScreenRight();
        this.runtime.context.phase = GamePhase.Boss;
        const bossCenter = this.runtime.getBossCenterWorldPosition();
        this.runtime.spawnFloatText(bossCenter.x, bossCenter.y + 60, "BOSS \u51fa\u73b0", new cc.Color(255, 130, 255, 255));
    }

    private damageMonsterById(monsterId: number, damage: number, source: "normal" | "bomb" | "roller" = "normal"): void {
        const monster = this.runtime.monsters.find((item) => item.id === monsterId);
        if (!monster || !cc.isValid(monster.node) || monster.dying) {
            return;
        }

        const canLeaveAtOneHp = (source === "bomb" || source === "roller")
            && !monster.lockedAtOneHp
            && monster.hp > monster.maxHp * 0.5
            && damage > monster.hp
            && Math.random() < 0.3;
        if (canLeaveAtOneHp) {
            monster.hp = 1;
            monster.lockedAtOneHp = true;
        } else {
            monster.hp -= damage;
        }
        monster.hpBar.root.active = true;
        this.runtime.uiPrimitives.updateBar(monster.hpBar as any, monster.hp, monster.maxHp, "");
        this.runtime.spawnFloatText(monster.node.x, monster.node.y + 46, `-${Math.ceil(damage)}`, new cc.Color(255, 235, 90, 255));

        if (monster.hp <= 0) {
            this.killMonster(monsterId);
        }
    }

    private killMonster(monsterId: number): void {
        const monster = this.runtime.monsters.find((item) => item.id === monsterId);
        if (!monster || !cc.isValid(monster.node) || monster.dying) {
            return;
        }

        monster.dying = true;
        monster.contactCar = false;
        monster.contactCarIndex = -1;
        monster.contactHero = false;
        monster.attackTimer = 0;
        monster.hpBar.root.active = false;

        const finishDeath = (): void => {
            const currentIndex = this.runtime.monsters.findIndex((item) => item.id === monsterId);
            if (currentIndex < 0) {
                return;
            }

            const currentMonster = this.runtime.monsters[currentIndex];
            const x = currentMonster.node.x;
            const y = currentMonster.node.y;
            this.recycleMonster(currentIndex);
            this.runtime.context.killCount += 1;
            this.runtime.spawnFloatText(x, y + 14, "\u51fb\u6740", new cc.Color(110, 255, 122, 255));
        };

        this.runtime.playMonsterDie(monster.node, finishDeath);
    }

    private damageBoss(damage: number): void {
        if (this.runtime.context.phase !== GamePhase.Boss && this.runtime.context.phase !== GamePhase.Win) {
            return;
        }

        const bossNode = this.runtime.refs.bossNode;
        this.runtime.bossHp = Math.max(0, this.runtime.bossHp - damage);
        if (bossNode) {
            const bossCenter = this.runtime.getBossCenterWorldPosition();
            this.runtime.spawnFloatText(bossCenter.x, bossCenter.y + 110, `-${Math.ceil(damage)}`, new cc.Color(255, 226, 100, 255));
        }
        if (this.runtime.bossHp <= 0) {
            this.finishBattle(true);
        }
    }

    private attackCarSide(baseDamage: number, attackerY?: number, preferredCarIndex: number = -1): void {
        if (this.runtime.context.sawCarAlive) {
            const targetCarIndex = preferredCarIndex >= 0 && this.runtime.context.getCarHp(preferredCarIndex) > 0
                ? preferredCarIndex
                : this.getCarIndexForIncomingAttack(attackerY);
            const damage = this.getIncomingDamage(baseDamage, targetCarIndex);
            const carPosition = this.runtime.getCarWorldPositionByIndex(targetCarIndex);
            this.runtime.spawnFloatText(carPosition.x, carPosition.y + 45, `-${Math.ceil(damage)}`, new cc.Color(255, 96, 96, 255));
            const damageResult = this.runtime.context.damageCar(targetCarIndex, damage);
            if (damageResult.destroyed) {
                if (this.runtime.context.sawCarAlive) {
                    this.runtime.spawnFloatText(carPosition.x, carPosition.y + 78, "\u5907\u7528\u6218\u8f66\u9876\u4e0a", new cc.Color(255, 220, 120, 255));
                    return;
                }

                this.runtime.spawnFloatText(carPosition.x, carPosition.y + 40, "\u8f66\u8f86\u635f\u6bc1", new cc.Color(255, 96, 96, 255));
            }
            return;

        }

        this.attackHeroSide(baseDamage);
    }

    private attackHeroSide(baseDamage: number): void {
        const damage = this.getIncomingDamage(baseDamage);
        this.runtime.context.playerHp = Math.max(0, this.runtime.context.playerHp - damage);
        const heroPosition = this.runtime.getHeroWorldPosition();
        this.runtime.spawnFloatText(heroPosition.x, heroPosition.y + 60, `-${Math.ceil(damage)}`, new cc.Color(255, 96, 96, 255));
    }

    private getIncomingDamage(baseDamage: number, carIndex?: number): number {
        const defenseUnlocked = carIndex === undefined
            ? this.runtime.context.defenseUnlocked
            : this.runtime.context.getCarDefenseUnlocked(carIndex);
        if (!defenseUnlocked) {
            return baseDamage;
        }
        return Math.max(0, baseDamage * BattleController.DEFENSE_DAMAGE_MULTIPLIER);
    }

    private getCarIndexForIncomingAttack(attackerY?: number): number {
        const aliveIndices = this.runtime.context.getAliveCarIndices();
        if (aliveIndices.length <= 0) {
            return -1;
        }
        if (attackerY === undefined) {
            return aliveIndices[aliveIndices.length - 1];
        }

        let targetIndex = aliveIndices[0];
        let nearestDistance = Number.MAX_SAFE_INTEGER;
        aliveIndices.forEach((index) => {
            const carPosition = this.runtime.getCarWorldPositionByIndex(index);
            const distanceToAttacker = Math.abs(carPosition.y - attackerY);
            if (distanceToAttacker < nearestDistance) {
                nearestDistance = distanceToAttacker;
                targetIndex = index;
            }
        });
        return targetIndex;
    }

    private updateEffects(dt: number): void {
        for (let index = this.runtime.effects.length - 1; index >= 0; index -= 1) {
            const effect = this.runtime.effects[index];
            if (!cc.isValid(effect.node)) {
                this.runtime.effects.splice(index, 1);
                continue;
            }

            if (effect.fadeDelay !== undefined && effect.fadeDelay > 0) {
                effect.fadeDelay = Math.max(0, effect.fadeDelay - dt);
                continue;
            }

            effect.life -= dt;
            effect.node.y += effect.driftY * dt;
            effect.node.opacity = clamp((effect.life / effect.maxLife) * 255, 0, 255);
            if (!effect.disableFadeScale) {
                effect.node.scale = 1 + (1 - effect.life / effect.maxLife) * 0.5;
            }

            if (effect.life <= 0) {
                this.runtime.poolManager.put(effect.key, effect.node);
                this.runtime.effects.splice(index, 1);
            }
        }
    }

    private checkFailState(): void {
        if (this.runtime.context.playerHp > 0) {
            return;
        }
        this.runtime.context.playerHp = 0;
        this.finishBattle(false);
    }

    private finishBattle(isWin: boolean): void {
        this.runtime.clearBattleObjects();
        this.callbacks.onBattleFinished(isWin);
    }

    private spawnMonster(localX: number, localY?: number, kind: MonsterKind = "normal"): void {
        const monsterRoot = this.runtime.refs.monsterRoot;
        if (!monsterRoot) {
            return;
        }

        const node = this.runtime.poolManager.get("monster", monsterRoot, () => this.runtime.createMonsterNode());
        this.runtime.configureMonsterNode(node, kind);
        const laneIndex = localY === undefined
            ? this.getRandomMonsterLaneIndex()
            : this.getMonsterLaneIndexByY(localY);
        node.x = localX;
        node.y = localY === undefined
            ? this.getMonsterLaneY(laneIndex)
            : this.getMonsterLaneY(laneIndex);
        node.zIndex = Math.round(-node.y * 10);
        node.opacity = 255;

        const monster = (node as any).__runtime;
        const config = kind === "elite" ? GameConfig.monster.elite : GameConfig.monster.normal;
        monster.id = this.runtime.monsterIdSeed;
        monster.kind = kind;
        monster.laneIndex = laneIndex;
        monster.hp = Math.floor(config.hp * Math.pow(GameConfig.monster.glowRateRound,this.runtime.context.currentRound-1));
        monster.maxHp = monster.hp;
        monster.attack = Math.floor(config.attack * Math.pow(GameConfig.monster.glowRateRound,this.runtime.context.currentRound-1));
        monster.attackTimer = 0;
        monster.contactCar = false;
        monster.contactCarIndex = -1;
        monster.contactHero = false;
        monster.lockedAtOneHp = false;
        monster.stackedOnMonsterId = 0;
        monster.hasStackJumped = false;
        monster.blockedByMonsterLastFrame = false;
        monster.stackJumpProgress = 1;
        monster.stackJumpStartX = node.x;
        monster.stackJumpStartY = node.y;
        monster.knockbackVelocityX = 0;
        monster.knockbackVelocityY = 0;
        monster.dying = false;
        monster.node = node;
        monster.hpBar.root.active = false;
        this.runtime.uiPrimitives.updateBar(monster.hpBar as any, monster.hp, monster.maxHp, "");

        this.runtime.monsters.push(monster);
        this.runtime.monsterIdSeed += 1;
    }

    private recycleMonster(index: number): void {
        const monster = this.runtime.monsters[index];
        this.runtime.monsters.splice(index, 1);
        this.runtime.poolManager.put("monster", monster.node);
    }

    private applyRollerKnockback(monsterId: number): void {
        const monster = this.runtime.monsters.find((item) => item.id === monsterId);
        if (!monster || !cc.isValid(monster.node) || monster.dying) {
            return;
        }

        this.addMonsterKnockback(monster, BattleController.ROLLER_KNOCKBACK_X, BattleController.ROLLER_KNOCKBACK_Y);
    }

    private applyBombKnockback(monsterId: number, center: cc.Vec2): void {
        const monster = this.runtime.monsters.find((item) => item.id === monsterId);
        if (!monster || !cc.isValid(monster.node) || monster.dying) {
            return;
        }

        let direction = cc.v2(monster.node.x - center.x, monster.node.y - center.y);
        if (direction.magSqr() <= 1) {
            direction = cc.v2(1, 0);
        } else {
            direction = direction.normalize();
        }

        this.addMonsterKnockback(
            monster,
            direction.x * BattleController.BOMB_KNOCKBACK_SPEED,
            direction.y * BattleController.BOMB_KNOCKBACK_SPEED,
        );
    }

    private addMonsterKnockback(monster: MonsterRuntime, velocityX: number, velocityY: number): void {
        monster.knockbackVelocityX += velocityX;
        monster.knockbackVelocityY += velocityY;
    }

    private updateMonsterKnockback(monster: MonsterRuntime, dt: number): void {
        if (Math.abs(monster.knockbackVelocityX) < BattleController.MONSTER_KNOCKBACK_MIN_SPEED
            && Math.abs(monster.knockbackVelocityY) < BattleController.MONSTER_KNOCKBACK_MIN_SPEED) {
            monster.knockbackVelocityX = 0;
            monster.knockbackVelocityY = 0;
            return;
        }

        monster.node.x += monster.knockbackVelocityX * dt;
        monster.node.y += monster.knockbackVelocityY * dt;

        const damping = Math.exp(-BattleController.MONSTER_KNOCKBACK_DECAY * dt);
        monster.knockbackVelocityX *= damping;
        monster.knockbackVelocityY *= damping;
    }

    private getRightScreenMonsterSpawnX(): number {
        return this.runtime.cameraTrackX + GameConfig.designWidth / 2 + randomRange(180, 420);
    }

    private getBossPhaseMonsterSpawnPosition(): cc.Vec2 {
        const laneIndex = this.getRandomMonsterLaneIndex();
        const laneY = this.getMonsterLaneY(laneIndex);
        if (!this.runtime.isBossVisibleInScreen()) {
            return cc.v2(this.getRightScreenMonsterSpawnX(), laneY);
        }
        const bossCenter = this.runtime.getBossCenterWorldPosition();
        return cc.v2(bossCenter.x, laneY);
    }

    private getBossCenterMonsterSpawnPosition(): cc.Vec2 {
        const laneIndex = this.getRandomMonsterLaneIndex();
        const laneY = this.getMonsterLaneY(laneIndex);
        const bossCenter = this.runtime.getBossCenterWorldPosition();
        return cc.v2(bossCenter.x, laneY);
    }

    private canSpawnBossMonster(): boolean {
        return this.getAliveMonsterCount() < GameConfig.boss.maxMonsterCount
            && this.getBossVisibleAreaMonsterCount() < GameConfig.boss.maxVisibleMonsterCount;
    }

    private getAliveMonsterCount(): number {
        return this.runtime.monsters.filter((monster) => cc.isValid(monster.node) && !monster.dying).length;
    }

    private getBossVisibleAreaMonsterCount(): number {
        const spawnAreaLeft = this.runtime.cameraTrackX - 40;
        const spawnAreaRight = this.runtime.cameraTrackX + GameConfig.designWidth / 2 + 140;
        return this.runtime.monsters.filter((monster) => {
            if (!cc.isValid(monster.node) || monster.dying) {
                return false;
            }
            return monster.node.x >= spawnAreaLeft && monster.node.x <= spawnAreaRight;
        }).length;
    }

    private getRandomMonsterLaneIndex(): number {
        return Math.floor(Math.random() * BattleController.MONSTER_LANE_OFFSETS.length);
    }

    private getMonsterLaneIndexByY(y: number): number {
        let nearestIndex = 0;
        let nearestDistance = Number.MAX_SAFE_INTEGER;
        BattleController.MONSTER_LANE_OFFSETS.forEach((offset, index) => {
            const laneY = GameConfig.monster.laneY + offset;
            const laneDistance = Math.abs(y - laneY);
            if (laneDistance < nearestDistance) {
                nearestDistance = laneDistance;
                nearestIndex = index;
            }
        });
        return nearestIndex;
    }

    private getMonsterLaneY(laneIndex: number): number {
        const offset = BattleController.MONSTER_LANE_OFFSETS[laneIndex] || 0;
        return GameConfig.monster.laneY + offset;
    }

    private resolveMonsterLaneSpacing(carFrontX: number, previousXById: Record<number, number>): void {
        for (let laneIndex = 0; laneIndex < BattleController.MONSTER_LANE_OFFSETS.length; laneIndex += 1) {
            const laneMonsters = this.runtime.monsters
                .filter((monster) => cc.isValid(monster.node)
                    && !monster.dying
                    && monster.laneIndex === laneIndex
                    && !this.isMonsterElevated(monster))
                .sort((left, right) => left.node.x - right.node.x);

            let nextMinX = carFrontX + GameConfig.monster.width / 2;
            let previousGroundMonster: MonsterRuntime | null = null;
            for (const monster of laneMonsters) {
                const minimumX = previousGroundMonster
                    ? nextMinX + BattleController.MONSTER_LANE_MIN_SPACING
                    : nextMinX;
                if (monster.node.x < minimumX) {
                    const blockedX = minimumX;
                    const previousX = previousXById[monster.id] ?? monster.node.x;
                    const horizontalDisplacement = blockedX - previousX;
                    const canJump = previousGroundMonster
                        && monster.blockedByMonsterLastFrame
                        && horizontalDisplacement >= 0
                        && !this.hasMonsterOnTop(monster)
                        && !monster.hasStackJumped
                        && Math.random() < BattleController.MONSTER_STACK_JUMP_CHANCE
                        && !monster.contactCar
                        && monster.attackTimer == 0;
                        if (canJump) {
                        this.startMonsterStackJump(monster, previousGroundMonster);
                        monster.blockedByMonsterLastFrame = false;
                        continue;
                    }

                    monster.node.x = blockedX;
                    monster.blockedByMonsterLastFrame = !!previousGroundMonster && !monster.blockedByMonsterLastFrame;
                } else {
                    monster.blockedByMonsterLastFrame = false;
                }

                nextMinX = monster.node.x;
                previousGroundMonster = monster;
            }
        }
    }

    private resolveMonsterVerticalStacking(dt: number): void {
        for (let laneIndex = 0; laneIndex < BattleController.MONSTER_LANE_OFFSETS.length; laneIndex += 1) {
            const laneMonsters = this.runtime.monsters
                .filter((monster) => cc.isValid(monster.node) && !monster.dying && monster.laneIndex === laneIndex);

            const stackMonsters = laneMonsters
                .filter((monster) => monster.stackedOnMonsterId > 0)
                .sort((left, right) => this.getMonsterStackDepth(left) - this.getMonsterStackDepth(right));
            stackMonsters.forEach((monster) => {
                const supportMonster = this.getSupportedMonster(monster);
                if (!supportMonster) {
                    monster.stackedOnMonsterId = 0;
                    monster.stackJumpProgress = 1;
                    return;
                }
                const targetY = supportMonster.node.y + BattleController.MONSTER_STACK_Y_OFFSET;
                if (this.isMonsterJumping(monster)) {
                    const nextProgress = clamp(
                        monster.stackJumpProgress + dt / BattleController.MONSTER_STACK_JUMP_DURATION,
                        0,
                        1,
                    );
                    const easedProgress = this.easeInOut(nextProgress);
                    const nextX = this.lerp(monster.stackJumpStartX, supportMonster.node.x, easedProgress);
                    const nextBaseY = this.lerp(monster.stackJumpStartY, targetY, easedProgress);
                    monster.node.x = nextX;
                    monster.node.y = nextBaseY + Math.sin(easedProgress * Math.PI) * BattleController.MONSTER_STACK_JUMP_ARC_HEIGHT;
                    monster.stackJumpProgress = nextProgress;
                } else {
                    monster.node.y = targetY;
                }
            });

            const elevatedMonsters = laneMonsters
                .filter((monster) => this.isMonsterElevated(monster))
                .sort((left, right) => {
                    return left.node.x - right.node.x;
                });

            let previousElevatedMonster: MonsterRuntime | null = null;
            elevatedMonsters.forEach((monster) => {
                if (!previousElevatedMonster) {
                    previousElevatedMonster = monster;
                    return;
                }
                const minimumX = previousElevatedMonster.node.x + BattleController.MONSTER_LANE_MIN_SPACING;
                if (monster.node.x < minimumX) {
                    monster.node.x = minimumX;
                }
                previousElevatedMonster = monster;
            });

            elevatedMonsters.forEach((monster) => {
                monster.node.zIndex = Math.round(-monster.node.y * 10);
            });
        }
    }

    private startMonsterStackJump(monster: MonsterRuntime, supportMonster: MonsterRuntime): void {
        monster.stackedOnMonsterId = supportMonster.id;
        monster.hasStackJumped = true;
        // monster.contactCar = false;
        // monster.attackTimer = 0;
        monster.stackJumpProgress = 0;
        monster.stackJumpStartX = monster.node.x;
        monster.stackJumpStartY = monster.node.y;
    }

    private getSupportedMonster(monster: Pick<MonsterRuntime, "id" | "laneIndex" | "stackedOnMonsterId">): MonsterRuntime | null {
        if (!monster.stackedOnMonsterId) {
            return null;
        }
        return this.runtime.monsters.find((candidate) => candidate.id === monster.stackedOnMonsterId
            && candidate.laneIndex === monster.laneIndex
            && cc.isValid(candidate.node)
            && !candidate.dying) || null;
    }

    private hasMonsterOnTop(monster: Pick<MonsterRuntime, "id" | "laneIndex">): boolean {
        return this.runtime.monsters.some((candidate) => candidate.stackedOnMonsterId === monster.id
            && candidate.laneIndex === monster.laneIndex
            && cc.isValid(candidate.node)
            && !candidate.dying);
    }

    private getMonsterStackDepth(monster: Pick<MonsterRuntime, "id" | "laneIndex" | "stackedOnMonsterId">, visited: Record<number, boolean> = {}): number {
        if (!monster.stackedOnMonsterId || visited[monster.id]) {
            return 0;
        }
        visited[monster.id] = true;
        const supportMonster = this.getSupportedMonster(monster);
        if (!supportMonster) {
            return 0;
        }
        return this.getMonsterStackDepth(supportMonster, visited) + 1;
    }

    private isMonsterElevated(monster: Pick<MonsterRuntime, "laneIndex" | "node" | "stackedOnMonsterId">): boolean {
        if (monster.stackedOnMonsterId > 0) {
            return true;
        }
        return monster.node.y > this.getMonsterLaneY(monster.laneIndex) + 0.01;
    }

    private isMonsterJumping(monster: Pick<MonsterRuntime, "stackJumpProgress" | "stackedOnMonsterId">): boolean {
        return monster.stackedOnMonsterId > 0 && monster.stackJumpProgress < 1;
    }

    private lerp(from: number, to: number, progress: number): number {
        return from + (to - from) * progress;
    }

    private easeInOut(progress: number): number {
        return progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    }

    private recycleBullet(index: number): void {
        const bullet = this.runtime.bullets[index];
        this.runtime.bullets.splice(index, 1);
        if (cc.isValid(bullet) && bullet.node) {
            this.runtime.poolManager.put("bullet", bullet.node);
        }
    }

    private getCurrentCarSpeed(): number {
        if (this.runtime.context.phase === GamePhase.Boss && !this.runtime.bossEntranceActive) {
            return 0;
        }

        const contactCount = this.runtime.monsters.filter((monster) => monster.contactCar).length;
        const speedFactor = 1 - GameConfig.monster.slowFactorPerMonster * contactCount;
        const searchSpeedMultiplier = this.hasAttackableTargetInRange() ? 1 : BattleController.SEARCH_MOVE_SPEED_MULTIPLIER;
        return Math.max(0, GameConfig.car.baseSpeed * speedFactor * searchSpeedMultiplier);
    }

    private hasAttackableTargetInRange(): boolean {
        if (!this.runtime.getCarAnchorNode()) {
            return false;
        }

        const carPosition = this.runtime.getCarWorldPosition();
        const attackRange = GameConfig.player.attackRange;

        if (this.runtime.context.phase === GamePhase.Boss && this.runtime.refs.bossNode && this.runtime.refs.bossNode.active) {
            const bossCenter = this.runtime.getBossCenterWorldPosition();
            if (distance(carPosition, bossCenter) <= attackRange) {
                return true;
            }
        }

        return this.runtime.monsters.some((monster) => {
            if (monster.dying) {
                return false;
            }
            return distance(carPosition, cc.v2(monster.node.x, monster.node.y)) <= attackRange;
        });
    }

    private getBattleProgress(): number {
        const totalRounds = Math.max(1, GameConfig.campaign.totalRounds);
        const completedRounds = this.getCompletedRounds();
        const activeRoundProgress = this.shouldAccumulateCurrentRoundProgress()
            ? this.getCurrentRoundProgress()
            : 0;
        return clamp((completedRounds + activeRoundProgress) / totalRounds, 0, 1);
    }

    private getCompletedRounds(): number {
        if (this.runtime.context.phase === GamePhase.Win) {
            return Math.max(0, GameConfig.campaign.totalRounds);
        }
        return clamp(this.runtime.context.currentRound - 1, 0, GameConfig.campaign.totalRounds);
    }

    private shouldAccumulateCurrentRoundProgress(): boolean {
        return this.runtime.context.phase === GamePhase.Battle
            || this.runtime.context.phase === GamePhase.Boss
            || this.runtime.context.phase === GamePhase.QuestionPause;
    }

    private getCurrentRoundProgress(): number {
        const roundStartDistance = this.runtime.context.roundStartDistance;
        const fullProgressCameraX = this.runtime.bossEntranceTargetCameraX > 0
            ? this.runtime.bossEntranceTargetCameraX
            : roundStartDistance
                + GameConfig.car.bossTriggerX
                + GameConfig.designWidth / 2
                + GameConfig.boss.entranceScreenPadding
                + GameConfig.boss.width / 2;
        const totalProgressDistance = fullProgressCameraX - roundStartDistance;
        if (totalProgressDistance <= 0) {
            return 0;
        }
        return clamp((this.runtime.cameraTrackX - roundStartDistance) / totalProgressDistance, 0, 1);
    }

    private shouldShowBattleProgress(): boolean {
        return this.runtime.context.phase === GamePhase.Battle
            || this.runtime.context.phase === GamePhase.Boss
            || this.runtime.context.phase === GamePhase.QuestionPause
            || this.runtime.context.phase === GamePhase.NormalPause;
    }

    private getCarRect(): { x: number; y: number; width: number; height: number } {
        const carNode = this.runtime.getCarVisualNode() || this.runtime.getCarAnchorNode();
        return this.runtime.getNodeColliderRect(carNode, 180, 90);
    }

    private getCarRectByIndex(carIndex: number): { x: number; y: number; width: number; height: number } {
        const carNode = this.runtime.getCarVisualNodeByIndex(carIndex) || this.runtime.getCarVisualNode() || this.runtime.getCarAnchorNode();
        return this.runtime.getNodeColliderRect(carNode, 180, 90);
    }

    private getContactCarHit(
        monsterRect: { x: number; y: number; width: number; height: number },
        attackerY: number,
    ): { index: number; contactFrontX: number } | null {
        const aliveIndices = this.runtime.context.getAliveCarIndices();
        let result: { index: number; contactFrontX: number; distanceToAttacker: number } | null = null;
        let bottomFallback: { index: number; contactFrontX: number; minY: number } | null = null;

        aliveIndices.forEach((index) => {
            const rect = this.getCarRectByIndex(index);
            const halfHeight = rect.height / 2;
            const minY = rect.y - halfHeight;
            const contactFrontX = rect.x + rect.width / 2 - BattleController.MONSTER_CAR_CONTACT_SHRINK;
            if (!bottomFallback || minY < bottomFallback.minY) {
                bottomFallback = {
                    index,
                    contactFrontX,
                    minY,
                };
            }
            const withinCarYRange = (attackerY >= rect.y - halfHeight && attackerY <= rect.y + halfHeight);
            if (!withinCarYRange) {
                return;
            }

            const reachesCarFront = monsterRect.x - monsterRect.width / 2 <= contactFrontX;
            const hitsCar = rectIntersects(monsterRect, rect) || reachesCarFront;
            if (!hitsCar) {
                return;
            }

            const distanceToAttacker = Math.abs(rect.y - attackerY);
            if (!result || distanceToAttacker < result.distanceToAttacker) {
                result = {
                    index,
                    contactFrontX,
                    distanceToAttacker,
                };
            }
        });

        if (!result && bottomFallback && attackerY < bottomFallback.minY) {
            const bottomRect = this.getCarRectByIndex(bottomFallback.index);
            const reachesCarFront = monsterRect.x - monsterRect.width / 2 <= bottomFallback.contactFrontX;
            const hitsCar = rectIntersects(monsterRect, bottomRect) || reachesCarFront;
            if (hitsCar) {
                return {
                    index: bottomFallback.index,
                    contactFrontX: bottomFallback.contactFrontX,
                };
            }
        }

        return result ? { index: result.index, contactFrontX: result.contactFrontX } : null;
    }

    private getHeroRect(): { x: number; y: number; width: number; height: number } {
        const heroNode = this.runtime.refs.heroNode;
        return this.runtime.getNodeColliderRect(heroNode, 90, 140);
    }

    private rectOverlapsY(a: { y: number; height: number }, b: { y: number; height: number }): boolean {
        return Math.abs(a.y - b.y) * 2 < a.height + b.height;
    }

    private getBattleSpawnRate(battleTime: number): number {
        const phase = GameConfig.monster.battleSpawnPhases.find((item) => battleTime >= item.start && battleTime < item.end);
        return phase ? phase.rate : 0;
    }

    private rollBossMonsterKind(): MonsterKind {
        return Math.random() < GameConfig.monster.bossPreSpawnNormalRatio ? "normal" : "elite";
    }

    private spawnBossPreWave(): void {
        return;
    }
}
