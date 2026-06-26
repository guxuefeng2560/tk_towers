import GameFlowController from "./Core/GameFlowController";
import GameRuntime from "./Core/GameRuntime";
import { GamePhase } from "./Core/GameDefines";
import { distance } from "./Util/MathUtil";
import { SceneRefs } from "./Core/SceneRefs";
import { AudioID } from "./global/TD_Constants";
import AudioManager from "./Framework/audio/TD_AudioManager";
import ResModuleManager from "./Framework/moduleManager/TD_ResModuleManager";
import Global from "./global/TD_Global";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TowerDefenseScene extends cc.Component {
    private activeAimTouchId: number | null = null;
    @property(cc.Node)
    NodeCamera: cc.Node = null;

    @property(cc.Node)
    NodeFarMap: cc.Node = null;

    @property([cc.Node])
    NodeBgArr: cc.Node[] = [];

    @property(cc.Node)
    NodeHero: cc.Node = null;

    @property(cc.Node)
    NodeFlag: cc.Node = null;

    @property(cc.Node)
    NodeSan: cc.Node = null;

    @property(cc.Node)
    SpineHero: cc.Node = null;

    @property(cc.Node)
    SpineBow: cc.Node = null;

    @property(cc.Node)
    NodeShootLine: cc.Node = null;

    @property(cc.Node)
    NodeCar0: cc.Node = null;

    @property(cc.Node)
    NodeCar: cc.Node = null;

    @property([cc.Node])
    NodeSweelArr: cc.Node[] = [];

    @property(cc.ProgressBar)
    ProgressHeroBar: cc.ProgressBar = null;

    @property(cc.Node)
    NodeBoss: cc.Node = null;

    @property(cc.Node)
    NodeMonster: cc.Node = null;

    @property(cc.ProgressBar)
    ProgressBossBar: cc.ProgressBar = null;

    @property(cc.Label)
    LabelBossHp: cc.Label = null;

    @property(cc.Node)
    BtnCode: cc.Node = null;

    /** 解锁升级按钮节点 */
    @property(cc.Node)
    BtnUpLayout: cc.Node = null;

    /** 购买车 */
    @property(cc.Node)
    BtnBuyCar: cc.Node = null;

    /** 解锁技能 */
    @property(cc.Node)
    BtnUnlockSkill: cc.Node = null;

    /** 提升技能伤害 */
    @property(cc.Node)
    BtnUpHurt: cc.Node = null;

    @property(cc.Label)
    LabelHurt: cc.Label = null;

    @property([cc.Node])
    NodeHurtPointVec: cc.Node[] = [];

    /** 提升血量 */
    @property(cc.Node)
    BtnUpHp: cc.Node = null;

    @property(cc.Label)
    LabelHp: cc.Label = null;

    @property([cc.Node])
    NodeHpPointVec: cc.Node[] = [];

    /** 解锁护盾 */
    @property(cc.Node)
    BtnUnlockDef: cc.Node = null;

    /** 提升能量恢复 */
    @property(cc.Node)
    BtnUpEnegy: cc.Node = null;

    @property(cc.Label)
    LabelEnegyRate: cc.Label = null;

    /** 战斗状态节点 */
    @property(cc.Node)
    BtnBattleLayout: cc.Node = null;
    
    /** 能量恢复进度图片 */
    @property(cc.ProgressBar)
    ImgEnegyProgress: cc.ProgressBar = null;

    @property(cc.Label)
    LabelEnegy: cc.Label = null;

    @property(cc.Label)
    LabelBombCost: cc.Label = null;

    @property(cc.Label)
    LabelSawtoothCost: cc.Label = null;

    @property(cc.Node)
    BtnAnswer1: cc.Node = null;

    @property(cc.Node)
    BtnAnswer2: cc.Node = null;

    @property(cc.Node)
    BtnStart: cc.Node = null;

    @property(cc.Node)
    Nodebuff: cc.Node = null;

    /** 战力显示 */
    @property(cc.ProgressBar)
    PowerBar: cc.ProgressBar = null;

    @property(cc.Label)
    LabelPower: cc.Label = null;

    /** 行驶进度节点 */
    @property(cc.Node)
    NodeBattleProgress: cc.Node = null;

    /** 行驶进度 */
    @property(cc.ProgressBar)
    BattleBar: cc.ProgressBar = null;

    /** boss的节点（包括巢穴） */
    @property([cc.Node])
    NodeBossVec: cc.Node[] = [];


    private runtime: GameRuntime = null;
    private flowController: GameFlowController = null;

    protected onLoad(): void {
        const getPrepareChild = (name: string): cc.Node | null => (
            this.BtnUpLayout ? this.BtnUpLayout.getChildByName(name) : null
        );
        const refs: SceneRefs = {
            root: this.node,
            farMapLayout: this.NodeFarMap,
            nodeCamera: this.NodeCamera,
            bgNodes: this.NodeBgArr,
            heroNode: this.NodeHero,
            flagNode: this.NodeFlag,
            sanNode: this.NodeSan,
            heroSpineNode: this.SpineHero,
            bowSpineNode: this.SpineBow,
            shootLineNode: this.NodeShootLine,
            carBaseNode: this.NodeCar0,
            carNode: this.NodeCar,
            wheelNodes: this.NodeSweelArr,
            heroProgressBar: this.ProgressHeroBar,
            bossNode: this.NodeBoss,
            monsterRoot: this.NodeMonster,
            bossProgressBar: this.ProgressBossBar,
            bossHpLabel: this.LabelBossHp,
            btnCode: this.BtnCode,
            btnStart: this.BtnStart,
            btnUpLayout: this.BtnUpLayout,
            btnBuyCar: this.BtnBuyCar,
            btnUnlockSkill: this.BtnUnlockSkill,
            btnUpHurt: this.BtnUpHurt,
            hurtPointNodes: this.NodeHurtPointVec,
            btnUpHp: this.BtnUpHp,
            hpPointNodes: this.NodeHpPointVec,
            btnUnlockDef: this.BtnUnlockDef,
            btnUpEnergy: this.BtnUpEnegy,
            btnBattleLayout: this.BtnBattleLayout,
            labelHurt: this.LabelHurt,
            labelHp: this.LabelHp,
            labelEnergyRate: this.LabelEnegyRate,
            powerBar: this.PowerBar,
            labelPower: this.LabelPower,
            nodeBattleProgress: this.NodeBattleProgress,
            battleBar: this.BattleBar,
            // bossIconNodes: this.NodeBossIconVec,
            imgEnergyProgress: this.ImgEnegyProgress,
            labelEnergy: this.LabelEnegy,
            labelBombCost: this.LabelBombCost,
            labelSawtoothCost: this.LabelSawtoothCost,
            btnAnswer1: this.BtnAnswer1,
            btnAnswer2: this.BtnAnswer2,
        };

        this.runtime = new GameRuntime(refs);
        this.runtime.initializeScene();
        this.setShootLineVisible(false);
        this.flowController = new GameFlowController(this.runtime, this);
        this.flowController.initialize();
        this.registerTouchEvents();

        ResModuleManager.init(Global.game_id, Global.game_id);
        AudioManager.getInstance();
        this.scheduleOnce(function() {
            AudioManager.getInstance().playMusic(AudioID.AudioID_BGM_BATTLE);
        }, 1.0)
    }

    protected update(dt: number): void {
        if (this.flowController) {
            this.flowController.update(dt);
        }
    }

    protected onDestroy(): void {
        this.unregisterTouchEvents();
        if (this.flowController) {
            this.flowController.destroy();
        }
    }

    private registerTouchEvents(): void {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    private unregisterTouchEvents(): void {
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    private onTouchStart(event: cc.Event.EventTouch): void {
        if (!this.shouldHandleAimTouch()) {
            return;
        }
        this.activeAimTouchId = event.getID();
        this.updateForcedAimDirection(event);
    }

    private onTouchEnd(event: cc.Event.EventTouch): void {
        if (this.activeAimTouchId !== event.getID()) {
            return;
        }
        this.clearForcedAimDirection();
    }

    private onTouchMove(event: cc.Event.EventTouch): void {
        if (this.activeAimTouchId !== event.getID() || !this.shouldHandleAimTouch()) {
            return;
        }
        this.updateForcedAimDirection(event);
    }

    private onTouchCancel(event: cc.Event.EventTouch): void {
        if (this.activeAimTouchId !== event.getID()) {
            return;
        }
        this.clearForcedAimDirection();
    }

    private shouldHandleAimTouch(): boolean {
        return !!this.runtime
            && (this.runtime.context.phase === GamePhase.Battle || this.runtime.context.phase === GamePhase.Boss);
    }

    private updateForcedAimDirection(event: cc.Event.EventTouch): void {
        if (!this.runtime || !this.runtime.worldRoot) {
            return;
        }
        const firePosition = this.runtime.getHeroFireWorldPosition();
        const touchLocation = event.getLocation();
        const touchInWorld = this.runtime.worldRoot.convertToNodeSpaceAR(touchLocation);
        if (touchInWorld.x <= firePosition.x) {
            this.clearForcedAimDirection();
            return;
        }
        let direction = cc.v2(touchInWorld.x - firePosition.x, touchInWorld.y - firePosition.y);
        if (direction.magSqr() <= 1) {
            direction = cc.v2(1, 0);
        } else {
            direction = direction.normalize();
        }
        this.runtime.forcedAimDirection = direction;
        this.runtime.forcedAimTargetPosition = cc.v2(touchInWorld.x, touchInWorld.y);
        this.runtime.forcedAimDistance = distance(firePosition, touchInWorld);
        this.updateShootLine(firePosition, touchInWorld);
    }

    private clearForcedAimDirection(): void {
        if (this.runtime) {
            this.runtime.forcedAimDirection = null;
            this.runtime.forcedAimTargetPosition = null;
            this.runtime.forcedAimDistance = 0;
        }
        this.setShootLineVisible(false);
        this.activeAimTouchId = null;
    }

    private updateShootLine(from: cc.Vec2, to: cc.Vec2): void {
        if (!this.NodeShootLine) {
            return;
        }

        const delta = cc.v2(to.x - from.x, to.y - from.y);
        const length = delta.mag()/this.NodeShootLine.parent.scale;
        const shootLineParent = this.NodeShootLine.parent;
        const fromLocal = shootLineParent && this.runtime && this.runtime.worldRoot
            ? shootLineParent.convertToNodeSpaceAR(this.runtime.worldRoot.convertToWorldSpaceAR(from))
            : from;
        this.NodeShootLine.active = true;
        this.NodeShootLine.x = fromLocal.x;
        this.NodeShootLine.y = fromLocal.y;
        this.NodeShootLine.height = Math.max(1, length);
        this.NodeShootLine.angle = -Math.atan2(delta.x, delta.y) * 180 / Math.PI;
    }

    private setShootLineVisible(visible: boolean): void {
        if (this.NodeShootLine) {
            this.NodeShootLine.active = visible;
        }
    }
}
