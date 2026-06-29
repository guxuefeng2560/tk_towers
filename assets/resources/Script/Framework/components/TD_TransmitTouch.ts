/**
 * @description 实现点击穿透
 * @use  绑在需要穿透的节点上即可
 */

const { ccclass, property } = cc._decorator;

@ccclass('TD_TransmitTouch')
export default class TD_TransmitTouch extends cc.Component {
    @property([cc.Component.EventHandler])
    protected clickEvents: cc.Component.EventHandler[] = new Array();

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
    }

    onEnable() {
        this.node["_touchListener"].setSwallowTouches(false);
    }

    touchStart(event: cc.Event.EventTouch) {
        if (this.clickEvents == null) {
            return;
        }
        cc.Component.EventHandler.emitEvents(this.clickEvents, event);
    }

    onDisable() {
        this.node["_touchListener"].setSwallowTouches(true);
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_START, this.touchStart, this);
    }
}
