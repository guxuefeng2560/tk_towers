const { ccclass } = cc._decorator;

export interface ResultViewData {
    title: string;
    content: string;
    isWin: boolean;
}

@ccclass
export default class ResultView extends cc.Component {
    private backgroundNode: cc.Node | null = null;
    private resultLabel: cc.Label | null = null;
    private continueLabelNode: cc.Node | null = null;
    private retryButtonNode: cc.Node | null = null;
    private learnButtonNode: cc.Node | null = null;
    private onRetry: (() => void) | null = null;
    private onCloseWin: (() => void) | null = null;
    private lastData: ResultViewData | null = null;

    protected onLoad(): void {
        this.backgroundNode = this.node.getChildByName("bg");
        this.resultLabel = this.findLabel("LabelResult");
        this.continueLabelNode = this.node.getChildByName("LabelContinue");

        const buttonNodes = this.node.children
            .filter((child) => child.name === "btnAnswer1")
            .sort((left, right) => left.x - right.x);

        this.retryButtonNode = buttonNodes[0] || null;
        this.learnButtonNode = buttonNodes[1] || null;
    }

    public initialize(onRetry: () => void, onCloseWin: () => void): void {
        this.onRetry = onRetry;
        this.onCloseWin = onCloseWin;
        this.bindButton(this.node, () => {
            if (this.lastData && this.lastData.isWin && this.onCloseWin) {
                this.onCloseWin();
            }
        });
        this.bindButton(this.backgroundNode, () => {
            if (this.lastData && this.lastData.isWin && this.onCloseWin) {
                this.onCloseWin();
            }
        });
        this.bindButton(this.retryButtonNode, () => {
            if (this.onRetry) {
                this.onRetry();
            }
        });
        this.bindButton(this.learnButtonNode, () => {});
    }

    public setActive(active: boolean): void {
        if (this.node.active !== active) {
            this.node.active = active;
        }
    }

    public render(data: ResultViewData): void {
        const previous = this.lastData;

        if (this.resultLabel) {
            const resultText = data.content ? `${data.title}\n${data.content}` : data.title;
            if (!previous || previous.title !== data.title || previous.content !== data.content) {
                this.resultLabel.string = resultText;
            }
        }

        if (this.continueLabelNode) {
            if (this.continueLabelNode.active !== data.isWin) {
                this.continueLabelNode.active = data.isWin;
            }
        }

        if (this.retryButtonNode) {
            if (this.retryButtonNode.active === data.isWin) {
                this.retryButtonNode.active = !data.isWin;
            }
        }

        if (this.learnButtonNode) {
            if (this.learnButtonNode.active === data.isWin) {
                this.learnButtonNode.active = !data.isWin;
            }
        }

        this.lastData = { ...data };
    }

    public reapplyLastData(): void {
        if (this.lastData) {
            this.render(this.lastData);
        }
    }

    private findLabel(nodeName: string): cc.Label | null {
        const node = this.node.getChildByName(nodeName);
        return node ? node.getComponent(cc.Label) : null;
    }

    private bindButton(node: cc.Node | null, onClick: () => void): void {
        if (!node) {
            return;
        }

        node.targetOff(this);
        node.on(cc.Node.EventType.TOUCH_END, onClick, this);
    }
}
