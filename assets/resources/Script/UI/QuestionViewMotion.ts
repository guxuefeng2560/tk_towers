export interface QuestionViewMotionData {
    [key: string]: any;
}

export interface QuestionViewMotionHost {
    node: cc.Node;
    contentRoot: cc.Node | null;
    inputLocked: boolean;
    render(data: QuestionViewMotionData): void;
    hideImmediate(): void;
    ensureOverlaySize(): void;
    getAnchorPosition(anchorNode: cc.Node | null): cc.Vec2;
    getRestPosition(): cc.Vec2;
}

export function openQuestionViewFrom(host: QuestionViewMotionHost, anchorNode: cc.Node | null, data: QuestionViewMotionData): void {
    host.render(data);
    host.node.stopAllActions();
    if (host.contentRoot) {
        host.contentRoot.stopAllActions();
    }

    host.ensureOverlaySize();
    host.node.active = true;
    host.inputLocked = true;

    const startPosition = host.getAnchorPosition(anchorNode);
    const restPosition = host.getRestPosition();
    if (host.contentRoot) {
        host.contentRoot.opacity = 0;
        host.contentRoot.scale = anchorNode ? 0.25 : 0.8;
        host.contentRoot.setPosition(startPosition);
        host.contentRoot.runAction(
            cc.sequence(
                cc.spawn(
                    cc.fadeIn(0.18),
                    cc.scaleTo(0.2, 1).easing(cc.easeBackOut()),
                    cc.moveTo(0.2, restPosition).easing(cc.easeSineOut()),
                ),
                cc.callFunc(() => {
                    host.inputLocked = false;
                }),
            ),
        );
        return;
    }

    host.inputLocked = false;
}

export function closeQuestionViewTo(host: QuestionViewMotionHost, anchorNode: cc.Node | null, onComplete?: () => void): void {
    if (!host.node.active) {
        if (onComplete) {
            onComplete();
        }
        return;
    }

    host.inputLocked = true;
    const targetPosition = host.getAnchorPosition(anchorNode);

    if (host.contentRoot) {
        host.contentRoot.stopAllActions();
        host.contentRoot.runAction(
            cc.sequence(
                cc.spawn(
                    cc.fadeOut(0.18),
                    cc.scaleTo(0.18, anchorNode ? 0.22 : 0.8).easing(cc.easeSineIn()),
                    cc.moveTo(0.18, targetPosition).easing(cc.easeSineIn()),
                ),
                cc.callFunc(() => {
                    host.hideImmediate();
                    if (onComplete) {
                        onComplete();
                    }
                }),
            ),
        );
        return;
    }

    host.hideImmediate();
    if (onComplete) {
        onComplete();
    }
}
