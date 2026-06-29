
import LanguageSprite from "../Framework/language/TD_LanguageSprite";
import TKLog from "../Framework/log/TD_TKLog";
import ResModuleManager, { ResModuleID } from "../Framework/moduleManager/TD_ResModuleManager";
import Singleton from "../Framework/TD_Singleton";
import Global from "../global/TD_Global";


/**
 * 资源管理
 */
export default class ResourceManager extends Singleton {
    // 音频和图片资源缓存
    private _resCache: (cc.Texture2D | cc.AudioClip)[] = null;

    constructor() {
        super();
        this.initialize();
    }

    initialize() {
        this._resCache = null;
    }

    /**
     * 预加载批量资源
     * @param path 待加载资源的路径
     * @param progressCallback 加载中的回调
     * @param completeCallback 加载完毕的回调
     */
    preloadRes(path: string, progressCallback?: Function, completeCallback?: Function) {
        ResModuleManager.loadDir(ResModuleID.Resources, path, cc.Asset,
            (completedCount, totalCount) => {
                if (progressCallback) {
                    progressCallback(completedCount, totalCount);
                }
            },
            (err, res) => {
                if (completeCallback) {
                    completeCallback(err, res);
                }
            });
    }

    /**
     * 预加载场景
     * @param sceneName 
     * @param onProgress 
     * @param onLoaded 
     */
    preloadScene(sceneName: string, onProgress?: (completedCount: number, totalCount: number) => void, onLoaded?: (err: Error) => void) {
        cc.director.preloadScene(sceneName, (completedCount: number, totalCount: number) => {
            if (onProgress != null) {
                onProgress(completedCount, totalCount);
            }
        }, (err: Error) => {
            if (onLoaded != null) {
                onLoaded(err);
            }
        })
    }


    /**
     * 批量加载指定路径的资源
     * @param paths 批量记载路径
     * @param progressCallback 过程回调
     * @param completeCallback 完成回调
     */
    preloadBatch(paths: string[], progressCallback?: Function, completeCallback?: Function) {
        this.releaseAsset();
        ResModuleManager.loadArray(ResModuleID.Resources, paths, cc.Asset,
            (completedCount, totalCount) => {
                if (progressCallback) {
                    progressCallback(completedCount, totalCount);
                }
            },
            (err, res) => {
                this._resCache = res;
                if (completeCallback) {
                    completeCallback(err, res);
                }
            })
    }

    /**
     * 根据路径加载资源并更新精灵
     * @param path 
     * @param sprite 
     * @param finishedCallback 
     */
    static loadImage(path: string, sprite: cc.Sprite, finishedCallback?: Function) {
        ResModuleManager.loadRes(ResModuleID.Resources, path, cc.SpriteFrame, (err, spriteFrame) => {
            if (err) {
                TKLog.LogInfo("图片资源加载出错:", err);
                return;
            }
            try {
                if (sprite != null && cc.isValid(sprite) && sprite.node != null) {
                    sprite.spriteFrame = spriteFrame;
                    finishedCallback && finishedCallback();
                }
            } catch (error) {
                TKLog.LogInfo("LoadPropsSprite error:", error);
            }
        });
    }

    /**
     * 加载远程图片
     * @param url 远程地址
     * @param sprite 需要操作的精灵
     * @param imgType 图片后缀名，如'.png'，若为空则需要url携带后缀名
     */
    static loadUrlImage(url: string, imgType: string, callback?: Function) {
        if (imgType) {
            if (url) {
                cc.assetManager.loadRemote(url, { ext: imgType }, (err, texture: cc.Texture2D) => {
                    if (err) {
                        // PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts32"), 2, 2);
                    } else {
                        if (texture == null || texture == undefined) {
                            // PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts33"), 2, 2);
                        }
                    }
                    callback && callback(new cc.SpriteFrame(texture));
                });
            }
            return;
        }

        if (url) {
            cc.assetManager.loadRemote(url, (err, texture: cc.Texture2D) => {
                if (err) {
                    // PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts32"), 2, 2);
                } else {
                    if (texture == null || texture == undefined) {
                        // PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts33"), 2, 2);
                    }
                }
                callback && callback(new cc.SpriteFrame(texture));
            });
        }
    }

    /**
     * 加载并播放远程音频
     * @param url 远程地址
     */
    static loadUrlAudio(url: string) {
        if (url) {
            cc.assetManager.loadRemote(url, { ext: '.mp3' }, (err, asset: cc.AudioClip) => {
                if (err) {
                    // PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts34"), 1, 1);
                } else {
                    if (asset == null || asset == undefined) {
                        // PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts35"), 1, 1);
                    }

                    Global.currentSFXId = cc.audioEngine.play(asset, false, 1);
                    Global.currentSFXClip = asset;
                    // cc.audioEngine.setFinishCallback(Global.currentSFXId, () => {
                    //     cc.audioEngine.uncache(asset);
                    // })
                }
            });
        }
    }

    /**
     * 加载大图资源并且带回调方法
     * @param id 传入图片的参数
     * @param callback 回调方法
     */
    loadSpriteCallback(id: string, callback: Function) {
        ResModuleManager.loadRes(ResModuleID.Resources, id, cc.SpriteAtlas, (err, atlas) => {
            if (err) {
                TKLog.LogInfo("error:", err);
                return;
            }
            const frame = atlas.getSpriteFrame(id);
            if (callback != null) {
                callback(frame);
            }
        });
    }

    releaseAsset() {
        if (this._resCache == null) {
            return;
        }
        let assets = this._resCache;
        try {
            for (let i = 0; i < assets.length; ++i) {
                let asset = assets[i];
                ResModuleManager.releaseRes(ResModuleID.Resources, asset);
            }
        } catch (e) {
            TKLog.LogInfo("释放资源失败：", e);
        }
        this._resCache = null;
    }

}
