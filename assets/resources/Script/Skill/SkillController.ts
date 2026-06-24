import { GameConfig } from "../Core/GameConfig";
import GameRuntime from "../Core/GameRuntime";
import { SkillType } from "../Entity/EntityTypes";
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
    }

    public tryUseSkill(skillType: SkillType, onBombHit: (monsterId: number, damage: number, center: cc.Vec2) => void): SkillAttemptResult {
        if (skillType === "roller") {
            if (!this.runtime.context.hasAliveCarSkillUnlocked()) {
                return { kind: "invalid", reason: "需要锯齿车存活" };
            }
            if (this.runtime.rollerCooldown > 0) {
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
        if (!this.hasBombTarget()) {
            return { kind: "invalid", reason: "没有目标" };
        }
        if (this.runtime.context.energy < GameConfig.skill.bomb.cost) {
            return { kind: "needs_energy", skillType, cost: GameConfig.skill.bomb.cost };
        }
        this.castBomb(onBombHit);
        return { kind: "used" };
    }

    public useSkillWithoutEnergyCost(skillType: SkillType, onBombHit: (monsterId: number, damage: number, center: cc.Vec2) => void): boolean {
        if (skillType === "roller") {
            if (!this.runtime.context.hasAliveCarSkillUnlocked() || this.runtime.rollerCooldown > 0) {
                return false;
            }
            this.castRoller(false);
            return true;
        }

        if (this.runtime.bombCooldown > 0 || !this.hasBombTarget()) {
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

            if (!roller.isRolling) {
                roller.node.y = Math.max(roller.groundY, roller.node.y - GameConfig.skill.roller.speed * dt);
                if (roller.node.y <= roller.groundY) {
                    roller.node.y = roller.groundY;
                    roller.isRolling = true;
                }
            } else {
                roller.node.x += GameConfig.skill.roller.speed * dt;
            }
            roller.node.angle -= 720 * dt;

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
                    onMonsterHit(monster.id, GameConfig.skill.roller.damage, cc.v2(roller.node.x, roller.node.y));
                }
            }

            if (roller.node.x > this.runtime.cameraTrackX + GameConfig.designWidth / 2 + 280) {
                this.runtime.poolManager.put("roller", roller.node);
                this.runtime.rollers.splice(index, 1);
            }
        }
    }

    public findBestBombTarget(): cc.Vec2 | null {
        const monsters = this.getMonstersInBombRange();
        if (monsters.length === 0) {
            return null;
        }

        const gridSize = GameConfig.skill.bomb.gridSize;
        const heroPos = this.getHeroPosition();
        const grids: Record<string, { count: number; center: cc.Vec2; monsters: cc.Vec2[] }> = {};

        monsters.forEach((monster) => {
            const gx = Math.floor(monster.node.x / gridSize);
            const gy = Math.floor(monster.node.y / gridSize);
            const key = `${gx}_${gy}`;
            if (!grids[key]) {
                grids[key] = {
                    count: 0,
                    center: cc.v2(gx * gridSize + gridSize / 2, gy * gridSize + gridSize / 2),
                    monsters: [],
                };
            }
            grids[key].count += 1;
            grids[key].monsters.push(cc.v2(monster.node.x, monster.node.y));
        });

        let best: { count: number; center: cc.Vec2; monsters: cc.Vec2[] } | null = null;
        Object.keys(grids).forEach((key) => {
            const grid = grids[key];
            const currentBest = best;
            if (!currentBest || grid.count > currentBest.count || (grid.count === currentBest.count && distance(grid.center, heroPos) < distance(currentBest.center, heroPos))) {
                best = grid;
            }
        });

        if (!best) {
            return null;
        }

        if (best.monsters.length === 1) {
            return best.monsters[0];
        }

        let bestTarget = best.monsters[0];
        let bestHitCount = -1;
        let bestDistance = Number.MAX_SAFE_INTEGER;

        best.monsters.forEach((candidate) => {
            let hitCount = 0;
            best!.monsters.forEach((monsterPosition) => {
                if (distance(candidate, monsterPosition) <= GameConfig.skill.bomb.explosionRadius) {
                    hitCount += 1;
                }
            });

            const candidateDistance = distance(candidate, heroPos);
            if (hitCount > bestHitCount || (hitCount === bestHitCount && candidateDistance < bestDistance)) {
                bestHitCount = hitCount;
                bestDistance = candidateDistance;
                bestTarget = candidate;
            }
        });

        return bestTarget;
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
            spine.setAnimation(0, SkillController.BOMB_EFFECT_ANIMATION, false);
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
        if (consumeEnergy) {
            this.runtime.context.energy -= GameConfig.skill.roller.cost;
        }
        this.runtime.context.rollerUseCount += 1;
        this.runtime.rollerCooldown = GameConfig.skill.roller.cooldown;

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
        const sourceCarIndex = this.runtime.context.getLowestAliveCarIndexWithSkill();
        const sawPosition = sourceCarIndex >= 0
            ? this.runtime.getSawWorldPositionByIndex(sourceCarIndex)
            : this.runtime.getSawWorldPosition();
        node.x = sawPosition.x + 48;
        node.y = sawPosition.y - 10;
        node.angle = 0;
        node.opacity = 255;
        node.scale = 1;

        this.runtime.rollers.push({
            node,
            hitMonsterIds: {},
            isRolling: false,
            groundY: GameConfig.world.monsterY-30,
        });
    }

    private castBomb(onBombHit: (monsterId: number, damage: number, center: cc.Vec2) => void, consumeEnergy: boolean = true): void {
        const target = this.findBestBombTarget();
        if (!target) {
            return;
        }

        if (consumeEnergy) {
            this.runtime.context.energy -= GameConfig.skill.bomb.cost;
        }
        this.runtime.context.bombUseCount += 1;
        this.runtime.bombCooldown = GameConfig.skill.bomb.cooldown;
        this.spawnBombEffect(target);
        this.damageMonstersInBombRange(target, onBombHit);
    }

    private hasBombTarget(): boolean {
        return this.getMonstersInBombRange().length > 0;
    }

    private getMonstersInBombRange() {
        const heroPos = this.getHeroPosition();
        return this.runtime.monsters.filter((monster) => !monster.dying && distance(heroPos, cc.v2(monster.node.x, monster.node.y)) <= GameConfig.skill.bomb.searchRadius);
    }

    private getHeroPosition(): cc.Vec2 {
        return this.runtime.getHeroWorldPosition();
    }
}
