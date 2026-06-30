import { GameConfig } from "../Core/GameConfig";
import GameRuntime from "../Core/GameRuntime";
import { SkillType } from "../Entity/EntityTypes";
import AudioManager from "../Framework/audio/TD_AudioManager";
import { AudioID } from "../global/TD_Constants";
import { distance, rectIntersects } from "../Util/MathUtil";

export type SkillAttemptResult =
    | { kind: "used" }
    | { kind: "needs_energy"; skillType: SkillType; cost: number }
    | { kind: "cooldown" }
    | { kind: "invalid"; reason: string };

export default class SkillController {
    private static readonly BOMB_EFFECT_ANIMATION = "animation";

    private readonly runtime: GameRuntime;

    public constructor(runtime: GameRuntime) {
        this.runtime = runtime;
    }

    public updateCooldowns(dt: number): void {
        this.runtime.rollerCooldown = Math.max(0, this.runtime.rollerCooldown - dt);
        this.runtime.bombCooldown = Math.max(0, this.runtime.bombCooldown - dt);
        this.runtime.rollerHiddenRemaining = Math.max(0, this.runtime.rollerHiddenRemaining - dt);
    }

    public updateBombs(dt: number): void {
        const groundY = GameConfig.monster.laneY - 40;
        const visibleLeft = this.runtime.cameraTrackX - GameConfig.designWidth / 2 - 280;
        const visibleRight = this.runtime.cameraTrackX + GameConfig.designWidth / 2 + 360;

        for (let index = this.runtime.bombs.length - 1; index >= 0; index -= 1) {
            const bomb = this.runtime.bombs[index];
            if (!bomb || !cc.isValid(bomb.node)) {
                this.runtime.bombs.splice(index, 1);
                continue;
            }

            bomb.velocity.y -= GameConfig.skill.bomb.gravity * dt;
            bomb.node.x += bomb.velocity.x * dt;
            bomb.node.y += bomb.velocity.y * dt;
            bomb.node.angle -= 540 * dt;
            bomb.node.zIndex = Math.round(-bomb.node.y * 10) + 30;

            if (bomb.node.y <= groundY) {
                const target = cc.v2(bomb.node.x, groundY);
                this.explodeBomb(index, target);
                continue;
            }

            if (bomb.node.x < visibleLeft || bomb.node.x > visibleRight || bomb.node.y < groundY - 80) {
                this.recycleBomb(index);
            }
        }
    }

    public tryUseSkill(skillType: SkillType, onBombHit: (monsterId: number, damage: number, center: cc.Vec2) => void): SkillAttemptResult {
        if (skillType === "roller") {
            if (!this.runtime.context.hasAliveCarSkillUnlocked()) {
                return { kind: "invalid", reason: "roller_unavailable" };
            }
            if (this.runtime.rollerCooldown > 0 || this.runtime.rollerHiddenRemaining > 0) {
                return { kind: "cooldown" };
            }
            if (this.runtime.context.energy < GameConfig.skill.roller.cost) {
                return { kind: "needs_energy", skillType, cost: GameConfig.skill.roller.cost };
            }
            this.castRoller();
            return { kind: "used" };
        }

        if (this.runtime.bombCooldown > 0) {
            return { kind: "cooldown" };
        }
        if (this.runtime.context.energy < GameConfig.skill.bomb.cost) {
            return { kind: "needs_energy", skillType, cost: GameConfig.skill.bomb.cost };
        }
        this.castBomb(onBombHit);
        return { kind: "used" };
    }

    public useSkillWithoutEnergyCost(skillType: SkillType, onBombHit: (monsterId: number, damage: number, center: cc.Vec2) => void): boolean {
        if (skillType === "roller") {
            if (!this.runtime.context.hasAliveCarSkillUnlocked() || this.runtime.rollerCooldown > 0 || this.runtime.rollerHiddenRemaining > 0) {
                return false;
            }
            this.castRoller(false);
            return true;
        }

        if (this.runtime.bombCooldown > 0) {
            return false;
        }
        this.castBomb(onBombHit, false);
        return true;
    }

    public updateRollers(dt: number, onMonsterHit: (monsterId: number, damage: number, hitPoint: cc.Vec2) => void): void {
        for (let index = this.runtime.rollers.length - 1; index >= 0; index -= 1) {
            const roller = this.runtime.rollers[index];
            if (!cc.isValid(roller.node)) {
                this.runtime.rollers.splice(index, 1);
                continue;
            }

            const sawPosition = this.runtime.getSawWorldPositionByIndex(roller.sourceCarIndex);
            roller.node.x += GameConfig.skill.roller.speed * dt;
            roller.node.y = sawPosition.y;// - 10;
            // roller.node.angle -= 720 * dt;

            const rollerRect = this.runtime.makeRect(
                roller.node.x,
                roller.node.y,
                GameConfig.skill.roller.size,
                GameConfig.skill.roller.size,
            );

            for (const monster of this.runtime.monsters) {
                if (monster.dying) {
                    continue;
                }
                if (roller.hitMonsterIds[monster.id]) {
                    continue;
                }
                if (rectIntersects(rollerRect, this.runtime.getNodeColliderRect(monster.node, GameConfig.monster.width, GameConfig.monster.height))) {
                    roller.hitMonsterIds[monster.id] = true;
                    const damage = GameConfig.skill.roller.damageMultiplier * this.runtime.context.getCarAttack(roller.sourceCarIndex);
                    onMonsterHit(monster.id, damage, cc.v2(roller.node.x, roller.node.y));
                }
            }

            if (roller.node.x > this.runtime.cameraTrackX + GameConfig.designWidth / 2 + 280) {
                this.runtime.poolManager.put("roller", roller.node);
                this.runtime.rollers.splice(index, 1);
            }
        }
    }

    public damageMonstersInBombRange(target: cc.Vec2, onMonsterHit: (monsterId: number, damage: number, center: cc.Vec2) => void): void {
        this.runtime.monsters.forEach((monster) => {
            if (monster.dying) {
                return;
            }
            if (distance(target, cc.v2(monster.node.x, monster.node.y)) <= GameConfig.skill.bomb.explosionRadius) {
                onMonsterHit(monster.id, GameConfig.skill.bomb.damage, target);
            }
        });
    }

    public spawnBombEffect(target: cc.Vec2): void {
        const node = this.runtime.poolManager.get("bombExplosion", this.runtime.effectRoot, () => {
            const explosionNode = new cc.Node("BombExplosion");
            const spine = explosionNode.addComponent(sp.Skeleton);
            if (this.runtime.bombEffectSpineData) {
                spine.skeletonData = this.runtime.bombEffectSpineData;
            }
            return explosionNode;
        });

        node.x = target.x;
        node.y = target.y;
        node.scale = Math.max(0.8, GameConfig.skill.bomb.explosionRadius / 150);
        node.opacity = 255;

        const spine = node.getComponent(sp.Skeleton);
        if (spine && this.runtime.bombEffectSpineData) {
            spine.skeletonData = this.runtime.bombEffectSpineData;
            spine.setCompleteListener(null);
            spine.clearTracks();
            spine.setAnimation(0, "h1", false);
        }

        this.runtime.effects.push({
            key: "bombExplosion",
            node,
            life: 0.5,
            maxLife: 0.5,
            driftY: 0,
        });
    }

    private castRoller(consumeEnergy: boolean = true): void {
        const sourceCarIndices = this.runtime.context.getAliveCarIndices().filter((index) => this.runtime.context.getCarSkillUnlocked(index));
        if (sourceCarIndices.length <= 0) {
            return;
        }

        if (consumeEnergy) {
            this.runtime.context.energy -= GameConfig.skill.roller.cost;
        }
        this.runtime.context.rollerUseCount += 1;
        this.runtime.rollerCooldown = GameConfig.skill.roller.cooldown;
        this.runtime.rollerHiddenRemaining = GameConfig.skill.roller.hideDuration;
        AudioManager.getInstance().playSFX(AudioID.AudioID_sting);

        for (const sourceCarIndex of sourceCarIndices) {
            const node = this.runtime.poolManager.get("roller", this.runtime.effectRoot, () => {
                const rollerNode = new cc.Node("Roller");
                rollerNode.setContentSize(GameConfig.skill.roller.size, GameConfig.skill.roller.size);
                const sprite = rollerNode.addComponent(cc.Sprite);
                if (this.runtime.rollerSpriteFrame) {
                    sprite.spriteFrame = this.runtime.rollerSpriteFrame;
                }
                return rollerNode;
            });

            const sprite = node.getComponent(cc.Sprite);
            if (sprite && this.runtime.rollerSpriteFrame) {
                sprite.spriteFrame = this.runtime.rollerSpriteFrame;
            }
            const sawPosition = this.runtime.getSawWorldPositionByIndex(sourceCarIndex);
            node.x = sawPosition.x + 48;
            node.y = sawPosition.y - 10;
            node.angle = 0;
            node.opacity = 255;
            node.scale = 1;

            this.runtime.rollers.push({
                node,
                hitMonsterIds: {},
                sourceCarIndex,
            });
        }
    }

    private castBomb(onBombHit: (monsterId: number, damage: number, center: cc.Vec2) => void, consumeEnergy: boolean = true): void {
        if (consumeEnergy) {
            this.runtime.context.energy -= GameConfig.skill.bomb.cost;
        }
        this.runtime.context.bombUseCount += 1;
        this.runtime.bombCooldown = GameConfig.skill.bomb.cooldown;
        this.spawnBombProjectile(onBombHit);
    }

    private spawnBombProjectile(onBombHit: (monsterId: number, damage: number, center: cc.Vec2) => void): void {
        const node = this.runtime.poolManager.get("bomb", this.runtime.bulletRoot, () => this.runtime.createBombNode());
        const sprite = node.getComponent(cc.Sprite);
        if (sprite && this.runtime.bombSpriteFrame) {
            sprite.spriteFrame = this.runtime.bombSpriteFrame;
        }

        const startPosition = this.runtime.getWeaponWorldPosition();
        node.x = startPosition.x;
        node.y = startPosition.y;
        node.angle = 0;
        node.opacity = 255;
        node.scale = 0.5;
        node.setContentSize(GameConfig.skill.bomb.size, GameConfig.skill.bomb.size);
        node.zIndex = Math.round(-node.y * 10) + 30;

        this.runtime.bombs.push({
            node,
            velocity: cc.v2(GameConfig.skill.bomb.initialVelocity.x, GameConfig.skill.bomb.initialVelocity.y),
            onHit: onBombHit,
        });
    }

    private explodeBomb(index: number, target: cc.Vec2): void {
        const bomb = this.runtime.bombs[index];
        if (!bomb) {
            return;
        }

        this.spawnBombEffect(target);
        this.damageMonstersInBombRange(target, bomb.onHit);
        AudioManager.getInstance().playSFX(AudioID.AudioID_Boom);
        this.recycleBomb(index);
    }

    private recycleBomb(index: number): void {
        const bomb = this.runtime.bombs[index];
        this.runtime.bombs.splice(index, 1);
        if (bomb && bomb.node && cc.isValid(bomb.node)) {
            this.runtime.poolManager.put("bomb", bomb.node);
        }
    }
}
