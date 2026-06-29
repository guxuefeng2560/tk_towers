/**
 * 1. 负责处理加载逻辑
 * 2. 管理加载项
 * 3. 清理加载项
 * 
 */

export default class ResLoader {

    protected bundle: cc.AssetManager.Bundle = null;
    protected name: string;

    constructor(bundle: cc.AssetManager.Bundle, name: string = "") {
        this.bundle = bundle;
        this.name = name;
    }

    /**
     * 同时释放多个资源。
     * @param list 需要加载的资源列表
     * @param type 需要加载的资源类型，要求所有资源统一类型
     */
    releaseArray(list: Array<string>, type?: typeof cc.Asset) {
        for (let index = 0, length = list.length; index < length; index++) {
            this.releaseRes(list[index], type);
        }
    }

    /**
     * 释放单个资源
     * @param url 
     * @param type 
     */
    releaseRes(asset: cc.Asset, type?: typeof cc.Asset);
    releaseRes(url: string, type?: typeof cc.Asset);
    releaseRes(arg: any, type?: typeof cc.Asset) {
        let item = null;
        if (typeof arg == "string") {
            item = this.bundle.get(arg, type);
        } else {
            item = arg;
        }

        if (item) {
            // console.log("releaseRes url ", arg, "item ", item);
            item.decRef();
        }
    }

    /**
     * 强制释放多个资源
     * @param list 需要释放的资源列表
     * @param type 需要释放的资源类型，要求所有资源统一类型
     */
    forceReleaseArray(list: Array<string>, type?: typeof cc.Asset) {
        for (let index = 0, length = list.length; index < length; index++) {
            this.forceReleaseRes(list[index], type);
        }
    }

    /**
     * 强制释放资源，本身不经过检查，但会检查依赖资源
     * @param arg 
     * @param type 
     */
    forceReleaseRes(asset: cc.Asset, type?: typeof cc.Asset);
    forceReleaseRes(arg: string, type?: typeof cc.Asset);
    forceReleaseRes(arg: any, type?: typeof cc.Asset) {
        let item = null;
        if (typeof arg == "string") {
            item = this.bundle.get(arg, type);
        } else {
            item = arg;
        }

        if (item) {
            // console.log("forceReleaseRes url ", arg, "item ", item);
            if (typeof arg == "string") {
                this.bundle.release(arg, type);
            } else {
                this.bundle.releaseAsset(item);
            }
        }
    }

    /**
     * 释放所有资源
     */
    releaseAll() {
        // console.log("ResLoader release:", this.bundle.name);
        this.bundle.releaseAll();
    }

    getBundle(): cc.AssetManager.Bundle {
        return this.bundle;
    }

    /**
     * 加载文件夹下资源
     * @param url 文件夹路径
     * @param type 资源类型
     * @param onProgess 进度回调
     * @param callback 完成回调
     */
    loadDir(url: string, type: typeof cc.Asset, onProgess: (finish: number, total: number) => void, callback: (err: Error, assets: cc.Asset[]) => void) {
        this.bundle.loadDir(url, type, (finish, total) => {
            onProgess(finish, total);
        }, (err, assets) => {
            callback(err, assets);
        })
    }

    /**
     * 同时加载多个资源。
     * @param list 需要加载的资源列表
     * @param type 需要加载的资源类型，要求所有资源统一类型
     * @param func 加载后的回调
     */
    loadArray(list: Array<string>, type: typeof cc.Asset, func: (finish: number, total: number) => void, callback: (err: string, assets: any) => void) {
        let resCount = 0;
        let resList = [];
        for (let index = 0; index < list.length; index++) {
            const element = list[index];
            this.loadRes(element, type, (err, res) => {
                // 不论是否都加载成功都返回
                if (err) {
                    // console.log("load Array err:", err);
                    callback(err, resList);
                    return;
                }
                resCount++;
                resList.push(res)
                func(resCount, list.length);
                if (resCount == list.length) {
                    callback(err, resList);
                }
            });
        }
    }

    /**
     * 加载单个文件
     * @param url 
     * @param type 
     * @param callback 
     */
    loadRes(url: string, type: typeof cc.Asset, callback: (err: string, res: any) => void) {
        let item = this.getRes(url, type);
        // console.log("loadRes url ", url, "item ", item);
        if (item) {
            callback(null, item);
            return;
        } else {
            this.bundle.load(url, type, (err, asset) => {
                if (err) {
                    // console.log("load res err:", err);
                    callback("load res err.", null);
                    return;
                }
                asset.addRef();
                callback(null, asset);
            })
        }
    }
    /**
     * 预加载资源
     * @param url 
     * @param type 
     * @param callback 
     */
    preloadRes(url: string, type: typeof cc.Asset, callback: (err: any) => void) {
        this.bundle.preload(url, type, (err) => {
            callback(err);
        })
    }
    /**
     * 加载bundle中的场景
     * @param url 
     * @param callback 
     */
    loadScene(url: string, callback: (err: string, res: any) => void) {
        let item = this.getRes(url, cc.SceneAsset);
        if (item) {
            callback(null, item);
            return;
        } else {
            this.bundle.loadScene(url, (err, asset) => {
                if (err) {
                    // console.log("load scene err:", err);
                    callback("load scene err.", null);
                    return;
                }

                callback(null, asset);
            })
        }
    }
    /**
     * 预加载场景
     * @param url 
     * @param callback 
     */
    preloadScene(url: string, onProgess: (finish: number, total: number) => void, callback: (err: Error) => void) {
        this.bundle.preloadScene(url, (finish: number, total: number) => {
            onProgess(finish, total);
        }, (err) => {
            callback(err);
        });
    }

    /**
     * 获取已加载资源
     * @param url 
     * @param type 
     */
    getRes(url: string, type?: typeof cc.Asset) {
        let item = this.bundle.get(url, type);
        if (!item) {
            return null;
        }

        item.addRef();
        return item;
    }

}
