import { ImageChoiceQuestionData } from "../Core/GameDefines";
import { playResultStamp, QUESTION_RESULT_DELAY, resetResultState } from "./QuestionResultStamp";

const { ccclass, property } = cc._decorator;

export interface QuestionViewData {
    title?: string;
    aleart: string;
    ques: string;
    answer1: string;
    answer2: string;
    answer3?: string;
    correctAnswerIndex?: number;
    imageChoice?: ImageChoiceQuestionData;
}

/** 看图选择 */
@ccclass
export default class QuestionView2 extends cc.Component {
    private static readonly DISPLAY_OFFSET_X = 200;
    private static readonly COLOR_CORRECT = new cc.Color(201, 249, 129, 255);
    private static readonly COLOR_DEFAULT = new cc.Color(220, 220, 220, 255);
    private static readonly COLOR_WRONG = new cc.Color(236, 128, 141, 255);
    private static readonly COLOR_SELECTED = new cc.Color(250, 206, 145, 255);

    @property(cc.Node)
    contentRoot: cc.Node = null;

    @property(cc.Node)
    leftLabelTitleNode: cc.Node = null;

    @property(cc.Label)
    leftLabel: cc.Label = null;

    @property(cc.Label)
    aleartLabel: cc.Label = null;

    @property(cc.Node)
    quesPic: cc.Node = null;

    @property(cc.Label)
    answer1Label: cc.Label = null;

    @property(cc.Label)
    answer2Label: cc.Label = null;

    @property(cc.Label)
    answer3Label: cc.Label = null;

    @property(cc.Node)
    answer1Node: cc.Node = null;

    @property(cc.Node)
    answer2Node: cc.Node = null;

    @property(cc.Node)
    answer3Node: cc.Node = null;

    @property(cc.Node)
    resultNode: cc.Node = null;

    @property(cc.Label)
    resultLabel: cc.Label = null;

    private onSelect: ((index: number) => void) | null = null;
    private lastData: QuestionViewData | null = null;
    private inputLocked = false;
    private selectedIndex = -1;
    private correctAnswerIndex = 0;
    private answerNodes: cc.Node[] = [];
    private answerSprites: Array<cc.Sprite | null> = [];
    private quesPicSprite: cc.Sprite | null = null;
    private isBattleMode = false;

    protected onLoad(): void {
        this.createOverlayLayout();
        this.leftLabelTitleNode = this.findContentNode("labelLL");
        this.answerNodes = [this.answer1Node, this.answer2Node, this.answer3Node];
        this.answerSprites = this.answerNodes.map((node) => (node ? node.getComponent(cc.Sprite) : null));
        this.quesPicSprite = this.quesPic ? this.quesPic.getComponent(cc.Sprite) : null;
        this.hideImmediate();
    }

    public initialize(onSelect: (index: number) => void): void {
        this.onSelect = onSelect;
        this.bindAnswerNode(this.answer1Node, 0);
        this.bindAnswerNode(this.answer2Node, 1);
        this.bindAnswerNode(this.answer3Node, 2);
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
        const imageChoice = data.imageChoice;
        const optionTexts = imageChoice && imageChoice.options.length > 0
            ? imageChoice.options.map((option) => option.text)
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
        if (this.answer1Label) {
            this.answer1Label.string = `A. ${optionTexts && optionTexts[0] ? optionTexts[0] : data.answer1}`;
        }
        if (this.answer2Label) {
            this.answer2Label.string = `B. ${optionTexts && optionTexts[1] ? optionTexts[1] : data.answer2}`;
        }
        if (this.answer3Label) {
            this.answer3Label.string = `C. ${optionTexts && optionTexts[2] ? optionTexts[2] : (data.answer3 || "")}`;
        }
        this.loadQuestionImage(imageChoice ? imageChoice.imagePath : "");
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

    private bindAnswerNode(node: cc.Node | null, index: number): void {
        if (!node) {
            return;
        }

        node.targetOff(this);
        node.on(cc.Node.EventType.TOUCH_END, () => {
            if (!this.inputLocked) {
                this.selectAnswer(index);
            }
        }, this);
    }

    private selectAnswer(index: number): void {
        if (index < 0 || index >= this.answerNodes.length) {
            return;
        }

        this.selectedIndex = index;
        for (let i = 0; i < this.answerSprites.length; i += 1) {
            this.setNodeColor(this.answerNodes[i], i === index
                ? QuestionView2.COLOR_SELECTED
                : QuestionView2.COLOR_DEFAULT);
        }
        this.submitAnswer();
    }

    private submitAnswer(): void {
        if (this.inputLocked || this.selectedIndex < 0) {
            return;
        }

        this.inputLocked = true;

        const isCorrect = this.selectedIndex === this.correctAnswerIndex;
        if (isCorrect) {
            this.setNodeColor(this.answerNodes[this.selectedIndex], QuestionView2.COLOR_CORRECT);
            playResultStamp(
                this.resultNode,
                this.resultLabel,
                true,
                QuestionView2.COLOR_CORRECT,
                QuestionView2.COLOR_WRONG,
            );
        } else {
            this.setNodeColor(this.answerNodes[this.selectedIndex], QuestionView2.COLOR_WRONG);
            this.setNodeColor(this.answerNodes[this.correctAnswerIndex], QuestionView2.COLOR_CORRECT);
            playResultStamp(
                this.resultNode,
                this.resultLabel,
                false,
                QuestionView2.COLOR_CORRECT,
                QuestionView2.COLOR_WRONG,
            );
        }

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
        for (let i = 0; i < this.answerSprites.length; i += 1) {
            this.setNodeColor(this.answerNodes[i], QuestionView2.COLOR_DEFAULT);
        }
    }

    private loadQuestionImage(imagePath: string): void {
        if (!this.quesPicSprite || !imagePath) {
            return;
        }

        const resources = (cc as any).resources;
        if (!resources || !resources.load) {
            return;
        }

        resources.load(imagePath, cc.SpriteFrame, (error: Error | null, spriteFrame: cc.SpriteFrame) => {
            if (error || !spriteFrame || !this.quesPicSprite || !this.lastData) {
                return;
            }

            if (this.lastData.imageChoice && this.lastData.imageChoice.imagePath === imagePath) {
                this.quesPicSprite.spriteFrame = spriteFrame;
            }
        });
    }

    private setNodeColor(target: { color?: cc.Color } | null, color: cc.Color): void {
        if (!target) {
            return;
        }
        target.color = color;
    }

    private getCorrectAnswerIndex(data: QuestionViewData): number {
        if (!data.imageChoice) {
            return data.correctAnswerIndex ?? 0;
        }

        const optionIndex = data.imageChoice.options.findIndex(
            (option) => option.id === data.imageChoice!.correctOptionId,
        );
        if (optionIndex >= 0) {
            return optionIndex;
        }

        return data.correctAnswerIndex ?? 0;
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
        return cc.v2(QuestionView2.DISPLAY_OFFSET_X, 0);
    }
}
