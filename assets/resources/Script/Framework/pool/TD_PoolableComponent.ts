import ObjectPool from "./TD_ObjectPool";

const { ccclass, property } = cc._decorator;

@ccclass('TD_PoolableComponent')
export default class TD_PoolableComponent extends cc.Component {
    @property(cc.String)
    PoolID = "非常重要需要唯一";
    @property(cc.Integer)
    preloadCount = 0;

    myPool: ObjectPool = null;

    // 标记是否是通过池子创建的
    createdWithPoolController: boolean = false;

    unuse() {
        // this.node.emit("OnPutToPool");
        // TKLog.LogInfo("unuse:" + this.name);
    }

    reuse() {
        // this.node.emit("OnGetFromPool")
        // TKLog.LogInfo("reuse:" + this.name);
    }
}
