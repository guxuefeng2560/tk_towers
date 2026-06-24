import { CheckRightQuestionData } from "../Core/GameDefines";
import { playResultStamp, QUESTION_RESULT_DELAY, resetResultState } from "./QuestionResultStamp";

const { ccclass, property } = cc._decorator;

export interface QuestionViewData {
    title?: string;
    aleart: string;
    ques: string;
    answer1: string;
    answer2: string;
    correctAnswerIndex?: number;
    checkRight?: CheckRightQuestionData;
}

/** 判断题 */
@ccclass
export default class QuestionView6 extends cc.Component {
    private static readonly DISPLAY_OFFSET_X = 200;
    private static readonly COLOR_CORRECT = new cc.Color(201, 249, 129, 255);
    private static readonly COLOR_DEFAULT = new cc.Color(220, 220, 220, 255);
    private static readonly COLOR_WRONG = new cc.Color(236, 128, 141, 255);

    @property(cc.Node)
    contentRoot: cc.Node = null;

    @property(cc.Node)
    leftLabelTitleNode: cc.Node = null;

    @property(cc.Label)
    leftLabel: cc.Label = null;

    @property(cc.Label)
    aleartLabel: cc.Label = null;

    @property(cc.Label)
    quesLabel: cc.Label = null;

    @property(cc.Node)
    answer1Node: cc.Node = null;

    @property(cc.Node)
    answer2Node: cc.Node = null;

    @property(cc.Node)
    resultNode: cc.Node = null;

    @property(cc.Label)
    resultLabel: cc.Label = null;

    private answer1Label: cc.Label | null = null;
    private answer2Label: cc.Label | null = null;
    private onSelect: ((index: number) => void) | null = null;
    private inputLocked = false;
    private selectedIndex = -1;
    private correctAnswerIndex = 0;
    private answerNodes: cc.Node[] = [];
    private isBattleMode = false;

    protected onLoad(): void {
        this.createOverlayLayout();
        this.leftLabelTitleNode = this.leftLabelTitleNode || this.findContentNode("labelLL");
        this.leftLabel = this.leftLabel || this.findLabel("LabelLeft");
        this.aleartLabel = this.aleartLabel || this.findLabel("LabelAlert");
        this.quesLabel = this.quesLabel || this.findLabel("LabelQ");
        this.answer1Label = this.findLabel("LabelAns1");
        this.answer2Label = this.findLabel("LabelAns2");
        this.resultLabel = this.resultLabel || this.findResultLabel();
        this.answerNodes = [this.answer1Node, this.answer2Node].filter((node): node is cc.Node => !!node);
        this.hideImmediate();
    }

    public initialize(onSelect: (index: number) => void): void {
        this.onSelect = onSelect;
        this.bindAnswerNode(this.answer1Node, 0);
        this.bindAnswerNode(this.answer2Node, 1);
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
        const checkRight = data.checkRight;
        const optionTexts = checkRight && checkRight.options.length > 0
            ? checkRight.options.map((option) => option.text)
            : null;
        this.correctAnswerIndex = this.getCorrectAnswerIndex(data);
        this.selectedIndex = -1;
        this.inputLocked = false;
        this.resetAnswerState();
        resetResultState(this.resultNode);
        this.setHeaderVisible(!this.isBattleMode);

        if (this.leftLabel) {
            this.leftLabel.string = this.getLeftLabelText(data);
        }
        if (this.aleartLabel) {
            this.aleartLabel.string = data.aleart;
        }
        if (this.quesLabel) {
            this.quesLabel.string = checkRight ? checkRight.prompt : (data.ques || "");
        }
        if (this.answer1Label) {
            this.answer1Label.string = optionTexts && optionTexts[0] ? optionTexts[0] : (data.answer1 || "正确");
        }
        if (this.answer2Label) {
            this.answer2Label.string = optionTexts && optionTexts[1] ? optionTexts[1] : (data.answer2 || "错误");
        }
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
        this.selectedIndex = -1;
        this.node.stopAllActions();
        if (this.contentRoot) {
            this.contentRoot.stopAllActions();
            this.contentRoot.opacity = 255;
            this.contentRoot.scale = 1;
            this.contentRoot.setPosition(this.getRestPosition());
        }
        this.resetAnswerState();
        resetResultState(this.resultNode);
        this.node.active = false;
    }

    private createOverlayLayout(): void {
        const originalChildren = this.node.children.slice();

        this.contentRoot = new cc.Node("ContentRoot");
        this.contentRoot.parent = this.node;

        originalChildren.forEach((child) => {
            if (child !== this.contentRoot) {
                child.parent = this.contentRoot;
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

    private findResultLabel(): cc.Label | null {
        if (!this.resultNode || this.resultNode.childrenCount <= 0) {
            return null;
        }
        return this.resultNode.children[0].getComponent(cc.Label);
    }

    private bindAnswerNode(node: cc.Node | null, index: number): void {
        if (!node) {
            return;
        }

        node.targetOff(this);
        node.on(cc.Node.EventType.TOUCH_END, () => {
            if (!this.inputLocked) {
                this.judgeAnswer(index);
            }
        }, this);
    }

    private judgeAnswer(index: number): void {
        if (index < 0 || index >= this.answerNodes.length) {
            return;
        }

        this.inputLocked = true;
        this.selectedIndex = index;

        const isCorrect = this.selectedIndex === this.correctAnswerIndex;
        if (isCorrect) {
            this.setNodeColor(this.answerNodes[this.selectedIndex], QuestionView6.COLOR_CORRECT);
        } else {
            this.setNodeColor(this.answerNodes[this.selectedIndex], QuestionView6.COLOR_WRONG);
            if (this.correctAnswerIndex >= 0 && this.correctAnswerIndex < this.answerNodes.length) {
                this.setNodeColor(this.answerNodes[this.correctAnswerIndex], QuestionView6.COLOR_CORRECT);
            }
        }

        playResultStamp(
            this.resultNode,
            this.resultLabel,
            isCorrect,
            QuestionView6.COLOR_CORRECT,
            QuestionView6.COLOR_WRONG,
        );

        this.node.stopAllActions();
        this.node.runAction(
            cc.sequence(
                cc.delayTime(QUESTION_RESULT_DELAY),
                cc.callFunc(() => {
                    if (this.onSelect) {
                        this.onSelect(this.selectedIndex);
                    }
                }),
            ),
        );
    }

    private setHeaderVisible(visible: boolean): void {
        if (this.leftLabelTitleNode) {
            this.leftLabelTitleNode.active = visible;
        }
        if (this.leftLabel) {
            this.leftLabel.node.active = visible;
        }
    }

    private resetAnswerState(): void {
        for (let i = 0; i < this.answerNodes.length; i += 1) {
            this.setNodeColor(this.answerNodes[i], QuestionView6.COLOR_DEFAULT);
        }
    }

    private setNodeColor(target: cc.Node | null, color: cc.Color): void {
        if (!target) {
            return;
        }
        target.color = color;
    }

    private getCorrectAnswerIndex(data: QuestionViewData): number {
        if (data.checkRight) {
            const optionIndex = data.checkRight.options.findIndex(
                (option) => option.id === data.checkRight!.correctOptionId,
            );
            if (optionIndex >= 0) {
                return optionIndex;
            }
        }

        const index = data.correctAnswerIndex ?? 0;
        if (index < 0 || index > 1) {
            return 0;
        }
        return index;
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
        return cc.v2(QuestionView6.DISPLAY_OFFSET_X, 0);
    }
}
