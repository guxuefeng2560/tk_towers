/**
 * 按钮保护
 */

const { ccclass, property } = cc._decorator;

@ccclass('TD_ButtonSafe')
export default class TD_ButtonSafe extends cc.Component {
    @property({
        tooltip: "按钮保护时间，指定间隔内只能点击一次"
    })
    safeTime: number = 1.0;
    @property(cc.Node)
    NodeTarget: cc.Node = null;

    @property([cc.Component.EventHandler])
    protected AddClickEvents: cc.Component.EventHandler[] = new Array();

    clickEvents: any;

    start() {
        if (this.AddClickEvents && this.AddClickEvents.length > 0) {
            this.node.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
            this.node.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        }

        let button = this.getComponent(cc.Button);
        if (button) {
            this.clickEvents = button.clickEvents;

            this.node.on('click', () => {
                button.clickEvents = [];
                this.scheduleOnce((dt) => {
                    button.clickEvents = this.clickEvents;
                }, this.safeTime);
            }, this);
        } else {
            this.clickEvents = this.AddClickEvents;

            this.node.on('click', () => {
                cc.Component.EventHandler.emitEvents(this.AddClickEvents, event);
                this.AddClickEvents = [];
                this.scheduleOnce((dt) => {
                    this.AddClickEvents = this.clickEvents;
                }, this.safeTime);
            }, this);
        }
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
    }

    private touchStart(event: cc.Event.EventTouch) {
        this.btnUp();
    }

    private touchEnd(event: cc.Event.EventTouch) {
        this.btnBack();
        if (this.AddClickEvents && this.AddClickEvents.length > 0) {
            cc.Component.EventHandler.emitEvents(this.AddClickEvents, event);
            this.scheduleOnce((dt) => {
                this.AddClickEvents = this.clickEvents;
            }, this.safeTime);
        }
        this.AddClickEvents = [];
    }

    private btnUp() {
        if (!this.NodeTarget) {
            return;
        }

        cc.tween(this.NodeTarget)
            .to(0.1, { scale: 0.92 })
            .start();
    }

    private btnBack() {
        if (!this.NodeTarget) {
            return;
        }

        cc.tween(this.NodeTarget)
            .to(0.1, { scale: 1 })
            .start();
    }
}
