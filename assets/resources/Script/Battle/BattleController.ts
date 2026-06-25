import { GameConfig, DebugConfig } from "../Core/GameConfig";
import { GamePhase } from "../Core/GameDefines";
import GameRuntime from "../Core/GameRuntime";
import { SkillType } from "../Entity/EntityTypes";
import { clamp } from "../Util/MathUtil";
import { BattleViewData } from "../UI/BattleView";
import CameraFollow from "./CameraFollow";
import SkillController from "../Skill/SkillController";
import BulletManager from "./BulletManager";
import MonsterManager from "./MonsterManager";
import CarManager from "./CarManager";

interface BattleCallbacks {
    onNeedQuestion: (skillType: SkillType, cost: number) => void;
    onBattleFinished: (isWin: boolean) => void;
}

export default class BattleController {
    private static readonly DEFENSE_DAMAGE_MULTIPLIER = 0.2;

    private readonly runtime: GameRuntime;
    private readonly cameraFollow: CameraFollow;
    private readonly skillController: SkillController;
    private readonly bulletManager: BulletManager;
    private readonly monsterManager: MonsterManager;
    private readonly carManager: CarManager;
    private readonly callbacks: BattleCallbacks;

    public constructor(runtime: GameRuntime, callbacks: BattleCallbacks) {
        this.runtime = runtime;
        this.cameraFollow = new CameraFollow(runtime);
        this.skillController = new SkillController(runtime);
        this.callbacks = callbacks;
        this.bulletManager = new BulletManager(runtime, {
            onDamageMonster: (monsterId, damage, source) => this.monsterManager.damageMonsterById(monsterId, damage, source),
            onDamageBoss: (damage) => this.damageBoss(damage),
        });
        this.carManager = new CarManager(runtime, {
            onDamageMonster: (monsterId, damage) => this.monsterManager.damageMonsterById(monsterId, damage),
            onAttackHero: (baseDamage) => this.attackHeroSide(baseDamage),
        });
        this.monsterManager = new MonsterManager(runtime, {
            onAttackCar: (baseDamage, attackerY, preferredCarIndex) => this.carManager.attackCarSide(baseDamage, attackerY, preferredCarIndex),
            onAttackHero: (baseDamage) => this.attackHeroSide(baseDamage),
            onMonsterKilled: () => { this.runtime.context.killCount += 1; },
            getCarRect: () => this.carManager.getCarRect(),
            getContactCarHit: (monsterRect, attackerY) => this.carManager.getContactCarHit(monsterRect, attackerY),
            getHeroRect: () => this.getHeroRect(),
            rectOverlapsY: (a, b) => this.rectOverlapsY(a, b),
        });
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
        this.monsterManager.updateSpawning(dt);
        this.bulletManager.update(dt);
        this.monsterManager.updateMonsters(dt);
        this.carManager.updateSawDamage(dt);
        this.carManager.updateCarMovement(dt);
        this.runtime.updateActorPlacement();
        this.skillController.updateRollers(dt, (monsterId, damage) => {
            this.monsterManager.damageMonsterById(monsterId, damage, "roller");
            this.monsterManager.applyRollerKnockback(monsterId);
        });
        this.updateEffects(dt);
        this.tryEnterBossPhase();
        this.checkFailState();
    }

    public updateVisuals(): void {
        this.cameraFollow.update();
        this.carManager.updateSawVisuals();
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
            this.monsterManager.damageMonsterById(monsterId, damage, "bomb");
            this.monsterManager.applyBombKnockback(monsterId, center);
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
                this.monsterManager.damageMonsterById(monsterId, damage, "bomb");
                this.monsterManager.applyBombKnockback(monsterId, center);
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
                ? `\u8f66\u901f ${this.carManager.getCurrentCarSpeed().toFixed(1)}  \u602a\u7269 ${this.runtime.monsters.length}  \u5b50\u5f39 ${this.runtime.bullets.length}  \u955c\u5934 ${this.runtime.cameraTrackX.toFixed(1)}`
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
        this.monsterManager.spawnBossPreWave();
        this.runtime.placeBossAtScreenRight();
        this.runtime.context.phase = GamePhase.Boss;
        const bossCenter = this.runtime.getBossCenterWorldPosition();
        this.runtime.spawnFloatText(bossCenter.x, bossCenter.y + 60, "BOSS \u51fa\u73b0", new cc.Color(255, 130, 255, 255));
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

    private getHeroRect(): { x: number; y: number; width: number; height: number } {
        const heroNode = this.runtime.refs.heroNode;
        return this.runtime.getNodeColliderRect(heroNode, 90, 140);
    }

    private rectOverlapsY(a: { y: number; height: number }, b: { y: number; height: number }): boolean {
        return Math.abs(a.y - b.y) * 2 < a.height + b.height;
    }
}
