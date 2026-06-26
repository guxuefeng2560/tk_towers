import { GameConfig } from "../Core/GameConfig";
import { GamePhase } from "../Core/GameDefines";
import GameRuntime from "../Core/GameRuntime";
import { BulletRuntime } from "../Entity/EntityTypes";
import { clamp, distance, randomRange, rectIntersects, rotateVector } from "../Util/MathUtil";

/**
 * 子弹管理器回调接口
 */
interface BulletManagerCallbacks {
    /** 对怪物造成伤害 */
    onDamageMonster: (monsterId: number, damage: number, source: "normal" | "bomb" | "roller") => void;
    /** 对 Boss 造成伤害 */
    onDamageBoss: (damage: number) => void;
}

/**
 * 子弹管理器
 * 负责子弹的发射、移动、碰撞检测
 * 从 BattleController 拆分而来
 */
export default class BulletManager {
    private static readonly BOSS_ONLY_BULLET_COUNT = 0;
    private static readonly BULLET_GRAVITY = 800;
    private static readonly MANUAL_BULLET_SPEED_BASE_DISTANCE = 600;
    private static readonly MANUAL_BULLET_SPEED_MIN = 600;
    private static readonly MANUAL_BULLET_SPEED_MAX = 1400;

    private readonly runtime: GameRuntime;
    private readonly callbacks: BulletManagerCallbacks;

    public constructor(runtime: GameRuntime, callbacks: BulletManagerCallbacks) {
        this.runtime = runtime;
        this.callbacks = callbacks;
    }

    /**
     * 每帧更新：自动射击 + 子弹移动/碰撞
     */
    public update(dt: number): void {
        this.updateAutoShooting(dt);
        this.updateBullets(dt);
    }

    /**
     * 自动射击逻辑
     */
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
            ? this.getManualBulletSpeed(this.runtime.forcedAimDistance, firePosition, manualAimTargetPosition)
            : GameConfig.player.bulletSpeed;

        const bossTarget = manualAiming ? null : this.getBossBulletTarget();
        for (let index = 0; index < GameConfig.player.bulletsPerShot; index += 1) {
            const useBossOnlyBullet = !!bossTarget && index < BulletManager.BOSS_ONLY_BULLET_COUNT;
            const shotBaseDirection = useBossOnlyBullet
                ? this.getDirectionToTarget(firePosition, bossTarget)
                : baseDirection;
            const direction = rotateVector(shotBaseDirection, randomRange(-GameConfig.player.bulletRandomAngle, GameConfig.player.bulletRandomAngle));
            const delay = randomRange(0, GameConfig.player.bulletRandomDelayMax);
            this.spawnBullet(firePosition, direction, delay, useBossOnlyBullet, manualAiming ? 1 : 0.5, bulletSpeed);
        }
    }

    /**
     * 寻找射击目标（优先 Boss，其次最近的怪物）
     */
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

    /**
     * 生成一颗子弹
     */
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

    /**
     * 获取手动瞄准时的子弹速度（根据触摸距离调整）
     */
    private getManualBulletSpeed(lockedDistance: number, firePosition: cc.Vec2, targetPosition: cc.Vec2 | null): number {
        const touchDistance = lockedDistance > 0
            ? lockedDistance
            : (targetPosition ? distance(firePosition, targetPosition) : 0);
        if (touchDistance <= 0) {
            return GameConfig.player.bulletSpeed;
        }
        const speedByDistance = GameConfig.player.bulletSpeed
            * (touchDistance / BulletManager.MANUAL_BULLET_SPEED_BASE_DISTANCE);
        return clamp(
            speedByDistance,
            BulletManager.MANUAL_BULLET_SPEED_MIN,
            BulletManager.MANUAL_BULLET_SPEED_MAX,
        );
    }

    /**
     * 更新所有子弹：移动、碰撞、回收
     */
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

            bullet.velocity.y -= BulletManager.BULLET_GRAVITY * bullet.gravityScale * dt;
            bullet.node.x += bullet.velocity.x * dt;
            bullet.node.y += bullet.velocity.y * dt;
            bullet.node.angle = -Math.atan2(bullet.velocity.x, bullet.velocity.y) * 180 / Math.PI + GameConfig.player.bulletAngleOffset;

            if (bullet.node.y <  GameConfig.monster.laneY -20) {
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
                this.callbacks.onDamageMonster(hit.monsterId, bullet.damage, "normal");
                this.recycleBullet(index);
                continue;
            }
            if (hit.type === "boss") {
                this.callbacks.onDamageBoss(bullet.damage);
                this.recycleBullet(index);
                continue;
            }

            const waitingCrater = bullet.pendingCraterDelay !== undefined;
            if (bullet.node.x < visibleLeft || bullet.node.x > visibleRight || (!waitingCrater && bullet.node.y < -430) || bullet.node.y > 430) {
                this.recycleBullet(index);
            }
        }
    }

    /**
     * 查找子弹命中目标（怪物或 Boss）
     */
    private findBulletHitTarget(bulletNode: cc.Node, bossOnly: boolean = false): { type: "none" | "monster" | "boss"; monsterId: number } {
        const bulletRect = this.runtime.makeRect(bulletNode.x, bulletNode.y, 22, 10);
        let bestHitType: "none" | "monster" | "boss" = "none";
        let bestHitMonsterId = 0;
        let bestHitDistance = Number.MAX_SAFE_INTEGER;
        const bulletX = bulletNode.x;
        const bulletY = bulletNode.y;

        if (!bossOnly) {
            for (const monster of this.runtime.monsters) {
                if (monster.dying) {
                    continue;
                }
                if (rectIntersects(bulletRect, this.runtime.getNodeColliderRect(monster.node, GameConfig.monster.width, GameConfig.monster.height))) {
                    const hitDistance = distance(cc.v2(bulletX, bulletY), cc.v2(monster.node.x, monster.node.y));
                    if (hitDistance < bestHitDistance) {
                        bestHitType = "monster";
                        bestHitMonsterId = monster.id;
                        bestHitDistance = hitDistance;
                    }
                }
            }
        }

        if (this.runtime.context.phase === GamePhase.Boss && this.runtime.refs.bossNode && this.runtime.refs.bossNode.active) {
            const bossCenter = this.runtime.getBossCenterWorldPosition();
            if (rectIntersects(bulletRect, this.runtime.makeRect(bossCenter.x, bossCenter.y, GameConfig.boss.width, GameConfig.boss.height))) {
                const hitDistance = distance(cc.v2(bulletX, bulletY), bossCenter);
                if (hitDistance < bestHitDistance) {
                    bestHitType = "boss";
                    bestHitMonsterId = 0;
                    bestHitDistance = hitDistance;
                }
            }
        }

        if (bestHitType === "none") {
            return { type: bestHitType, monsterId: bestHitMonsterId };
        }
        return { type: bestHitType, monsterId: bestHitMonsterId };
    }

    /**
     * 获取 Boss 子弹目标
     */
    private getBossBulletTarget(): cc.Vec2 | null {
        return this.getBossPriorityTarget();
    }

    /**
     * 获取 Boss 优先目标（在攻击范围内或位于屏幕中央）
     */
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

    /**
     * 判断 Boss 是否位于屏幕中央
     */
    private isBossCenteredOnScreen(bossCenter: cc.Vec2): boolean {
        const screenCenterX = this.runtime.cameraTrackX;
        const centerTolerance = Math.max(GameConfig.boss.width * 0.5, 30);
        return Math.abs(bossCenter.x - screenCenterX) <= centerTolerance;
    }

    /**
     * 获取从 from 到 target 的方向向量
     */
    private getDirectionToTarget(from: cc.Vec2, target: cc.Vec2): cc.Vec2 {
        const direction = cc.v2(target.x - from.x, target.y - from.y);
        if (direction.magSqr() <= 1) {
            return cc.v2(1, 0);
        }
        return direction.normalize();
    }

    /**
     * 回收子弹（放回对象池）
     */
    private recycleBullet(index: number): void {
        const bullet = this.runtime.bullets[index];
        this.runtime.bullets.splice(index, 1);
        if (cc.isValid(bullet) && bullet.node) {
            this.runtime.poolManager.put("bullet", bullet.node);
        }
    }
}
