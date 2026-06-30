import { OrderingQuestionData, QuestionOption } from "../Core/GameDefines";
import { QUESTION_RESULT_DELAY } from "./QuestionResultStamp";
import QuestionViewBase from "./QuestionViewBase";
import { closeQuestionViewTo, openQuestionViewFrom } from "./QuestionViewMotion";

const { ccclass, property } = cc._decorator;

export interface QuestionViewData {
    title?: string;
    aleart: string;
    ques: string;
    answer1: string;
    answer2: string;
    answer3?: string;
    answer4?: string;
    ordering?: OrderingQuestionData;
}

interface OrderingDisplayOption {
    id: string;
    text: string;
}

interface TokenBinding {
    option: OrderingDisplayOption;
    sourceNode: cc.Node;
    answerNode: cc.Node;
}

/** 排序 */
@ccclass
export default class QuestionView4 extends QuestionViewBase {
    private static readonly COLOR_CORRECT = new cc.Color(201, 249, 129, 255);
    private static readonly COLOR_DEFAULT = new cc.Color(220, 220, 220, 255);
    private static readonly COLOR_WRONG = new cc.Color(236, 128, 141, 255);
    private static readonly STATE_RIGHT_PATH = "Texture/questionUI/right";
    private static readonly STATE_WRONG_PATH = "Texture/questionUI/wrong";
    private static readonly SOURCE_AREA_OFFSET_Y = -15;
    private static readonly OPTION_SPACING_X = 30;
    private static readonly OPTION_OFFSET_Y = 15;
    private static readonly OPTION_ROW_WRAP_X = 160;
    private static readonly OPTION_ROW_STEP_Y = 60;
    private static stateRightFrame: cc.SpriteFrame | null = null;
    private static stateWrongFrame: cc.SpriteFrame | null = null;
    private static stateFramesLoadingStarted = false;

    @property(cc.Node)
    contentRoot: cc.Node = null;

    @property(cc.Node)
    leftLabelTitleNode: cc.Node = null;

    @property(cc.Label)
    leftLabel: cc.Label = null;

    @property(cc.Label)
    aleartLabel: cc.Label = null;

    @property(cc.Node)
    ansNode: cc.Node = null;

    @property(cc.Node)
    tempNode: cc.Node = null;

    @property(cc.Node)
    imgState: cc.Node = null;


    @property(cc.Node)
    submitNode: cc.Node = null;

    private onSelect: ((index: number) => void) | null = null;
    private inputLocked = false;
    private optionTemplate: cc.Node | null = null;
    private optionNodes: cc.Node[] = [];
    private selectedTokens: TokenBinding[] = [];
    private orderingData: OrderingQuestionData | null = null;
    private optionBaseX = 0;
    private optionBaseY = 0;
    private isBattleMode = false;

    protected onLoad(): void {
        this.createOverlayLayout();
        this.leftLabelTitleNode = this.findContentNode("labelLL");
        this.imgState = this.imgState || this.findContentNode("img_state");
        this.optionTemplate = this.tempNode;
        if (this.optionTemplate) {
            this.optionBaseX = this.optionTemplate.x;
            this.optionBaseY = this.optionTemplate.y;
        }
        this.preloadStateFrames();
        this.bindSubmitNode();
        this.hideImmediate();
        this.setSubmitVisible(false);
    }

    public initialize(onSelect: (index: number) => void): void {
        this.onSelect = onSelect;
    }

    public setActive(active: boolean): void {
        if (!active) {
            this.hideImmediate();
            return;
        }
        this.node.active = true;
    }

    public render(data: QuestionViewData): void {
        this.isBattleMode = !data.title || data.title.indexOf("/") < 0;
        this.orderingData = data.ordering || this.buildOrderingDataFromFallback(data);
        this.inputLocked = false;
        this.clearCurrentState();
        this.resetStateImage();
        this.setHeaderVisible(!this.isBattleMode);

        if (this.leftLabel) {
            this.leftLabel.string = this.getLeftLabelText(data);
        }

        if (this.aleartLabel) {
            this.aleartLabel.string = data.aleart;
        }

        if (this.orderingData) {
            this.createOptionNodes(this.buildDisplayOptions(this.orderingData.options));
        }
    }

    public openFrom(anchorNode: cc.Node | null, data: QuestionViewData): void {
        openQuestionViewFrom(this as any, anchorNode, data);
    }

    public closeTo(anchorNode: cc.Node | null, onComplete?: () => void): void {
        closeQuestionViewTo(this as any, anchorNode, onComplete);
    }

    public hideImmediate(): void {
        this.inputLocked = false;
        this.node.stopAllActions();
        if (this.contentRoot) {
            this.contentRoot.stopAllActions();
            this.contentRoot.opacity = 255;
            this.contentRoot.scale = 1;
            this.contentRoot.setPosition(this.getRestPosition());
        }
        this.clearCurrentState();
        this.resetStateImage();
        this.setSubmitVisible(false);
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

    private bindSubmitNode(): void {
        if (!this.submitNode) {
            return;
        }

        this.submitNode.targetOff(this);
        this.submitNode.on(cc.Node.EventType.TOUCH_END, () => {
            this.submitAnswer();
        }, this);
    }

    private createOptionNodes(options: OrderingDisplayOption[]): void {
        if (!this.optionTemplate || !this.optionTemplate.parent) {
            return;
        }

        options.forEach((option, index) => {
            const optionNode = cc.instantiate(this.optionTemplate);
            optionNode.active = true;
            optionNode.parent = this.optionTemplate.parent;
            optionNode.name = `OrderOption_${option.id}_${index}`;
            this.setOptionText(optionNode, option.text);
            this.syncOptionNodeSize(optionNode);
            this.setNodeColor(optionNode, QuestionView4.COLOR_DEFAULT);
            this.bindSourceNode(optionNode, option);
            this.optionNodes.push(optionNode);
        });

        this.optionTemplate.active = false;
        this.layoutSourceOptionNodes();
    }

    private bindSourceNode(node: cc.Node, option: OrderingDisplayOption): void {
        node.targetOff(this);
        node.on(cc.Node.EventType.TOUCH_END, () => {
            if (this.inputLocked || !node.active) {
                return;
            }
            this.selectOption(option, node);
        }, this);
    }

    private bindAnswerNode(node: cc.Node, binding: TokenBinding): void {
        node.targetOff(this);
        node.on(cc.Node.EventType.TOUCH_END, () => {
            if (this.inputLocked) {
                return;
            }
            this.removeSelectedToken(binding);
        }, this);
    }

    private selectOption(option: OrderingDisplayOption, sourceNode: cc.Node): void {
        if (!this.ansNode || !this.optionTemplate) {
            return;
        }

        sourceNode.active = false;
        const answerNode = cc.instantiate(this.optionTemplate);
        answerNode.active = true;
        answerNode.parent = this.ansNode;
        answerNode.name = `AnswerToken_${option.id}`;
        answerNode.y = 0;
        this.setOptionText(answerNode, option.text);
        this.syncOptionNodeSize(answerNode);
        this.setNodeColor(answerNode, QuestionView4.COLOR_DEFAULT);

        const binding: TokenBinding = {
            option,
            sourceNode,
            answerNode,
        };
        this.selectedTokens.push(binding);
        this.bindAnswerNode(answerNode, binding);
        this.refreshLayout(this.ansNode);
        if (this.selectedTokens.length !== this.orderingData.correctOrder.length) {
            return;
        }
        this.setSubmitVisible(true);
    }

    private removeSelectedToken(binding: TokenBinding): void {
        const index = this.selectedTokens.findIndex((item) => item === binding);
        if (index < 0) {
            return;
        }

        this.selectedTokens.splice(index, 1);
        if (binding.answerNode && cc.isValid(binding.answerNode)) {
            binding.answerNode.destroy();
        }
        if (binding.sourceNode && cc.isValid(binding.sourceNode)) {
            binding.sourceNode.active = true;
            this.setNodeColor(binding.sourceNode, QuestionView4.COLOR_DEFAULT);
        }
        this.refreshLayout(this.ansNode);
        if (this.selectedTokens.length !== this.orderingData.correctOrder.length) {
            this.setSubmitVisible(false);
        }
    }

    private submitAnswer(): void {
        if (this.inputLocked || !this.orderingData) {
            return;
        }

        if (this.selectedTokens.length !== this.orderingData.correctOrder.length) {
            return;
        }

        this.inputLocked = true;
        this.setSubmitVisible(false);

        const isCorrect = this.isOrderingCorrect();
        this.showStateImage(isCorrect);

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

    private isOrderingCorrect(): boolean {
        if (!this.orderingData) {
            return false;
        }

        if (this.selectedTokens.length !== this.orderingData.correctOrder.length) {
            return false;
        }

        return this.selectedTokens.every((token, index) => token.option.id === this.orderingData!.correctOrder[index]);
    }

    private showStateImage(isCorrect: boolean): void {
        if (!this.imgState) {
            return;
        }

        const sprite = this.imgState.getComponent(cc.Sprite);
        const spriteFrame = isCorrect ? QuestionView4.stateRightFrame : QuestionView4.stateWrongFrame;
        if (sprite && spriteFrame) {
            sprite.spriteFrame = spriteFrame;
        }

        this.imgState.stopAllActions();
        this.imgState.active = true;
        this.imgState.opacity = 255;
        this.imgState.scale = 1;
        this.imgState.angle = 0;
    }

    private resetStateImage(): void {
        if (!this.imgState) {
            return;
        }

        this.imgState.stopAllActions();
        this.imgState.active = false;
        this.imgState.opacity = 255;
        this.imgState.scale = 1;
        this.imgState.angle = 0;
    }

    private clearCurrentState(): void {
        this.selectedTokens = [];
        this.optionNodes.forEach((node) => {
            if (node && cc.isValid(node)) {
                node.destroy();
            }
        });
        this.optionNodes = [];

        if (this.ansNode) {
            this.ansNode.children.slice().forEach((child) => {
                child.destroy();
            });
        }
        if (this.tempNode) {
            this.tempNode.active = true;
            this.tempNode.setPosition(this.optionBaseX, this.optionBaseY);
            this.setNodeColor(this.tempNode, QuestionView4.COLOR_DEFAULT);
        }
        this.refreshLayout(this.ansNode);
    }

    private layoutSourceOptionNodes(): void {
        const visibleNodes = this.optionNodes.filter((node) => node && cc.isValid(node) && node.active);
        if (visibleNodes.length <= 0) {
            return;
        }

        const startWidth = this.getOptionNodeWidth(this.optionTemplate);
        let currentX = this.optionBaseX - (startWidth * 0.5);
        let currentY = this.optionBaseY + QuestionView4.OPTION_OFFSET_Y + QuestionView4.SOURCE_AREA_OFFSET_Y;

        visibleNodes.forEach((node, index) => {
            const width = this.getOptionNodeWidth(node);
            if (index > 0) {
                currentX += QuestionView4.OPTION_SPACING_X;
            }

            if (index > 0 && currentX + width > QuestionView4.OPTION_ROW_WRAP_X) {
                currentX = this.optionBaseX - (startWidth * 0.5);
                currentY -= QuestionView4.OPTION_ROW_STEP_Y;
            }

            node.setAnchorPoint(0, 0.5);
            node.setPosition(currentX, currentY);
            currentX += width;
        });
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

    private setOptionText(node: cc.Node | null, text: string): void {
        if (!node) {
            return;
        }
        const label = node.getComponentInChildren(cc.Label);
        if (label) {
            label.string = text;
        }
    }

    private setNodeColor(target: { node?: cc.Node; color?: cc.Color } | null, color: cc.Color): void {
        if (!target) {
            return;
        }
        if ("node" in target && target.node) {
            target.node.color = color;
            return;
        }
        target.color = color;
    }

    private refreshLayout(node: cc.Node | null): void {
        if (!node) {
            return;
        }
        const layout = node.getComponent(cc.Layout);
        if (layout) {
            layout.updateLayout();
        }
    }

    private syncOptionNodeSize(node: cc.Node | null): void {
        if (!node) {
            return;
        }

        const label = node.getComponentInChildren(cc.Label);
        if (label && (label as any)._forceUpdateRenderData) {
            (label as any)._forceUpdateRenderData(true);
        }

        this.refreshLayout(node);

        const layout = node.getComponent(cc.Layout) as any;
        const labelNode = label ? label.node : null;
        const labelWidth = labelNode ? labelNode.getContentSize().width : node.getContentSize().width;
        const paddingLeft = layout ? (layout._N$paddingLeft || 0) : 0;
        const paddingRight = layout ? (layout._N$paddingRight || 0) : 0;
        const minWidth = this.optionTemplate ? this.optionTemplate.getContentSize().width : node.getContentSize().width;
        const width = Math.max(minWidth, labelWidth + paddingLeft + paddingRight);
        const size = node.getContentSize();

        node.setContentSize(width, size.height);
        this.refreshLayout(node);
    }

    private getOptionNodeWidth(node: cc.Node | null): number {
        if (!node) {
            return 0;
        }

        this.syncOptionNodeSize(node);
        return node.width || node.getContentSize().width;
    }

    private preloadStateFrames(): void {
        if (QuestionView4.stateFramesLoadingStarted) {
            return;
        }
        QuestionView4.stateFramesLoadingStarted = true;

        const resources = (cc as any).resources;
        if (!resources || !resources.load) {
            return;
        }

        resources.load(QuestionView4.STATE_RIGHT_PATH, cc.SpriteFrame, (error: Error | null, spriteFrame: cc.SpriteFrame) => {
            if (!error && spriteFrame) {
                QuestionView4.stateRightFrame = spriteFrame;
            }
        });
        resources.load(QuestionView4.STATE_WRONG_PATH, cc.SpriteFrame, (error: Error | null, spriteFrame: cc.SpriteFrame) => {
            if (!error && spriteFrame) {
                QuestionView4.stateWrongFrame = spriteFrame;
            }
        });
    }

    private buildDisplayOptions(options: QuestionOption[]): OrderingDisplayOption[] {
        return options.map((option) => ({ id: option.id, text: option.text }));
    }

    private buildOrderingDataFromFallback(data: QuestionViewData): OrderingQuestionData | null {
        const fallbackOptions = [data.answer1, data.answer2, data.answer3, data.answer4]
            .filter((text): text is string => !!text)
            .map((text, index) => ({
                id: `fallback_order_${index}`,
                text,
            }));

        if (fallbackOptions.length === 0) {
            return null;
        }

        return {
            prompt: data.ques,
            options: fallbackOptions,
            correctOrder: fallbackOptions.map((option) => option.id),
        };
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

}
