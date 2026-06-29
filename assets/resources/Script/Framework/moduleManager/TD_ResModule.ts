/**
 * 资源
 */

import ResLoader from "./TD_ResLoader";
import { ResModuleID } from "./TD_ResModuleManager";

export default class ResModule {
    /** 加载管理器 */
    private _resLoader: ResLoader = null;

    protected projectName: string = "";
    protected moduleName: string = "";

    constructor(projectName: string, moduleName: string) {
        this.projectName = projectName;
        this.moduleName = moduleName;

        // 有名称的模块，需要在适当的时候加载bundle并设置
        if (!this.moduleName) { // name != '' 说明是自定义的bundle
            this.setLoader(new ResLoader(cc.resources, ResModuleID.Resources));
        }

    }

    hasLoader(): boolean {
        return this._resLoader != null;
    }

    setLoader(loader: ResLoader) {
        this._resLoader = loader;
    }

    setLoaderByBundle(bundle: cc.AssetManager.Bundle) {
        this.setLoader(new ResLoader(bundle, this.moduleName));
    }

    getName(): string {
        return this.moduleName;
    }

    getLoader(): ResLoader {
        return this._resLoader;
    }

    getBundle(): cc.AssetManager.Bundle {
        return this._resLoader.getBundle();
    }
}
