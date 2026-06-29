// import OneShotEffectMgr from "../TD_OneShotEffectMgr";
import ObjectPoolController from "../pool/TD_ObjectPoolController";

const { ccclass, property } = cc._decorator;

/**
 * 冒泡提示
 */
@ccclass('TD_PopInfo')
export default class TD_PopInfo extends cc.Component {
    @property(cc.Label)
    LabelInfo: cc.Label = null;
    @property(cc.Float)
    moveToDur = 1;
    @property(cc.Vec3)
    moveByPos: cc.Vec3 = cc.Vec3.ZERO;
    @property(cc.String)
    moveEasing = "sineOut";
    @property(cc.Float)
    fadeOutDur = 2;

    static popText(text: string, moveDur: number, fadeOutDur: number) {
        let root = cc.find("Canvas");
        // OneShotEffectMgr.getInstance().OneShot({
        //     path: "prefab/ui/TD_PopInfo",
        //     bind: root,
        //     position: cc.v3(0, 50, 0),
        //     afterLoad: (go: cc.Node) => {
        //         let com = go.getComponent('TD_PopInfo');
        //         if (com != null) {
        //             com.init(text, moveDur, fadeOutDur);
        //         } else {
        //             ObjectPoolController.freeNode(go);
        //         }
        //     }
        // })
    }

    init(info: string, moveDur: number, fadeOutDur: number) {
        this.node.width = 0;
        this.LabelInfo.string = info;
        this.node.opacity = 255;
        this.moveToDur = moveDur;
        this.fadeOutDur = fadeOutDur;
        this.node.runAction(
            cc.sequence(
                cc.moveBy(this.moveToDur, this.moveByPos.x, this.moveByPos.y),
                cc.fadeOut(this.fadeOutDur),
                cc.callFunc(() => {
                    //用完后，把label组件重置一下，方便下次取用
                    this.LabelInfo.string = "";
                    ObjectPoolController.freeNode(this.node);
                })
            )
        );
    }
}
