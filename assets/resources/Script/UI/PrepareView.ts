import { PrepareTaskKey } from "../Core/GameDefines";
import { SceneRefs } from "../Core/SceneRefs";
import AudioManager from "../Framework/audio/TD_AudioManager";
import { AudioID } from "../global/TD_Constants";
import { formatCompactK } from "../Util/NumberFormatUtil";

export interface PrepareTaskViewState {
    key: PrepareTaskKey;
    progress: number;
    required: number;
    visible: boolean;
    completed: boolean;
    current: boolean;
}

export interface PrepareViewData {
    showStartButton: boolean;
    showSkipButton: boolean;
    visibleTaskKey: PrepareTaskKey | null;
    currentPowerPercent?: number;
    totalPowerPercent?: number;
    totalCorrectCount?: number;
    totalQuestionCount?: number;
    powerPercent: number;
    hurtValueText: string;
    hpValueText: string;
    energyRateText: string;
    tasks: PrepareTaskViewState[];
}

export default class PrepareView {
    private static readonly START_BUTTON_MIN_SCALE = 0.95;
    private static readonly START_BUTTON_MAX_SCALE = 1.05;
    private static readonly ACTION_BUTTON_WIDTH = 156;
    private static readonly ACTION_BUTTON_HEIGHT = 56;
    private static readonly ACTION_BUTTON_RADIUS = 18;
    private static readonly ACTION_BUTTON_GAP = 20;
    private static readonly SKIP_BUTTON_LABEL = "\u8df3\u8fc7\u7b54\u9898";
    private static readonly TASK_NODE_SHOW_SCALE = 1;
    private static readonly TASK_NODE_HIDE_SCALE = 0.2;
    private static readonly TASK_NODE_ANIM_DURATION = 0.12;

    public readonly root: cc.Node | null;

    private readonly refs: SceneRefs;
    private readonly startButton: cc.Node | null;
    private readonly taskNodes: Record<PrepareTaskKey, cc.Node | null>;
    private readonly taskLabels: Record<PrepareTaskKey, cc.Label | null>;
    private readonly skipButton: cc.Node | null;
    private codeFloatLabel: cc.Label | null = null;
    private active = false;
    private taskVisibilityInitialized = false;
    private currentVisibleTaskKey: PrepareTaskKey | null = null;
    private taskTransitionToken = 0;

    public constructor(
        refs: SceneRefs,
        target: any,
        onStartBattle: () => void,
        onSkipPrepare: () => void,
    ) {
        this.refs = refs;
        this.root = refs.btnUpLayout;
        this.startButton = refs.btnStart;
        this.taskNodes = {
            [PrepareTaskKey.BuyCar]: refs.btnBuyCar,
            [PrepareTaskKey.UnlockSkill]: refs.btnUnlockSkill,
            [PrepareTaskKey.Hurt]: refs.btnUpHurt,
            [PrepareTaskKey.Hp]: refs.btnUpHp,
            [PrepareTaskKey.UnlockDef]: refs.btnUnlockDef,
            [PrepareTaskKey.Energy]: refs.btnUpEnergy,
        };
        this.taskLabels = {
            [PrepareTaskKey.BuyCar]: this.findInnerLabel(refs.btnBuyCar),
            [PrepareTaskKey.UnlockSkill]: this.findInnerLabel(refs.btnUnlockSkill),
            [PrepareTaskKey.Hurt]: refs.labelHurt,
            [PrepareTaskKey.Hp]: refs.labelHp,
            [PrepareTaskKey.UnlockDef]: this.findInnerLabel(refs.btnUnlockDef),
            [PrepareTaskKey.Energy]: refs.labelEnergyRate,
        };
        this.skipButton = this.createSkipButton(target, onSkipPrepare);

        if (this.startButton) {
            this.startButton.on(cc.Node.EventType.TOUCH_END, () => {
                AudioManager.getInstance().playSFX(AudioID.AudioID_Btn_Click);
                onStartBattle();
            }, target);
        }
        if (this.refs.btnCode) {
            this.refs.btnCode.active = true;
        }
    }

    public setActive(active: boolean): void {
        this.active = active;
        if (this.root) {
            this.root.active = active;
        }
        if (!active) {
            this.resetTaskVisibility(null);
        }
        if (this.startButton) {
            this.stopStartButtonBreathing();
            this.startButton.active = false;
        }
        if (this.skipButton) {
            this.skipButton.active = false;
        }
        if (this.refs.btnCode) {
            this.refs.btnCode.active = true;
        }
        if (this.refs.powerBar) {
            this.refs.powerBar.node.active = false;
        }
    }

    public render(data: PrepareViewData, onTaskVisibilitySettled?: () => void): void {
        const showPrepareLayout = this.active && !data.showStartButton;
        if (this.root) {
            this.root.active = showPrepareLayout;
        }
        if (showPrepareLayout) {
            this.syncTaskVisibility(data.visibleTaskKey, onTaskVisibilitySettled);
        } else {
            this.resetTaskVisibility(null);
            if (onTaskVisibilitySettled) {
                onTaskVisibilitySettled();
            }
        }
        if (this.refs.btnCode) {
            this.refs.btnCode.active = true;
        }
        if (this.refs.powerBar) {
            this.refs.powerBar.progress = Math.max(0, Math.min(1, data.powerPercent / 100));
        }
        if (this.refs.labelPower) {
            this.refs.labelPower.string = `${this.formatPercent(this.resolveCurrentPowerPercent(data))}`;
        }
        if (this.refs.labelHurt) {
            this.refs.labelHurt.string = data.hurtValueText;
        }
        if (this.refs.labelHp) {
            this.refs.labelHp.string = formatCompactK(data.hpValueText);
        }
        if (this.refs.labelEnergyRate) {
            this.refs.labelEnergyRate.string = data.energyRateText;
        }

        if (this.skipButton) {
            this.skipButton.active = this.active && data.showSkipButton;
            this.updateSkipButtonPosition();
        }

        data.tasks.forEach((task) => {
            this.updateTaskNode(task);
        });

        if (this.startButton) {
            this.startButton.active = this.active && data.showStartButton;
            this.startButton.opacity = data.showStartButton ? 255 : 0;
            if (this.startButton.active) {
                this.playStartButtonBreathing();
            } else {
                this.stopStartButtonBreathing();
            }
        }
        if (this.refs.powerBar) {
            this.refs.powerBar.node.active = this.active;
        }
    }

    public getTaskAnchor(taskKey: PrepareTaskKey | null): cc.Node | null {
        if (!taskKey) {
            return null;
        }
        return this.taskNodes[taskKey] || null;
    }

    public getCodeAnchor(): cc.Node | null {
        return this.refs.btnCode;
    }

    public playCodeGain(): void {
        if (!this.refs.root || !this.refs.btnCode) {
            return;
        }

        if (!this.codeFloatLabel) {
            const labelNode = new cc.Node("PrepareWrongFloat");
            labelNode.parent = this.refs.root;
            labelNode.setContentSize(80, 32);
            this.codeFloatLabel = labelNode.addComponent(cc.Label);
            this.codeFloatLabel.fontSize = 24;
            this.codeFloatLabel.lineHeight = 28;
            this.codeFloatLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            this.codeFloatLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
        }

        const node = this.codeFloatLabel.node;
        node.stopAllActions();
        node.active = true;
        node.color = new cc.Color(255, 220, 80, 255);
        node.opacity = 255;
        node.scale = 0.8;
        node.setPosition(this.refs.btnCode.x, this.refs.btnCode.y + 50);
        this.codeFloatLabel.string = "+1";

        node.runAction(
            cc.sequence(
                cc.spawn(
                    cc.moveBy(0.45, 0, 48).easing(cc.easeSineOut()),
                    cc.scaleTo(0.2, 1),
                    cc.fadeOut(0.45),
                ),
                cc.callFunc(() => {
                    node.active = false;
                }),
            ),
        );
    }

    private updateTaskNode(task: PrepareTaskViewState): void {
        const node = this.taskNodes[task.key];
        const label = this.taskLabels[task.key];
        if (!node) {
            return;
        }
        // node.opacity = task.visible ? 255 : (task.completed ? 220 : 180);
        // node.color = task.current
        //     ? new cc.Color(255, 245, 190, 255)
        //     : (task.completed ? new cc.Color(210, 255, 210, 255) : cc.Color.WHITE);

        if (label && (task.key === PrepareTaskKey.BuyCar || task.key === PrepareTaskKey.UnlockSkill || task.key === PrepareTaskKey.UnlockDef)) {
            // label.string = this.buildTaskText(task);
        }

        if (task.key === PrepareTaskKey.Hurt) {
            this.renderPointGroup(this.refs.hurtPointNodes, task.progress, node.active);
        }
        if (task.key === PrepareTaskKey.Hp) {
            this.renderPointGroup(this.refs.hpPointNodes, task.progress, node.active);
        }
    }

    private formatPercent(value: number): string {
        const clampedValue = Math.max(0, Math.min(100, value));
        const roundedValue = Math.floor((clampedValue * 10) / 10 + 0.5);
        return `${roundedValue.toFixed(Number.isInteger(roundedValue) ? 0 : 1)}%`;
    }

    private resolveCurrentPowerPercent(data: PrepareViewData): number {
        if (typeof data.currentPowerPercent === "number") {
            return data.currentPowerPercent;
        }
        if (typeof data.totalCorrectCount === "number" && typeof data.totalQuestionCount === "number" && data.totalQuestionCount > 0) {
            return (data.totalCorrectCount / data.totalQuestionCount) * 100;
        }
        return typeof data.powerPercent === "number" ? data.powerPercent : 0;
    }

    private resolveTotalPowerPercent(data: PrepareViewData): number {
        if (typeof data.totalPowerPercent === "number") {
            return data.totalPowerPercent;
        }
        if (typeof data.totalQuestionCount === "number") {
            return data.totalQuestionCount > 0 ? 100 : 0;
        }
        return 100;
    }

    private resetTaskVisibility(visibleTaskKey: PrepareTaskKey | null): void {
        this.taskTransitionToken += 1;
        this.currentVisibleTaskKey = visibleTaskKey;
        this.taskVisibilityInitialized = false;
        Object.keys(this.taskNodes).forEach((key) => {
            const node = this.taskNodes[key as PrepareTaskKey];
            if (node) {
                this.setTaskNodeVisibleImmediate(node, !!visibleTaskKey && key === visibleTaskKey);
            }
        });
        if (!visibleTaskKey) {
            this.refs.hurtPointNodes.forEach((node) => { node.active = false; });
            this.refs.hpPointNodes.forEach((node) => { node.active = false; });
        }
    }

    private syncTaskVisibility(visibleTaskKey: PrepareTaskKey | null, onComplete?: () => void): void {
        if (!this.taskVisibilityInitialized) {
            this.taskVisibilityInitialized = true;
            this.currentVisibleTaskKey = visibleTaskKey;
            Object.keys(this.taskNodes).forEach((key) => {
                const node = this.taskNodes[key as PrepareTaskKey];
                if (node) {
                    this.setTaskNodeVisibleImmediate(node, !!visibleTaskKey && key === visibleTaskKey);
                }
            });
            if (onComplete) {
                onComplete();
            }
            return;
        }

        if (this.currentVisibleTaskKey === visibleTaskKey) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        this.taskTransitionToken += 1;
        const transitionToken = this.taskTransitionToken;
        const previousTaskKey = this.currentVisibleTaskKey;
        const previousNode = previousTaskKey ? this.taskNodes[previousTaskKey] : null;
        const nextNode = visibleTaskKey ? this.taskNodes[visibleTaskKey] : null;

        this.currentVisibleTaskKey = visibleTaskKey;

        if (!previousNode || !previousNode.active) {
            if (nextNode) {
                this.showTaskNodeAnimated(nextNode, onComplete);
                return;
            }
            if (onComplete) {
                onComplete();
            }
            return;
        }

        this.hideTaskNodeAnimated(previousNode, () => {
            if (transitionToken !== this.taskTransitionToken) {
                return;
            }
            if (!nextNode) {
                if (onComplete) {
                    onComplete();
                }
                return;
            }
            this.showTaskNodeAnimated(nextNode, onComplete);
        });
    }

    private setTaskNodeVisibleImmediate(node: cc.Node, visible: boolean): void {
        node.stopAllActions();
        node.active = visible;
        node.opacity = visible ? 255 : 0;
        node.scale = PrepareView.TASK_NODE_SHOW_SCALE;
    }

    private showTaskNodeAnimated(node: cc.Node, onComplete?: () => void): void {
        node.stopAllActions();
        node.active = true;
        node.opacity = 255;
        node.scale = PrepareView.TASK_NODE_HIDE_SCALE;
        node.runAction(
            cc.sequence(
                cc.scaleTo(
                    PrepareView.TASK_NODE_ANIM_DURATION,
                    PrepareView.TASK_NODE_SHOW_SCALE,
                ).easing(cc.easeBackOut()),
                cc.callFunc(() => {
                    if (onComplete) {
                        onComplete();
                    }
                }),
            ),
        );
    }

    private hideTaskNodeAnimated(node: cc.Node, onComplete: () => void): void {
        node.stopAllActions();
        if (!node.active) {
            node.scale = PrepareView.TASK_NODE_SHOW_SCALE;
            onComplete();
            return;
        }
        node.runAction(
            cc.sequence(
                cc.scaleTo(
                    PrepareView.TASK_NODE_ANIM_DURATION,
                    PrepareView.TASK_NODE_HIDE_SCALE,
                ).easing(cc.easeSineIn()),
                cc.callFunc(() => {
                    node.active = false;
                    node.opacity = 0;
                    node.scale = PrepareView.TASK_NODE_SHOW_SCALE;
                    onComplete();
                }),
            ),
        );
    }

    private renderPointGroup(nodes: cc.Node[], activeCount: number, groupVisible: boolean): void {
        nodes.forEach((node, index) => {
            node.active = groupVisible && index < activeCount;
        });
    }

    private findInnerLabel(node: cc.Node | null): cc.Label | null {
        if (!node) {
            return null;
        }

        const direct = node.getComponentInChildren ? node.getComponentInChildren(cc.Label) : null;
        if (direct) {
            return direct;
        }

        const stack = node.children.slice();
        while (stack.length > 0) {
            const child = stack.shift()!;
            const label = child.getComponent(cc.Label);
            if (label) {
                return label;
            }
            stack.push(...child.children);
        }

        return null;
    }

    private playStartButtonBreathing(): void {
        if (!this.startButton) {
            return;
        }
        const startButtonAny = this.startButton as any;
        if (startButtonAny.__breathing) {
            return;
        }

        startButtonAny.__breathing = true;
        this.startButton.stopAllActions();
        this.startButton.scale = 1;
        this.startButton.runAction(
            cc.repeatForever(
                cc.sequence(
                    cc.scaleTo(0.8, PrepareView.START_BUTTON_MAX_SCALE).easing(cc.easeSineInOut()),
                    cc.scaleTo(0.8, PrepareView.START_BUTTON_MIN_SCALE).easing(cc.easeSineInOut()),
                ),
            ),
        );
    }

    private stopStartButtonBreathing(): void {
        if (!this.startButton) {
            return;
        }
        this.startButton.stopAllActions();
        this.startButton.scale = 1;
        (this.startButton as any).__breathing = false;
    }

    private createSkipButton(target: any, onSkipPrepare: () => void): cc.Node | null {
        return this.createActionButton("BtnSkipPrepare", PrepareView.SKIP_BUTTON_LABEL, target, onSkipPrepare);
    }

    private createActionButton(
        nodeName: string,
        labelText: string,
        target: any,
        onClick: () => void,
    ): cc.Node | null {
        if (!this.refs.root) {
            return null;
        }

        const buttonNode = new cc.Node(nodeName);
        buttonNode.parent = this.refs.root;
        buttonNode.setContentSize(PrepareView.ACTION_BUTTON_WIDTH, PrepareView.ACTION_BUTTON_HEIGHT);
        buttonNode.zIndex = 650;

        const graphics = buttonNode.addComponent(cc.Graphics);
        graphics.fillColor = new cc.Color(40, 52, 76, 220);
        graphics.roundRect(
            -PrepareView.ACTION_BUTTON_WIDTH * 0.5,
            -PrepareView.ACTION_BUTTON_HEIGHT * 0.5,
            PrepareView.ACTION_BUTTON_WIDTH,
            PrepareView.ACTION_BUTTON_HEIGHT,
            PrepareView.ACTION_BUTTON_RADIUS,
        );
        graphics.fill();
        graphics.lineWidth = 2;
        graphics.strokeColor = new cc.Color(255, 232, 180, 255);
        graphics.roundRect(
            -PrepareView.ACTION_BUTTON_WIDTH * 0.5,
            -PrepareView.ACTION_BUTTON_HEIGHT * 0.5,
            PrepareView.ACTION_BUTTON_WIDTH,
            PrepareView.ACTION_BUTTON_HEIGHT,
            PrepareView.ACTION_BUTTON_RADIUS,
        );
        graphics.stroke();

        const labelNode = new cc.Node("Label");
        labelNode.parent = buttonNode;
        const label = labelNode.addComponent(cc.Label);
        label.string = labelText;
        label.fontSize = 24;
        label.lineHeight = 28;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        labelNode.color = new cc.Color(255, 244, 215, 255);

        buttonNode.on(cc.Node.EventType.TOUCH_END, onClick, target);
        buttonNode.active = false;
        return buttonNode;
    }

    private updateSkipButtonPosition(skipButtonOverride?: cc.Node): void {
        const buttonNode = skipButtonOverride || this.skipButton;
        if (!buttonNode) {
            return;
        }

        const size = cc.winSize;
        buttonNode.setPosition(size.width / 2 - 110, -size.height / 2 + 56);
    }
}
