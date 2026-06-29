import TKLog from "../log/TD_TKLog";
import ResLoadManager from "../TD_ResLoadManager";
import ObjectPool from "./TD_ObjectPool";



/**
 * 对象池控制器
 */
export default class ObjectPoolController {

    /**
     * 异步实例化指定路径的prefab
     * @param path prefab路径
     */
    static instantiateWithPathAsync(path: string): Promise<cc.Node> {
        return new Promise<cc.Node>((resolve, reject) => {
            ResLoadManager.getInstance().loadRes(path, cc.Prefab)
                .then(asset => {
                    if (asset == null) {
                        TKLog.LogWarn("ObjectPoolController.instantiateWithPathAsync 实例化对象失败，找不到资源 ", path);
                        resolve(null);
                    } else {
                        resolve(this.instantiatePrefab(asset));
                    }
                })
                .catch(e => {
                    TKLog.LogErr("ObjectPoolController.instantiateWithPathAsync 实例化对象失败 ", path, e);
                    reject(new Error("实例化对象失败"));
                });
        });
    }

    /**
     * 同步实例化指定路径的prefab
     * @param path 
     * @param context 
     * @param loadCompleteCallBack 
     */
    static instantiateWithPath(path: string, context: any, loadCompleteCallBack: Function) {
        ResLoadManager.getInstance().loadRes(path, cc.Prefab)
            .then(asset => {
                if (asset == null) {
                    TKLog.LogWarn("ObjectPoolController.instantiateWithPath 实例化对象失败，找不到资源", path);
                    return;
                }
                if (loadCompleteCallBack != null) {
                    loadCompleteCallBack.call(context, this.instantiatePrefab(asset));
                }
            })
            .catch(e => {
                TKLog.LogErr("ObjectPoolController.instantiateWithPath 实例化对象失败", path, e);
                if (loadCompleteCallBack != null) {
                    loadCompleteCallBack.call(context, null);
                }
            });
    }

    /**
     * 实例化prefab
     * 不管是否放入对象池的预制体，都用这个方法统一实例化
     * @param prefab
     */
    static instantiatePrefab(prefab: cc.Prefab): cc.Node {
        // TKLog.LogInfo("ObjectPoolController.instantiatePrefab. ", prefab.name);

        const prefabPool = prefab.data.getComponent("TD_PoolableComponent");
        if (prefabPool == null) {
            // TKLog.LogWarn(prefab.name, "中找不到PoolableComponent，直接实例化");
            return cc.instantiate(prefab);
        }

        const go = ObjectPool._GetPool(prefabPool).GetPooledInstance();
        if (go != null) {
            return go;
        } else {
            // TKLog.LogWarn(prefab.name, "没有通过pool获取，直接实例化");
            return this.instantiatePrefabWithoutPool(prefab);
        }
    }

    /**
     * 实例化prefab并设置位置
     * @param prefab 
     * @param position 
     */
    static instantiateWithPos(prefab: cc.Prefab, position: cc.Vec2): cc.Node {
        const go = this.instantiatePrefab(prefab);
        go.setPosition(position);
        return go;
    }

    static instantiatePrefabWithoutPool(prefab: cc.Prefab): cc.Node {
        // TKLog.LogInfo("ObjectPoolController.instantiatePrefabWithoutPool. ", prefab.name);

        const go = cc.instantiate(prefab);
        go.setPosition(cc.Vec2.ZERO);
        const pool = go.getComponent(PoolableComponent);
        if (pool) {
            pool.createdWithPoolController = true;
            go.removeComponent(PoolableComponent);
        }
        return go;
    }

    /**
     * 销毁/回收
     * @param obj 
     */
    static freeNode(obj: cc.Node) {
        // TKLog.LogInfo("ObjectPoolController.freeNode. ", obj.name);
        if (obj == null) {
            return;
        }
        const poolObj = obj.getComponent(PoolableComponent);
        if (poolObj == null) {
            // TKLog.LogInfo("对象", obj.name, "中找不到PoolableComponent，直接销毁");
            obj.destroy();
            return;
        }

        if (poolObj.myPool != null) {
            poolObj.myPool.Destroy(poolObj);
        } else {
            // if (!poolObj.createdWithPoolController) {
            //     TKLog.LogWarn("池中物", obj.name, " 不是通过ObjectPoolController实例化，直接销毁");
            // }
            obj.destroy();
        }
    }
}
