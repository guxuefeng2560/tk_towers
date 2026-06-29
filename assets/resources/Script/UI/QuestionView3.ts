import { MatchingQuestionData } from "../Core/GameDefines";
import { QUESTION_RESULT_DELAY } from "./QuestionResultStamp";
import { closeQuestionViewTo, openQuestionViewFrom } from "./QuestionViewMotion";

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
    private static readonly BAR_DEFAULT_PATH = "Texture/questionUI/bar_7";
    private static readonly BAR_SELECTED_PATH = "Texture/questionUI/bar_4";
    private static readonly STATE_RIGHT_PATH = "Texture/questionUI/right";
    private static readonly STATE_WRONG_PATH = "Texture/questionUI/wrong";

    @property(cc.Node)
    submitBtn: cc.Node = null;

    @property(cc.Node)
    stateImg: cc.Node = null;

    @property([cc.Label])
    leftOptionLabels: cc.Label[] = [];

    private static readonly DISPLAY_OFFSET_X = 360;
    private static readonly DISPLAY_OFFSET_Y = 60;
    private static readonly SWAP_DURATION = 0.18;
    private static barDefaultFrame: cc.SpriteFrame | null = null;
    private static barSelectedFrame: cc.SpriteFrame | null = null;
    private static stateRightFrame: cc.SpriteFrame | null = null;
    private static stateWrongFrame: cc.SpriteFrame | null = null;
    private static framesLoadingStarted = false;

    private contentRoot: cc.Node | null = null;
    private leftLabelTitleNode: cc.Node | null = null;
    private leftLabel: cc.Label | null = null;
    private alertLabel: cc.Label | null = null;
    private leftOptionNodes: Array<cc.Node | null> = [];
    @property([cc.Label])
    rightOptionLabels: cc.Label[] = [];

    private rightOptionNodes: Array<cc.Node | null> = [];
    private initialRightOptionNodes: Array<cc.Node | null> = [];
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

        this.stateImg = this.stateImg || this.findContentNode("img_state");
        this.leftLabelTitleNode = this.findContentNode("labelLL");
        this.leftLabel = this.findLabel("LabelLeft");
        this.alertLabel = this.findLabel("LabelAlert");
        this.leftOptionNodes = [this.findContentNode("bg1"), this.findContentNode("bg2"), this.findContentNode("bg3")];
        this.rightOptionNodes = [this.findContentNode("rbg1"), this.findContentNode("rbg2"), this.findContentNode("rbg3")];
        this.initialRightOptionNodes = this.rightOptionNodes.slice();
        this.submitNode = this.findContentNode("BtnSure");
        this.rightSlotPositions.push(...this.rightOptionNodes.map((node) => node ? cc.v2(node.x, node.y) : cc.v2()));
        this.preloadFrames();
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
        this.resetStateImage();
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
                this.leftOptionLabels[i]!.string = `${str}`;
            }
        }

        this.applyRightOptionOrderToView();
    }

    public openFrom(anchorNode: cc.Node | null, data: QuestionViewData): void {
        openQuestionViewFrom(this as any, anchorNode, data);
    }

    public closeTo(anchorNode: cc.Node | null, onComplete?: () => void): void {
        closeQuestionViewTo(this as any, anchorNode, onComplete);
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
        this.resetStateImage();
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
            this.applyOptionFrame(this.leftOptionNodes[this.selectedLeftIndex], "selected");
        }
        if (this.selectedRightIndex >= 0) {
            this.applyOptionFrame(this.rightOptionNodes[this.selectedRightIndex], "selected");
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
        this.showStateImage(isCorrect);
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

        const movingNode = this.rightOptionNodes[sourceSlot];
        const movingOrder = this.rightOptionOrder[sourceSlot];
        if (!movingNode || movingOrder === undefined) {
            this.selectedLeftIndex = -1;
            this.selectedRightIndex = -1;
            this.refreshSelectionState();
            return;
        }

        const nextRightOptionNodes = this.rightOptionNodes.slice();
        const nextRightOptionOrder = this.rightOptionOrder.slice();
        nextRightOptionNodes.splice(sourceSlot, 1);
        nextRightOptionOrder.splice(sourceSlot, 1);
        nextRightOptionNodes.splice(targetSlot, 0, movingNode);
        nextRightOptionOrder.splice(targetSlot, 0, movingOrder);

        this.inputLocked = true;
        let remaining = 0;
        const onMoveFinished = (): void => {
            remaining -= 1;
            if (remaining > 0) {
                return;
            }

            this.rightOptionNodes = nextRightOptionNodes;
            this.rightOptionOrder = nextRightOptionOrder;
            this.rightOptionNodes.forEach((node, index) => {
                if (node && this.rightSlotPositions[index]) {
                    node.setPosition(this.rightSlotPositions[index]);
                }
            });

            this.selectedLeftIndex = -1;
            this.selectedRightIndex = -1;
            this.inputLocked = false;
            this.refreshSelectionState();
        };

        for (let i = 0; i < nextRightOptionNodes.length; i += 1) {
            const node = nextRightOptionNodes[i];
            const targetPosition = this.rightSlotPositions[i];
            if (!node || !targetPosition) {
                continue;
            }

            remaining += 1;
            node.stopAllActions();
            node.runAction(
                cc.sequence(
                    cc.moveTo(QuestionView3.SWAP_DURATION, targetPosition).easing(cc.easeSineInOut()),
                    cc.callFunc(onMoveFinished),
                ),
            );
        }

        if (remaining <= 0) {
            this.rightOptionNodes = nextRightOptionNodes;
            this.rightOptionOrder = nextRightOptionOrder;
            this.selectedLeftIndex = -1;
            this.selectedRightIndex = -1;
            this.inputLocked = false;
            this.refreshSelectionState();
        }
    }

    private applyRightOptionOrderToView(): void {
        if (!this.matchingData) {
            return;
        }

        let arr = ["","",""];
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
                label.string = `${str}`;
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
        this.leftOptionNodes.forEach((node) => {
            this.applyOptionFrame(node, "default");
        });
        this.rightOptionNodes.forEach((node) => {
            this.applyOptionFrame(node, "default");
        });
    }

    private applyOptionFrame(node: cc.Node | null, state: "default" | "selected"): void {
        if (!node) {
            return;
        }

        const sprite = node.getComponent(cc.Sprite);
        if (!sprite) {
            return;
        }

        const spriteFrame = state === "selected"
            ? (QuestionView3.barSelectedFrame || QuestionView3.barDefaultFrame)
            : QuestionView3.barDefaultFrame;
        if (spriteFrame) {
            sprite.spriteFrame = spriteFrame;
        }
    }

    private showStateImage(isCorrect: boolean): void {
        if (!this.stateImg) {
            return;
        }

        const sprite = this.stateImg.getComponent(cc.Sprite);
        const spriteFrame = isCorrect ? QuestionView3.stateRightFrame : QuestionView3.stateWrongFrame;
        if (sprite && spriteFrame) {
            sprite.spriteFrame = spriteFrame;
        }

        this.stateImg.stopAllActions();
        this.stateImg.active = true;
        this.stateImg.opacity = 255;
        this.stateImg.scale = 1;
        this.stateImg.angle = 0;
    }

    private resetStateImage(): void {
        if (!this.stateImg) {
            return;
        }

        this.stateImg.stopAllActions();
        this.stateImg.active = false;
        this.stateImg.opacity = 255;
        this.stateImg.scale = 1;
        this.stateImg.angle = 0;
    }

    private preloadFrames(): void {
        if (QuestionView3.framesLoadingStarted) {
            return;
        }
        QuestionView3.framesLoadingStarted = true;

        const resources = (cc as any).resources;
        if (!resources || !resources.load) {
            return;
        }

        resources.load(QuestionView3.BAR_DEFAULT_PATH, cc.SpriteFrame, (error: Error | null, spriteFrame: cc.SpriteFrame) => {
            if (!error && spriteFrame) {
                QuestionView3.barDefaultFrame = spriteFrame;
                this.refreshSelectionState();
            }
        });
        resources.load(QuestionView3.BAR_SELECTED_PATH, cc.SpriteFrame, (error: Error | null, spriteFrame: cc.SpriteFrame) => {
            if (!error && spriteFrame) {
                QuestionView3.barSelectedFrame = spriteFrame;
                this.refreshSelectionState();
            }
        });
        resources.load(QuestionView3.STATE_RIGHT_PATH, cc.SpriteFrame, (error: Error | null, spriteFrame: cc.SpriteFrame) => {
            if (!error && spriteFrame) {
                QuestionView3.stateRightFrame = spriteFrame;
            }
        });
        resources.load(QuestionView3.STATE_WRONG_PATH, cc.SpriteFrame, (error: Error | null, spriteFrame: cc.SpriteFrame) => {
            if (!error && spriteFrame) {
                QuestionView3.stateWrongFrame = spriteFrame;
            }
        });
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
        return cc.v2(QuestionView3.DISPLAY_OFFSET_X, QuestionView3.DISPLAY_OFFSET_Y);
    }
}
