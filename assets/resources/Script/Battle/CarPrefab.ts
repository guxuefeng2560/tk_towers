const { ccclass, property } = cc._decorator;

@ccclass
export default class CarPrefab extends cc.Component {
    @property(cc.Node)
    bodyNode: cc.Node = null;

    @property(cc.Node)
    sawNode: cc.Node = null;

    @property(cc.Node)
    hpRootNode: cc.Node = null;

    @property(cc.ProgressBar)
    hpProgressBar: cc.ProgressBar = null;

    @property(cc.Node)
    shieldNode: cc.Node = null;

    protected onLoad(): void {
        this.ensureRefs();
    }

    public ensureRefs(): void {
        this.bodyNode = this.resolveBodyNode();
        this.sawNode = this.sawNode || this.node.getChildByName("teshu2");
        this.hpRootNode = this.hpRootNode || this.node.getChildByName("progressBg");
        this.shieldNode = this.shieldNode || this.node.getChildByName("Nodebuff");

        if (!this.hpProgressBar && this.hpRootNode) {
            const progressNode = this.hpRootNode.getChildByName("progressBar");
            this.hpProgressBar = progressNode ? progressNode.getComponent(cc.ProgressBar) : null;
        }
    }

    public setBodySpriteFrame(spriteFrame: cc.SpriteFrame | null): void {
        this.ensureRefs();
        const sprite = this.getBodySprite();
        if (!sprite) {
            return;
        }
        sprite.spriteFrame = spriteFrame;
    }

    public setCarVisible(visible: boolean): void {
        this.node.active = visible;
    }

    public setSawVisible(visible: boolean): void {
        this.ensureRefs();
        if (this.sawNode) {
            this.sawNode.active = visible;
        }
    }

    public setShieldVisible(visible: boolean): void {
        this.ensureRefs();
        if (this.shieldNode) {
            this.shieldNode.active = visible;
        }
    }

    public setHpVisible(visible: boolean): void {
        this.ensureRefs();
        if (this.hpRootNode) {
            this.hpRootNode.active = visible;
        }
    }

    public setHpProgress(progress: number): void {
        this.ensureRefs();
        if (!this.hpProgressBar) {
            return;
        }
        this.hpProgressBar.progress = Math.max(0, Math.min(1, progress));
    }

    private resolveBodyNode(): cc.Node | null {
        if (this.bodyNode && cc.isValid(this.bodyNode) && this.bodyNode !== this.node) {
            return this.bodyNode;
        }
        return this.node.getChildByName("box") || this.bodyNode || this.node;
    }

    private getBodySprite(): cc.Sprite | null {
        const bodyNode = this.resolveBodyNode();
        return bodyNode ? bodyNode.getComponent(cc.Sprite) : null;
    }
}
