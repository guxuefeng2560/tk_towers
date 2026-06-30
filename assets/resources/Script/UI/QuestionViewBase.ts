const { ccclass } = cc._decorator;

@ccclass
export default class QuestionViewBase extends cc.Component {
    protected static readonly DISPLAY_OFFSET_X = 300;
    protected static readonly DISPLAY_OFFSET_Y = 60;

    public getRestPosition(): cc.Vec2 {
        return cc.v2(QuestionViewBase.DISPLAY_OFFSET_X, QuestionViewBase.DISPLAY_OFFSET_Y);
    }
}
