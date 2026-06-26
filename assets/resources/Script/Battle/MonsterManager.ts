import { GameConfig } from "../Core/GameConfig";
import { GamePhase } from "../Core/GameDefines";
import GameRuntime from "../Core/GameRuntime";
import { MonsterKind, MonsterRuntime } from "../Entity/EntityTypes";
import { clamp, randomRange, rectIntersects } from "../Util/MathUtil";

type Rect = { x: number; y: number; width: number; height: number };

type MonsterFrameCaches = {
    monsterById: Record<number, MonsterRuntime>;
    stackedChildrenCountById: Record<number, number>;
    laneMonsters: MonsterRuntime[][];
    groundLaneMonsters: MonsterRuntime[][];
    elevatedLaneMonsters: MonsterRuntime[][];
    stackLaneMonsters: MonsterRuntime[][];
    stackDepthById: Record<number, number>;
};

/**
 * 怪物管理器回调接口
 * 由 BattleController 实现，用于解耦怪物与车辆/英雄的交互
 */
export interface MonsterManagerCallbacks {
    /** 怪物攻击车辆 */
    onAttackCar: (baseDamage: number, attackerY?: number, preferredCarIndex?: number) => void;
    /** 怪物攻击英雄 */
    onAttackHero: (baseDamage: number) => void;
    /** 怪物被击杀（用于 killCount 计数） */
    onMonsterKilled: () => void;
    /** 获取车辆碰撞矩形 */
    getCarRect: () => Rect;
    /** 获取怪物与车辆的接触信息 */
    getContactCarHit: (monsterRect: Rect, attackerY: number) => { index: number; contactFrontX: number } | null;
    /** 获取英雄碰撞矩形 */
    getHeroRect: () => Rect;
    /** 判断两个矩形在 Y 轴上是否重叠 */
    rectOverlapsY: (a: { y: number; height: number }, b: { y: number; height: number }) => boolean;
}

/**
 * 怪物管理器
 * 负责怪物的生成、移动、碰撞、伤害、击退、堆叠和回收
 */
export default class MonsterManager {
    // ===== 怪物车道与间距 =====
    private static readonly MONSTER_LANE_OFFSETS = [-10, 0, 10];
    private static readonly MONSTER_LANE_MIN_SPACING = 30;
    private static readonly MONSTER_CAR_CONTACT_SHRINK = 10;

    // ===== 怪物堆叠 =====
    private static readonly MONSTER_STACK_JUMP_CHANCE = 0.5;
    private static readonly MONSTER_STACK_JUMP_DURATION = 0.8;
    private static readonly MONSTER_STACK_JUMP_ARC_HEIGHT = 22;
    private static readonly MONSTER_STACK_Y_OFFSET = 46;
    private static readonly MONSTER_STACK_FALL_SPEED = 280;

    // ===== 怪物击退 =====
    private static readonly MONSTER_KNOCKBACK_DECAY = 9;
    private static readonly MONSTER_KNOCKBACK_MIN_SPEED = 18;
    private static readonly ROLLER_KNOCKBACK_X = 180;
    private static readonly ROLLER_KNOCKBACK_Y = 55;
    private static readonly BOMB_KNOCKBACK_SPEED = 220;

    // ===== Boss 阶段怪物生成 =====
    private static readonly BOSS_PRE_SPAWN_SPACING = 90;
    private static readonly BOSS_PRE_SPAWN_INTERVAL = 0.28;

    private readonly runtime: GameRuntime;
    private readonly callbacks: MonsterManagerCallbacks;

    public constructor(runtime: GameRuntime, callbacks: MonsterManagerCallbacks) {
        this.runtime = runtime;
        this.callbacks = callbacks;
    }

    /**
     * 更新怪物生成
     */
    public updateSpawning(dt: number): void {
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
            ? MonsterManager.BOSS_PRE_SPAWN_INTERVAL
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

    /**
     * 更新所有怪物：移动、碰撞、攻击、击退、回收
     */
    public updateMonsters(dt: number): void {
        const carRect = this.callbacks.getCarRect();
        const heroRect = this.callbacks.getHeroRect();
        const contactCarFrontX = carRect.x + carRect.width / 2 - MonsterManager.MONSTER_CAR_CONTACT_SHRINK;
        const previousXById: Record<number, number> = {};
        const preUpdateCaches = this.buildMonsterFrameCaches();

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
            const supportMonster = this.getSupportedMonster(monster, preUpdateCaches.monsterById);

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
                    monster.node.y = Math.max(laneY, monster.node.y - MonsterManager.MONSTER_STACK_FALL_SPEED * dt);
                } else if (monster.node.y < laneY) {
                    monster.node.y = laneY;
                }
            }

            const monsterRect = this.runtime.getNodeColliderRect(monster.node, GameConfig.monster.width, GameConfig.monster.height);
            const heroContactFrontX = heroRect.x + heroRect.width / 2 - MonsterManager.MONSTER_CAR_CONTACT_SHRINK;
            const reachesHeroFront = monster.node.x - GameConfig.monster.width / 2 <= heroContactFrontX;
            const carContact = this.callbacks.getContactCarHit(monsterRect, monster.node.y + monster.node.parent.y);
            const hitsCar = !!carContact;
            const hitsHero = rectIntersects(monsterRect, heroRect) || (reachesHeroFront && this.callbacks.rectOverlapsY(monsterRect, heroRect));
            const shouldAttackHero = !hitsCar && hitsHero;
            if (shouldAttackHero) {
                monster.contactHero = true;
                monster.node.x = heroContactFrontX + GameConfig.monster.width / 2;
                monster.attackTimer += dt;
                if (monster.attackTimer >= GameConfig.monster.attackInterval) {
                    monster.attackTimer = 0;
                    this.runtime.playMonsterAttack(monster.node);
                    this.callbacks.onAttackHero(monster.attack);
                }
            } else if (hitsCar) {
                monster.contactCar = true;
                monster.contactCarIndex = carContact.index;
                monster.node.x = carContact.contactFrontX + GameConfig.monster.width / 2;
                monster.attackTimer += dt;
                if (monster.attackTimer >= GameConfig.monster.attackInterval) {
                    monster.attackTimer = 0;
                    this.runtime.playMonsterAttack(monster.node);
                    this.callbacks.onAttackCar(monster.attack, monster.node.y, monster.contactCarIndex);
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

        const postUpdateCaches = this.buildMonsterFrameCaches();
        this.resolveMonsterLaneSpacing(contactCarFrontX, previousXById, postUpdateCaches);
        const postSpacingCaches = this.buildMonsterFrameCaches();
        this.resolveMonsterVerticalStacking(dt, postSpacingCaches);
    }

    /**
     * 对指定怪物造成伤害
     */
    public damageMonsterById(monsterId: number, damage: number, source: "normal" | "bomb" | "roller" = "normal"): void {
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

    /**
     * 击杀指定怪物
     */
    public killMonster(monsterId: number): void {
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
            this.callbacks.onMonsterKilled();
            this.runtime.spawnFloatText(x, y + 14, "\u51fb\u6740", new cc.Color(110, 255, 122, 255));
        };

        this.runtime.playMonsterDie(monster.node, finishDeath);
    }

    /**
     * 应用滚轮技能击退
     */
    public applyRollerKnockback(monsterId: number): void {
        const monster = this.runtime.monsters.find((item) => item.id === monsterId);
        if (!monster || !cc.isValid(monster.node) || monster.dying) {
            return;
        }

        this.addMonsterKnockback(monster, MonsterManager.ROLLER_KNOCKBACK_X, MonsterManager.ROLLER_KNOCKBACK_Y);
    }

    /**
     * 应用炸弹技能击退
     */
    public applyBombKnockback(monsterId: number, center: cc.Vec2): void {
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
            direction.x * MonsterManager.BOMB_KNOCKBACK_SPEED,
            direction.y * MonsterManager.BOMB_KNOCKBACK_SPEED,
        );
    }

    /**
     * Boss 前置波生成（预留）
     */
    public spawnBossPreWave(): void {
        return;
    }

    // ==================== 私有方法 ====================

    /**
     * 生成一只怪物
     */
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
        monster.hp = Math.floor(config.hp * Math.pow(GameConfig.monster.glowRateRound, this.runtime.context.currentRound - 1));
        monster.maxHp = monster.hp;
        monster.attack = Math.floor(config.attack * Math.pow(GameConfig.monster.glowRateRound, this.runtime.context.currentRound - 1));
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

    /**
     * 回收怪物（放回对象池）
     */
    private recycleMonster(index: number): void {
        const monster = this.runtime.monsters[index];
        this.runtime.monsters.splice(index, 1);
        this.runtime.poolManager.put("monster", monster.node);
    }

    /**
     * 添加击退速度
     */
    private addMonsterKnockback(monster: MonsterRuntime, velocityX: number, velocityY: number): void {
        monster.knockbackVelocityX += velocityX;
        monster.knockbackVelocityY += velocityY;
    }

    /**
     * 更新怪物击退状态
     */
    private updateMonsterKnockback(monster: MonsterRuntime, dt: number): void {
        if (Math.abs(monster.knockbackVelocityX) < MonsterManager.MONSTER_KNOCKBACK_MIN_SPEED
            && Math.abs(monster.knockbackVelocityY) < MonsterManager.MONSTER_KNOCKBACK_MIN_SPEED) {
            monster.knockbackVelocityX = 0;
            monster.knockbackVelocityY = 0;
            return;
        }

        monster.node.x += monster.knockbackVelocityX * dt;
        monster.node.y += monster.knockbackVelocityY * dt;

        const damping = Math.exp(-MonsterManager.MONSTER_KNOCKBACK_DECAY * dt);
        monster.knockbackVelocityX *= damping;
        monster.knockbackVelocityY *= damping;
    }

    // ==================== 生成位置 ====================

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
        let count = 0;
        for (const monster of this.runtime.monsters) {
            if (cc.isValid(monster.node) && !monster.dying) {
                count += 1;
            }
        }
        return count;
    }

    private getBossVisibleAreaMonsterCount(): number {
        const spawnAreaLeft = this.runtime.cameraTrackX - 40;
        const spawnAreaRight = this.runtime.cameraTrackX + GameConfig.designWidth / 2 + 140;
        let count = 0;
        for (const monster of this.runtime.monsters) {
            if (!cc.isValid(monster.node) || monster.dying) {
                continue;
            }
            if (monster.node.x >= spawnAreaLeft && monster.node.x <= spawnAreaRight) {
                count += 1;
            }
        }
        return count;
    }

    // ==================== 车道 ====================

    private getRandomMonsterLaneIndex(): number {
        return Math.floor(Math.random() * MonsterManager.MONSTER_LANE_OFFSETS.length);
    }

    private getMonsterLaneIndexByY(y: number): number {
        let nearestIndex = 0;
        let nearestDistance = Number.MAX_SAFE_INTEGER;
        MonsterManager.MONSTER_LANE_OFFSETS.forEach((offset, index) => {
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
        const offset = MonsterManager.MONSTER_LANE_OFFSETS[laneIndex] || 0;
        return GameConfig.monster.laneY + offset;
    }

    // ==================== 车道间距与堆叠 ====================

    private resolveMonsterLaneSpacing(carFrontX: number, previousXById: Record<number, number>, caches: MonsterFrameCaches): void {
        for (let laneIndex = 0; laneIndex < MonsterManager.MONSTER_LANE_OFFSETS.length; laneIndex += 1) {
            const laneMonsters = caches.groundLaneMonsters[laneIndex];

            let nextMinX = carFrontX + GameConfig.monster.width / 2;
            let previousGroundMonster: MonsterRuntime | null = null;
            for (const monster of laneMonsters) {
                const minimumX = previousGroundMonster
                    ? nextMinX + MonsterManager.MONSTER_LANE_MIN_SPACING
                    : nextMinX;
                if (monster.node.x < minimumX) {
                    const blockedX = minimumX;
                    const previousX = previousXById[monster.id] ?? monster.node.x;
                    const horizontalDisplacement = blockedX - previousX;
                    const canJump = previousGroundMonster
                        && monster.blockedByMonsterLastFrame
                        && horizontalDisplacement >= 0
                        && !this.hasMonsterOnTop(monster, caches.stackedChildrenCountById)
                        && !monster.hasStackJumped
                        && Math.random() < MonsterManager.MONSTER_STACK_JUMP_CHANCE
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

    private resolveMonsterVerticalStacking(dt: number, caches: MonsterFrameCaches): void {
        for (let laneIndex = 0; laneIndex < MonsterManager.MONSTER_LANE_OFFSETS.length; laneIndex += 1) {
            const stackMonsters = caches.stackLaneMonsters[laneIndex];
            stackMonsters.forEach((monster) => {
                const supportMonster = this.getSupportedMonster(monster, caches.monsterById);
                if (!supportMonster) {
                    monster.stackedOnMonsterId = 0;
                    monster.stackJumpProgress = 1;
                    return;
                }
                const targetY = supportMonster.node.y + MonsterManager.MONSTER_STACK_Y_OFFSET;
                if (this.isMonsterJumping(monster)) {
                    const nextProgress = clamp(
                        monster.stackJumpProgress + dt / MonsterManager.MONSTER_STACK_JUMP_DURATION,
                        0,
                        1,
                    );
                    const easedProgress = this.easeInOut(nextProgress);
                    const nextX = this.lerp(monster.stackJumpStartX, supportMonster.node.x, easedProgress);
                    const nextBaseY = this.lerp(monster.stackJumpStartY, targetY, easedProgress);
                    monster.node.x = nextX;
                    monster.node.y = nextBaseY + Math.sin(easedProgress * Math.PI) * MonsterManager.MONSTER_STACK_JUMP_ARC_HEIGHT;
                    monster.stackJumpProgress = nextProgress;
                } else {
                    monster.node.y = targetY;
                }
            });

            const elevatedMonsters = caches.elevatedLaneMonsters[laneIndex];

            let previousElevatedMonster: MonsterRuntime | null = null;
            elevatedMonsters.forEach((monster) => {
                if (!previousElevatedMonster) {
                    previousElevatedMonster = monster;
                    return;
                }
                const minimumX = previousElevatedMonster.node.x + MonsterManager.MONSTER_LANE_MIN_SPACING;
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
        monster.stackJumpProgress = 0;
        monster.stackJumpStartX = monster.node.x;
        monster.stackJumpStartY = monster.node.y;
    }

    private getSupportedMonster(
        monster: Pick<MonsterRuntime, "id" | "laneIndex" | "stackedOnMonsterId">,
        monsterById: Record<number, MonsterRuntime>,
    ): MonsterRuntime | null {
        if (!monster.stackedOnMonsterId) {
            return null;
        }
        const supportMonster = monsterById[monster.stackedOnMonsterId];
        if (!supportMonster || supportMonster.laneIndex !== monster.laneIndex || !cc.isValid(supportMonster.node) || supportMonster.dying) {
            return null;
        }
        return supportMonster;
    }

    private hasMonsterOnTop(
        monster: Pick<MonsterRuntime, "id" | "laneIndex">,
        stackedChildrenCountById: Record<number, number>,
    ): boolean {
        return (stackedChildrenCountById[monster.id] || 0) > 0;
    }

    private getMonsterStackDepth(
        monster: Pick<MonsterRuntime, "id" | "laneIndex" | "stackedOnMonsterId">,
        monsterById: Record<number, MonsterRuntime>,
        cache: Record<number, number>,
        visited: Record<number, boolean> = {},
    ): number {
        if (cache[monster.id] !== undefined) {
            return cache[monster.id];
        }
        if (!monster.stackedOnMonsterId || visited[monster.id]) {
            return 0;
        }
        visited[monster.id] = true;
        const supportMonster = this.getSupportedMonster(monster, monsterById);
        if (!supportMonster) {
            return 0;
        }
        const depth = this.getMonsterStackDepth(supportMonster, monsterById, cache, visited) + 1;
        cache[monster.id] = depth;
        return depth;
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

    // ==================== 工具函数 ====================

    private lerp(from: number, to: number, progress: number): number {
        return from + (to - from) * progress;
    }

    private easeInOut(progress: number): number {
        return progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    }

    private getBattleSpawnRate(battleTime: number): number {
        const phase = GameConfig.monster.battleSpawnPhases.find((item) => battleTime >= item.start && battleTime < item.end);
        return phase ? phase.rate : 0;
    }

    private rollBossMonsterKind(): MonsterKind {
        return Math.random() < GameConfig.monster.bossPreSpawnNormalRatio ? "normal" : "elite";
    }

    private buildMonsterFrameCaches(): MonsterFrameCaches {
        const laneCount = MonsterManager.MONSTER_LANE_OFFSETS.length;
        const laneMonsters = Array.from({ length: laneCount }, () => [] as MonsterRuntime[]);
        const groundLaneMonsters = Array.from({ length: laneCount }, () => [] as MonsterRuntime[]);
        const elevatedLaneMonsters = Array.from({ length: laneCount }, () => [] as MonsterRuntime[]);
        const stackLaneMonsters = Array.from({ length: laneCount }, () => [] as MonsterRuntime[]);
        const monsterById: Record<number, MonsterRuntime> = {};
        const stackedChildrenCountById: Record<number, number> = {};
        const stackDepthById: Record<number, number> = {};
        const activeMonsters: MonsterRuntime[] = [];

        for (const monster of this.runtime.monsters) {
            if (!cc.isValid(monster.node) || monster.dying) {
                continue;
            }
            monsterById[monster.id] = monster;
            activeMonsters.push(monster);
            if (monster.stackedOnMonsterId > 0) {
                stackedChildrenCountById[monster.stackedOnMonsterId] = (stackedChildrenCountById[monster.stackedOnMonsterId] || 0) + 1;
            }
        }

        for (const monster of activeMonsters) {
            const laneIndex = monster.laneIndex;
            if (laneIndex < 0 || laneIndex >= laneCount) {
                continue;
            }
            laneMonsters[laneIndex].push(monster);
            if (this.isMonsterElevated(monster)) {
                elevatedLaneMonsters[laneIndex].push(monster);
            } else {
                groundLaneMonsters[laneIndex].push(monster);
            }
            if (monster.stackedOnMonsterId > 0) {
                stackLaneMonsters[laneIndex].push(monster);
            }
        }

        for (let laneIndex = 0; laneIndex < laneCount; laneIndex += 1) {
            laneMonsters[laneIndex].sort((left, right) => left.node.x - right.node.x);
            groundLaneMonsters[laneIndex].sort((left, right) => left.node.x - right.node.x);
            elevatedLaneMonsters[laneIndex].sort((left, right) => left.node.x - right.node.x);
            stackLaneMonsters[laneIndex].sort((left, right) => {
                const leftDepth = this.getMonsterStackDepth(left, monsterById, stackDepthById);
                const rightDepth = this.getMonsterStackDepth(right, monsterById, stackDepthById);
                return leftDepth - rightDepth;
            });
        }

        return {
            monsterById,
            stackedChildrenCountById,
            laneMonsters,
            groundLaneMonsters,
            elevatedLaneMonsters,
            stackLaneMonsters,
            stackDepthById,
        };
    }
}
