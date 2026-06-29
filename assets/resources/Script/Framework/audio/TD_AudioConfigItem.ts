import TKLog from "../log/TD_TKLog";
import ResLoadManager from "../TD_ResLoadManager";


/**
 * 音频配置
 */
export default class AudioConfigItem {
    id: number = 0;
    path: string = "";
    loop: boolean = false;
    volume: number = 1;
    reload: boolean = false;
    clip: cc.AudioClip = null;

    private _isInvalid: boolean = false;
    private _loadToken: number = 0;

    initWithJsonAsset(
        itemJson: any,
        allowPreload: boolean = true,
        isRuntimeActive?: () => boolean,
    ) {
        if (!itemJson) {
            return;
        }

        this.id = Number(itemJson.id);
        this.path = itemJson.path;
        this.loop = Boolean(itemJson.loop);
        this.volume = Number(itemJson.volume);
        this.reload = Boolean(itemJson.reload);

        if (this.reload && allowPreload) {
            this.loadClip(null, isRuntimeActive);
        }
    }

    Load(callback: Function, isRuntimeActive?: () => boolean) {
        if (this.clip) {
            callback && callback(this);
            return;
        }

        this.loadClip(callback, isRuntimeActive);
    }

    invalidate() {
        this._isInvalid = true;
        this._loadToken += 1;
        this.clip = null;
    }

    private loadClip(callback: Function | null, isRuntimeActive?: () => boolean) {
        const loadToken = ++this._loadToken;
        ResLoadManager.getInstance().loadRes(this.path, cc.AudioClip)
            .then((asset) => {
                if (!this.shouldAcceptAsyncResult(loadToken, isRuntimeActive)) {
                    return;
                }

                if (!asset) {
                    TKLog.LogWarn("AudioConfigItem.load clip returned null:", this.path);
                    return;
                }

                this.clip = asset;
                callback && callback(this);
            })
            .catch((error) => {
                if (!this.shouldAcceptAsyncResult(loadToken, isRuntimeActive)) {
                    return;
                }

                TKLog.LogErr("AudioConfigItem.load clip failed:", this.path, error);
            });
    }

    private shouldAcceptAsyncResult(loadToken: number, isRuntimeActive?: () => boolean): boolean {
        if (this._isInvalid || this._loadToken !== loadToken) {
            return false;
        }

        if (!isRuntimeActive) {
            return true;
        }

        try {
            return !!isRuntimeActive();
        } catch (error) {
            return false;
        }
    }
}
