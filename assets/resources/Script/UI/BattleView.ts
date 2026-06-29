import { GameConfig } from "../Core/GameConfig";
import { GamePhase } from "../Core/GameDefines";
import { SceneRefs } from "../Core/SceneRefs";

export interface BattleViewData {
    playerHp: number;
    playerMaxHp: number;
    energy: number;
    energyMax: number;
    battleProgress: number;
    completedRounds: number;
    showBattleProgress: boolean;
    phase: GamePhase;
    sawUnlocked: boolean;
    sawAlive: boolean;
    sawHp: number;
    sawMaxHp: number;
    showBoss: boolean;
    bossHp: number;
    bossMaxHp: number;
    infoText: string;
    debugText: string;
    rollerSkillVisible: boolean;
    canUseRoller: boolean;
    canUseBomb: boolean;
    pauseLabel: string;
}

export default class BattleView {
    private static readonly ACTION_BUTTON_WIDTH = 156;
    private static readonly ACTION_BUTTON_HEIGHT = 56;
    private static readonly ACTION_BUTTON_RADIUS = 18;
    private static readonly SPEED_BUTTON_LABEL = "\u52a0\u901f+100";

    public readonly root: cc.Node;

    private readonly refs: SceneRefs;
    private readonly bombButton: cc.Node | null;
    private readonly sawButton: cc.Node | null;
    private readonly answer1Button: cc.Node | null;
    private readonly answer2Button: cc.Node | null;
    private readonly answer1LabelNode: cc.Node | null;
    private readonly answer2LabelNode: cc.Node | null;
    private readonly speedButton: cc.Node | null;
    private active = false;
    private lastData: BattleViewData | null = null;

    public constructor(refs: SceneRefs, target: any, onRoller: () => void, onBomb: () => void, onSpeedUp: () => void) {
        this.refs = refs;
        this.root = refs.btnBattleLayout;
        this.bombButton = this.root ? this.root.getChildByName("BtnBomb") : null;
        this.sawButton = this.root ? this.root.getChildByName("layout").getChildByName("BtnSawtooth") : null;
        this.answer1Button = refs.btnAnswer1;
        this.answer2Button = refs.btnAnswer2;
        this.answer1LabelNode = this.findAnswerLabelNode(this.answer1Button);
        this.answer2LabelNode = this.findAnswerLabelNode(this.answer2Button);
        this.speedButton = this.createSpeedButton(target, onSpeedUp);
        this.disableOverlayButtonInteraction(this.answer1Button);
        this.disableOverlayButtonInteraction(this.answer2Button);

        if (this.bombButton) {
            this.bombButton.on(cc.Node.EventType.TOUCH_END, onBomb, target);
        }
        if (this.sawButton) {
            this.sawButton.on(cc.Node.EventType.TOUCH_END, onRoller, target);
        }
    }

    public setActive(active: boolean): void {
        this.active = active;
        if (this.root) {
            this.root.active = active;
        }
        if (!active) {
            this.setNodeGroupActive(this.refs.heroProgressBar ? this.refs.heroProgressBar.node.parent : null, false);
            // this.setNodeGroupActive(this.refs.carProgressBar ? this.refs.carProgressBar.node.parent : null, false);
            this.setNodeGroupActive(this.refs.bossProgressBar ? this.refs.bossProgressBar.node.parent : null, false);
            this.setNodeGroupActive(this.refs.bossHpLabel ? this.refs.bossHpLabel.node : null, false);
            this.setNodeGroupActive(this.refs.nodeBattleProgress, false);
            // this.setNodeGroupActive(this.answer1Button, false);
            // this.setNodeGroupActive(this.answer2Button, false);
            // this.setNodeGroupActive(this.answer1LabelNode, false);
            // this.setNodeGroupActive(this.answer2LabelNode, false);
            this.setNodeGroupActive(this.speedButton, false);
            this.lastData = null;
            return;
        }
        // this.setNodeGroupActive(this.answer1Button, true);
        // this.setNodeGroupActive(this.answer2Button, true);
        // this.setNodeGroupActive(this.answer1LabelNode, false);
        // this.setNodeGroupActive(this.answer2LabelNode, false);
        this.updateSpeedButtonPosition();
    }

    public render(data: BattleViewData): void {
        if (!this.active) {
            return;
        }

        if (this.refs.heroProgressBar) {
            this.setNodeGroupActiveIfChanged(this.refs.heroProgressBar.node.parent, true);
            const heroProgress = data.playerMaxHp > 0 ? Math.max(0, Math.min(1, data.playerHp / data.playerMaxHp)) : 0;
            if (!this.lastData || this.lastData.playerHp !== data.playerHp || this.lastData.playerMaxHp !== data.playerMaxHp) {
                this.refs.heroProgressBar.progress = heroProgress;
            }
        }

        // if (this.refs.carProgressBar) {
        //     this.setNodeGroupActive(this.refs.carProgressBar.node.parent, data.sawUnlocked && data.sawAlive);
        //     this.refs.carProgressBar.progress = data.sawMaxHp > 0 ? Math.max(0, Math.min(1, data.sawHp / data.sawMaxHp)) : 0;
        // }

        if (this.refs.bossProgressBar) {
            this.setNodeGroupActiveIfChanged(this.refs.bossProgressBar.node.parent, data.showBoss);
            if (!this.lastData || this.lastData.bossHp !== data.bossHp || this.lastData.bossMaxHp !== data.bossMaxHp) {
                this.refs.bossProgressBar.progress = data.bossMaxHp > 0 ? Math.max(0, Math.min(1, data.bossHp / data.bossMaxHp)) : 0;
            }
        }

        if (this.refs.bossHpLabel) {
            this.setNodeGroupActiveIfChanged(this.refs.bossHpLabel.node, data.showBoss);
            const bossHpText = `${Math.ceil(data.bossHp)} / ${data.bossMaxHp}`;
            if (!this.lastData || this.lastData.bossHp !== data.bossHp || this.lastData.bossMaxHp !== data.bossMaxHp) {
                this.refs.bossHpLabel.string = bossHpText;
            }
        }

        if (this.refs.nodeBattleProgress) {
            this.setNodeGroupActiveIfChanged(this.refs.nodeBattleProgress, data.showBattleProgress);
        }
        if (this.refs.battleBar) {
            if (!this.lastData || this.lastData.battleProgress !== data.battleProgress) {
                this.refs.battleBar.progress = Math.max(0, Math.min(1, data.battleProgress));
            }
        }
        if (!this.lastData || this.lastData.completedRounds !== data.completedRounds) {
            this.updateBossIcons(data.completedRounds);
        }

        if (this.refs.labelEnergy) {
            const energyText = `${Math.floor(data.energy)}`;
            if (!this.lastData || Math.floor(this.lastData.energy) !== Math.floor(data.energy)) {
                this.refs.labelEnergy.string = energyText;
            }
        }

        if (this.refs.labelBombCost && !this.lastData) {
            this.refs.labelBombCost.string = `${GameConfig.skill.bomb.cost}`;
        }

        if (this.refs.labelSawtoothCost && !this.lastData) {
            this.refs.labelSawtoothCost.string = `${GameConfig.skill.roller.cost}`;
        }

        if (this.refs.imgEnergyProgress) {
            let ratio = 0;
            if (data.energyMax > 0) {
                if (data.energy >= data.energyMax) {
                    ratio = 1;
                } else {
                    ratio = data.energy - Math.floor(data.energy);
                }
            }
            if (!this.lastData || this.lastData.energy !== data.energy || this.lastData.energyMax !== data.energyMax) {
                this.refs.imgEnergyProgress.progress = Math.max(0, Math.min(1, ratio));
            }
        }

        const bombEnergyEnough = data.energy >= GameConfig.skill.bomb.cost;
        const sawSkillVisible = data.rollerSkillVisible;
        const rollerEnergyEnough = data.energy >= GameConfig.skill.roller.cost;
        const showSkillSwitch = data.phase !== GamePhase.QuestionPause;
        this.setCostVisibleIfChanged(this.refs.labelBombCost, showSkillSwitch && bombEnergyEnough);
        this.setCostVisibleIfChanged(this.refs.labelSawtoothCost,  sawSkillVisible && rollerEnergyEnough);
        this.setNodeGroupActiveIfChanged(this.answer1Button, true);
        this.setNodeGroupActiveIfChanged(this.answer2Button, true);
        this.setNodeGroupActiveIfChanged(this.answer1LabelNode, !bombEnergyEnough);
        this.setNodeGroupActiveIfChanged(this.answer2LabelNode, sawSkillVisible && !rollerEnergyEnough);
        this.setNodeGroupActiveIfChanged(this.speedButton, data.phase === GamePhase.Battle || data.phase === GamePhase.Boss || data.phase === GamePhase.NormalPause);
        this.updateSpeedButtonPosition();

        if (this.bombButton) {
            const bombOpacity = data.canUseBomb ? 255 : 135;
            if (this.bombButton.opacity !== bombOpacity) {
                this.bombButton.opacity = bombOpacity;
            }
        }

        if (this.sawButton) {
            this.setNodeGroupActiveIfChanged(this.sawButton, data.rollerSkillVisible);
            if (this.sawButton.active) {
                const sawOpacity = data.canUseRoller ? 255 : 135;
                if (this.sawButton.opacity !== sawOpacity) {
                    this.sawButton.opacity = sawOpacity;
                }
            }
        }

        this.lastData = { ...data };
    }

    private setNodeGroupActive(node: cc.Node | null, active: boolean): void {
        if (node) {
            node.active = active;
        }
    }

    private setNodeGroupActiveIfChanged(node: cc.Node | null, active: boolean): void {
        if (node && node.active !== active) {
            node.active = active;
        }
    }

    private setCostVisible(label: cc.Label | null, active: boolean): void {
        if (!label) {
            return;
        }
        label.node.active = active;
        if (label.node.parent) {
            label.node.parent.active = active;
        }
    }

    private setCostVisibleIfChanged(label: cc.Label | null, active: boolean): void {
        if (!label) {
            return;
        }
        if (label.node.active !== active) {
            label.node.active = active;
        }
        if (label.node.parent && label.node.parent.active !== active) {
            label.node.parent.active = active;
        }
    }

    private disableOverlayButtonInteraction(node: cc.Node | null): void {
        if (!node) {
            return;
        }
        const button = node.getComponent(cc.Button);
        if (button) {
            button.enabled = false;
            button.interactable = false;
        }
    }

    private findAnswerLabelNode(node: cc.Node | null): cc.Node | null {
        if (!node) {
            return null;
        }
        return node.getChildByName("label");
    }

    private createSpeedButton(target: any, onSpeedUp: () => void): cc.Node | null {
        if (!this.refs.root) {
            return null;
        }

        const buttonNode = new cc.Node("BtnBattleSpeedUp");
        buttonNode.parent = this.refs.root;
        buttonNode.setContentSize(BattleView.ACTION_BUTTON_WIDTH, BattleView.ACTION_BUTTON_HEIGHT);
        buttonNode.zIndex = 650;

        const graphics = buttonNode.addComponent(cc.Graphics);
        graphics.fillColor = new cc.Color(40, 52, 76, 220);
        graphics.roundRect(
            -BattleView.ACTION_BUTTON_WIDTH * 0.5,
            -BattleView.ACTION_BUTTON_HEIGHT * 0.5,
            BattleView.ACTION_BUTTON_WIDTH,
            BattleView.ACTION_BUTTON_HEIGHT,
            BattleView.ACTION_BUTTON_RADIUS,
        );
        graphics.fill();
        graphics.lineWidth = 2;
        graphics.strokeColor = new cc.Color(255, 232, 180, 255);
        graphics.roundRect(
            -BattleView.ACTION_BUTTON_WIDTH * 0.5,
            -BattleView.ACTION_BUTTON_HEIGHT * 0.5,
            BattleView.ACTION_BUTTON_WIDTH,
            BattleView.ACTION_BUTTON_HEIGHT,
            BattleView.ACTION_BUTTON_RADIUS,
        );
        graphics.stroke();

        const labelNode = new cc.Node("Label");
        labelNode.parent = buttonNode;
        const label = labelNode.addComponent(cc.Label);
        label.string = BattleView.SPEED_BUTTON_LABEL;
        label.fontSize = 24;
        label.lineHeight = 28;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        labelNode.color = new cc.Color(255, 244, 215, 255);

        buttonNode.on(cc.Node.EventType.TOUCH_END, onSpeedUp, target);
        buttonNode.active = false;
        return buttonNode;
    }

    private updateSpeedButtonPosition(): void {
        if (!this.speedButton) {
            return;
        }

        const size = cc.winSize;
        this.speedButton.setPosition(size.width / 2 - 110, -size.height / 2 + 56);
    }

    private updateBossIcons(completedRounds: number): void {
        
    }
}
