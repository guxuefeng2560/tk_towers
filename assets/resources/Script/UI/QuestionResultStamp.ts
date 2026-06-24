export const QUESTION_RESULT_DELAY = 1;

const RESULT_STAMP_ANGLE = -12;

export function playResultStamp(
    resultNode: cc.Node | null,
    resultLabel: cc.Label | null,
    isCorrect: boolean,
    correctColor: cc.Color,
    wrongColor: cc.Color,
): void {
    if (!resultNode) {
        return;
    }

    resultNode.color = isCorrect ? correctColor : wrongColor;
    if (resultLabel) {
        resultLabel.string = isCorrect ? "正确" : "错误";
    }

    resultNode.stopAllActions();
    resultNode.active = true;
    resultNode.opacity = 0;
    resultNode.scale = 2.2;
    resultNode.angle = RESULT_STAMP_ANGLE - 8;
    resultNode.runAction(
        cc.sequence(
            cc.spawn(
                cc.fadeIn(0.05),
                cc.scaleTo(0.08, 0.86).easing(cc.easeSineIn()),
                cc.rotateTo(0.08, RESULT_STAMP_ANGLE),
            ),
            cc.scaleTo(0.1, 1.08).easing(cc.easeBackOut()),
            cc.scaleTo(0.05, 1),
        ),
    );
}

export function resetResultState(resultNode: cc.Node | null): void {
    if (!resultNode) {
        return;
    }

    resultNode.stopAllActions();
    resultNode.active = false;
    resultNode.opacity = 255;
    resultNode.scale = 1;
    resultNode.angle = RESULT_STAMP_ANGLE;
}
