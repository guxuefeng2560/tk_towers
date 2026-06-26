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
    public readonly root: cc.Node;

    private readonly refs: SceneRefs;
    private readonly bombButton: cc.Node | null;
    private readonly sawButton: cc.Node | null;
    private readonly answer1Button: cc.Node | null;
    private readonly answer2Button: cc.Node | null;
    private active = false;
    private lastData: BattleViewData | null = null;

    public constructor(refs: SceneRefs, target: any, onRoller: () => void, onBomb: () => void) {
        this.refs = refs;
        this.root = refs.btnBattleLayout;
        this.bombButton = this.root ? this.root.getChildByName("BtnBomb") : null;
        this.sawButton = this.root ? this.root.getChildByName("BtnSawtooth") : null;
        this.answer1Button = refs.btnAnswer1;
        this.answer2Button = refs.btnAnswer2;
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
            this.setNodeGroupActive(this.answer1Button, false);
            this.setNodeGroupActive(this.answer2Button, false);
            this.lastData = null;
            return;
        }
        this.setNodeGroupActive(this.answer1Button, false);
        this.setNodeGroupActive(this.answer2Button, false);
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
        // this.setCostVisibleIfChanged(this.refs.labelBombCost, showSkillSwitch && bombEnergyEnough);
        // this.setCostVisibleIfChanged(this.refs.labelSawtoothCost, showSkillSwitch && sawSkillVisible && rollerEnergyEnough);
        this.setNodeGroupActiveIfChanged(this.answer1Button, showSkillSwitch && !bombEnergyEnough);
        this.setNodeGroupActiveIfChanged(this.answer2Button, showSkillSwitch && sawSkillVisible && !rollerEnergyEnough);

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

    private updateBossIcons(completedRounds: number): void {
        const iconNodes = this.refs.bossIconNodes || [];
        iconNodes.forEach((node, index) => {
            if (!node) {
                return;
            }
            node.active = index >= completedRounds;
        });
    }
}
