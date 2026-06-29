import { IConfigLoader } from "./TD_IConfigLoader";
import IModuleInitable from "../game/TD_IModuleInitable";

/**
 * 配置文件加载管理
 */
export default class ConfigLoaderModule implements IModuleInitable {
    protected configs: Array<IConfigLoader> = new Array<IConfigLoader>();
    protected progress: number = 0

    protected completeCount: number = 0

    constructor(...configLoader: IConfigLoader[]) {
        for (let index = 0, length = configLoader.length; index < length; index++) {
            const element = configLoader[index];
            this.configs.push(element);
        }
    }

    moduleInit(callback: Function) {
        this.progress = 0;
        this.completeCount = 0;
        for (let index = 0, length = this.configs.length; index < length; index++) {
            const element = this.configs[index];
            element.preload(function() {
                this.completeCount ++;
                if (this.completeCount >= length) {
                    /** 抛一个事件通知 LoadingScene 配置加载完成 */
                    callback && callback()
                }
            }.bind(this));
            this.progress = this.progress / length;
        }
    }
    moduleInitProgress(): number {
        return this.progress;
    }

    /** 是否配置已全部加载完成 */
    isLoadCompleted() {
        return this.completeCount === this.configs.length;
    }
}
