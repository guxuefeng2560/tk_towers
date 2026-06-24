import { coordinateSystem } from "../Framework/CoordinateSystem";
import { eventBus } from "../Framework/EventBus";
import { GameEvent } from "../Framework/GameEvents";
import { effectManager } from "../Framework/EffectManager";
import { monsterManager } from "./MonsterManager";

/**
 * 子弹接口
 */
interface IBullet {
    id: number;
    logicalX: number;
    logicalY: number;
    velocityX: number;
    velocityY: number;
    damage: number;
    isAlive: boolean;
    bossOnly: boolean; // 是否只攻击 Boss
    node: cc.Node | null;
}

/**
 * 子弹管理器
 * 负责子弹的发射、移动、碰撞检测
 */
export class BulletManager {
    private static _instance: BulletManager | null = null;

    // 子弹列表
    private bullets: Map<number, IBullet> = new Map();
    private nextBulletId: number = 0;

    // 子弹根节点
    private bulletRoot: cc.Node | null = null;

    // 对象池
    private bulletPool: cc.Node[] = [];

    // 子弹配置
    private bulletSpeed: number = 500;
    private bulletDamage: number = 25;

    // 是否处于战斗状态
    private isBattling: boolean = false;

    // 塔的位置
    private towerX: number = -300;
    private towerY: number = 0;

    // 自动射击计时器
    private shootTimer: number = 0;
    private shootInterval: number = 1; // 秒

    // Boss 相关
    private bossPosition: { x: number; y: number } | null = null;
    private bossActive: boolean = false;
    private bulletsPerShot: number = 5; // 每次射击发射 5 颗子弹
    private bossOnlyBulletCount: number = 0; // 其中 3 颗专门打 Boss
    private bulletRandomAngle: number = 5; // 子弹随机角度偏差（度）
    private attackRange: number = 800; // 攻击范围

    /**
     * 获取单例实例
     */
    public static get instance(): BulletManager {
        if (!BulletManager._instance) {
            BulletManager._instance = new BulletManager();
        }
        return BulletManager._instance;
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
            this.bossActive = false;
            this.bossPosition = null;
        });

        // 监听战斗结束
        eventBus.on(GameEvent.BATTLE_END, () => {
            this.isBattling = false;
            this.clearAllBullets();
            this.bossActive = false;
            this.bossPosition = null;
        });

        // 监听 Boss 出现
        eventBus.on(GameEvent.BOSS_SPAWNED, (data) => {
            this.bossActive = true;
            this.bossPosition = { x: data.x, y: data.y };
        });

        // 监听 Boss 位置更新
        eventBus.on(GameEvent.BOSS_POSITION_CHANGED, (data) => {
            this.bossPosition = { x: data.x, y: data.y };
        });

        // 监听 Boss 死亡
        eventBus.on(GameEvent.BOSS_KILLED, () => {
            this.bossActive = false;
            this.bossPosition = null;
        });
    }

    /**
     * 初始化子弹管理器
     * @param bulletRoot 子弹根节点
     */
    public init(bulletRoot: cc.Node): void {
        this.bulletRoot = bulletRoot;
    }

    /**
     * 设置塔的位置
     * @param x 逻辑 X 坐标
     * @param y 逻辑 Y 坐标
     */
    public setTowerPosition(x: number, y: number): void {
        this.towerX = x;
        this.towerY = y;
    }

    /**
     * 更新子弹
     * @param dt 帧间隔时间
     */
    public update(dt: number): void {
        if (!this.isBattling) {
            return;
        }

        // 自动射击
        this.shootTimer += dt;
        if (this.shootTimer >= this.shootInterval) {
            this.shootTimer = 0;
            this.autoShoot();
        }

        // 更新所有子弹
        this.updateBullets(dt);
    }

    /**
     * 自动射击：瞄准最近的怪物或 Boss
     */
    private autoShoot(): void {
        // 检查 Boss 是否在攻击范围内
        const bossInRange = this.isBossInRange();

        if (bossInRange) {
            // Boss 在范围内：发射 5 颗子弹，其中 3 颗专门打 Boss
            this.shootBossBullets();
        } else {
            // Boss 不在范围内或没有 Boss，瞄准最近的普通怪物
            this.shootNormalBullets();
        }
    }

    /**
     * 检查 Boss 是否在攻击范围内
     */
    private isBossInRange(): boolean {
        if (!this.bossActive || !this.bossPosition) {
            return false;
        }

        const dist = coordinateSystem.distance(
            this.towerX, this.towerY,
            this.bossPosition.x, this.bossPosition.y
        );

        return dist <= this.attackRange;
    }

    /**
     * 发射 Boss 专用子弹（3 颗 bossOnly + 2 颗普通，但全部瞄准 Boss）
     * Boss 在范围内时，所有 5 颗子弹都瞄准 Boss，攻击目标优先为 Boss
     */
    private shootBossBullets(): void {
        if (!this.bossPosition) return;

        // 前 3 颗 bossOnly（只与 Boss 碰撞）
        for (let i = 0; i < this.bossOnlyBulletCount; i++) {
            this.shootSingleBullet(this.bossPosition.x, this.bossPosition.y, false);
        }

        // 剩下 2 颗普通子弹也全部瞄准 Boss（可以与 Boss 或怪物碰撞，但优先打 Boss）
        const normalBulletCount = this.bulletsPerShot - this.bossOnlyBulletCount;
        for (let i = 0; i < normalBulletCount; i++) {
            this.shootSingleBullet(this.bossPosition.x, this.bossPosition.y, false);
        }
    }

    /**
     * 发射普通子弹
     */
    private shootNormalBullets(): void {
        const nearestMonster = this.findNearestMonster();
        if (!nearestMonster) return;

        // 发射 5 颗子弹，都可以打普通怪物
        for (let i = 0; i < this.bulletsPerShot; i++) {
            this.shootSingleBullet(nearestMonster.x, nearestMonster.y, false);
        }
    }

    /**
     * 寻找最近的怪物
     */
    private findNearestMonster(): { x: number; y: number } | null {
        const monsters = monsterManager.getMonstersInRange(
            this.towerX,
            this.towerY,
            this.attackRange
        );

        if (monsters.length === 0) {
            return null;
        }

        let nearestPos: { x: number; y: number } | null = null;
        let nearestDist = Infinity;

        for (const monsterId of monsters) {
            const pos = monsterManager.getMonsterPosition(monsterId);
            if (!pos) continue;

            const dist = coordinateSystem.distance(
                this.towerX, this.towerY,
                pos.x, pos.y
            );

            if (dist < nearestDist) {
                nearestDist = dist;
                nearestPos = pos;
            }
        }

        return nearestPos;
    }

    /**
     * 发射单颗子弹
     * @param targetX 目标 X 坐标
     * @param targetY 目标 Y 坐标
     * @param bossOnly 是否只攻击 Boss
     */
    private shootSingleBullet(targetX: number, targetY: number, bossOnly: boolean): void {
        if (!this.bulletRoot) {
            return;
        }

        // 计算方向
        const dirX = targetX - this.towerX;
        const dirY = targetY - this.towerY;
        const dist = Math.sqrt(dirX * dirX + dirY * dirY);

        if (dist === 0) {
            return;
        }

        // 标准化方向
        const normalizedX = dirX / dist;
        const normalizedY = dirY / dist;

        // 添加随机角度偏差
        const randomAngle = (Math.random() - 0.5) * this.bulletRandomAngle * Math.PI / 180;
        const cos = Math.cos(randomAngle);
        const sin = Math.sin(randomAngle);
        const finalDirX = normalizedX * cos - normalizedY * sin;
        const finalDirY = normalizedX * sin + normalizedY * cos;

        // 计算速度
        const velocityX = finalDirX * this.bulletSpeed;
        const velocityY = finalDirY * this.bulletSpeed;

        // 创建子弹
        const id = ++this.nextBulletId;
        const node = this.createBulletNode();

        const bullet: IBullet = {
            id,
            logicalX: this.towerX,
            logicalY: this.towerY,
            velocityX,
            velocityY,
            damage: this.bulletDamage,
            isAlive: true,
            bossOnly,
            node,
        };

        this.bullets.set(id, bullet);

        // 设置初始位置
        const localX = coordinateSystem.logicalToLocalX(this.towerX);
        node.setPosition(localX, this.towerY);

        this.bulletRoot.addChild(node);

        // 发送子弹发射事件
        eventBus.emit(GameEvent.BULLET_FIRED, {
            bulletId: id,
            x: this.towerX,
            y: this.towerY,
            bossOnly,
        });
    }

    /**
     * 向目标位置发射子弹（保留原有接口兼容）
     * @param targetX 目标 X 坐标
     * @param targetY 目标 Y 坐标
     */
    public shootAt(targetX: number, targetY: number): void {
        this.shootSingleBullet(targetX, targetY, false);
    }

    /**
     * 创建子弹节点
     */
    private createBulletNode(): cc.Node {
        // 尝试从对象池获取
        if (this.bulletPool.length > 0) {
            const node = this.bulletPool.pop()!;
            node.active = true;
            return node;
        }

        // 创建新节点
        const node = new cc.Node("Bullet");
        node.addComponent(cc.Sprite);

        // 设置默认外观
        node.setContentSize(12, 12);

        // 使用 graphics 绘制
        const graphics = node.addComponent(cc.Graphics);
        graphics.circle(0, 0, 6);
        graphics.fillColor = cc.Color.YELLOW;
        graphics.fill();

        return node;
    }

    /**
     * 更新所有子弹
     */
    private updateBullets(dt: number): void {
        const toRemove: number[] = [];

        this.bullets.forEach((bullet, id) => {
            if (!bullet.isAlive) {
                return;
            }

            // 移动子弹
            bullet.logicalX += bullet.velocityX * dt;
            bullet.logicalY += bullet.velocityY * dt;

            // 更新节点位置
            if (bullet.node) {
                const localX = coordinateSystem.logicalToLocalX(bullet.logicalX);
                bullet.node.setPosition(localX, bullet.logicalY);
            }

            // 碰撞检测
            this.checkCollision(bullet, id);

            // 检查是否超出屏幕范围
            if (
                bullet.logicalX > coordinateSystem.getScreenRight() + 100 ||
                bullet.logicalX < coordinateSystem.getScreenLeft() - 100 ||
                bullet.logicalY > 500 ||
                bullet.logicalY < -500
            ) {
                toRemove.push(id);
            }
        });

        // 移除子弹
        for (const id of toRemove) {
            this.removeBullet(id);
        }
    }

    /**
     * 检查子弹与怪物的碰撞
     */
    private checkCollision(bullet: IBullet, bulletId: number): void {
        // Boss 专用子弹不与普通怪物碰撞，只检测 Boss 碰撞
        if (bullet.bossOnly) {
            this.checkBossCollision(bullet, bulletId);
            return;
        }

        // 普通子弹先检测与 Boss 的碰撞（优先打 Boss）
        if (this.checkBossCollision(bullet, bulletId)) {
            return;
        }

        // 检测与普通怪物的碰撞
        const monsters = monsterManager.getMonstersInRange(
            bullet.logicalX,
            bullet.logicalY,
            25 // 碰撞半径
        );

        if (monsters.length > 0) {
            // 对第一个命中的怪物造成伤害
            const targetMonsterId = monsters[0];
            monsterManager.damageMonster(targetMonsterId, bullet.damage, "bullet");

            // 播放命中特效
            if (bullet.node) {
                const worldPos = bullet.node.convertToWorldSpaceAR(cc.v2(0, 0));
                effectManager.playHitEffect(worldPos.x, worldPos.y);
            }

            // 标记子弹已命中
            bullet.isAlive = false;
            this.removeBullet(bulletId);

            // 发送子弹命中事件
            eventBus.emit(GameEvent.BULLET_HIT, {
                bulletId,
                monsterId: targetMonsterId,
                damage: bullet.damage,
            });
        }
    }

    /**
     * 检查子弹与 Boss 的碰撞
     * @returns 是否命中 Boss
     */
    private checkBossCollision(bullet: IBullet, bulletId: number): boolean {
        if (!this.bossActive || !this.bossPosition) {
            return false;
        }

        // 计算与 Boss 的距离
        const dist = coordinateSystem.distance(
            bullet.logicalX, bullet.logicalY,
            this.bossPosition.x, this.bossPosition.y
        );

        // Boss 碰撞半径（假设较大，实际值应根据游戏需求调整）
        const bossCollisionRadius = 80;

        if (dist <= bossCollisionRadius) {
            // 发送 Boss 受伤事件
            eventBus.emit(GameEvent.BOSS_DAMAGED, {
                damage: bullet.damage,
                x: bullet.logicalX,
                y: bullet.logicalY,
            });

            // 播放命中特效
            if (bullet.node) {
                const worldPos = bullet.node.convertToWorldSpaceAR(cc.v2(0, 0));
                effectManager.playHitEffect(worldPos.x, worldPos.y);
            }

            // 标记子弹已命中
            bullet.isAlive = false;
            this.removeBullet(bulletId);

            // 发送子弹命中 Boss 事件
            eventBus.emit(GameEvent.BULLET_HIT, {
                bulletId,
                isBoss: true,
                damage: bullet.damage,
            });

            return true;
        }

        return false;
    }

    /**
     * 移除子弹
     */
    private removeBullet(bulletId: number): void {
        const bullet = this.bullets.get(bulletId);
        if (!bullet) {
            return;
        }

        // 将节点放回对象池
        if (bullet.node) {
            bullet.node.removeFromParent(false);
            bullet.node.active = false;
            this.bulletPool.push(bullet.node);
        }

        this.bullets.delete(bulletId);
    }

    /**
     * 清空所有子弹
     */
    public clearAllBullets(): void {
        this.bullets.forEach((bullet) => {
            if (bullet.node) {
                bullet.node.removeFromParent(false);
                bullet.node.active = false;
                this.bulletPool.push(bullet.node);
            }
        });

        this.bullets.clear();
    }

    /**
     * 设置射击间隔
     * @param interval 间隔时间（秒）
     */
    public setShootInterval(interval: number): void {
        this.shootInterval = Math.max(0.1, interval);
    }

    /**
     * 设置子弹伤害
     * @param damage 伤害值
     */
    public setBulletDamage(damage: number): void {
        this.bulletDamage = damage;
    }

    /**
     * 设置子弹速度
     * @param speed 速度
     */
    public setBulletSpeed(speed: number): void {
        this.bulletSpeed = speed;
    }
}

/**
 * 便捷导出单例实例
 */
export const bulletManager = BulletManager.instance;