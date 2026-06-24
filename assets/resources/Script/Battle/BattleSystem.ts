import { coordinateSystem } from "../Framework/CoordinateSystem";
import { eventBus } from "../Framework/EventBus";
import { GameEvent } from "../Framework/GameEvents";
import { effectManager } from "../Framework/EffectManager";
import { monsterManager } from "./MonsterManager";
import { bulletManager } from "./BulletManager";

/**
 * 战斗系统
 * 整合所有战斗相关的管理器，提供统一的接口
 */
export class BattleSystem {
    private static _instance: BattleSystem | null = null;

    // 战斗状态
    private isBattling: boolean = false;
    private battleTime: number = 0;

    // 玩家数据
    private playerHp: number = 100;
    private playerMaxHp: number = 100;
    private score: number = 0;
    private gold: number = 0;

    // 根节点引用
    private monsterRoot: cc.Node | null = null;
    private bulletRoot: cc.Node | null = null;
    private effectRoot: cc.Node | null = null;

    /**
     * 获取单例实例
     */
    public static get instance(): BattleSystem {
        if (!BattleSystem._instance) {
            BattleSystem._instance = new BattleSystem();
        }
        return BattleSystem._instance;
    }

    /**
     * 私有构造函数
     */
    private constructor() {
        this.registerEventListeners();
    }

    /**
     * 注册事件监听器
     */
    private registerEventListeners(): void {
        // 怪物死亡，加分
        eventBus.on(GameEvent.MONSTER_KILLED, () => {
            this.score += 10;
            this.gold += 5;
            eventBus.emit(GameEvent.POWER_CHANGED, {
                score: this.score,
                gold: this.gold,
            });
        });

        // 怪物到达边界，玩家受伤
        eventBus.on(GameEvent.MONSTER_REACHED_BOUNDARY, () => {
            this.damagePlayer(10);
        });
    }

    /**
     * 初始化战斗系统
     * @param monsterRoot 怪物根节点
     * @param bulletRoot 子弹根节点
     * @param effectRoot 特效根节点
     */
    public init(
        monsterRoot: cc.Node,
        bulletRoot: cc.Node,
        effectRoot: cc.Node
    ): void {
        this.monsterRoot = monsterRoot;
        this.bulletRoot = bulletRoot;
        this.effectRoot = effectRoot;

        // 初始化子管理器
        monsterManager.init(monsterRoot);
        bulletManager.init(bulletRoot);
        effectManager.init(null, effectRoot);

        // 设置塔的位置
        bulletManager.setTowerPosition(-300, 0);
    }

    /**
     * 开始战斗
     */
    public startBattle(): void {
        if (this.isBattling) {
            return;
        }

        this.isBattling = true;
        this.battleTime = 0;
        this.score = 0;
        this.gold = 0;
        this.playerHp = this.playerMaxHp;

        // 发送战斗开始事件
        eventBus.emit(GameEvent.BATTLE_START, {
            maxHp: this.playerMaxHp,
        });

        // 发送血量变化事件
        eventBus.emit(GameEvent.PLAYER_HP_CHANGED, {
            current: this.playerHp,
            max: this.playerMaxHp,
        });

        console.log("[BattleSystem] Battle started");
    }

    /**
     * 结束战斗
     * @param victory 是否胜利
     */
    public endBattle(victory: boolean = false): void {
        if (!this.isBattling) {
            return;
        }

        this.isBattling = false;

        // 发送战斗结束事件
        eventBus.emit(GameEvent.BATTLE_END, {
            victory,
            score: this.score,
            gold: this.gold,
            time: this.battleTime,
        });

        console.log(`[BattleSystem] Battle ended, victory: ${victory}, score: ${this.score}`);
    }

    /**
     * 更新战斗系统
     * @param dt 帧间隔时间
     */
    public update(dt: number): void {
        if (!this.isBattling) {
            return;
        }

        this.battleTime += dt;

        // 更新各个管理器
        monsterManager.update(dt);
        bulletManager.update(dt);

        // 检查游戏结束
        if (this.playerHp <= 0) {
            this.endBattle(false);
        }
    }

    /**
     * 玩家受伤
     * @param damage 伤害值
     */
    public damagePlayer(damage: number): void {
        this.playerHp = Math.max(0, this.playerHp - damage);

        // 发送血量变化事件
        eventBus.emit(GameEvent.PLAYER_HP_CHANGED, {
            current: this.playerHp,
            max: this.playerMaxHp,
        });

        // 发送玩家受伤事件
        eventBus.emit(GameEvent.PLAYER_DAMAGED, {
            damage,
            remainingHp: this.playerHp,
        });
    }

    /**
     * 治疗玩家
     * @param amount 治疗量
     */
    public healPlayer(amount: number): void {
        this.playerHp = Math.min(this.playerMaxHp, this.playerHp + amount);

        eventBus.emit(GameEvent.PLAYER_HP_CHANGED, {
            current: this.playerHp,
            max: this.playerMaxHp,
        });
    }

    /**
     * 获取当前分数
     */
    public getScore(): number {
        return this.score;
    }

    /**
     * 获取金币
     */
    public getGold(): number {
        return this.gold;
    }

    /**
     * 获取战斗时间
     */
    public getBattleTime(): number {
        return this.battleTime;
    }

    /**
     * 获取玩家血量
     */
    public getPlayerHp(): { current: number; max: number } {
        return {
            current: this.playerHp,
            max: this.playerMaxHp,
        };
    }

    /**
     * 是否正在战斗
     */
    public isInBattle(): boolean {
        return this.isBattling;
    }

    /**
     * 清理战斗系统
     */
    public clear(): void {
        monsterManager.clearAllMonsters();
        bulletManager.clearAllBullets();
        effectManager.clearAll();
    }

    /**
     * 设置怪物生成间隔
     * @param interval 间隔时间（秒）
     */
    public setSpawnInterval(interval: number): void {
        monsterManager.setSpawnInterval(interval);
    }

    /**
     * 设置射击间隔
     * @param interval 间隔时间（秒）
     */
    public setShootInterval(interval: number): void {
        bulletManager.setShootInterval(interval);
    }

    /**
     * 设置子弹伤害
     * @param damage 伤害值
     */
    public setBulletDamage(damage: number): void {
        bulletManager.setBulletDamage(damage);
    }

    /**
     * 设置射击速度
     * @param speed 速度
     */
    public setBulletSpeed(speed: number): void {
        bulletManager.setBulletSpeed(speed);
    }

    /**
     * 设置玩家最大血量
     * @param maxHp 最大血量
     */
    public setPlayerMaxHp(maxHp: number): void {
        this.playerMaxHp = maxHp;
        this.playerHp = maxHp;
    }
}

/**
 * 便捷导出单例实例
 */
export const battleSystem = BattleSystem.instance;