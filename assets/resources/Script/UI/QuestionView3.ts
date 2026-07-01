import { MatchingQuestionData } from "../Core/GameDefines";
import { QUESTION_RESULT_DELAY } from "./QuestionResultStamp";
import QuestionViewBase from "./QuestionViewBase";
import { closeQuestionViewTo, openQuestionViewFrom } from "./QuestionViewMotion";

const { ccclass, property } = cc._decorator;

export interface QuestionViewData {
    title?: string;
    aleart: string;
    ques: string;
    matching?: MatchingQuestionData;
}

type MatchPairState = "correct" | "wrong" | null;
type OptionFrameState = "default" | "selected" | "correct" | "wrong";

/** 匹配 */
@ccclass
export default class QuestionView3 extends QuestionViewBase {
    private static readonly BAR_DEFAULT_PATH = "Texture/questionUI/bar_7";
    private static readonly BAR_SELECTED_PATH = "Texture/questionUI/bar_4";
    private static readonly BAR_CORRECT_PATH = "Texture/questionUI/bar_1";
    private static readonly BAR_WRONG_PATH = "Texture/questionUI/bar_2";
    private static readonly STATE_RIGHT_PATH = "Texture/questionUI/right";
    private static readonly STATE_WRONG_PATH = "Texture/questionUI/wrong";

    private static readonly LABEL_OUTLINE_DEFAULT = new cc.Color(154, 99, 50, 255);
    private static readonly LABEL_OUTLINE_CORRECT = new cc.Color(18, 110, 140, 255);
    private static readonly LABEL_OUTLINE_WRONG = new cc.Color(175, 49, 49, 255);

    @property(cc.Node)
    stateImg: cc.Node = null;

    @property([cc.Label])
    leftOptionLabels: cc.Label[] = [];

    private static readonly SWAP_DURATION = 0.18;
    private static barDefaultFrame: cc.SpriteFrame | null = null;
    private static barSelectedFrame: cc.SpriteFrame | null = null;
    private static barCorrectFrame: cc.SpriteFrame | null = null;
    private static barWrongFrame: cc.SpriteFrame | null = null;
    private static stateRightFrame: cc.SpriteFrame | null = null;
    private static stateWrongFrame: cc.SpriteFrame | null = null;
    private static framesLoadingStarted = false;

    private contentRoot: cc.Node | null = null;
    private leftLabelTitleNode: cc.Node | null = null;
    private leftLabel: cc.Label | null = null;
    private alertLabel: cc.Label | null = null;
    private leftOptionNodes: Array<cc.Node | null> = [];
    private initialLeftOptionNodes: Array<cc.Node | null> = [];
    @property([cc.Label])
    rightOptionLabels: cc.Label[] = [];

    private rightOptionNodes: Array<cc.Node | null> = [];
    private initialRightOptionNodes: Array<cc.Node | null> = [];
    private onSelect: ((index: number, detail?: any) => void) | null = null;
    private lastData: QuestionViewData | null = null;
    private inputLocked = false;
    private isBattleMode = false;
    private selectedLeftIndex = -1;
    private selectedRightIndex = -1;
    private matchingData: MatchingQuestionData | null = null;
    private leftOptionOrder: number[] = [];
    private rightOptionOrder: number[] = [];
    private pairStates: MatchPairState[] = [];
    private matchingResultSent = false;
    private readonly leftSlotPositions: cc.Vec2[] = [];
    private readonly rightSlotPositions: cc.Vec2[] = [];

    protected onLoad(): void {
        this.createOverlayLayout();

        this.stateImg = this.stateImg || this.findContentNode("img_state");
        this.leftLabelTitleNode = this.findContentNode("labelLL");
        this.leftLabel = this.findLabel("LabelLeft");
        this.alertLabel = this.findLabel("LabelAlert");
        this.leftOptionNodes = [this.findContentNode("bg1"), this.findContentNode("bg2"), this.findContentNode("bg3")];
        this.rightOptionNodes = [this.findContentNode("rbg1"), this.findContentNode("rbg2"), this.findContentNode("rbg3")];
        this.initialLeftOptionNodes = this.leftOptionNodes.slice();
        this.initialRightOptionNodes = this.rightOptionNodes.slice();
        this.hideLegacyActionButtons();
        this.leftSlotPositions.push(...this.leftOptionNodes.map((node) => node ? cc.v2(node.x, node.y) : cc.v2()));
        this.rightSlotPositions.push(...this.rightOptionNodes.map((node) => node ? cc.v2(node.x, node.y) : cc.v2()));
        this.preloadFrames();
        this.hideImmediate();
    }

    public initialize(onSelect: (index: number, detail?: any) => void): void {
        this.onSelect = onSelect;
        this.leftOptionNodes.forEach((node) => this.bindSideNode(node, "left"));
        this.rightOptionNodes.forEach((node) => this.bindSideNode(node, "right"));
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
        this.matchingResultSent = false;
        this.restoreOptionNodes();
        this.leftOptionOrder = this.buildLeftOptionOrder();
        this.rightOptionOrder = this.buildShuffledRightOptionOrder();
        this.pairStates = this.leftOptionOrder.map(() => null);
        this.inputLocked = false;
        this.resetOptionState();
        this.hideLegacyActionButtons();
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

        this.applyLeftOptionOrderToView();
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
        this.matchingData = null;
        this.matchingResultSent = false;
        this.restoreOptionNodes();
        this.leftOptionOrder = [];
        this.rightOptionOrder = [];
        this.pairStates = [];
        this.node.stopAllActions();
        if (this.contentRoot) {
            this.contentRoot.stopAllActions();
            this.contentRoot.opacity = 255;
            this.contentRoot.scale = 1;
            this.contentRoot.setPosition(this.getRestPosition());
        }
        this.resetOptionState();
        this.hideLegacyActionButtons();
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

    private bindSideNode(node: cc.Node | null, side: "left" | "right"): void {
        if (!node) {
            return;
        }

        node.targetOff(this);
        node.on(cc.Node.EventType.TOUCH_END, () => {
            if (this.inputLocked) {
                return;
            }

            if (side === "left") {
                const currentLeftIndex = this.leftOptionNodes.findIndex((item) => item === node);
                if (currentLeftIndex >= 0) {
                    this.handleLeftClick(currentLeftIndex);
                }
                return;
            }

            const currentRightIndex = this.rightOptionNodes.findIndex((item) => item === node);
            if (currentRightIndex >= 0) {
                this.handleRightClick(currentRightIndex);
            }
        }, this);
    }

    private handleLeftClick(index: number): void {
        if (this.isSlotCorrect(index)) {
            return;
        }

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
        if (this.isSlotCorrect(index)) {
            return;
        }

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
        this.moveSelectedPairToMatchedArea();
    }

    private refreshSelectionState(): void {
        this.resetOptionState();

        this.pairStates.forEach((state, index) => {
            if (!state) {
                return;
            }

            this.applyOptionFrame(this.leftOptionNodes[index], state);
            this.applyOptionFrame(this.rightOptionNodes[index], state);
        });

        if (this.selectedLeftIndex >= 0) {
            this.applyOptionFrame(this.leftOptionNodes[this.selectedLeftIndex], "selected");
        }
        if (this.selectedRightIndex >= 0) {
            this.applyOptionFrame(this.rightOptionNodes[this.selectedRightIndex], "selected");
        }
    }

    private moveSelectedPairToMatchedArea(): void {
        if (this.selectedLeftIndex < 0 || this.selectedRightIndex < 0) {
            return;
        }

        if (this.isSlotCorrect(this.selectedLeftIndex) || this.isSlotCorrect(this.selectedRightIndex)) {
            this.selectedLeftIndex = -1;
            this.selectedRightIndex = -1;
            this.refreshSelectionState();
            return;
        }

        const targetSlot = this.getMatchedCount();
        const isCorrect = this.isSelectedPairCorrect();
        const nextLeftOptionNodes = this.swapArrayItems(this.leftOptionNodes, this.selectedLeftIndex, targetSlot);
        const nextLeftOptionOrder = this.swapArrayItems(this.leftOptionOrder, this.selectedLeftIndex, targetSlot);
        const nextRightOptionNodes = this.swapArrayItems(this.rightOptionNodes, this.selectedRightIndex, targetSlot);
        const nextRightOptionOrder = this.swapArrayItems(this.rightOptionOrder, this.selectedRightIndex, targetSlot);
        const nextPairStates = this.pairStates.slice();
        nextPairStates[targetSlot] = isCorrect ? "correct" : "wrong";

        this.inputLocked = true;
        let remaining = 0;
        let finished = false;
        const finishMove = (): void => {
            if (finished) {
                return;
            }
            finished = true;

            this.leftOptionNodes = nextLeftOptionNodes;
            this.leftOptionOrder = nextLeftOptionOrder;
            this.rightOptionNodes = nextRightOptionNodes;
            this.rightOptionOrder = nextRightOptionOrder;
            this.pairStates = nextPairStates;
            this.snapOptionNodesToSlots();
            this.selectedLeftIndex = -1;
            this.selectedRightIndex = -1;
            this.inputLocked = false;
            this.refreshSelectionState();
            this.tryFinishMatchingQuestion();
        };

        const onMoveFinished = (): void => {
            remaining -= 1;
            if (remaining <= 0) {
                finishMove();
            }
        };

        for (let i = 0; i < nextLeftOptionNodes.length; i += 1) {
            const node = nextLeftOptionNodes[i];
            const targetPosition = this.leftSlotPositions[i];
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
            finishMove();
        }
    }

    private applyLeftOptionOrderToView(): void {
        if (!this.matchingData) {
            return;
        }

        for (let i = 0; i < this.leftOptionNodes.length; i += 1) {
            const node = this.leftOptionNodes[i];
            const optionIndex = this.leftOptionOrder[i];
            if (!node) {
                continue;
            }

            node.stopAllActions();
            if (this.leftSlotPositions[i]) {
                node.setPosition(this.leftSlotPositions[i]);
            }

            const label = this.getLabelForOptionNode(node, this.initialLeftOptionNodes, this.leftOptionLabels);
            if (label) {
                let str = optionIndex >= 0 && optionIndex < this.matchingData.leftOptions.length
                    ? this.matchingData.leftOptions[optionIndex].text
                    : "";
                label.string = `${str}`;
            }
        }
    }

    private applyRightOptionOrderToView(): void {
        if (!this.matchingData) {
            return;
        }

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

            const label = this.getLabelForOptionNode(node, this.initialRightOptionNodes, this.rightOptionLabels);
            if (label) {
                let str = optionIndex >= 0 && optionIndex < this.matchingData.rightOptions.length
                    ? this.matchingData.rightOptions[optionIndex].text
                    : "";
                label.string = `${str}`;
            }
        }
    }

    private restoreOptionNodes(): void {
        if (this.initialLeftOptionNodes.length <= 0 && this.initialRightOptionNodes.length <= 0) {
            return;
        }

        this.leftOptionNodes = this.initialLeftOptionNodes.slice();
        this.rightOptionNodes = this.initialRightOptionNodes.slice();
        this.snapOptionNodesToSlots();
    }

    private snapOptionNodesToSlots(): void {
        for (let i = 0; i < this.leftOptionNodes.length; i += 1) {
            const node = this.leftOptionNodes[i];
            if (!node) {
                continue;
            }

            node.stopAllActions();
            if (this.leftSlotPositions[i]) {
                node.setPosition(this.leftSlotPositions[i]);
            }
        }

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

    private buildLeftOptionOrder(): number[] {
        if (!this.matchingData) {
            return [];
        }

        return this.matchingData.leftOptions.map((_, index) => index);
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

    private hideLegacyActionButtons(): void {
        const buttonNames = ["BtnSure", "BtnCancel", "BtnClose"];
        buttonNames.forEach((buttonName) => {
            const node = this.findContentNode(buttonName);
            if (node) {
                node.active = false;
                node.targetOff(this);
            }
        });
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

    private applyOptionFrame(node: cc.Node | null, state: OptionFrameState): void {
        if (!node) {
            return;
        }

        const sprite = node.getComponent(cc.Sprite);
        if (!sprite) {
            return;
        }

        let spriteFrame = QuestionView3.barDefaultFrame;
        if (state === "selected") {
            spriteFrame = QuestionView3.barSelectedFrame || QuestionView3.barDefaultFrame;
        } else if (state === "correct") {
            spriteFrame = QuestionView3.barCorrectFrame || QuestionView3.barDefaultFrame;
        } else if (state === "wrong") {
            spriteFrame = QuestionView3.barWrongFrame || QuestionView3.barDefaultFrame;
        }
        if (spriteFrame) {
            sprite.spriteFrame = spriteFrame;
        }

        this.applyOptionLabelOutline(node, state);
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
        resources.load(QuestionView3.BAR_CORRECT_PATH, cc.SpriteFrame, (error: Error | null, spriteFrame: cc.SpriteFrame) => {
            if (!error && spriteFrame) {
                QuestionView3.barCorrectFrame = spriteFrame;
                this.refreshSelectionState();
            }
        });
        resources.load(QuestionView3.BAR_WRONG_PATH, cc.SpriteFrame, (error: Error | null, spriteFrame: cc.SpriteFrame) => {
            if (!error && spriteFrame) {
                QuestionView3.barWrongFrame = spriteFrame;
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

    private isSelectedPairCorrect(): boolean {
        if (!this.matchingData || this.selectedLeftIndex < 0 || this.selectedRightIndex < 0) {
            return false;
        }

        const leftOptionIndex = this.leftOptionOrder[this.selectedLeftIndex];
        const rightOptionIndex = this.rightOptionOrder[this.selectedRightIndex];
        if (leftOptionIndex === undefined || rightOptionIndex === undefined) {
            return false;
        }

        const leftOption = this.matchingData.leftOptions[leftOptionIndex];
        const rightOption = this.matchingData.rightOptions[rightOptionIndex];
        if (!leftOption || !rightOption) {
            return false;
        }

        return this.matchingData.correctMatches.some((match) => {
            return match.leftId === leftOption.id && match.rightId === rightOption.id;
        });
    }

    private tryFinishMatchingQuestion(): void {
        const matchingData = this.matchingData;
        if (!matchingData || this.matchingResultSent) {
            return;
        }

        const totalCount = this.getRequiredPairCount(matchingData);
        if (totalCount <= 0 || this.getMatchedCount() < totalCount) {
            return;
        }

        const nowCount = this.getMatchingCorrectCount();
        this.matchingResultSent = true;
        this.inputLocked = true;
        if (this.isBattleMode) {
            this.showStateImage(nowCount >= totalCount);
        } else {
            this.resetStateImage();
        }

        this.node.stopAllActions();
        this.node.runAction(
            cc.sequence(
                cc.delayTime(QUESTION_RESULT_DELAY),
                cc.callFunc(() => {
                    if (this.onSelect && this.matchingData === matchingData) {
                        this.onSelect(nowCount, {
                            matchingCorrectCount: nowCount,
                            matchingTotalCount: totalCount,
                        });
                    }
                }),
            ),
        );
    }

    private getRequiredPairCount(matchingData: MatchingQuestionData = this.matchingData!): number {
        if (!matchingData) {
            return 0;
        }
        return Math.min(3, matchingData.leftOptions.length, matchingData.rightOptions.length);
    }

    private getMatchedCount(): number {
        let count = 0;
        for (let i = 0; i < this.pairStates.length; i += 1) {
            if (this.pairStates[i]) {
                count += 1;
            }
        }
        return count;
    }

    private getMatchingCorrectCount(): number {
        let count = 0;
        for (let i = 0; i < this.pairStates.length; i += 1) {
            if (this.pairStates[i] === "correct") {
                count += 1;
            }
        }
        return count;
    }

    private isSlotCorrect(index: number): boolean {
        return index >= 0 && index < this.pairStates.length && this.pairStates[index] === "correct";
    }

    private swapArrayItems<T>(source: T[], fromIndex: number, toIndex: number): T[] {
        const result = source.slice();
        if (fromIndex < 0 || fromIndex >= result.length) {
            return result;
        }

        const targetIndex = Math.max(0, Math.min(toIndex, result.length - 1));
        const temp = result[targetIndex];
        result[targetIndex] = result[fromIndex];
        result[fromIndex] = temp;
        return result;
    }

    private getLabelForOptionNode(
        node: cc.Node,
        initialNodes: Array<cc.Node | null>,
        labels: cc.Label[],
    ): cc.Label | null {
        const index = initialNodes.findIndex((item) => item === node);
        if (index >= 0 && labels[index]) {
            return labels[index];
        }
        return null;
    }

    private applyOptionLabelOutline(node: cc.Node, state: OptionFrameState): void {
        const outlineColor = this.getOutlineColorByState(state);
        this.getAllLabelsInNode(node).forEach((label) => {
            const outline = label.getComponent(cc.LabelOutline);
            if (outline) {
                outline.color = outlineColor;
            }
        });
    }

    private getOutlineColorByState(state: OptionFrameState): cc.Color {
        if (state === "correct") {
            return QuestionView3.LABEL_OUTLINE_CORRECT;
        }
        if (state === "wrong") {
            return QuestionView3.LABEL_OUTLINE_WRONG;
        }
        return QuestionView3.LABEL_OUTLINE_DEFAULT;
    }

    private getAllLabelsInNode(node: cc.Node): cc.Label[] {
        const labels: cc.Label[] = [];
        const stack: cc.Node[] = [node];
        while (stack.length > 0) {
            const current = stack.pop();
            if (!current) {
                continue;
            }

            const label = current.getComponent(cc.Label);
            if (label) {
                labels.push(label);
            }

            stack.push(...current.children);
        }
        return labels;
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

}
