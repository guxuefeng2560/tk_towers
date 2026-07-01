/**
 * 资源管理
 * 
 * 注意！！！当组件或者组件的节点们有使用池子时不可以释放资源
 */

import TKLog from "../log/TD_TKLog";
import ResModule from "./TD_ResModule";
import ResLoader from "./TD_ResLoader";


// 模块id
export enum ResModuleID {
    Resources = "resources",
}

export type ResCallback = (err: any, res: any) => void

export type ProcessCallback = (finish: number, total: number) => void;

//有分包的模块就有bundle的名字，没有就是使用cc.resource 

export default class ResModuleManager {

    private static mgrMap: Map<string, ResModule> = new Map<string, ResModule>();

    private static moduleID: string = "resources";

    /**
     * 初始化mgrMap
     * @param projectName 
     * @param moduleName 
     */
    static init(projectName: string, moduleName: string) {
        if (moduleName === ResModuleID.Resources) {
            ResModuleManager.mgrMap[ResModuleID.Resources] = new ResModule(projectName, "");
            return;
        }

        ResModuleManager.mgrMap[moduleName] = new ResModule(projectName, moduleName);
    }

    /**
     * 获取默认的moduleId
     */
    static getDefaultModuleId(): string {
        return ResModuleManager.moduleID;
    }

    /**
     * 获取已加载资源
     * @param id 
     * @param url 
     * @param type 
     */
    static getRes(id: string, url: string, type?: typeof cc.Asset): any {
        if (ResModuleManager.hasLoader(id)) {
            return ResModuleManager.getLoader(id).getRes(url, type);
        }
        return null;
    }

    /**
     * 加载资源
     * @param id moduleId 
     * @param url 资源路径
     * @param type 加载类型
     * @param callback 回调函数
     */
    static loadRes(id: string, url: string, type: typeof cc.Asset, callback: (err: string, res: any) => void) {
        if (ResModuleManager.hasLoader(id)) {
            ResModuleManager.getLoader(id).loadRes(url, type, callback);
            return;
        }

        ResModuleManager.loadBundle(id, () => {
            ResModuleManager.getLoader(id).loadRes(url, type, callback);
        });
    }
    static loadResAsync(id: string, path: string, type: typeof cc.Asset): Promise<any> {
        return new Promise<any>((res) => {
            ResModuleManager.loadRes(id, path, type, (err: string, resource: any) => {
                if (err) {
                    res(null);
                } else {
                    res(resource);
                }
            });
        }).catch(e => {
            TKLog.LogErr("ResModuleManager.loadResAsync Err:" + e);
            throw new Error("ResModuleManager.loadResAsync Err:" + e);
        })
    }

    /**
     * 预加载资源
     * @param id 
     * @param url 
     * @param type 
     * @param callback 
     */
    static preloadRes(id: string, url: string, type: typeof cc.Asset, callback: (err: Error) => void) {
        if (ResModuleManager.hasLoader(id)) {
            ResModuleManager.getLoader(id).preloadRes(url, type, callback);
            return;
        }

        ResModuleManager.loadBundle(id, () => {
            ResModuleManager.getLoader(id).preloadRes(url, type, callback);
        });
    }

    /**
     * 加载多个资源
     * @param id 
     * @param url 
     * @param type 
     * @param callback 
     */
    static loadArray(id: string, url: string[], type: typeof cc.Asset, onProgess: (finish: number, total: number) => void, callback: (err: string, assets: any) => void) {
        if (ResModuleManager.hasLoader(id)) {
            ResModuleManager.getLoader(id).loadArray(url, type, onProgess, callback);
            return;
        }

        ResModuleManager.loadBundle(id, () => {
            ResModuleManager.getLoader(id).loadArray(url, type, onProgess, callback);
        });
    }

    /**
     * 加载场景
     * @param id 
     * @param url 
     * @param callback 
     */
    static loadScene(id: string, url: string, callback: (err: string, res: any) => void) {
        if (ResModuleManager.hasLoader(id)) {
            ResModuleManager.getLoader(id).loadScene(url, callback);
            return;
        }

        ResModuleManager.loadBundle(id, () => {
            ResModuleManager.getLoader(id).loadScene(url, callback);
        });
    }

    /**
     * 预加载场景
     * @param id
     * @param url
     * @param onProgess
     * @param callback
     */
    static preloadScene(id: string, url: string, onProgess: (finish: number, total: number) => void, callback: (err: Error) => void) {
        if (ResModuleManager.hasLoader(id)) {
            ResModuleManager.getLoader(id).preloadScene(url, onProgess, callback);
            return;
        }

        ResModuleManager.loadBundle(id, () => {
            ResModuleManager.getLoader(id).preloadScene(url, onProgess, callback);
        })
    }

    /**
     * 加载并切换场景
     * @param id 模块ID
     * @param url 场景名称
     * @param onLaunched 场景启动后的回调
     */
    static loadAndRunScene(id: string, url: string, onLaunched?: (err: string) => void) {
        ResModuleManager.loadScene(id, url, (err: string, sceneAsset: any) => {
            if (err) {
                console.error(`加载场景失败: ${url}`, err);
                onLaunched && onLaunched(err);
                return;
            }
            cc.director.runScene(sceneAsset);
            onLaunched && onLaunched(null);
        });
    }

    /**
     * 加载文件夹
     * @param id 
     * @param url 
     * @param type 
     * @param onProgess 
     * @param callback 
     */
    static loadDir(id: string, url: string, type: typeof cc.Asset, onProgess: ProcessCallback, callback: ResCallback) {
        if (ResModuleManager.hasLoader(id)) {
            ResModuleManager.getLoader(id).loadDir(url, type, onProgess, callback);
            return;
        }

        ResModuleManager.loadBundle(id, () => {
            ResModuleManager.getLoader(id).loadDir(url, type, onProgess, callback);
        });
    }

    /**
     * 返回bundle名称
     * @param id 
     */
    static getName(id: string): string {
        const module = ResModuleManager.mgrMap[id];
        return module ? module.getName() : id;
    }

    /**
     * 设置module的bundle
     * @param id 
     * @param bundle 
     */
    static setLoaderByBundle(id: string, bundle: cc.AssetManager.Bundle) {
        if (!ResModuleManager.hasResModule(id)) {
            ResModuleManager.init(id, id);
        }
        ResModuleManager.mgrMap[id].setLoaderByBundle(bundle);
    }

    /**
     * 设置默认moduleID
     * @param id 
     */
    static setModuleID(id: string) {
        ResModuleManager.moduleID = id;
    }

    /**
     * 获取module的加载管理器
     * @param id 
     */
    static getLoader(id: string = ResModuleManager.moduleID): ResLoader {
        const module = ResModuleManager.mgrMap[id];
        return module ? module.getLoader() : null;
    }

    /**
     * 判断module是否已经设置了加载管理器
     * @param id 
     */
    static hasLoader(id: string = ResModuleManager.moduleID): boolean {
        return ResModuleManager.hasResModule(id) && ResModuleManager.mgrMap[id].hasLoader();
    }

    static hasResModule(id: string = ResModuleManager.moduleID): boolean {
        return ResModuleManager.mgrMap[id] != null && ResModuleManager.mgrMap[id] != undefined;
    }

    /**
     * 为某个模块设置bundle
     * @param moduleID 
     * @param callback 
     */
    static loadBundle(moduleID: string, callback: Function) {
        if (!ResModuleManager.hasResModule(moduleID)) {
            ResModuleManager.init(moduleID, moduleID);
        }

        if (ResModuleManager.hasLoader(moduleID)) {
            callback();
            return;
        }

        cc.assetManager.loadBundle(ResModuleManager.getName(moduleID), (err, bundle) => {
            if (err) {
                TKLog.LogErr("ResModuleManager.loadBundle failed:", moduleID, err);
                return;
            }

            ResModuleManager.setLoaderByBundle(moduleID, bundle);
            callback();
        });
    }

    /**
     * 释放module中的资源
     * @param moduleID 
     * @param asset 
     * @param type 
     */
    static releaseRes(moduleID: string, asset: cc.Asset, type?: typeof cc.Asset);
    static releaseRes(moduleID: string, url: string, type?: typeof cc.Asset);
    static releaseRes(moduleID: string, arg: any, type?: typeof cc.Asset) {
        if (ResModuleManager.hasLoader(moduleID)) {
            ResModuleManager.getLoader(moduleID).releaseRes(arg, type);
        }
    }

    /**
     * 释放module中的多个资源
     * @param moduleID 
     * @param url 
     * @param type 
     */
    static releaseArray(moduleID: string, url: string[], type?: typeof cc.Asset) {
        if (ResModuleManager.hasLoader(moduleID)) {
            ResModuleManager.getLoader(moduleID).releaseArray(url, type);
            return;
        }

        ResModuleManager.loadBundle(moduleID, () => {
            ResModuleManager.getLoader(moduleID).releaseArray(url, type);
        });
    }

    static releaseAllRes(moduleID: string = ResModuleManager.moduleID) {
        if (ResModuleManager.hasLoader(moduleID)) {
            ResModuleManager.getLoader(moduleID).releaseAll();
        }
    }

    /**
     * 强制释放module中的资源
     * @param moduleID 
     * @param arg 
     * @param type 
     */
    static forceReleaseRes(moduleID: string, arg: string, type?: typeof cc.Asset) {
        if (ResModuleManager.hasLoader(moduleID)) {
            ResModuleManager.getLoader(moduleID).forceReleaseRes(arg, type);
        }
    }

    /**
     * 强制释放module中的多个资源
     * @param moduleID 
     * @param arg 
     * @param type 
     */
    static forceReleaseArray(moduleID: string, url: string[], type?: typeof cc.Asset) {
        if (ResModuleManager.hasLoader(moduleID)) {
            ResModuleManager.getLoader(moduleID).forceReleaseArray(url, type);
        }
    }
}
