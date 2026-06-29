import { CheckRightQuestionData } from "../Core/GameDefines";
import { QUESTION_RESULT_DELAY, resetResultState } from "./QuestionResultStamp";
import { closeQuestionViewTo, openQuestionViewFrom } from "./QuestionViewMotion";

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
    private static readonly DISPLAY_OFFSET_X = 360;
    private static readonly DISPLAY_OFFSET_Y = 60;

    private static readonly LABEL_OUTLINE_DEFAULT = new cc.Color(154, 99, 50, 255);
    private static readonly LABEL_OUTLINE_CORRECT = new cc.Color(18, 110, 140, 255);
    private static readonly LABEL_OUTLINE_WRONG = new cc.Color(175, 49, 49, 255);

    private static readonly BAR_DEFAULT_PATH = "Texture/questionUI/bar_3";
    private static readonly BAR_CORRECT_PATH = "Texture/questionUI/bar_1";
    private static readonly BAR_WRONG_PATH = "Texture/questionUI/bar_2";

    private static barDefaultFrame: cc.SpriteFrame | null = null;
    private static barCorrectFrame: cc.SpriteFrame | null = null;
    private static barWrongFrame: cc.SpriteFrame | null = null;
    private static framesLoadingStarted = false;

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

    @property(cc.Label)
    answer1Label: cc.Label = null;

    @property(cc.Label)
    answer2Label: cc.Label = null;

    @property(cc.Label)
    saLabel: cc.Label = null;

    @property(cc.Label)
    sbLabel: cc.Label = null;

    @property(cc.Node)
    rightNode: cc.Node = null;

    @property(cc.Node)
    wrongNode: cc.Node = null;

    private answerNodes: cc.Node[] = [];
    private answerLabels: Array<cc.Label | null> = [];
    private answerOutlineLabels: Array<cc.Label | null> = [];
    private onSelect: ((index: number) => void) | null = null;
    private inputLocked = false;
    private selectedIndex = -1;
    private correctAnswerIndex = 0;
    private isBattleMode = false;

    protected onLoad(): void {
        this.createOverlayLayout();
        this.leftLabelTitleNode = this.leftLabelTitleNode || this.findContentNode("labelLL");
        this.leftLabel = this.leftLabel || this.findLabel("LabelLeft");
        this.aleartLabel = this.aleartLabel || this.findLabel("LabelAlert");
        this.quesLabel = this.quesLabel || this.findLabel("LabelQ");
        this.saLabel = this.saLabel || this.findLabel("sA");
        this.sbLabel = this.sbLabel || this.findLabel("sB");
        this.answerNodes = [this.answer1Node, this.answer2Node].filter((node): node is cc.Node => !!node);
        this.answerLabels = [this.answer1Label, this.answer2Label];
        this.answerOutlineLabels = [this.answer1Label, this.answer2Label, this.saLabel, this.sbLabel];
        this.preloadAnswerFrames();
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
        this.resetMarkerState();
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
            this.answer1Label.string = optionTexts && optionTexts[0] ? optionTexts[0] : (data.answer1 || "");
        }
        if (this.answer2Label) {
            this.answer2Label.string = optionTexts && optionTexts[1] ? optionTexts[1] : (data.answer2 || "");
        }
        if (this.saLabel) {
            this.saLabel.string = "A";
        }
        if (this.sbLabel) {
            this.sbLabel.string = "B";
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
        this.selectedIndex = -1;
        this.node.stopAllActions();
        if (this.contentRoot) {
            this.contentRoot.stopAllActions();
            this.contentRoot.opacity = 255;
            this.contentRoot.scale = 1;
            this.contentRoot.setPosition(this.getRestPosition());
        }
        this.resetAnswerState();
        this.resetMarkerState();
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
        this.resetAnswerState();
        this.resetMarkerState();

        const isCorrect = this.selectedIndex === this.correctAnswerIndex;
        if (isCorrect) {
            this.applyAnswerVisualState(this.selectedIndex, "correct");
            this.showMarkerAtAnswer(this.rightNode, this.correctAnswerIndex);
        } else {
            this.applyAnswerVisualState(this.selectedIndex, "wrong");
            this.showMarkerAtAnswer(this.wrongNode, this.selectedIndex);
            if (this.correctAnswerIndex >= 0 && this.correctAnswerIndex < this.answerNodes.length) {
                this.applyAnswerVisualState(this.correctAnswerIndex, "correct");
                this.showMarkerAtAnswer(this.rightNode, this.correctAnswerIndex);
            }
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
        for (let i = 0; i < this.answerNodes.length; i += 1) {
            this.applyAnswerVisualState(i, "default");
        }
        this.setOutlineColor(this.answerOutlineLabels, QuestionView6.LABEL_OUTLINE_DEFAULT);
    }

    private resetMarkerState(): void {
        resetResultState(this.rightNode);
        resetResultState(this.wrongNode);
    }

    private applyAnswerVisualState(index: number, state: "default" | "correct" | "wrong"): void {
        const answerNode = this.answerNodes[index] || null;
        if (!answerNode) {
            return;
        }

        const sprite = answerNode.getComponent(cc.Sprite);
        if (sprite) {
            let spriteFrame = QuestionView6.barDefaultFrame;
            if (state === "correct") {
                spriteFrame = QuestionView6.barCorrectFrame || spriteFrame;
            } else if (state === "wrong") {
                spriteFrame = QuestionView6.barWrongFrame || spriteFrame;
            }
            if (spriteFrame) {
                sprite.spriteFrame = spriteFrame;
            }
        }

        const label = this.answerLabels[index];
        const outline = label ? label.getComponent(cc.LabelOutline) : null;
        if (outline) {
            outline.color = this.getOutlineColorByState(state);
        }

        const shortLabel = index === 0 ? this.saLabel : this.sbLabel;
        const shortOutline = shortLabel ? shortLabel.getComponent(cc.LabelOutline) : null;
        if (shortOutline) {
            shortOutline.color = this.getOutlineColorByState(state);
        }
    }

    private getOutlineColorByState(state: "default" | "correct" | "wrong"): cc.Color {
        if (state === "correct") {
            return QuestionView6.LABEL_OUTLINE_CORRECT;
        }
        if (state === "wrong") {
            return QuestionView6.LABEL_OUTLINE_WRONG;
        }
        return QuestionView6.LABEL_OUTLINE_DEFAULT;
    }

    private setOutlineColor(labels: Array<cc.Label | null>, color: cc.Color): void {
        labels.forEach((label) => {
            const outline = label ? label.getComponent(cc.LabelOutline) : null;
            if (outline) {
                outline.color = color;
            }
        });
    }

    private showMarkerAtAnswer(markerNode: cc.Node | null, answerIndex: number): void {
        if (!markerNode || answerIndex < 0 || answerIndex >= this.answerNodes.length) {
            return;
        }

        const answerNode = this.answerNodes[answerIndex];
        if (!answerNode) {
            return;
        }

        markerNode.stopAllActions();
        markerNode.active = true;
        markerNode.opacity = 255;
        markerNode.scale = 1;
        markerNode.angle = 0;
        markerNode.y = answerNode.y;
    }

    private preloadAnswerFrames(): void {
        if (QuestionView6.framesLoadingStarted) {
            return;
        }
        QuestionView6.framesLoadingStarted = true;

        const resources = (cc as any).resources;
        if (!resources || !resources.load) {
            return;
        }

        resources.load(QuestionView6.BAR_DEFAULT_PATH, cc.SpriteFrame, (error: Error | null, spriteFrame: cc.SpriteFrame) => {
            if (!error && spriteFrame) {
                QuestionView6.barDefaultFrame = spriteFrame;
                this.resetAnswerState();
            }
        });
        resources.load(QuestionView6.BAR_CORRECT_PATH, cc.SpriteFrame, (error: Error | null, spriteFrame: cc.SpriteFrame) => {
            if (!error && spriteFrame) {
                QuestionView6.barCorrectFrame = spriteFrame;
            }
        });
        resources.load(QuestionView6.BAR_WRONG_PATH, cc.SpriteFrame, (error: Error | null, spriteFrame: cc.SpriteFrame) => {
            if (!error && spriteFrame) {
                QuestionView6.barWrongFrame = spriteFrame;
            }
        });
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
        return cc.v2(QuestionView6.DISPLAY_OFFSET_X, QuestionView6.DISPLAY_OFFSET_Y);
    }
}
