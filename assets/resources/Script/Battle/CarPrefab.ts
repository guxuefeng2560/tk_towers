const { ccclass, property } = cc._decorator;

@ccclass
export default class CarPrefab extends cc.Component {
    private static readonly SAW_SHOW_ANIM_DURATION = 0.15;
    private static readonly SAW_HIT_SHAKE_AMPLITUDE = 3;
    private static readonly SAW_HIT_SHAKE_REPEAT = 2;

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
        if (!this.sawNode) {
            return;
        }

        const stateKey = "__sawVisible";
        const previousVisible = !!(this.sawNode as any)[stateKey];
        if (previousVisible === visible) {
            if (!visible) {
                this.sawNode.active = false;
                this.sawNode.scaleX = 1;
                this.sawNode.angle = 0;
            }
            return;
        }
        (this.sawNode as any)[stateKey] = visible;
        this.sawNode.stopAllActions();

        if (!visible) {
            this.sawNode.active = false;
            this.sawNode.scaleX = 1;
            this.sawNode.angle = 0;
            return;
        }

        this.sawNode.active = true;
        this.sawNode.scaleX = 0;
        this.sawNode.runAction(
            cc.scaleTo(CarPrefab.SAW_SHOW_ANIM_DURATION, 1, this.sawNode.scaleY).easing(cc.easeSineOut()),
        );
    }

    public setShieldVisible(visible: boolean): void {
        this.ensureRefs();
        if (this.shieldNode) {
            this.shieldNode.active = visible;
        }
    }

    public playSawHitFeedback(): void {
        this.ensureRefs();
        if (!this.sawNode || !this.sawNode.active) {
            return;
        }

        const sawNode = this.sawNode;
        const playingKey = "__sawHitFeedbackPlaying";
        if ((sawNode as any)[playingKey]) {
            return;
        }
        (sawNode as any)[playingKey] = true;
        const basePosition = sawNode.getPosition();
        const baseScaleX = sawNode.scaleX;
        const baseScaleY = sawNode.scaleY;

        const offsetA = cc.v2(0, -CarPrefab.SAW_HIT_SHAKE_AMPLITUDE);
        const offsetB = cc.v2(0, CarPrefab.SAW_HIT_SHAKE_AMPLITUDE);

        sawNode.stopAllActions();
        sawNode.setPosition(basePosition);
        sawNode.scaleX = baseScaleX;
        sawNode.scaleY = baseScaleY;

        let tween = cc.tween(sawNode);
        for (let index = 0; index < CarPrefab.SAW_HIT_SHAKE_REPEAT; index += 1) {
            tween = tween
                .to(0.05, {scaleX: 0.9}) //{ y: basePosition.y + offsetA.y})
                .to(0.05, {scaleX: 1.1}) //{ y: basePosition.y + offsetB.y})
                .to(0.05, {scaleX: 1.0}) //{ y: basePosition.y });
        }

        tween
            .call(() => {
                sawNode.setPosition(basePosition);
                sawNode.scaleX = baseScaleX;
                sawNode.scaleY = baseScaleY;
                (sawNode as any)[playingKey] = false;
            })
            .start();
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
