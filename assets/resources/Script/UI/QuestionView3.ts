import { MatchingQuestionData } from "../Core/GameDefines";
import { playResultStamp, QUESTION_RESULT_DELAY, resetResultState } from "./QuestionResultStamp";

const { ccclass, property } = cc._decorator;

export interface QuestionViewData {
    title?: string;
    aleart: string;
    ques: string;
    matching?: MatchingQuestionData;
}

/** 匹配 */
@ccclass
export default class QuestionView3 extends cc.Component {
    private static readonly DISPLAY_OFFSET_X = 200;
    private static readonly COLOR_CORRECT = new cc.Color(201, 249, 129, 255);
    private static readonly COLOR_DEFAULT = new cc.Color(220, 220, 220, 255);
    private static readonly COLOR_WRONG = new cc.Color(236, 128, 141, 255);
    private static readonly COLOR_SELECTED = new cc.Color(250, 206, 145, 255);
    private static readonly COLOR_BLUE = new cc.Color(129, 211, 248, 255);
    private static readonly COLOR_GREEN = new cc.Color(202, 249, 130, 255);
    private static readonly COLOR_PURPLE = new cc.Color(128, 128, 255, 255);
    private static readonly SWAP_DURATION = 0.18;

    private contentRoot: cc.Node | null = null;
    private leftLabelTitleNode: cc.Node | null = null;
    private leftLabel: cc.Label | null = null;
    private alertLabel: cc.Label | null = null;
    private leftOptionLabels: Array<cc.Label | null> = [];
    private leftOptionNodes: Array<cc.Node | null> = [];
    @property([cc.Label])
    rightOptionLabels: cc.Label[] = [];

    private rightOptionNodes: Array<cc.Node | null> = [];
    private initialRightOptionNodes: Array<cc.Node | null> = [];
    private resultNode: cc.Node | null = null;
    private resultLabel: cc.Label | null = null;
    private submitNode: cc.Node | null = null;
    private cancelBtn: cc.Node | null = null;
    private onSelect: ((index: number) => void) | null = null;
    private lastData: QuestionViewData | null = null;
    private inputLocked = false;
    private isBattleMode = false;
    private selectedLeftIndex = -1;
    private selectedRightIndex = -1;
    private matchingData: MatchingQuestionData | null = null;
    private rightOptionOrder: number[] = [];
    private readonly rightSlotPositions: cc.Vec2[] = [];

    protected onLoad(): void {
        this.createOverlayLayout();

        this.leftLabelTitleNode = this.findContentNode("labelLL");
        this.leftLabel = this.findLabel("LabelLeft");
        this.alertLabel = this.findLabel("LabelAlert");
        this.leftOptionNodes = [this.findContentNode("bg1"), this.findContentNode("bg2"), this.findContentNode("bg3")];
        this.rightOptionNodes = [this.findContentNode("rbg1"), this.findContentNode("rbg2"), this.findContentNode("rbg3")];
        this.initialRightOptionNodes = this.rightOptionNodes.slice();
        this.leftOptionLabels = [this.findLabel("LabelAns1"), this.findLabel("LabelAns2"), this.findLabel("LabelAns3")];
        this.resultNode = this.findContentNode("NodeResult");
        this.resultLabel = this.resultNode ? this.resultNode.getComponentInChildren(cc.Label) : null;
        this.submitNode = this.findContentNode("BtnSure");
        this.cancelBtn = this.findContentNode("BtnCancel");
        this.rightSlotPositions.push(...this.rightOptionNodes.map((node) => node ? cc.v2(node.x, node.y) : cc.v2()));
        this.bindSubmitNode();
        this.bindCancelNode();
        this.hideImmediate();
    }

    public initialize(onSelect: (index: number) => void): void {
        this.onSelect = onSelect;
        this.leftOptionNodes.forEach((node, index) => this.bindSideNode(node, "left", index));
        this.rightOptionNodes.forEach((node, index) => this.bindSideNode(node, "right", index));
    }

    public setActive(active: boolean): void {
        if (!active) {
            this.hideImmediate();
            return;
        }
        this.node.active = true;
    }

    public render(data: QuestionViewData): void {
        this.lastData = data;
        this.isBattleMode = !data.title || data.title.indexOf("/") < 0;
        this.matchingData = data.matching || null;
        this.selectedLeftIndex = -1;
        this.selectedRightIndex = -1;
        this.restoreRightOptionNodes();
        this.rightOptionOrder = this.buildShuffledRightOptionOrder();
        this.inputLocked = false;
        this.resetOptionState();
        this.setSubmitVisible(false);
        resetResultState(this.resultNode);
        this.setHeaderVisible(!this.isBattleMode);

        if (this.leftLabel) {
            this.leftLabel.string = this.getLeftLabelText(data);
        }
        if (this.alertLabel) {
            this.alertLabel.string = this.matchingData ? this.matchingData.prompt : (data.aleart || data.ques);
        }

        for (let i = 0; i < 3; i += 1) {
            if (this.leftOptionLabels[i]) {
                let str = this.matchingData && this.matchingData.leftOptions[i]
                    ? this.matchingData.leftOptions[i].text
                    : "";
                this.leftOptionLabels[i]!.string = `${i+1}.${str}`;
            }
        }

        this.applyRightOptionOrderToView();
    }

    public openFrom(anchorNode: cc.Node | null, data: QuestionViewData): void {
        this.render(data);
        this.node.stopAllActions();
        if (this.contentRoot) {
            this.contentRoot.stopAllActions();
        }

        this.ensureOverlaySize();
        this.node.active = true;
        this.inputLocked = true;

        const startPosition = this.getAnchorPosition(anchorNode);
        const restPosition = this.getRestPosition();
        if (this.contentRoot) {
            this.contentRoot.opacity = 0;
            this.contentRoot.scale = anchorNode ? 0.25 : 0.8;
            this.contentRoot.setPosition(startPosition);
            this.contentRoot.runAction(
                cc.sequence(
                    cc.spawn(
                        cc.fadeIn(0.18),
                        cc.scaleTo(0.2, 1).easing(cc.easeBackOut()),
                        cc.moveTo(0.2, restPosition).easing(cc.easeSineOut()),
                    ),
                    cc.callFunc(() => {
                        this.inputLocked = false;
                    }),
                ),
            );
        } else {
            this.inputLocked = false;
        }
    }

    public closeTo(anchorNode: cc.Node | null, onComplete?: () => void): void {
        if (!this.node.active) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        this.inputLocked = true;
        const targetPosition = this.getAnchorPosition(anchorNode);

        if (this.contentRoot) {
            this.contentRoot.stopAllActions();
            this.contentRoot.runAction(
                cc.sequence(
                    cc.spawn(
                        cc.fadeOut(0.18),
                        cc.scaleTo(0.18, anchorNode ? 0.22 : 0.8).easing(cc.easeSineIn()),
                        cc.moveTo(0.18, targetPosition).easing(cc.easeSineIn()),
                    ),
                    cc.callFunc(() => {
                        this.hideImmediate();
                        if (onComplete) {
                            onComplete();
                        }
                    }),
                ),
            );
            return;
        }

        this.hideImmediate();
        if (onComplete) {
            onComplete();
        }
    }

    public hideImmediate(): void {
        this.inputLocked = false;
        this.selectedLeftIndex = -1;
        this.selectedRightIndex = -1;
        this.restoreRightOptionNodes();
        this.node.stopAllActions();
        if (this.contentRoot) {
            this.contentRoot.stopAllActions();
            this.contentRoot.opacity = 255;
            this.contentRoot.scale = 1;
            this.contentRoot.setPosition(this.getRestPosition());
        }
        this.resetOptionState();
        this.setSubmitVisible(false);
        resetResultState(this.resultNode);
        this.node.active = false;
    }

    private createOverlayLayout(): void {
        const originalChildren = this.node.children.slice();
        this.contentRoot = new cc.Node("ContentRoot");
        this.contentRoot.parent = this.node;

        originalChildren.forEach((child) => {
            if (child !== this.contentRoot) {
                child.parent = this.contentRoot!;
            }
        });

        this.ensureOverlaySize();
    }

    private ensureOverlaySize(): void {
        const size = cc.winSize;
        this.node.setContentSize(size.width, size.height);
    }

    private findContentNode(nodeName: string): cc.Node | null {
        if (!this.contentRoot) {
            return null;
        }
        return this.contentRoot.getChildByName(nodeName);
    }

    private findLabel(nodeName: string): cc.Label | null {
        const node = this.findContentNode(nodeName);
        return node ? node.getComponent(cc.Label) : null;
    }

    private bindSideNode(node: cc.Node | null, side: "left" | "right", index: number): void {
        if (!node) {
            return;
        }

        node.targetOff(this);
        node.on(cc.Node.EventType.TOUCH_END, () => {
            if (this.inputLocked) {
                return;
            }

            this.setSubmitVisible(true);
            if (side === "left") {
                this.handleLeftClick(index);
                return;
            }

            const currentRightIndex = this.rightOptionNodes.findIndex((item) => item === node);
            if (currentRightIndex >= 0) {
                this.handleRightClick(currentRightIndex);
            }
        }, this);
    }

    private bindSubmitNode(): void {
        if (!this.submitNode) {
            return;
        }

        this.submitNode.targetOff(this);
        this.submitNode.on(cc.Node.EventType.TOUCH_END, () => {
            this.submitAnswer();
        }, this);
    }

    private bindCancelNode(): void {
        if (!this.cancelBtn) {
            return;
        }

        this.cancelBtn.targetOff(this);
        this.cancelBtn.on(cc.Node.EventType.TOUCH_END, () => {
            if (this.inputLocked) {
                return;
            }
            this.clearAllMatches();
        }, this);
    }

    private handleLeftClick(index: number): void {
        if (this.selectedLeftIndex === index) {
            this.selectedLeftIndex = -1;
            this.refreshSelectionState();
            return;
        }

        this.selectedLeftIndex = index;
        this.refreshSelectionState();
        this.tryAutoPair();
    }

    private handleRightClick(index: number): void {
        if (this.selectedRightIndex === index) {
            this.selectedRightIndex = -1;
            this.refreshSelectionState();
            return;
        }

        this.selectedRightIndex = index;
        this.refreshSelectionState();
        this.tryAutoPair();
    }

    private tryAutoPair(): void {
        if (this.selectedLeftIndex < 0 || this.selectedRightIndex < 0) {
            return;
        }
        this.swapRightOptionsToSelectedLeft();
    }

    private clearAllMatches(): void {
        this.selectedLeftIndex = -1;
        this.selectedRightIndex = -1;
        this.restoreRightOptionNodes();
        this.rightOptionOrder = this.buildShuffledRightOptionOrder();
        this.applyRightOptionOrderToView();
        this.setSubmitVisible(false);
        this.refreshSelectionState();
    }

    private refreshSelectionState(): void {
        this.resetOptionState();

        if (this.selectedLeftIndex >= 0) {
            this.setNodeColor(this.leftOptionNodes[this.selectedLeftIndex], QuestionView3.COLOR_SELECTED);
        }
        if (this.selectedRightIndex >= 0) {
            this.setNodeColor(this.rightOptionNodes[this.selectedRightIndex], QuestionView3.COLOR_SELECTED);
        }
    }

    private submitAnswer(): void {
        if (this.inputLocked || !this.matchingData) {
            return;
        }

        const requiredPairCount = Math.min(this.matchingData.leftOptions.length, this.matchingData.rightOptions.length);
        if (this.rightOptionOrder.length !== requiredPairCount) {
            return;
        }

        this.inputLocked = true;
        this.setSubmitVisible(false);

        const isCorrect = this.isMatchingCorrect();
        this.applyMatchingResult(isCorrect);

        this.node.stopAllActions();
        this.node.runAction(
            cc.sequence(
                cc.delayTime(QUESTION_RESULT_DELAY),
                cc.callFunc(() => {
                    if (this.onSelect) {
                        this.onSelect(isCorrect ? 0 : 1);
                    }
                }),
            ),
        );
    }

    private isMatchingCorrect(): boolean {
        if (!this.matchingData) {
            return false;
        }

        return this.matchingData.correctMatches.every((match) => {
            const leftIndex = this.matchingData!.leftOptions.findIndex((item) => item.id === match.leftId);
            if (leftIndex < 0 || leftIndex >= this.rightOptionOrder.length) {
                return false;
            }

            const currentRightOptionIndex = this.rightOptionOrder[leftIndex];
            if (currentRightOptionIndex < 0 || currentRightOptionIndex >= this.matchingData!.rightOptions.length) {
                return false;
            }

            return this.matchingData!.rightOptions[currentRightOptionIndex].id === match.rightId;
        });
    }

    private applyMatchingResult(isCorrect: boolean): void {
        if (!this.matchingData) {
            return;
        }

        this.resetOptionState();

        const colors = [QuestionView3.COLOR_BLUE, QuestionView3.COLOR_GREEN, QuestionView3.COLOR_PURPLE];

        this.matchingData.leftOptions.forEach((leftOption, leftIndex) => {
            const correctMatch = this.matchingData!.correctMatches.find((match) => match.leftId === leftOption.id);
            if (isCorrect) {
                this.setNodeColor(this.leftOptionNodes[leftIndex], QuestionView3.COLOR_CORRECT);
                this.setNodeColor(this.rightOptionNodes[leftIndex], QuestionView3.COLOR_CORRECT);
            } else {
                this.setNodeColor(this.leftOptionNodes[leftIndex], colors[leftIndex]);

                if (!correctMatch) {
                    return;
                }

                const correctRightOptionIndex = this.matchingData!.rightOptions.findIndex(
                    (option) => option.id === correctMatch.rightId,
                );
                const currentRightNodeIndex = this.rightOptionOrder.findIndex(
                    (optionIndex) => optionIndex === correctRightOptionIndex,
                );
                if (currentRightNodeIndex >= 0) {
                    this.setNodeColor(this.rightOptionNodes[currentRightNodeIndex], colors[leftIndex]);
                }
            }
        });

        playResultStamp(
            this.resultNode,
            this.resultLabel,
            isCorrect,
            QuestionView3.COLOR_CORRECT,
            QuestionView3.COLOR_WRONG,
        );
    }

    private swapRightOptionsToSelectedLeft(): void {
        if (this.selectedLeftIndex < 0 || this.selectedRightIndex < 0) {
            return;
        }

        const targetSlot = this.selectedLeftIndex;
        const sourceSlot = this.selectedRightIndex;
        if (targetSlot === sourceSlot) {
            this.selectedLeftIndex = -1;
            this.selectedRightIndex = -1;
            this.refreshSelectionState();
            return;
        }

        const targetNode = this.rightOptionNodes[targetSlot];
        const sourceNode = this.rightOptionNodes[sourceSlot];
        const targetPosition = this.rightSlotPositions[targetSlot];
        const sourcePosition = this.rightSlotPositions[sourceSlot];
        if (!targetNode || !sourceNode || !targetPosition || !sourcePosition) {
            this.selectedLeftIndex = -1;
            this.selectedRightIndex = -1;
            this.refreshSelectionState();
            return;
        }

        this.inputLocked = true;
        targetNode.stopAllActions();
        sourceNode.stopAllActions();

        let remaining = 2;
        const onSwapFinished = (): void => {
            remaining -= 1;
            if (remaining > 0) {
                return;
            }

            const tempNode = this.rightOptionNodes[targetSlot];
            this.rightOptionNodes[targetSlot] = this.rightOptionNodes[sourceSlot];
            this.rightOptionNodes[sourceSlot] = tempNode;

            const tempOrder = this.rightOptionOrder[targetSlot];
            this.rightOptionOrder[targetSlot] = this.rightOptionOrder[sourceSlot];
            this.rightOptionOrder[sourceSlot] = tempOrder;

            this.rightOptionNodes[targetSlot]!.setPosition(targetPosition);
            this.rightOptionNodes[sourceSlot]!.setPosition(sourcePosition);

            this.selectedLeftIndex = -1;
            this.selectedRightIndex = -1;
            this.inputLocked = false;
            this.refreshSelectionState();
        };

        targetNode.runAction(
            cc.sequence(
                cc.moveTo(QuestionView3.SWAP_DURATION, sourcePosition).easing(cc.easeSineInOut()),
                cc.callFunc(onSwapFinished),
            ),
        );
        sourceNode.runAction(
            cc.sequence(
                cc.moveTo(QuestionView3.SWAP_DURATION, targetPosition).easing(cc.easeSineInOut()),
                cc.callFunc(onSwapFinished),
            ),
        );
    }

    private applyRightOptionOrderToView(): void {
        if (!this.matchingData) {
            return;
        }

        let arr = ["A","B","C"];
        for (let i = 0; i < this.rightOptionNodes.length; i += 1) {
            const node = this.rightOptionNodes[i];
            const optionIndex = this.rightOptionOrder[i];
            if (!node) {
                continue;
            }

            node.stopAllActions();
            if (this.rightSlotPositions[i]) {
                node.setPosition(this.rightSlotPositions[i]);
            }

            const label = this.rightOptionLabels[i];
            if (label) {
                let str = optionIndex >= 0 && optionIndex < this.matchingData.rightOptions.length
                    ? this.matchingData.rightOptions[optionIndex].text
                    : "";
                label.string = `${arr[i]}.${str}`;
            }
        }
    }

    private restoreRightOptionNodes(): void {
        if (this.initialRightOptionNodes.length <= 0) {
            return;
        }

        this.rightOptionNodes = this.initialRightOptionNodes.slice();
        for (let i = 0; i < this.rightOptionNodes.length; i += 1) {
            const node = this.rightOptionNodes[i];
            if (!node) {
                continue;
            }

            node.stopAllActions();
            if (this.rightSlotPositions[i]) {
                node.setPosition(this.rightSlotPositions[i]);
            }
        }
    }

    private buildShuffledRightOptionOrder(): number[] {
        if (!this.matchingData) {
            return [];
        }

        const order = this.matchingData.rightOptions.map((_, index) => index);
        for (let i = order.length - 1; i > 0; i -= 1) {
            const swapIndex = Math.floor(Math.random() * (i + 1));
            const temp = order[i];
            order[i] = order[swapIndex];
            order[swapIndex] = temp;
        }
        return order;
    }

    private setSubmitVisible(visible: boolean): void {
        if (this.submitNode) {
            this.submitNode.active = visible;
        }
    }

    private setHeaderVisible(visible: boolean): void {
        if (this.leftLabelTitleNode) {
            this.leftLabelTitleNode.active = visible;
        }
        if (this.leftLabel) {
            this.leftLabel.node.active = visible;
        }
    }

    private resetOptionState(): void {
        this.leftOptionNodes.forEach((node) => this.setNodeColor(node, QuestionView3.COLOR_DEFAULT));
        this.rightOptionNodes.forEach((node) => this.setNodeColor(node, QuestionView3.COLOR_DEFAULT));
    }

    private setNodeColor(target: { color?: cc.Color } | null, color: cc.Color): void {
        if (!target) {
            return;
        }
        target.color = color;
    }

    private getLeftLabelText(data: QuestionViewData): string {
        const source = data.title || data.aleart || "";
        const match = source.match(/(\d+)\s*\/\s*(\d+)/);
        if (!match) {
            return source;
        }

        const current = parseInt(match[1], 10);
        const total = parseInt(match[2], 10);
        if (isNaN(current) || isNaN(total)) {
            return source;
        }

        const remaining = Math.max(total - current + 1, 0);
        return `${remaining}/${total}`;
    }

    private getAnchorPosition(anchorNode: cc.Node | null): cc.Vec2 {
        if (!anchorNode || !this.node.parent) {
            return this.getRestPosition();
        }

        const worldPosition = anchorNode.parent
            ? anchorNode.parent.convertToWorldSpaceAR(cc.v2(anchorNode.x, anchorNode.y))
            : cc.v2(anchorNode.x, anchorNode.y);
        return this.node.parent.convertToNodeSpaceAR(worldPosition);
    }

    private getRestPosition(): cc.Vec2 {
        return cc.v2(QuestionView3.DISPLAY_OFFSET_X, 0);
    }
}
