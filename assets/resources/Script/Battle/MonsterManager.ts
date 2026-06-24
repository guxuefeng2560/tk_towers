import { coordinateSystem } from "../Framework/CoordinateSystem";
import { eventBus } from "../Framework/EventBus";
import { GameEvent } from "../Framework/GameEvents";
import { effectManager } from "../Framework/EffectManager";

/**
 * 怪物配置接口
 */
interface IMonster {
    id: number;
    logicalX: number;
    logicalY: number;
    hp: number;
    maxHp: number;
    speed: number;
    type: string;
    isAlive: boolean;
    node: cc.Node | null;
}

/**
 * 怪物管理器
 * 负责所有怪物的生命周期管理、生成、移动、伤害、死亡
 */
export class MonsterManager {
    private static _instance: MonsterManager | null = null;

    // 怪物列表
    private monsters: Map<number, IMonster> = new Map();
    private nextMonsterId: number = 0;

    // 怪物根节点
    private monsterRoot: cc.Node | null = null;

    // 对象池（可复用节点
    private monsterPool: cc.Node[] = [];

    // 怪物生成配置
    private spawnInterval: number = 2; // 秒
    private spawnTimer: number = 0;

    // 是否处于战斗状态
    private isBattling: boolean = false;

    /**
     * 获取单例实例
     */
    public static get instance(): MonsterManager {
        if (!MonsterManager._instance) {
            MonsterManager._instance = new MonsterManager();
        }
        return MonsterManager._instance;
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
        // 监听战斗开始
        eventBus.on(GameEvent.BATTLE_START, () => {
            this.isBattling = true;
        });

        // 监听战斗结束
        eventBus.on(GameEvent.BATTLE_END, () => {
            this.isBattling = false;
            this.clearAllMonsters();
        });
    }

    /**
     * 初始化怪物管理器
     * @param monsterRoot 怪物根节点
     */
    public init(monsterRoot: cc.Node): void {
        this.monsterRoot = monsterRoot;
    }

    /**
     * 更新怪物
     * @param dt 帧间隔时间
     */
    public update(dt: number): void {
        if (!this.isBattling) {
            return;
        }

        // 处理怪物生成
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnMonster();
        }

        // 更新所有怪物
        this.updateMonsters(dt);
    }

    /**
     * 更新所有怪物
     */
    private updateMonsters(dt: number): void {
        const toRemove: number[] = [];

        this.monsters.forEach((monster, id) => {
            if (!monster.isAlive) {
                return;
            }

            // 移动怪物
            monster.logicalX -= monster.speed * dt;

            // 更新节点位置
            if (monster.node) {
                const localX = coordinateSystem.logicalToLocalX(monster.logicalX);
                monster.node.setPosition(localX, monster.logicalY);
            }

            // 检查是否到达左边界
            if (monster.logicalX <= coordinateSystem.getScreenLeft() - 50) {
                // 怪物到达边界，玩家受伤
                eventBus.emit(GameEvent.MONSTER_REACHED_BOUNDARY, {
                    monsterId: id,
                    logicalX: monster.logicalX,
                });
                toRemove.push(id);
            }
        });

        // 移除已离开屏幕的怪物
        for (const id of toRemove) {
            this.removeMonster(id);
        }
    }

    /**
     * 生成怪物
     */
    private spawnMonster(): void {
        if (!this.monsterRoot) {
            return;
        }

        const id = ++this.nextMonsterId;
        const logicalX = coordinateSystem.getScreenRight() + 100;
        const logicalY = (Math.random() - 0.5) * 400;

        // 创建怪物节点
        const node = this.createMonsterNode();

        const monster: IMonster = {
            id,
            logicalX,
            logicalY,
            hp: 100,
            maxHp: 100,
            speed: 80,
            type: "normal",
            isAlive: true,
            node,
        };

        this.monsters.set(id, monster);

        // 设置初始位置
        const localX = coordinateSystem.logicalToLocalX(logicalX);
        node.setPosition(localX, logicalY);

        this.monsterRoot.addChild(node);

        // 发送怪物生成事件
        eventBus.emit(GameEvent.MONSTER_SPAWNED, {
            monsterId: id,
            logicalX,
            logicalY,
        });
    }

    /**
     * 创建怪物节点
     */
    private createMonsterNode(): cc.Node {
        // 尝试从对象池获取
        if (this.monsterPool.length > 0) {
            const node = this.monsterPool.pop()!;
            node.active = true;
            return node;
        }

        // 创建新节点
        const node = new cc.Node("Monster");
        const sprite = node.addComponent(cc.Sprite);

        // 设置默认外观
        node.setContentSize(40, 40);

        // 使用 graphics 绘制一个简单的圆形
        const graphics = node.addComponent(cc.Graphics);
        graphics.circle(0, 0, 20);
        graphics.fillColor = cc.Color.RED;
        graphics.fill();

        return node;
    }

    /**
     * 对怪物造成伤害
     * @param monsterId 怪物 ID
     * @param damage 伤害值
     * @param damageSource 伤害来源
     */
    public damageMonster(monsterId: number, damage: number, damageSource: string = "bullet"): void {
        const monster = this.monsters.get(monsterId);
        if (!monster || !monster.isAlive) {
            return;
        }

        monster.hp -= damage;

        // 显示伤害数字
        if (monster.node) {
            const worldPos = monster.node.convertToWorldSpaceAR(cc.v2(0, 0));
            effectManager.showDamageFloat(worldPos.x, worldPos.y + 30, damage);
        }

        // 检查是否死亡
        if (monster.hp <= 0) {
            this.killMonster(monsterId);
        }
    }

    /**
     * 杀死怪物
     * @param monsterId 怪物 ID
     */
    private killMonster(monsterId: number): void {
        const monster = this.monsters.get(monsterId);
        if (!monster) {
            return;
        }

        monster.isAlive = false;

        // 显示爆炸特效
        if (monster.node) {
            const worldPos = monster.node.convertToWorldSpaceAR(cc.v2(0, 0));
            effectManager.playExplosion(worldPos.x, worldPos.y);
        }

        // 发送怪物死亡事件
        eventBus.emit(GameEvent.MONSTER_KILLED, {
            monsterId,
            logicalX: monster.logicalX,
            logicalY: monster.logicalY,
        });

        // 延迟移除（让特效播放完）
        setTimeout(() => {
            this.removeMonster(monsterId);
        }, 300);
    }

    /**
     * 移除怪物
     * @param monsterId 怪物 ID
     */
    private removeMonster(monsterId: number): void {
        const monster = this.monsters.get(monsterId);
        if (!monster) {
            return;
        }

        // 将节点放回对象池
        if (monster.node) {
            monster.node.removeFromParent(false);
            monster.node.active = false;
            this.monsterPool.push(monster.node);
        }

        this.monsters.delete(monsterId);
    }

    /**
     * 清空所有怪物
     */
    public clearAllMonsters(): void {
        this.monsters.forEach((monster) => {
            if (monster.node) {
                monster.node.removeFromParent(false);
                monster.node.active = false;
                this.monsterPool.push(monster.node);
            }
        });

        this.monsters.clear();
    }

    /**
     * 获取范围内的怪物
     * @param x 中心 X
     * @param y 中心 Y
     * @param radius 半径
     */
    public getMonstersInRange(x: number, y: number, radius: number): number[] {
        const result: number[] = [];

        this.monsters.forEach((monster) => {
            if (!monster.isAlive) {
                return;
            }

            const dist = coordinateSystem.distance(x, y, monster.logicalX, monster.logicalY);
            if (dist <= radius) {
                result.push(monster.id);
            }
        });

        return result;
    }

    /**
     * 获取所有存活怪物数量
     */
    public getAliveMonsterCount(): number {
        let count = 0;
        this.monsters.forEach((monster) => {
            if (monster.isAlive) {
                count++;
            }
        });
        return count;
    }

    /**
     * 设置生成间隔
     * @param interval 间隔时间（秒）
     */
    public setSpawnInterval(interval: number): void {
        this.spawnInterval = Math.max(0.5, interval);
    }

    /**
     * 获取怪物位置
     * @param monsterId 怪物 ID
     */
    public getMonsterPosition(monsterId: number): { x: number; y: number } | null {
        const monster = this.monsters.get(monsterId);
        if (!monster) {
            return null;
        }
        return { x: monster.logicalX, y: monster.logicalY };
    }
}

/**
 * 便捷导出单例实例
 */
export const monsterManager = MonsterManager.instance;