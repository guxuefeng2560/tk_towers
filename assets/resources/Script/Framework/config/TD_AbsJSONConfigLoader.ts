import Singleton from "../TD_Singleton";
import { IConfigLoader } from "./TD_IConfigLoader";
import TKLog from "../log/TD_TKLog";
import ResLoadManager from "../TD_ResLoadManager";


/**
 * 配置文件基础加载器
 */
export abstract class AbsJSONNConfigLoader<T> extends Singleton implements IConfigLoader {
    /** 获取配置文件路径 */
    protected abstract configPath(): string;
    /** 所有配置 */
    protected configs: { [key: number]: T } = {}
    /** 加载完成后的回调 */
    public afterLoadCallBack: Function = null;

    /**
     * 手动预加载
     * @param afterLoadCallBack 加载完成后的回调
     */
    preload(afterLoadCallBack: Function = null) {
        this.afterLoadCallBack = afterLoadCallBack;
        this.initLoad();
    }

    /**
     * 获取所有配置
     */
    getAllConfigs() {
        return this.configs;
    }

    /**
     * 获取指定id的配置
     * @param id 配置id
     */
    public getConfig(id: number): T {
        if (this.configs == null || this.configs[id] == null) {
            return null;
        }

        return this.configs[id];
    }

    /**
     * 加载配置
     */
    protected initLoad() {
        return ResLoadManager.getInstance().loadRes(this.configPath(), cc.JsonAsset)
            .then(asset => {
                if (asset == null) {
                    return;
                }

                this.configs = {};

                for (let i = 0; i < asset.json.length; ++i) {
                    let item: T = asset.json[i];
                    let idCol: number = 0;

                    if (item["id"] != null) {
                        idCol = item["id"];
                    } else if (item["ID"] != null) {
                        idCol = item["ID"];
                    } else if (item["Id"] != null) {
                        idCol = item["Id"];
                    } else if (item["itemId"] != null) {
                        idCol = item["itemId"];
                    } else if (item["item_id"] != null) {
                        idCol = item["item_id"];
                    } else {
                        throw new Error("没有id列");
                    }

                    this.configs[idCol] = item;
                }

                if (this.afterLoadCallBack != null) {
                    this.afterLoadCallBack();
                }
            })
            .catch(e => {
                TKLog.LogErr("AbsJSONNConfigLoader.initLoad 读取配置" + this.configPath() + "失败:" + e);
            })
    }
}
