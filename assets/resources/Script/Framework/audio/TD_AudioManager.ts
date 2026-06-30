
import TKLog from "../log/TD_TKLog";
import ResModuleManager from "../moduleManager/TD_ResModuleManager";
import ResLoadManager from "../TD_ResLoadManager";
import Singleton from "../TD_Singleton";
import AudioConfigItem from "./TD_AudioConfigItem";

/**
 * 简单的音频播放管理
 * 只适合用来播放配置在audio.json中项目的播放，比如音效及背景音乐
 * 其他地方比如教学时的单词播放未考虑
 */
const { ccclass, property } = cc._decorator;

@ccclass
export default class AudioManager extends Singleton {

    // 音效配置
    private _sfx: { [id: number]: AudioConfigItem } = {};
    // 音乐配置
    private _music: { [id: number]: AudioConfigItem } = {};

    private _volume = 0.4;

    // 标记是否配置加载完成了
    private _isLoaded = false;
    private _isDisposed = false;
    private _allowConfigPreload = true;

    private audioMap = [];
    private _sfxLastPlayTimeById: { [id: number]: number } = {};
    private _loopingSfxAudioIdById: { [id: number]: number } = {};
    private _loopingSfxLoadPendingById: { [id: number]: boolean } = {};
    private _loopingSfxTokenById: { [id: number]: number } = {};
    private _currentMusicId: number = -1;
    // 配置未加载完成前挂起的待播放音乐ID（加载完成后自动补播）
    private _pendingMusicId: number = -1;

    constructor() {
        super();
        this._allowConfigPreload = !this.isHostedRuntime();
        if (ResModuleManager.hasResModule()) {
            this.initLoad("config/audio");
        }
    }

    protected onDestroy(): void {
        this._isDisposed = true;
        this.stopAll();
        this.invalidateConfigItems(this._sfx);
        this.invalidateConfigItems(this._music);
        this._sfx = {};
        this._music = {};
        this.audioMap = [];
        this._isLoaded = false;
    }

    stopAll() {
        cc.audioEngine.stopAll();
        this._currentMusicId = -1;
        this._loopingSfxAudioIdById = {};
        this._loopingSfxLoadPendingById = {};
        this._loopingSfxTokenById = {};
    }

    stopSFX(audioID: number) {
        cc.audioEngine.stop(audioID);
    }
    
    stopMusic() {
        if (this._currentMusicId !== -1) {
            cc.audioEngine.stop(this._currentMusicId);
            this._currentMusicId = -1;
        }
    }

    /**
     * 播放音乐
     * @param id 音乐ID
     * @returns audioID
     */
    playMusic(id: number) {
        if (!this.isRuntimeActive()) {
            return;
        }

        if (!this._isLoaded) {
            // 配置尚未加载完成，先挂起请求，待 initLoad 完成后自动补播
            this._pendingMusicId = id;
            TKLog.LogWarn("AudioConfig.playMusic config is not loaded, pending:", id);
            return;
        }

        const item = this._music[id];
        if (item == null) {
            TKLog.LogWarn("AudioConfig.playMusic missing config:", id);
            return;
        }

        // 如果正在播放音乐了，先停掉
        if (this._currentMusicId !== -1) {
            cc.audioEngine.stop(this._currentMusicId);
            this._currentMusicId = -1;
        }

        if (item.clip == null) {
            item.Load((config: AudioConfigItem) => {
                if (!this.isRuntimeActive()) {
                    return;
                }

                this._currentMusicId = this._play(config);
                return this._currentMusicId;
            }, this.isRuntimeActive.bind(this));
            return;
        }

        this._currentMusicId = this._play(item);
        return this._currentMusicId;
    }

    /**
     * 播放音效
     * @param id 音效ID
     * @returns audioID
     */
    playSFX(id: number): number {
        if (!this.isRuntimeActive()) {
            return -1;
        }

        // if (Global.stopWordGame) {
        //     return;
        // }

        if (!this._isLoaded) {
            TKLog.LogWarn("AudioConfig.playSFX config is not loaded.");
            return -1;
        }

        const item = this._sfx[id];
        if (item == null) {
            TKLog.LogWarn("AudioConfig.playSFX missing config:", id);
            return -1;
        }

        if (item.clip == null) {
            item.Load((config: AudioConfigItem) => {
                if (!this.isRuntimeActive()) {
                    return;
                }

                this._play(config);
            }, this.isRuntimeActive.bind(this));
            return -1;
        }

        return this._play(item);
    }

    playSFXThrottled(id: number, intervalSeconds: number): number {
        const nowSeconds = Date.now() / 1000;
        const lastPlayTime = this._sfxLastPlayTimeById[id] || 0;
        if (nowSeconds - lastPlayTime < Math.max(0, intervalSeconds)) {
            return -1;
        }
        const audioId = this.playSFX(id);
        if (audioId !== -1) {
            this._sfxLastPlayTimeById[id] = nowSeconds;
        }
        return audioId;
    }

    playLoopingSFX(id: number): number {
        if (!this.isRuntimeActive()) {
            return -1;
        }

        const existingAudioId = this._loopingSfxAudioIdById[id];
        if (existingAudioId !== undefined && existingAudioId !== -1) {
            return existingAudioId;
        }

        if (!this._isLoaded) {
            TKLog.LogWarn("AudioConfig.playLoopingSFX config is not loaded.");
            return -1;
        }

        const item = this._sfx[id];
        if (item == null) {
            TKLog.LogWarn("AudioConfig.playLoopingSFX missing config:", id);
            return -1;
        }

        if (item.clip == null) {
            if (this._loopingSfxLoadPendingById[id]) {
                return -1;
            }

            this._loopingSfxLoadPendingById[id] = true;
            const token = this.getNextLoopingSfxToken(id);
            item.Load((config: AudioConfigItem) => {
                this._loopingSfxLoadPendingById[id] = false;
                if (!this.isRuntimeActive() || this._loopingSfxTokenById[id] !== token) {
                    return;
                }
                this.startLoopingSFX(id, config);
            }, this.isRuntimeActive.bind(this));
            return -1;
        }

        this.getNextLoopingSfxToken(id);
        return this.startLoopingSFX(id, item);
    }

    stopLoopingSFX(id: number): void {
        this.getNextLoopingSfxToken(id);
        this._loopingSfxLoadPendingById[id] = false;
        const audioId = this._loopingSfxAudioIdById[id];
        if (audioId !== undefined && audioId !== -1) {
            cc.audioEngine.stop(audioId);
        }
        delete this._loopingSfxAudioIdById[id];
    }

    playSFXByURL(url: string): number {
        if (!this.isRuntimeActive() || this._volume === 0) {
            return -1;
        }

        if (this.audioMap[url] != null) {
            return cc.audioEngine.play(this.audioMap[url], false, this._volume);
        }

        ResModuleManager.loadRes(ResModuleManager.getDefaultModuleId(), url, cc.AudioClip, (err, audio) => {
            if (!this.isRuntimeActive()) {
                return;
            }

            if (err) {
                TKLog.LogInfo("load audio err:", err);
                return;
            }

            if (!audio) {
                return;
            }

            cc.audioEngine.play(audio, true, 1);
            this.audioMap[url] = audio;
        });

        return -1;
    }

    /**
     * 直接播放音频片段
     * @param clip 音频片段
     */
    playClip(clip: cc.AudioClip): number {
        if (!this.isRuntimeActive() || clip == null) {
            return -1;
        }

        return cc.audioEngine.play(clip, false, this._volume);
    }

    setAudioFinishCallback(id, callback) {
        if (callback) {
            cc.audioEngine.setFinishCallback(id, callback);
        }
    }

    initLoad(configPath: string) {
        ResLoadManager.getInstance().loadRes(configPath, cc.JsonAsset)
            .then((asset) => {
                if (!this.isRuntimeActive()) {
                    return;
                }

                if (asset == null) {
                    TKLog.LogWarn("AudioConfig.initLoad empty config:", configPath);
                    return;
                }

                const sfxes = asset.json.SFX;
                if (sfxes == null) {
                    TKLog.LogWarn("AudioConfig.initLoad missing SFX config:", configPath);
                    return;
                }

                this._readCate(sfxes, this._sfx);

                const musics = asset.json.Music;
                if (musics == null) {
                    TKLog.LogWarn("AudioConfig.initLoad missing Music config:", configPath);
                }

                this._readCate(musics, this._music);
                this._isLoaded = true;

                // 补播配置加载完成前挂起的音乐请求
                if (this._pendingMusicId !== -1) {
                    const pendingId = this._pendingMusicId;
                    this._pendingMusicId = -1;
                    this.playMusic(pendingId);
                }
            })
            .catch((error) => {
                if (!this.isRuntimeActive()) {
                    return;
                }

                TKLog.LogErr("AudioConfig.initLoad failed:", configPath, error);
            });
    }

    private _play(item: AudioConfigItem): number {
        return cc.audioEngine.play(item.clip, item.loop, item.volume * this._volume);
    }

    private startLoopingSFX(id: number, item: AudioConfigItem): number {
        const existingAudioId = this._loopingSfxAudioIdById[id];
        if (existingAudioId !== undefined && existingAudioId !== -1) {
            return existingAudioId;
        }

        const audioId = cc.audioEngine.play(item.clip, true, item.volume * this._volume);
        this._loopingSfxAudioIdById[id] = audioId;
        return audioId;
    }

    private getNextLoopingSfxToken(id: number): number {
        const token = (this._loopingSfxTokenById[id] || 0) + 1;
        this._loopingSfxTokenById[id] = token;
        return token;
    }

    private _readCate(rootJson: any, container: { [id: number]: AudioConfigItem }) {
        if (!rootJson) {
            return;
        }

        for (let i = 0; i < rootJson.length; ++i) {
            const item = rootJson[i];
            const configItem = this._readConfig(item);
            if (configItem != null) {
                container[configItem.id] = configItem;
            }
        }
    }

    private _readConfig(itemJson: any): AudioConfigItem {
        const res = new AudioConfigItem();
        res.initWithJsonAsset(
            itemJson,
            this._allowConfigPreload,
            this.isRuntimeActive.bind(this),
        );
        return res;
    }

    private isHostedRuntime(): boolean {
        return true;
        // if (typeof TKCore === "undefined" || !TKCore || !TKCore.Data || !TKCore.Data.GetSubGameLaunchData) {
        //     return false;
        // }

        // const launchData = TKCore.Data.GetSubGameLaunchData();
        // return !!(launchData && launchData.isReady && launchData.bundleName === Global.game_id);
    }

    private isRuntimeActive(): boolean {
        return !this._isDisposed;
    }

    private invalidateConfigItems(container: { [id: number]: AudioConfigItem }) {
        for (const key in container) {
            const item = container[key];
            if (item) {
                item.invalidate();
            }
        }
    }
}
