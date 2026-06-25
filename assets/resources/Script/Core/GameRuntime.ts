import { GameConfig } from "./GameConfig";
import { GameContext } from "./GameContext";
import { SceneRefs } from "./SceneRefs";
import CarPrefab from "../Battle/CarPrefab";
import PoolManager from "../Util/PoolManager";
import UIPrimitives from "../UI/UIPrimitives";
import { BulletRuntime, EffectRuntime, MonsterKind, MonsterRuntime, RollerRuntime, UiBarLike } from "../Entity/EntityTypes";
import { randomRange } from "../Util/MathUtil";

export default class GameRuntime {
    private static readonly BG_REUSE_OFFSCREEN_PADDING = 500;
    private static readonly BULLET_PREFAB_PATH = "prefab/bullet";
    private static readonly MONSTER_PREFAB_PATH = "prefab/monster";
    private static readonly CAR_PREFAB_PATH = "prefab/car";
    private static readonly ROLLER_SPRITE_PATH = "Texture/ui/teshu2";
    private static readonly BULLET_GROUND_SPRITE_PATH = "Texture/ui/bullet1";
    private static readonly BOMB_SPINE_PATH = "Texture/spine/effect/1001_die";

    public readonly context = new GameContext();
    public readonly poolManager = new PoolManager();
    public readonly uiPrimitives = new UIPrimitives();
    public readonly refs: SceneRefs;

    public worldRoot: cc.Node = null;
    public bulletRoot: cc.Node = null;
    public effectRoot: cc.Node = null;
    public uiRoot: cc.Node = null;
    public bulletPrefab: cc.Prefab | null = null;
    public monsterPrefab: cc.Prefab | null = null;
    public carPrefab: cc.Prefab | null = null;
    public rollerSpriteFrame: cc.SpriteFrame | null = null;
    public bulletGroundSpriteFrame: cc.SpriteFrame | null = null;
    public bombEffectSpineData: sp.SkeletonData | null = null;
    public monsterSpineData: Record<MonsterKind, sp.SkeletonData | null> = {
        normal: null,
        elite: null,
    };

    public mapLayout: cc.Node = null;
    public heroLayout: cc.Node = null;
    public enemyLayout: cc.Node = null;

    public monsters: MonsterRuntime[] = [];
    public bullets: BulletRuntime[] = [];
    public rollers: RollerRuntime[] = [];
    public effects: EffectRuntime[] = [];
    public pendingFloatTextAnchor: cc.Node | null = null;
    public forcedAimDirection: cc.Vec2 | null = null;
    public forcedAimTargetPosition: cc.Vec2 | null = null;
    public forcedAimDistance = 0;

    public monsterIdSeed = 1;
    public bossHp = GameConfig.boss.hp;
    public cameraTrackX = 0;

    public shootTimer = 0;
    public spawnTimer = 0;
    public bossSpawnTimer = 0;
    public bossPreSpawnRemaining = 0;
    public sawAttackTimer = 0;
    public rollerCooldown = 0;
    public bombCooldown = 0;

    public carBaseX = 0;
    public heroOffsetX = 0;
    public sawOffsetX = 0;
    public heroAliveY = 0;
    public heroDroppedY = 0;
    public heroScreenAnchorX = 0;
    public bossLocalX = 0;
    public bossLocalY = 0;
    public bossEntranceActive = false;
    public bossEntranceTargetCameraX = 0;
    public bgWidth = 1500;
    public sawRotationSpeed = 240;

    private carInstanceNodes: cc.Node[] = [];
    private carViews: CarPrefab[] = [];
    private carUnlockLift = 62;
    private carStackSpacingX = 0;
    private carStackSpacingY = 62;
    private baseCarLocalY = 0;
    private carBaseNodeHeight = 0;
    private carLocalX = 0;
    private carLocalY = 0;
    private heroBaseLocalY = 0;
    private heroSpineLocalY = 0;
    private heroProgressLocalY = 0;
    private sawLocalX = 0;
    private sawLocalY = 0;
    private heroFireOffsetFromSpine = cc.v2(0, 0);
    private wheelLocalPositions: cc.Vec2[] = [];
    private bgInitialPositions: cc.Vec2[] = [];
    private prepareLayoutBasePosition = cc.v2(0, 0);
    private prepareTaskSharedBasePosition = cc.v2(0, 0);
    private prepareBaseCarSlotPosition = cc.v2(0, 0);
    private previousCarX = 0;
    public bgOrderIndices: number[] = [];

    public constructor(refs: SceneRefs) {
        this.refs = refs;
    }

    public initializeScene(): void {
        this.mapLayout = this.refs.bgNodes.length > 0 ? this.refs.bgNodes[0].parent : null;
        this.heroLayout = this.refs.heroNode ? this.refs.heroNode.parent : null;
        this.enemyLayout = this.refs.bossNode ? this.refs.bossNode.parent : null;

        this.createWorldRoot();
        this.createDynamicRoots();
        this.raiseOverlayNodes();
        this.captureAnchors();
        this.applyWorldAnchors();
        this.hideLegacyUi();
        this.loadRuntimePrefabs();
        this.resetActorPlacement();
    }

    public destroy(): void {
        this.poolManager.clear();
    }

    public resetTransientFlow(preserveCameraTrack: boolean = false): void {
        this.shootTimer = 0;
        this.spawnTimer = 0;
        this.bossSpawnTimer = 0;
        this.bossPreSpawnRemaining = 0;
        this.sawAttackTimer = 0;
        this.rollerCooldown = 0;
        this.bombCooldown = 0;
        if (!preserveCameraTrack) {
            this.cameraTrackX = 0;
        }
        this.bossEntranceActive = false;
        this.bossEntranceTargetCameraX = 0;
        this.forcedAimDirection = null;
        this.forcedAimTargetPosition = null;
        this.forcedAimDistance = 0;
    }

    public resetActorPlacement(): void {
        this.refreshRoundAnchors();
        this.applyUnlockPresentation();
        this.syncSceneBars();

        if (this.refs.bossNode) {
            this.refs.bossNode.active = false;
            this.refs.bossNode.x = this.bossLocalX;
            this.refs.bossNode.y = this.bossLocalY;
        }

        this.syncCarPresentation();
        this.applyHeroCarStackOffset();

        const currentCarX = this.logicalToLocalX(this.context.reachedDistance);
        if (this.refs.heroNode) {
            this.refs.heroNode.x = currentCarX - this.carLocalX;
            this.refs.heroNode.y = this.heroAliveY;
        }
        this.previousCarX = currentCarX;

        this.updateShieldPresentation();
        this.restoreScenePlacement();
        this.syncCameraToCurrentDistance();
        this.syncPrepareTaskLayout();
    }

    public refreshPreparePresentation(): void {
        this.refreshRoundAnchors();
        this.applyUnlockPresentation();
        this.syncSceneBars();

        const currentCarX = this.logicalToLocalX(this.context.reachedDistance);
        this.syncCarPresentation();
        this.applyHeroCarStackOffset();

        if (this.refs.heroNode) {
            this.refs.heroNode.x = currentCarX - this.carLocalX;
            this.refs.heroNode.y = this.heroAliveY;
        }
        this.previousCarX = currentCarX;

        this.updateShieldPresentation();
        this.syncCameraToCurrentDistance();
        this.syncPrepareTaskLayout();
    }

    public updateActorPlacement(): void {
        if (!this.refs.carNode) {
            return;
        }

        this.applyUnlockPresentation();
        const nextCarX = this.logicalToLocalX(this.context.reachedDistance);
        const deltaX = nextCarX - this.previousCarX;
        this.syncCarPresentation();
        this.applyHeroCarStackOffset();
        if (this.refs.heroNode) {
            this.refs.heroNode.x = nextCarX - this.carLocalX;
            this.refs.heroNode.y = this.heroAliveY;
        }
        this.rotateWheelNodes(deltaX);
        this.previousCarX = nextCarX;
        this.updateShieldPresentation();
        if (this.refs.bossNode) {
            if (!this.refs.bossNode.active) {
                this.refs.bossNode.x = this.bossLocalX;
            }
            this.refs.bossNode.y = this.bossLocalY;
        }
    }

    public createMonsterNode(): cc.Node {
        const node = this.monsterPrefab
            ? cc.instantiate(this.monsterPrefab)
            : new cc.Node("Monster");

        if (!this.monsterPrefab) {
            this.uiPrimitives.redrawRect(node, GameConfig.monster.width, GameConfig.monster.height, new cc.Color(110, 205, 120, 255));
        }

        const hpRoot = node.getChildByName("progressBg") || new cc.Node("MonsterHpRoot");
        if (!hpRoot.parent) {
            hpRoot.parent = node;
            hpRoot.y = 44;
        }
        hpRoot.active = false;

        const progressNode = hpRoot.getChildByName("progressBar");
        const progressBar = progressNode ? progressNode.getComponent(cc.ProgressBar) : null;
        const fillNode = progressNode ? progressNode.getChildByName("bar") : null;
        const hpBar = progressBar && fillNode
            ? {
                root: hpRoot,
                fill: fillNode,
                label: this.ensureMonsterHpLabel(hpRoot),
                width: progressNode.width || 80,
                height: fillNode.height || 12,
                fillColor: fillNode.color || new cc.Color(96, 255, 108, 255),
                progressBar,
            }
            : this.uiPrimitives.createBar(hpRoot, 0, 0, 44, 6, new cc.Color(45, 25, 25, 220), new cc.Color(96, 255, 108, 255));
        hpBar.label.node.active = false;

        const runtime: MonsterRuntime = {
            id: 0,
            node,
            kind: "normal",
            laneIndex: 1,
            hp: 0,
            maxHp: 0,
            attack: 0,
            attackTimer: 0,
            contactCar: false,
            contactCarIndex: -1,
            contactHero: false,
            lockedAtOneHp: false,
            stackedOnMonsterId: 0,
            hasStackJumped: false,
            blockedByMonsterLastFrame: false,
            stackJumpProgress: 1,
            stackJumpStartX: 0,
            stackJumpStartY: 0,
            knockbackVelocityX: 0,
            knockbackVelocityY: 0,
            dying: false,
            hpBar: hpBar as UiBarLike,
        };

        (node as any).__runtime = runtime;
        return node;
    }

    public configureMonsterNode(node: cc.Node, kind: MonsterKind): void {
        const spineNode = node.getChildByName("NodeSpine");
        const spine = spineNode ? spineNode.getComponent(sp.Skeleton) : null;
        const skeletonData = this.monsterSpineData[kind];
        if (spine && skeletonData) {
            spine.skeletonData = skeletonData;
            spine.setCompleteListener(null);
            this.playSkeletonLoop(spine, this.getDefaultMonsterLoopAnimation(spine));
        }
    }

    public playHeroAttack(): void {
        const spine = this.getHeroSpine();
        if (!spine) {
            return;
        }
        this.playSkeletonOnce(spine, "attack1", this.getDefaultHeroLoopAnimation(spine));
    }

    public playHeroIdle(): void {
        const spine = this.getHeroSpine();
        if (!spine) {
            return;
        }
        this.playSkeletonLoop(spine, this.getDefaultHeroLoopAnimation(spine));
    }

    public playMonsterAttack(node: cc.Node): void {
        const spine = this.getMonsterSpine(node);
        if (!spine) {
            return;
        }
        this.playSkeletonOnce(spine, "attack", this.getDefaultMonsterLoopAnimation(spine));
    }

    public playMonsterIdle(node: cc.Node): void {
        const spine = this.getMonsterSpine(node);
        if (!spine) {
            return;
        }
        this.playSkeletonLoop(spine, this.findSkeletonAnimationName(spine, ["idle", spine.defaultAnimation, "walk"]));
    }

    public playMonsterMove(node: cc.Node): void {
        const spine = this.getMonsterSpine(node);
        if (!spine) {
            return;
        }
        this.playSkeletonLoop(spine, this.getDefaultMonsterLoopAnimation(spine));
    }

    public playMonsterDie(node: cc.Node, onComplete: () => void): boolean {
        const spine = this.getMonsterSpine(node);
        if (!spine) {
            onComplete();
            return false;
        }

        const dieAnimation = this.findSkeletonAnimationName(spine, ["die"]);
        if (!dieAnimation) {
            onComplete();
            return false;
        }

        spine.clearTracks();
        const trackEntry = spine.setAnimation(0, dieAnimation, false);
        spine.setTrackCompleteListener(trackEntry, () => {
            spine.setTrackCompleteListener(trackEntry, null as any);
            onComplete();
        });
        return true;
    }

    public createBulletNode(): cc.Node {
        if (this.bulletPrefab) {
            return cc.instantiate(this.bulletPrefab);
        }

        const bulletNode = new cc.Node("Bullet");
        this.uiPrimitives.redrawRect(bulletNode, 22, 8, new cc.Color(255, 236, 90, 255));
        return bulletNode;
    }

    public clearBattleObjects(): void {
        this.monsters.forEach((monster) => this.poolManager.put("monster", monster.node));
        this.bullets.forEach((bullet) => this.poolManager.put("bullet", bullet.node));
        this.rollers.forEach((roller) => this.poolManager.put("roller", roller.node));
        this.effects.forEach((effect) => this.poolManager.put(effect.key, effect.node));

        this.monsters = [];
        this.bullets = [];
        this.rollers = [];
        this.effects = [];
    }

    public spawnFloatText(x: number, y: number, text: string, color: cc.Color): void {
        if (x === 0 && y === 12 && this.pendingFloatTextAnchor) {
            const anchorPosition = this.getNodePositionInWorldRoot(this.pendingFloatTextAnchor);
            x = anchorPosition.x;
            y = anchorPosition.y + 80;
            this.pendingFloatTextAnchor = null;
        }

        const node = this.poolManager.get("floatText", this.effectRoot, () => {
            const labelNode = new cc.Node("FloatText");
            labelNode.setContentSize(260, 40);
            const label = labelNode.addComponent(cc.Label);
            label.fontSize = 22;
            label.lineHeight = 28;
            label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            label.verticalAlign = cc.Label.VerticalAlign.CENTER;
            (labelNode as any).__label = label;
            return labelNode;
        });

        node.x = x;
        node.y = y;
        node.opacity = 255;
        node.scale = 1;
        node.color = color;
        const label: cc.Label = (node as any).__label;
        label.string = text;

        this.effects.push({
            key: "floatText",
            node,
            life: 0.65,
            maxLife: 0.65,
            driftY: 40,
        });
    }

    public spawnBulletCrater(x: number, y: number, angle: number = -18): void {
        const node = this.poolManager.get("bulletGroundArrow", this.effectRoot, () => {
            const arrowNode = new cc.Node("BulletGroundArrow");
            arrowNode.setContentSize(10, 40);
            arrowNode.anchorX = 0.5;
            arrowNode.anchorY = 1;
            const sprite = arrowNode.addComponent(cc.Sprite);
            sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            if (this.bulletGroundSpriteFrame) {
                sprite.spriteFrame = this.bulletGroundSpriteFrame;
            }

            const groundPit = new cc.Node("GroundPit");
            groundPit.parent = arrowNode;
            groundPit.setPosition(0, -1.5);
            groundPit.setContentSize(8, 3);
            const pitGraphics = groundPit.addComponent(cc.Graphics);
            pitGraphics.clear();
            pitGraphics.fillColor = new cc.Color(104, 96, 84, 255);
            pitGraphics.ellipse(0, 0, 4, 1.5);
            pitGraphics.fill();
            return arrowNode;
        });

        const sprite = node.getComponent(cc.Sprite);
        if (sprite && this.bulletGroundSpriteFrame) {
            sprite.spriteFrame = this.bulletGroundSpriteFrame;
        }
        node.setContentSize(10, 40);
        node.x = x;
        node.y = y - 5.5;
        node.opacity = 255;
        node.scaleX = 1;
        node.scaleY = 1;
        node.angle = angle - randomRange(10, 30);
        const groundPit = node.getChildByName("GroundPit");
        if (groundPit) {
            groundPit.angle = -node.angle;
        }

        this.effects.push({
            key: "bulletGroundArrow",
            node,
            life: 0.55,
            maxLife: 0.55,
            driftY: 0,
            fadeDelay: 0.25,
            disableFadeScale: true,
        });
    }

    public logicalToLocalX(worldX: number): number {
        return this.carBaseX + worldX;
    }

    public placeBossAtScreenRight(): void {
        const bossNode = this.refs.bossNode;
        if (!bossNode) {
            return;
        }

        const visibleRight = this.cameraTrackX + GameConfig.designWidth / 2;
        const leftEdgeX = visibleRight + GameConfig.boss.entranceScreenPadding;
        bossNode.x = leftEdgeX + bossNode.anchorX * this.getNodeLocalDisplayWidth(bossNode);
        bossNode.y = this.bossLocalY;
        bossNode.active = true;
        this.bossEntranceTargetCameraX = this.getBossCenterWorldPosition().x;
        this.bossEntranceActive = true;
    }

    public getBossCenterWorldPosition(): cc.Vec2 {
        const bossNode = this.refs.bossNode;
        if (!bossNode) {
            return cc.v2(this.bossLocalX, GameConfig.world.bossY);
        }

        const width = this.getNodeLocalDisplayWidth(bossNode);
        const height = this.getNodeLocalDisplayHeight(bossNode);
        return cc.v2(
            bossNode.x + (0.5 - bossNode.anchorX) * width,
            bossNode.y + (0.5 - bossNode.anchorY) * height,
        );
    }

    public getBossCameraLockX(): number {
        if (this.bossEntranceTargetCameraX > 0) {
            return this.bossEntranceTargetCameraX;
        }
        return this.getBossCenterWorldPosition().x;
    }

    public completeBossEntranceIfCentered(): void {
        if (!this.bossEntranceActive) {
            return;
        }

        const lockX = this.getBossCameraLockX();
        if (this.cameraTrackX < lockX - 0.1) {
            return;
        }

        this.cameraTrackX = lockX;
        this.bossEntranceActive = false;
    }

    public isBossVisibleInScreen(): boolean {
        const bossNode = this.refs.bossNode;
        if (!bossNode || !bossNode.active) {
            return false;
        }

        const center = this.getBossCenterWorldPosition();
        const halfWidth = this.getNodeLocalDisplayWidth(bossNode) / 2;
        const visibleLeft = this.cameraTrackX - GameConfig.designWidth / 2;
        const visibleRight = this.cameraTrackX + GameConfig.designWidth / 2;
        return center.x + halfWidth > visibleLeft && center.x - halfWidth < visibleRight;
    }

    public getNodePositionInWorldRoot(node: cc.Node | null): cc.Vec2 {
        if (!node) {
            return cc.v2(0, 0);
        }
        if (!this.worldRoot || !node.parent) {
            return cc.v2(node.x, node.y);
        }
        const worldPosition = node.parent.convertToWorldSpaceAR(cc.v2(node.x, node.y));
        return this.worldRoot.convertToNodeSpaceAR(worldPosition);
    }

    public getNodeColliderRect(node: cc.Node | null, fallbackWidth: number, fallbackHeight: number): { x: number; y: number; width: number; height: number } {
        if (!node) {
            return {
                x: 0,
                y: 0,
                width: fallbackWidth,
                height: fallbackHeight,
            };
        }

        const collider = node.getComponent(cc.BoxCollider);
        if (!collider) {
            const position = this.getNodePositionInWorldRoot(node);
            return {
                x: position.x,
                y: position.y,
                width: node.width || fallbackWidth,
                height: node.height || fallbackHeight,
            };
        }

        const colliderWorldPosition = node.convertToWorldSpaceAR(cc.v2(collider.offset.x, collider.offset.y));
        const colliderPosition = this.worldRoot
            ? this.worldRoot.convertToNodeSpaceAR(colliderWorldPosition)
            : colliderWorldPosition;

        return {
            x: colliderPosition.x,
            y: colliderPosition.y,
            width: Math.abs(collider.size.width * node.scaleX) || fallbackWidth,
            height: Math.abs(collider.size.height * node.scaleY) || fallbackHeight,
        };
    }

    public getHeroWorldPosition(): cc.Vec2 {
        return this.getNodePositionInWorldRoot(this.refs.heroNode);
    }

    public getCarWorldPosition(): cc.Vec2 {
        return this.getNodePositionInWorldRoot(this.getCarVisualNode() || this.getCarAnchorNode());
    }

    public getCarWorldPositionByIndex(index: number): cc.Vec2 {
        const node = this.carInstanceNodes[index];
        return this.getNodePositionInWorldRoot(node && cc.isValid(node) ? node : this.refs.carNode);
    }

    public getCarVisualNodeByIndex(index: number): cc.Node | null {
        const node = this.carInstanceNodes[index];
        return node && cc.isValid(node) && node.active ? node : null;
    }

    public getSawWorldPosition(): cc.Vec2 {
        return this.getNodePositionInWorldRoot(this.getSawNode() || this.getLeadCarVisualNode() || this.refs.carNode);
    }

    public getSawWorldPositionByIndex(index: number): cc.Vec2 {
        const carView = this.carViews[index];
        if (carView && carView.sawNode && cc.isValid(carView.sawNode)) {
            return this.getNodePositionInWorldRoot(carView.sawNode);
        }
        return this.getCarWorldPositionByIndex(index);
    }

    public getCarAnchorNode(): cc.Node | null {
        return this.refs.carNode;
    }

    public getCarVisualNode(): cc.Node | null {
        return this.getLeadCarVisualNode() || this.refs.carBaseNode || this.refs.carNode;
    }

    public getSawNode(): cc.Node | null {
        const carView = this.getCarView();
        if (carView && carView.sawNode && cc.isValid(carView.sawNode)) {
            return carView.sawNode;
        }
        // return this.refs.sawNode && cc.isValid(this.refs.sawNode) ? this.refs.sawNode : null;
    }

    public getSawNodeByIndex(index: number): cc.Node | null {
        const carView = this.carViews[index];
        if (carView && carView.sawNode && cc.isValid(carView.sawNode)) {
            return carView.sawNode;
        }
        return null;
    }

    public getActiveCarViews(): CarPrefab[] {
        return this.carViews.filter((view) => view && cc.isValid(view.node) && view.node.active);
    }

    public getCarIndexByView(targetView: CarPrefab | null): number {
        if (!targetView) {
            return -1;
        }
        return this.carViews.findIndex((view) => view === targetView);
    }

    public getHeroFireWorldPosition(): cc.Vec2 {
        if (!this.refs.heroSpineNode) {
            const heroPosition = this.getHeroWorldPosition();
            return cc.v2(heroPosition.x + 50, heroPosition.y + 150);
        }
        const spinePosition = this.getNodePositionInWorldRoot(this.refs.heroSpineNode);
        return cc.v2(
            spinePosition.x + 50,//this.heroFireOffsetFromSpine.x,
            spinePosition.y + 13//this.heroFireOffsetFromSpine.y,
        );
    }

    public makeRect(x: number, y: number, width: number, height: number): { x: number; y: number; width: number; height: number } {
        return { x, y, width, height };
    }

    private createWorldRoot(): void {
        this.worldRoot = new cc.Node("WorldRoot");
        this.worldRoot.parent = this.refs.root;

        [this.mapLayout, this.heroLayout, this.enemyLayout].forEach((group) => {
            if (!group || group.parent === this.worldRoot) {
                return;
            }
            this.reparentKeepWorldTransform(group, this.worldRoot);
        });

        if (this.refs.nodeCamera) {
            this.refs.nodeCamera.x = 0;
            this.refs.nodeCamera.y = 0;
        }
    }

    private createDynamicRoots(): void {
        this.bulletRoot = new cc.Node("BulletRoot");
        this.bulletRoot.parent = this.worldRoot;
        this.bulletRoot.zIndex = 60;

        this.effectRoot = new cc.Node("EffectRoot");
        this.effectRoot.parent = this.worldRoot;
        this.effectRoot.zIndex = 80;

        this.uiRoot = new cc.Node("UIRoot");
        this.uiRoot.parent = this.refs.root;
        this.uiRoot.zIndex = 500;
    }

    private loadRuntimePrefabs(): void {
        const resources = (cc as any).resources;
        if (!resources || !resources.load) {
            return;
        }

        resources.load(GameRuntime.BULLET_PREFAB_PATH, cc.Prefab, (error: Error | null, prefab: cc.Prefab) => {
            if (error || !prefab) {
                return;
            }
            this.bulletPrefab = prefab;
        });

        resources.load(GameRuntime.MONSTER_PREFAB_PATH, cc.Prefab, (error: Error | null, prefab: cc.Prefab) => {
            if (error || !prefab) {
                return;
            }
            this.monsterPrefab = prefab;
        });

        resources.load(GameRuntime.CAR_PREFAB_PATH, cc.Prefab, (error: Error | null, prefab: cc.Prefab) => {
            if (error || !prefab) {
                return;
            }
            this.carPrefab = prefab;
            if (this.context.sawCarUnlocked) {
                this.syncCarPresentation();
            }
        });

        resources.load(GameRuntime.ROLLER_SPRITE_PATH, cc.SpriteFrame, (error: Error | null, spriteFrame: cc.SpriteFrame) => {
            if (error || !spriteFrame) {
                return;
            }
            this.rollerSpriteFrame = spriteFrame;
        });

        resources.load(GameRuntime.BULLET_GROUND_SPRITE_PATH, cc.SpriteFrame, (error: Error | null, spriteFrame: cc.SpriteFrame) => {
            if (error || !spriteFrame) {
                return;
            }
            this.bulletGroundSpriteFrame = spriteFrame;
        });

        resources.load(GameRuntime.BOMB_SPINE_PATH, sp.SkeletonData, (error: Error | null, data: sp.SkeletonData) => {
            if (error || !data) {
                return;
            }
            this.bombEffectSpineData = data;
        });

        resources.load("Texture/spine/monster/e1", sp.SkeletonData, (error: Error | null, data: sp.SkeletonData) => {
            if (error || !data) {
                return;
            }
            this.monsterSpineData.normal = data;
        });

        resources.load("Texture/spine/monster/e2", sp.SkeletonData, (error: Error | null, data: sp.SkeletonData) => {
            if (error || !data) {
                return;
            }
            this.monsterSpineData.elite = data;
        });
    }

    private captureAnchors(): void {
        this.carBaseX = this.getNodePositionInWorldRoot(this.refs.carNode).x || -300;
        this.heroOffsetX = 0;
        this.sawOffsetX = 0;
        this.bgWidth = 1500;
        this.bgInitialPositions = this.refs.bgNodes.map((bgNode) => cc.v2(bgNode.x, bgNode.y));
        this.bgOrderIndices = this.refs.bgNodes.map((_, index) => index)
            .sort((left, right) => this.bgInitialPositions[left].x - this.bgInitialPositions[right].x);
        this.bossLocalX = this.logicalToLocalX(GameConfig.boss.x);
        this.bossLocalY = this.getBossAnchorAlignedY(this.refs.bossNode);
        this.heroBaseLocalY = this.refs.heroNode ? this.refs.heroNode.y : GameConfig.world.heroY;
        this.heroAliveY = this.heroBaseLocalY;
        this.heroDroppedY = this.heroBaseLocalY;
        this.heroScreenAnchorX = this.refs.heroNode ? this.refs.heroNode.x : -GameConfig.designWidth / 3;
        // this.carUnlockLift = this.getNodeLocalDisplayHeight(this.refs.carNode);
        this.baseCarLocalY = this.refs.carBaseNode ? this.refs.carBaseNode.y : 0;
        this.carBaseNodeHeight = this.getNodeLocalDisplayHeight(this.refs.carBaseNode);
        this.carLocalX = this.refs.carNode ? this.refs.carNode.x : 0;
        this.carLocalY = this.refs.carNode ? this.refs.carNode.y : 0;
        this.heroSpineLocalY = this.refs.heroSpineNode ? this.refs.heroSpineNode.y : 0;
        this.heroProgressLocalY = this.refs.heroProgressBar && this.refs.heroProgressBar.node.parent
            ? this.refs.heroProgressBar.node.parent.y
            : 0;
        this.sawLocalX = 0;
        this.sawLocalY = 0;
        const spinePosition = this.getNodePositionInWorldRoot(this.refs.heroSpineNode);
        const initialFirePosition = this.refs.heroNode
            ? cc.v2(this.refs.heroNode.x + 42, this.refs.heroNode.y + 16)
            : cc.v2(42, 16);
        this.heroFireOffsetFromSpine = cc.v2(initialFirePosition.x - spinePosition.x, initialFirePosition.y - spinePosition.y);
        this.wheelLocalPositions = [];
        this.prepareLayoutBasePosition = this.refs.btnUpLayout
            ? cc.v2(this.refs.btnUpLayout.x, this.refs.btnUpLayout.y)
            : cc.v2(0, 0);
        this.prepareTaskSharedBasePosition = this.refs.btnBuyCar
            ? cc.v2(this.refs.btnBuyCar.x, this.refs.btnBuyCar.y)
            : cc.v2(0, 0);
        this.prepareBaseCarSlotPosition = this.getPrepareCarSlotPositionInTaskLayout(0);
    }

    private refreshRoundAnchors(): void {
        this.bossLocalX = this.logicalToLocalX(this.context.roundStartDistance + GameConfig.boss.x);
    }

    public syncCameraToCurrentDistance(): void {
        if (!this.worldRoot) {
            return;
        }

        const heroWorldPosition = this.getHeroWorldPosition();
        this.cameraTrackX = Math.max(0, heroWorldPosition.x - this.heroScreenAnchorX);
        this.worldRoot.x = -this.cameraTrackX;
        this.syncBackgroundLoopToCamera();
    }

    public syncBackgroundLoopToCamera(): void {
        const bgNodes = this.refs.bgNodes;
        if (bgNodes.length === 0) {
            return;
        }

        const visibleLeft = this.cameraTrackX - GameConfig.designWidth / 2;
        for (let count = 0; count < bgNodes.length; count += 1) {
            const leftMostIndex = this.bgOrderIndices[0];
            const rightMostIndex = this.bgOrderIndices[this.bgOrderIndices.length - 1];
            const leftMost = leftMostIndex === undefined ? null : bgNodes[leftMostIndex];
            const rightMost = rightMostIndex === undefined ? null : bgNodes[rightMostIndex];
            if (!leftMost || !rightMost) {
                return;
            }

            const leftMostRightEdge = leftMost.x + this.bgWidth / 2;
            if (leftMostRightEdge >= visibleLeft - GameRuntime.BG_REUSE_OFFSCREEN_PADDING) {
                return;
            }

            leftMost.x = rightMost.x + this.bgWidth;
            this.bgOrderIndices.push(this.bgOrderIndices.shift() as number);
        }
    }

    private applyWorldAnchors(): void {
        this.restoreScenePlacement();
        if (this.refs.heroNode) {
            this.refs.heroNode.y = this.heroAliveY;
        }
        this.syncCarPresentation();
        if (this.refs.bossNode) {
            this.refs.bossNode.y = this.bossLocalY;
            this.refs.bossNode.x = this.bossLocalX;
            this.refs.bossNode.active = false;
        }
    }

    public restoreScenePlacement(): void {
        this.cameraTrackX = 0;
        if (this.worldRoot) {
            this.worldRoot.x = 0;
        }

        this.refs.bgNodes.forEach((bgNode, index) => {
            const anchor = this.bgInitialPositions[index];
            if (!bgNode || !anchor) {
                return;
            }
            bgNode.x = anchor.x;
            bgNode.y = anchor.y;
        });
        this.bgOrderIndices = this.refs.bgNodes.map((_, index) => index)
            .sort((left, right) => {
                const leftNode = this.refs.bgNodes[left];
                const rightNode = this.refs.bgNodes[right];
                return (leftNode ? leftNode.x : 0) - (rightNode ? rightNode.x : 0);
            });
    }

    private hideLegacyUi(): void {
        [
            this.refs.heroProgressBar ? this.refs.heroProgressBar.node.parent : null,
            // this.refs.carProgressBar ? this.refs.carProgressBar.node.parent : null,
            this.refs.bossProgressBar ? this.refs.bossProgressBar.node.parent : null,
        ].forEach((node) => {
            if (node) {
                node.active = false;
            }
        });
        if (this.refs.bossHpLabel) {
            this.refs.bossHpLabel.node.active = false;
        }
    }

    private raiseOverlayNodes(): void {
        if (this.worldRoot && this.worldRoot.parent === this.refs.root) {
            this.worldRoot.setSiblingIndex(0);
        }

        const splashNode = this.refs.root ? this.refs.root.getChildByName("sprite_splash") : null;
        const overlayNodes = [
            splashNode,
            this.refs.btnCode,
            this.refs.btnStart,
            this.refs.btnUpLayout,
            this.refs.btnBattleLayout,
            this.refs.heroProgressBar ? this.refs.heroProgressBar.node.parent : null,
            // this.refs.carProgressBar ? this.refs.carProgressBar.node.parent : null,
            this.refs.bossProgressBar ? this.refs.bossProgressBar.node.parent : null,
            this.refs.bossHpLabel ? this.refs.bossHpLabel.node : null,
        ];

        overlayNodes.forEach((node, index) => {
            if (!node) {
                return;
            }
            node.zIndex = 300 + index;
            if (node.parent === this.refs.root) {
                node.setSiblingIndex(this.refs.root.childrenCount - 1);
            }
        });

        if (this.uiRoot && this.uiRoot.parent === this.refs.root) {
            this.uiRoot.setSiblingIndex(this.refs.root.childrenCount - 1);
        }
    }

    private getNodeLocalDisplayHeight(node: cc.Node | null): number {
        if (!node) {
            return 0;
        }
        return (node.height || 0) * Math.abs(node.scaleY || 1);
    }

    private getNodeLocalDisplayWidth(node: cc.Node | null): number {
        if (!node) {
            return 0;
        }
        return (node.width || 0) * Math.abs(node.scaleX || 1);
    }

    private ensureMonsterHpLabel(hpRoot: cc.Node): cc.Label {
        let labelNode = hpRoot.getChildByName("HpLabel");
        if (!labelNode) {
            labelNode = new cc.Node("HpLabel");
            labelNode.parent = hpRoot;
            labelNode.setPosition(0, 0);
        }

        let label = labelNode.getComponent(cc.Label);
        if (!label) {
            label = labelNode.addComponent(cc.Label);
            label.fontSize = 1;
            label.lineHeight = 1;
        }

        return label;
    }

    private getBossAnchorAlignedY(node: cc.Node | null): number {
        const height = this.getNodeLocalDisplayHeight(node) || GameConfig.boss.height;
        const anchorY = node ? node.anchorY : 0.5;
        return GameConfig.world.bossY - (0.5 - anchorY) * height;
    }

    private updateShieldPresentation(): void {
        this.carViews.forEach((view, index) => {
            if (!view || !cc.isValid(view.node) || !view.shieldNode || !cc.isValid(view.shieldNode)) {
                return;
            }

            const shouldShow = this.context.getCarDefenseUnlocked(index) && this.context.getCarHp(index) > 0;
            const shieldNode = view.shieldNode;
            shieldNode.active = shouldShow;
            const shieldNodeAny = shieldNode as any;
            const shieldSpine = shieldNode.getComponent(sp.Skeleton);
            if (!shieldSpine) {
                return;
            }

            if (!shouldShow) {
                shieldSpine.paused = true;
                shieldNodeAny.__shieldStarted = false;
                return;
            }

            shieldSpine.paused = false;
            if (shieldNodeAny.__shieldStarted) {
                return;
            }

            shieldNodeAny.__shieldStarted = true;
            const defaultAnimation = shieldSpine.defaultAnimation;
            if (defaultAnimation) {
                shieldSpine.setAnimation(0, defaultAnimation, true);
            }
        });
    }

    private reparentKeepWorldTransform(node: cc.Node, newParent: cc.Node): void {
        const oldParent = node.parent;
        if (!oldParent) {
            node.parent = newParent;
            return;
        }
        const worldPosition = oldParent.convertToWorldSpaceAR(cc.v2(node.x, node.y));
        node.parent = newParent;
        const localPosition = newParent.convertToNodeSpaceAR(worldPosition);
        node.setPosition(localPosition.x, localPosition.y);
    }

    private applyUnlockPresentation(): void {
        const showUnlockedCars = this.context.sawCarUnlocked && this.context.sawCarAlive;
        const lift = showUnlockedCars ? this.carUnlockLift : 0;
        this.heroAliveY = this.heroBaseLocalY;
        this.heroDroppedY = this.heroBaseLocalY;
        if (this.refs.carBaseNode) {
            this.refs.carBaseNode.y = this.baseCarLocalY + lift;
            this.refs.carBaseNode.active = !showUnlockedCars;
        }
        const heroSpineOffset = showUnlockedCars ? this.carUnlockLift - this.carBaseNodeHeight : 0;
        if (this.refs.heroSpineNode) {
            this.refs.heroSpineNode.y = this.heroSpineLocalY + heroSpineOffset;
        }
        if (this.refs.heroProgressBar && this.refs.heroProgressBar.node.parent) {
            this.refs.heroProgressBar.node.parent.y = this.heroProgressLocalY + heroSpineOffset;
        }
    }

    private syncPrepareTaskLayout(): void {
        const layout = this.refs.btnUpLayout;
        if (!layout || !layout.parent) {
            return;
        }

        layout.setPosition(this.prepareLayoutBasePosition.x, this.prepareLayoutBasePosition.y);
        const targetCarIndex = Math.max(0, this.context.currentRound - 1);
        const targetPosition = this.getPrepareCarSlotPositionInTaskLayout(targetCarIndex);
        const offsetX = targetPosition.x - this.prepareBaseCarSlotPosition.x;
        const offsetY = targetPosition.y - this.prepareBaseCarSlotPosition.y;
        const targetNodeY = this.prepareTaskSharedBasePosition.y + offsetY;

        [
            this.refs.btnBuyCar,
            this.refs.btnUnlockSkill,
            this.refs.btnUpHurt,
            this.refs.btnUpHp,
            this.refs.btnUnlockDef,
        ].forEach((node) => {
            if (!node) {
                return;
            }
            node.setPosition(node.x, targetNodeY);
        });
    }

    private getPrepareCarSlotPositionInTaskLayout(carIndex: number): cc.Vec2 {
        const pointInWorldRoot = this.getPrepareCarSlotPositionInWorldRoot(carIndex);
        const parentNode = this.refs.btnUpLayout || this.refs.root;
        if (!this.worldRoot || !parentNode) {
            return pointInWorldRoot;
        }

        const pointInWorld = this.worldRoot.convertToWorldSpaceAR(pointInWorldRoot);
        return parentNode.convertToNodeSpaceAR(pointInWorld);
    }

    private getPrepareCarSlotPositionInWorldRoot(carIndex: number): cc.Vec2 {
        const normalizedIndex = Math.max(0, Math.floor(carIndex));
        const visualNode = this.getCarVisualNodeByIndex(normalizedIndex);
        if (visualNode) {
            return this.getNodePositionInWorldRoot(visualNode);
        }

        const anchorNode = this.refs.carNode;
        if (!anchorNode) {
            return cc.v2(0, 0);
        }

        const anchorPosition = this.getNodePositionInWorldRoot(anchorNode);
        return cc.v2(
            anchorPosition.x + normalizedIndex * this.carStackSpacingX,
            anchorPosition.y + normalizedIndex * this.carStackSpacingY,
        );
    }

    private rotateWheelNodes(deltaX: number): void {
        this.refs.wheelNodes.forEach((wheelNode) => {
            if (!wheelNode) {
                return;
            }

            const radius = Math.max(1, (wheelNode.height || wheelNode.width || 48) * 0.5);
            const deltaAngle = -(deltaX / (2 * Math.PI * radius)) * 360;
            wheelNode.angle += deltaAngle;
        });
    }

    private syncSceneBars(): void {
        if (this.refs.heroProgressBar) {
            this.refs.heroProgressBar.progress = this.context.playerMaxHp > 0
                ? this.context.playerHp / this.context.playerMaxHp
                : 0;
        }
        this.syncCarHpBars();
        if (this.refs.bossProgressBar) {
            this.refs.bossProgressBar.progress = 1;
        }
        if (this.refs.bossHpLabel) {
            this.refs.bossHpLabel.string = `${Math.ceil(this.bossHp)} / ${GameConfig.boss.hp}`;
        }
    }

    private getCarView(): CarPrefab | null {
        return this.getLeadCarView();
    }

    private getShieldNode(): cc.Node | null {
        const carView = this.getCarView();
        if (carView && carView.shieldNode && cc.isValid(carView.shieldNode)) {
            return carView.shieldNode;
        }
        // return this.refs.shieldNode && cc.isValid(this.refs.shieldNode) ? this.refs.shieldNode : null;
    }

    private ensureCarInstances(requiredCount: number): void {
        if (!this.carPrefab || !this.refs.carNode) {
            return;
        }

        while (this.carInstanceNodes.length < requiredCount) {
            const node = cc.instantiate(this.carPrefab);
            node.parent = this.refs.carNode;
            const view = node.getComponent(CarPrefab) || node.addComponent(CarPrefab);
            view.ensureRefs();
            this.carInstanceNodes.push(node);
            this.carViews.push(view);
        }
    }

    private syncCarPresentation(): void {
        if (this.refs.carNode) {
            this.refs.carNode.x = this.carLocalX;
            this.refs.carNode.y = this.carLocalY;
            this.refs.carNode.active = true;
        }

        const shouldShowCar = this.context.sawCarUnlocked && this.context.sawCarAlive;
        this.ensureCarInstances(this.context.sawCarCount);
        const aliveIndices = shouldShowCar ? this.context.getAliveCarIndices() : [];

        this.carInstanceNodes.forEach((node, index) => {
            const alivePosition = aliveIndices.indexOf(index);
            const isVisible = alivePosition >= 0;
            node.active = isVisible;
            if (!isVisible) {
                return;
            }
            node.setPosition(alivePosition * this.carStackSpacingX, alivePosition * this.carStackSpacingY);
        });

        this.carViews.forEach((view, index) => {
            const isVisible = aliveIndices.indexOf(index) >= 0;
            view.setCarVisible(isVisible);
            view.setSawVisible(isVisible && this.context.getCarSkillUnlocked(index));
            view.setShieldVisible(isVisible && this.context.getCarDefenseUnlocked(index));
            view.setHpVisible(isVisible);
            const maxHp = this.context.getCarMaxHp(index);
            view.setHpProgress(maxHp > 0 ? this.context.getCarHp(index) / maxHp : 0);
        });
    }

    private getHeroSpine(): sp.Skeleton | null {
        return this.refs.heroSpineNode ? this.refs.heroSpineNode.getComponent(sp.Skeleton) : null;
    }

    private getLeadCarVisualNode(): cc.Node | null {
        const leadCarIndex = this.context.getLeadCarIndex();
        if (leadCarIndex < 0 || leadCarIndex >= this.carInstanceNodes.length) {
            return null;
        }
        const node = this.carInstanceNodes[leadCarIndex];
        return node && cc.isValid(node) && node.active ? node : null;
    }

    private getLeadCarView(): CarPrefab | null {
        const leadCarIndex = this.context.getLeadCarIndex();
        if (leadCarIndex < 0 || leadCarIndex >= this.carViews.length) {
            return null;
        }
        const view = this.carViews[leadCarIndex];
        if (!view || !cc.isValid(view.node) || !view.node.active) {
            return null;
        }
        view.ensureRefs();
        return view;
    }

    private syncCarHpBars(): void {
        this.carViews.forEach((view, index) => {
            if (!view || !cc.isValid(view.node)) {
                return;
            }
            const isAlive = this.context.getCarHp(index) > 0;
            view.setHpVisible(isAlive);
            if (isAlive) {
                const maxHp = this.context.getCarMaxHp(index);
                view.setHpProgress(maxHp > 0 ? this.context.getCarHp(index) / maxHp : 0);
            }
        });
    }

    private applyHeroCarStackOffset(): void {
        const activeCarCount = this.context.sawCarUnlocked && this.context.sawCarAlive
            ? Math.max(1, this.context.getAliveCarCount())
            : 0;
        const stackedOffset = activeCarCount > 0 ? (activeCarCount - 1) * this.carStackSpacingY : 0;
        const unlockedOffset = activeCarCount > 0 ? this.carUnlockLift - this.carBaseNodeHeight : 0;
        const totalOffset = unlockedOffset + stackedOffset;

        if (this.refs.heroSpineNode) {
            this.refs.heroSpineNode.y = this.heroSpineLocalY + totalOffset;
        }
        if (this.refs.heroProgressBar && this.refs.heroProgressBar.node.parent) {
            this.refs.heroProgressBar.node.parent.y = this.heroProgressLocalY + totalOffset;
        }
    }

    private getMonsterSpine(node: cc.Node | null): sp.Skeleton | null {
        if (!node) {
            return null;
        }
        const spineNode = node.getChildByName("NodeSpine");
        return spineNode ? spineNode.getComponent(sp.Skeleton) : null;
    }

    private playSkeletonLoop(spine: sp.Skeleton, animationName: string | null): void {
        if (!animationName) {
            return;
        }
        spine.clearTracks();
        spine.setAnimation(0, animationName, true);
    }

    private playSkeletonOnce(spine: sp.Skeleton, animationName: string, fallbackAnimation: string | null): void {
        const onceAnimation = this.findSkeletonAnimationName(spine, [animationName]);
        if (!onceAnimation) {
            if (fallbackAnimation) {
                this.playSkeletonLoop(spine, fallbackAnimation);
            }
            return;
        }

        spine.clearTracks();
        spine.setAnimation(0, onceAnimation, false);
        if (fallbackAnimation) {
            spine.addAnimation(0, fallbackAnimation, true, 0);
        }
    }

    private getDefaultHeroLoopAnimation(spine: sp.Skeleton): string | null {
        return this.findSkeletonAnimationName(spine, [spine.defaultAnimation, "idle", "walk"]);
    }

    private getDefaultMonsterLoopAnimation(spine: sp.Skeleton): string | null {
        return this.findSkeletonAnimationName(spine, [spine.defaultAnimation, "walk", "idle"]);
    }

    private findSkeletonAnimationName(spine: sp.Skeleton, names: Array<string | null | undefined>): string | null {
        for (const name of names) {
            if (!name) {
                continue;
            }
            if (spine.findAnimation(name)) {
                return name;
            }
        }
        return null;
    }
}
