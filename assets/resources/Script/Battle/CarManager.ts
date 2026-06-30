import { GameConfig } from "../Core/GameConfig";
import { GamePhase } from "../Core/GameDefines";
import GameRuntime from "../Core/GameRuntime";
import CarPrefab from "./CarPrefab";
import AudioManager from "../Framework/audio/TD_AudioManager";
import { AudioID } from "../global/TD_Constants";
import { distance, rectIntersects } from "../Util/MathUtil";

type Rect = { x: number; y: number; width: number; height: number };

/**
 * 车辆管理器回调接口
 * 由 BattleController 实现，用于解耦车辆与怪物/英雄系统
 */
export interface CarManagerCallbacks {
    /** 对指定怪物造成伤害（用于锯齿接触伤害） */
    onDamageMonster: (monsterId: number, damage: number) => void;
    /** 无存活车辆时转为攻击英雄 */
    onAttackHero: (baseDamage: number) => void;
}

/**
 * 车辆管理器
 * 负责车辆的推进移动、锯齿接触伤害、受击伤害分配、碰撞矩形与锯齿视觉旋转
 */
export default class CarManager {
    private static readonly SEARCH_MOVE_SPEED_MULTIPLIER = 2;
    private static readonly MONSTER_CAR_CONTACT_SHRINK = 10;
    private static readonly DEFENSE_DAMAGE_MULTIPLIER = 0.2;

    private readonly runtime: GameRuntime;
    private readonly callbacks: CarManagerCallbacks;

    public constructor(runtime: GameRuntime, callbacks: CarManagerCallbacks) {
        this.runtime = runtime;
        this.callbacks = callbacks;
    }

    /**
     * 锯齿接触伤害：周期性对接触车辆的怪物造成伤害
     */
    public updateSawDamage(dt: number): void {
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
            const sawNode = attackCarIndex >= 0
                ? this.runtime.getSawNodeByIndex(attackCarIndex)
                : this.runtime.getSawNode();
            const sawView = sawNode && sawNode.parent ? sawNode.parent.getComponent(CarPrefab) : null;
            if (sawView) {
                sawView.playSawHitFeedback();
            }
            this.callbacks.onDamageMonster(monster.id, damage);
        });
    }

    /**
     * 车辆推进移动：根据接触怪物数量降速，根据攻击目标在范围内决定搜索倍速
     */
    public updateCarMovement(dt: number): void {
        if (this.runtime.context.phase === GamePhase.Boss && !this.runtime.bossEntranceActive) {
            this.stopCarMoveAudio();
            return;
        }

        const moveSpeed = this.getCurrentCarSpeed();
        this.syncCarMoveAudio(moveSpeed > 0 && dt > 0);
        this.runtime.context.reachedDistance += moveSpeed * dt;

        if (moveSpeed > 0) {
            this.runtime.monsters.forEach((monster) => {
                if (monster.contactCar) {
                    monster.node.x += moveSpeed * dt;
                }
            });
        }
    }

    /**
     * 当前车辆移动速度
     */
    public getCurrentCarSpeed(): number {
        if (this.runtime.context.phase === GamePhase.Boss && !this.runtime.bossEntranceActive) {
            return 0;
        }

        const contactCount = this.runtime.monsters.filter((monster) => monster.contactCar).length;
        const speedFactor = 1 - GameConfig.monster.slowFactorPerMonster * contactCount;
        const searchSpeedMultiplier = 1;//this.hasAttackableTargetInRange() ? 1 : CarManager.SEARCH_MOVE_SPEED_MULTIPLIER;
        return Math.max(0, GameConfig.car.baseSpeed * speedFactor * searchSpeedMultiplier);
    }

    public stopCarMoveAudio(): void {
        AudioManager.getInstance().stopLoopingSFX(AudioID.AudioID_car_move);
    }

    /**
     * 攻击范围内是否存在可攻击目标（怪物或 Boss）
     */
    public hasAttackableTargetInRange(): boolean {
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

    /**
     * 怪物攻击车辆侧：分配到合适车辆并扣血，车辆全毁后转为攻击英雄
     */
    public attackCarSide(baseDamage: number, attackerY?: number, preferredCarIndex: number = -1): void {
        if (this.runtime.context.sawCarAlive) {
            const targetCarIndex = preferredCarIndex >= 0 && this.runtime.context.getCarHp(preferredCarIndex) > 0
                ? preferredCarIndex
                : this.getCarIndexForIncomingAttack(attackerY);
            const damage = this.getIncomingDamage(baseDamage, targetCarIndex);
            const carPosition = this.runtime.getCarWorldPositionByIndex(targetCarIndex);
            this.runtime.spawnFloatText(carPosition.x, carPosition.y + 45, `-${Math.ceil(damage)}`, new cc.Color(255, 96, 96, 255));
            AudioManager.getInstance().playSFXThrottled(AudioID.AudioID_enemy_attack, 0.15);
            const damageResult = this.runtime.context.damageCar(targetCarIndex, damage);
            this.runtime.playCarShieldHitEffect(targetCarIndex);
            if (damageResult.destroyed) {
                if (this.runtime.context.sawCarAlive) {
                    this.runtime.spawnFloatText(carPosition.x, carPosition.y + 78, "\u5907\u7528\u6218\u8f66\u9876\u4e0a", new cc.Color(255, 220, 120, 255));
                    return;
                }

                this.runtime.spawnFloatText(carPosition.x, carPosition.y + 40, "\u8f66\u8f86\u635f\u6bc1", new cc.Color(255, 96, 96, 255));
            }
            return;
        }

        this.callbacks.onAttackHero(baseDamage);
    }

    /**
     * 根据是否解锁防御，计算实际承受伤害
     */
    public getIncomingDamage(baseDamage: number, carIndex?: number): number {
        const defenseUnlocked = carIndex === undefined
            ? this.runtime.context.defenseUnlocked
            : this.runtime.context.getCarDefenseUnlocked(carIndex);
        if (!defenseUnlocked) {
            return baseDamage;
        }
        return Math.max(0, baseDamage * CarManager.DEFENSE_DAMAGE_MULTIPLIER);
    }

    /**
     * 根据攻击者 Y 坐标选择承受攻击的车辆索引
     */
    public getCarIndexForIncomingAttack(attackerY?: number): number {
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

    /**
     * 车辆主体碰撞矩形（用于怪物接触判定）
     */
    public getCarRect(): Rect {
        const carNode = this.runtime.getCarVisualNode() || this.runtime.getCarAnchorNode();
        return this.runtime.getNodeColliderRect(carNode, 180, 90);
    }

    /**
     * 指定索引车辆的碰撞矩形
     */
    public getCarRectByIndex(carIndex: number): Rect {
        const carNode = this.runtime.getCarVisualNodeByIndex(carIndex) || this.runtime.getCarVisualNode() || this.runtime.getCarAnchorNode();
        return this.runtime.getNodeColliderRect(carNode, 180, 90);
    }

    /**
     * 获取怪物与车辆的接触命中信息（含底部车辆兜底逻辑）
     */
    public getContactCarHit(monsterRect: Rect, attackerY: number): { index: number; contactFrontX: number } | null {
        const aliveIndices = this.runtime.context.getAliveCarIndices();
        let result: { index: number; contactFrontX: number; distanceToAttacker: number } | null = null;
        let bottomFallback: { index: number; contactFrontX: number; minY: number } | null = null;

        aliveIndices.forEach((index) => {
            const rect = this.getCarRectByIndex(index);
            const halfHeight = rect.height / 2;
            const minY = rect.y - halfHeight;
            const contactFrontX = rect.x + rect.width / 2 - CarManager.MONSTER_CAR_CONTACT_SHRINK;
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

    private syncCarMoveAudio(isMoving: boolean): void {
        if (isMoving) {
            AudioManager.getInstance().playLoopingSFX(AudioID.AudioID_car_move);
            return;
        }

        this.stopCarMoveAudio();
    }

    /**
     * 锯齿视觉旋转：根据车辆解锁状态显示并启动锯齿旋转动画
     */
}
