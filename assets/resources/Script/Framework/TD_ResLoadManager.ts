import ResModuleManager from "./moduleManager/TD_ResModuleManager";
import Singleton from "./TD_Singleton";


export default class ResLoadManager extends Singleton {

    /**
     * 异步载入资源
     * @param path 资源路径
     * @param type 资源类型
     */
    loadRes<T extends typeof cc.Asset>(path: string, type: T): Promise<InstanceType<T>> {
        return new Promise<InstanceType<T>>(resolve => {
            ResModuleManager.loadRes(ResModuleManager.getDefaultModuleId(), path, type, (err, res) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(res);
                }
            });
        }).catch(e => {
            throw new Error("ResLoadManager.loadRes Err:" + e);
        });
    }

    /**
     * 载入图集中的指定图片
     * @param atlasPath 图集路径
     * @param spriteName 图集中图片的名称
     */
    loadSpriteInAtlas(atlasPath: string, spriteName: string): Promise<cc.SpriteFrame> {
        return new Promise<cc.SpriteFrame>(resolve => {
            ResModuleManager.loadRes(ResModuleManager.getDefaultModuleId(), atlasPath, cc.SpriteAtlas, (err, res) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve((res as cc.SpriteAtlas).getSpriteFrame(spriteName));
                }
            });
        }).catch(e => {
            throw new Error("ResLoadManager.loadSpriteInAtlas Err:" + e);
        });
    }
}
