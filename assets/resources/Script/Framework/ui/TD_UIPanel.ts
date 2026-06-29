const { ccclass, property } = cc._decorator;

@ccclass("TD_UIPanel")
export default class UIPanel extends cc.Component {
    @property(cc.Canvas)
    _canvas: cc.Canvas = null;

    getCanvas(): cc.Canvas {
        if (this._canvas == null) {
            this._canvas = this.getComponent(cc.Canvas);
        }
        return this._canvas;
    }
}
