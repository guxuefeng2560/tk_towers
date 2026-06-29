import Global from "../../global/TD_Global";
import ToolsUseful from "../../tools/TD_ToolsUseful";
import LanguageSprite from "../language/TD_LanguageSprite";
import RemoteResManager from "../moduleManager/TD_RemoteResManager";
import { LocalStorage } from "../TD_LocalStorage";
import Singleton from "../TD_Singleton";
import ArrayUtil from "../utils/TD_ArrayUtil";
import StringUtil from "../utils/TD_StringUtil";



/**
 * 单词配置
 */
export interface WordsConfigItem {
    id: number;
    item_id: number;
    item_en: string;
    item_cn: string;
    item_bm: string;
    item_de: string;
    item_sp: string;
    item_th: string;
    item_vi: string;
    item_idn: string;
    pinyin?: string;
    img_url: any;
    audio_en: any;
    audio_cn: any;
}

export interface WordResCheckResult {
    wordId: number;
    hasImage: boolean;
    hasAudio: boolean;
    ok: boolean;
    missing: string[];
}

export interface WordsResCheckSummary {
    allOk: boolean;
    total: number;
    successCount: number;
    failCount: number;
    results: WordResCheckResult[];
}

/**
 * 单词配置管理
 */
export class WordsManager extends Singleton {
    /** 单词item_id:单词资源 */
    private _wordsRes: { [key: number]: WordsConfigItem } = null;
    get wordRes(): { [key: number]: WordsConfigItem } {
        return this._wordsRes;
    }

    /** 单词配置文件路径 */
    wordsConfigPath = "config/";

    // 图片资源缓存
    private _resImgCache: { [id: number]: cc.SpriteFrame } = null;
    // 音频资源缓存
    private _resAudioCache: { [id: number]: any } = null;

    private _finishedTotal: number = null;
    private _finishedImg: number = null;
    private _finishedAudio: number = null;

    private _storagePath: string = null;
    private _imgPath: string = null;
    private _enAudioPath: string = null;
    private _cnAudioPath: string = null;
    private _strokePath: string = null;
    private _strokeJsonCache: { [key: string]: cc.JsonAsset } = null;
    private _strokeWebFileCache: { [key: string]: string } = null;
    get storagePath(): string {
        return this._storagePath;
    }

    constructor() {
        super();
        this.initLoad();
        this._resImgCache = {};
        this._resAudioCache = {};
        this._finishedTotal = 0;
        this._finishedImg = 0;
        this._finishedAudio = 0;
        this._strokeJsonCache = {};
        this._strokeWebFileCache = {};

        if (CC_JSB) {
            this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + Global.BundleName + '/remote-asset');
            this._imgPath = this._storagePath + "/image";
            this._enAudioPath = this._storagePath + "/audio_en";
            this._cnAudioPath = this._storagePath + "/audio_cn";
            this._strokePath = this._storagePath + "/stroke";
            if (!jsb.fileUtils.isDirectoryExist(this._storagePath)) {
                jsb.fileUtils.createDirectory(this._storagePath);

                if (!jsb.fileUtils.isDirectoryExist(this._imgPath)) {
                    jsb.fileUtils.createDirectory(this._imgPath);
                }

                if (!jsb.fileUtils.isDirectoryExist(this._enAudioPath)) {
                    jsb.fileUtils.createDirectory(this._enAudioPath);
                }

                if (!jsb.fileUtils.isDirectoryExist(this._cnAudioPath)) {
                    jsb.fileUtils.createDirectory(this._cnAudioPath);
                }

                if (!jsb.fileUtils.isDirectoryExist(this._strokePath)) {
                    jsb.fileUtils.createDirectory(this._strokePath);
                }
            }
        }
    }

    initLoad() {
        this._wordsRes = {};
        // let wordConfig = WordsConfig.getInstance().getAllConfigs();
        // if (wordConfig) {
        //     Object.keys(wordConfig).forEach((key) => {
        //         this._wordsRes[key] = {} as WordsConfigItem;
        //         this._wordsRes[key].item_id = wordConfig[key].itemId;
        //         this._wordsRes[key].item_cn = wordConfig[key].itemCn;
        //         this._wordsRes[key].item_en = wordConfig[key].itemEn;
        //         this._wordsRes[key].item_bm = wordConfig[key].itemBm;
        //         this._wordsRes[key].item_de = wordConfig[key].itemDe;
        //         this._wordsRes[key].item_sp = wordConfig[key].itemSp;
        //         this._wordsRes[key].item_th = wordConfig[key].itemTh;
        //         this._wordsRes[key].item_vi = wordConfig[key].itemVi;
        //         this._wordsRes[key].item_idn = wordConfig[key].itemIdn;
        //         this._wordsRes[key].pinyin = wordConfig[key].pinyin;
        //     })
        // }
    }

    clearData() {
        if (this._resImgCache) {
            for (let key of Object.keys(this._resImgCache)) {
                let obj: cc.SpriteFrame = this._resImgCache[key];
                if (obj) {
                    if (CC_JSB) {
                        while (obj.refCount > 0) {
                            obj.decRef();
                            // TKLog.LogInfo("[WordsManager]清理组件:" + key, "剩余引用:", obj.refCount);
                        }
                    }
                    // else {
                    //     TKLog.LogInfo("[WordsManager]清理组件:" + key, "剩余引用:", obj.refCount);
                    // }
                    cc.assetManager.releaseAsset(obj);
                }
            }
            this._resImgCache = {};
        }

        // 非原生环境：释放 ToolsUseful.convertImgToSpriteFrame 创建的 GPU 纹理
        if (!CC_JSB) {
            ToolsUseful.releaseCachedImgSpriteFrame();
        }

        if (this._resAudioCache) {
            for (let key of Object.keys(this._resAudioCache)) {
                let obj = this._resAudioCache[key];
                if (obj && obj instanceof cc.AudioClip) {
                    cc.audioEngine.uncache(obj);
                }
            }
            this._resAudioCache = {};
        }
    }
    
    checkWordsResExisted(words: number[]): boolean {
        if (CC_JSB) {
            for (let i = 0, len = words.length; i < len; i++) {
                if (!jsb.fileUtils.isFileExist(`${this._imgPath}/${words[i]}.png`)) {
                    return false;
                }
            }
        } else {
            return false;
        }
        return true;
    }

    checkWordsRes(words: number[], callback: Function, onProgess: (finish: number, total: number) => void, onAllZipDone?: (summary: WordsResCheckSummary) => void) {
        this._finishedTotal = words.length * 2;
        this._finishedImg = 0;
        this._finishedAudio = 0;
        const wordResName: string[] = [];
        const finishedImageMap: { [key: number]: boolean } = {};
        const finishedAudioMap: { [key: number]: boolean } = {};
        let callbackFinished = false;
        let hasLoadError = false;
        let pendingZipCount = 0;

        const done = (errCode: number = 0) => {
            if (callbackFinished) {
                return;
            }
            callbackFinished = true;
            callback(errCode);
        };

        for (let i = 0, length = words.length; i < length; i++) {
            const wordId = words[i];
            const hasImage = this.hasWordImage(wordId);
            const hasAudio = this.hasWordAudio(wordId);

            if (hasImage) {
                finishedImageMap[wordId] = true;
                this._finishedImg++;
            }

            if (hasAudio) {
                finishedAudioMap[wordId] = true;
                this._finishedAudio++;
            }

            if (!hasImage || !hasAudio) {
                const name = this.generateRangeName(wordId);
                if (ArrayUtil.arrayContainItem(wordResName, name) == -1) {
                    wordResName.push(name);
                }
            }
        }

        if (wordResName.length == 0) {
            if (onProgess) {
                onProgess(this._finishedImg + this._finishedAudio, this._finishedTotal);
            }
            const summary = this.buildWordsResSummary(words);
            if (onAllZipDone) {
                onAllZipDone(summary);
            }
            done(summary.allOk ? 0 : -2);
            return;
        }

        pendingZipCount = wordResName.length;

        for (let i = 0, length = wordResName.length; i < length; i++) {
            const rangeName = wordResName[i];
            let date = new Date().getTime();//?t=${date}
            RemoteResManager.loadRemoteRes(`${Global.ResourceUrl}/${rangeName}.zip?t=${date}`, async (err, files) => {
                if (hasLoadError) {
                    return;
                }

                if (err) {
                    hasLoadError = true;
                    cc.error(err);
                    done(-1);
                    return;
                }

                try {
                    await this.generateWordRes(files, words, onProgess, finishedImageMap, finishedAudioMap);
                    LocalStorage.getInst().setInt(rangeName, 1);
                    pendingZipCount--;

                    if (pendingZipCount == 0 && !hasLoadError) {
                        if (onProgess) {
                            onProgess(this._finishedImg + this._finishedAudio, this._finishedTotal);
                        }
                        const summary = this.buildWordsResSummary(words);
                        if (onAllZipDone) {
                            onAllZipDone(summary);
                        }
                        done(summary.allOk ? 0 : -2);
                    }
                } catch (e) {
                    hasLoadError = true;
                    cc.error(e);
                    done(-1);
                }
            });
        }
        return;

    }

    checkWordsstrokeRes(callback: Function, onProgess: (finish: number, total: number) => void) {
        if (CC_JSB) {
            if (LocalStorage.getInst().getInt("stroke", 0) == 1) {
                callback();
                return;
            }
        }
        else if (Object.keys(this._strokeWebFileCache).length > 0) {
            callback();
            return;
        }

        this.ensureStrokeResources(callback, onProgess);
    }

    async generateWordRes(files: any, words: number[], onProgess: (finish: number, total: number) => void, finishedImageMap?: any, finishedAudioMap?: any) {
        const fileKeys = Object.keys(files);
        const tasks = fileKeys.map((key) => this.processWordResFile(key, files[key], words, onProgess, finishedImageMap, finishedAudioMap));
        await Promise.all(tasks);
    }

    private async processWordResFile(
        key: string,
        fileEntry: any,
        words: number[],
        onProgess: (finish: number, total: number) => void,
        finishedImageMap?: any,
        finishedAudioMap?: any
    ) {
        const arrKey = key.split("/");
        const arrKey1 = arrKey[arrKey.length - 1].split(".");
        const wordId = StringUtil.translateStringToNumber(arrKey1[0], 0);
        if (!this._wordsRes[wordId]) {
            return;
        }

        if (key.indexOf(".png") > -1 || key.indexOf(".jpg") > -1) {
            let outputByType = "base64";
            if (CC_JSB) {
                outputByType = "uint8array";
            }

            const file = await fileEntry.async(outputByType);
            const isPng = key.indexOf(".png") > -1;
            if (CC_JSB) {
                const imgExt = isPng ? "png" : "jpg";
                const imgPath = `${this._imgPath}/${wordId}.${imgExt}`;
                if (!jsb.fileUtils.isFileExist(imgPath)) {
                    jsb.fileUtils.writeDataToFile(file, imgPath);
                }
            } else {
                const mimeType = isPng ? "png" : "jpg";
                this._wordsRes[wordId].img_url = `data:image/${mimeType};base64,` + file;
            }

            if (ArrayUtil.arrayContainItem(words, wordId) > -1 && finishedImageMap && !finishedImageMap[wordId]) {
                finishedImageMap[wordId] = true;
                this._finishedImg++;
                cc.log("word image progress", wordId, this._finishedImg, this._finishedAudio, this._finishedTotal);
                if (onProgess) {
                    onProgess(this._finishedImg + this._finishedAudio, this._finishedTotal);
                }
            }
            return;
        }

        if (key.indexOf(".mp3") > -1) {
            let outputByType = "arraybuffer";
            if (CC_JSB) {
                outputByType = "uint8array";
            }

            const file = await fileEntry.async(outputByType);
            const isCnAudio = key.indexOf("cn") != -1;
            if (CC_JSB) {
                if (!jsb.fileUtils.isFileExist(`${this._storagePath}/${key}`)) {
                    jsb.fileUtils.writeDataToFile(file, `${this._storagePath}/${key}`);
                }
            } else {
                if (isCnAudio) {
                    this._wordsRes[wordId].audio_cn = file;
                } else if (key.indexOf("en") != -1) {
                    this._wordsRes[wordId].audio_en = file;
                }
            }

            if (isCnAudio && ArrayUtil.arrayContainItem(words, wordId) > -1 && finishedAudioMap && !finishedAudioMap[wordId]) {
                finishedAudioMap[wordId] = true;
                this._finishedAudio++;
                cc.log("word audio progress", wordId, this._finishedImg, this._finishedAudio, this._finishedTotal);
                if (onProgess) {
                    onProgess(this._finishedImg + this._finishedAudio, this._finishedTotal);
                }
            }
            return;
        }

        cc.error("Unknown word resource file in zip", key);
    }

    private hasWordImage(wordId: number): boolean {
        if (!this._wordsRes || !this._wordsRes[wordId]) {
            return false;
        }

        if (CC_JSB) {
            return jsb.fileUtils.isFileExist(`${this._imgPath}/${wordId}.png`) || jsb.fileUtils.isFileExist(`${this._imgPath}/${wordId}.jpg`);
        }

        return !!this._wordsRes[wordId].img_url;
    }

    private hasWordAudio(wordId: number): boolean {
        if (!this._wordsRes || !this._wordsRes[wordId]) {
            return false;
        }

        if (CC_JSB) {
            return jsb.fileUtils.isFileExist(this.getCNAudioPath(wordId));
        }

        return !!this._wordsRes[wordId].audio_cn;
    }

    private buildWordsResSummary(words: number[]): WordsResCheckSummary {
        const results: WordResCheckResult[] = [];
        let successCount = 0;

        for (let i = 0, len = words.length; i < len; i++) {
            const wordId = words[i];
            const hasImage = this.hasWordImage(wordId);
            const hasAudio = this.hasWordAudio(wordId);
            const missing: string[] = [];

            if (!hasImage) {
                missing.push("image");
            }
            if (!hasAudio) {
                missing.push("audio_cn");
            }

            const ok = hasImage && hasAudio;
            if (ok) {
                successCount++;
            }

            results.push({
                wordId,
                hasImage,
                hasAudio,
                ok,
                missing,
            });
        }

        return {
            allOk: successCount === words.length,
            total: words.length,
            successCount,
            failCount: words.length - successCount,
            results,
        };
    }

    /**
     * 根据单词id生成该单词id所在的width为宽度的单词范围
     * 如width为50，则id=10所在的范围就是1-50
     * @param wordId 单词item_id，不能为0
     * @param width 范围大小
     * @returns 范围字符串，如“1-50”
     */
    generateRangeName(wordId: number, width: number = 50) {
        const min = (Math.floor((wordId - 1) / width)) * width + 1;
        const max = min + width - 1;
        return `${min}-${max}`;
    }

    getWordConfig(id: number): WordsConfigItem {
        if (this._wordsRes == null) {
            return null;
        }

        return this._wordsRes[id];
    }

    getWordsConfig(ids: number[]): WordsConfigItem[] {
        const wordConfigList: WordsConfigItem[] = [];
        ids.forEach((item) => {
            let wordConfig = this.getWordConfig(item);
            if (wordConfig) {
                wordConfigList.push(wordConfig);
            }
        })
        return wordConfigList;
    }

    private normalizePinyin(pinyin: string): string {
        if (!pinyin) {
            return "";
        }

        return pinyin.replace(/\s+/g, " ").trim().toLowerCase();
    }

    private getFilteredWrongWordCandidates(right: number, wordIdList: number[]): number[] {
        if (wordIdList == null || wordIdList.length == 0) {
            return [];
        }

        const rightConfig = this.getWordConfig(right);
        const rightPinyin = this.normalizePinyin(rightConfig ? rightConfig.pinyin : "");

        return wordIdList.filter((wordId) => {
            if (wordId == null || wordId == right) {
                return false;
            }

            const wordConfig = this.getWordConfig(wordId);
            if (!wordConfig) {
                return false;
            }

            if (!rightPinyin) {
                return true;
            }

            return this.normalizePinyin(wordConfig.pinyin) !== rightPinyin;
        });
    }

    generateWrongWordId(right: number, wordIdList: number[]): { wrong1: number ,wrong2: number } {
        if (wordIdList == null || wordIdList.length == 0) {
            return { wrong1: right, wrong2: right };
        }

        let candidateIds = this.getFilteredWrongWordCandidates(right, wordIdList);
        if (candidateIds.length < 2 && this._wordsRes) {
            const allWordIds = Object.keys(this._wordsRes)
                .map((key) => Number(key))
                .filter((wordId) => !isNaN(wordId));
            candidateIds = this.getFilteredWrongWordCandidates(right, allWordIds);
        }

        if (candidateIds.length == 0) {
            return { wrong1: right, wrong2: right };
        }

        if (candidateIds.length == 1) {
            return { wrong1: candidateIds[0], wrong2: candidateIds[0] };
        }

        const wrong1 = ToolsUseful.getRandomNumExcept(candidateIds, right);
        const wrong2 = ToolsUseful.getRandomNumExcept(candidateIds, right, wrong1);
        return { wrong1: wrong1, wrong2: wrong2 };
    }

    playENAudio(wordId: number) {
        let ret = null;
        if (CC_JSB) {
            const path = this.getENAudioPath(wordId);
            this._resAudioCache[wordId] = path;
            ret = Global.currentSFXid = cc.audioEngine.play2d(path, false, 1);
        } else {
            const audioContext = new AudioContext();
            audioContext.decodeAudioData(this._wordsRes[wordId].audio_en.slice(), (buffer) => {
                const audioClip = new cc.AudioClip();
                audioClip["_nativeAsset"] = buffer;
                this._resAudioCache[wordId] = audioClip;
                ret = Global.currentSFXid = cc.audioEngine.play(audioClip, false, 1);
            });
        }
        return ret;
    }

    getENAudioPath(wordId: number) {
        return `${this._enAudioPath}/${wordId}.mp3`;
    }

    playCNAudio(wordId: number, callback?: Function): number {
        let ret = null;
        if (CC_JSB) {
            const path = this.getCNAudioPath(wordId);
            this._resAudioCache[wordId] = path;
            ret = Global.currentSFXid = cc.audioEngine.play2d(path, false, 1);
        } else {
            const audioContext = new AudioContext();
            if (this._wordsRes[wordId].audio_cn) {
                audioContext.decodeAudioData(this._wordsRes[wordId].audio_cn.slice(), (buffer) => {
                    const audioClip = new cc.AudioClip();
                    audioClip["_nativeAsset"] = buffer;
                    this._resAudioCache[wordId] = audioClip;
                    ret = Global.currentSFXid = cc.audioEngine.play(audioClip, false, 1);
                    callback && callback(ret);
                });
            }
        }
        return ret;
    }

    getCNAudioPath(wordId: number) {
        return `${this._cnAudioPath}/${wordId}.mp3`;
    }

    preloadBatch(wordsList: number[]) {
        let validIds: number[] = [];
        for (let i = 0; i < wordsList.length; i++) {
            let id = wordsList[i];
            if (!isNaN(id)) {
                validIds.push(id);
            }
        }

        // 标准 for 循环 + 每次 const 保存，绝对不污染
        for (let i = 0; i < validIds.length; i++) {
            // 每次循环都生成新的块级变量，async 抓不到外面去
            const wordId = validIds[i];

            // 已经缓存就跳过
            if (this._resImgCache[wordId]) {
                continue;
            }

            // 直接包一层 async 执行
            (async () => {
                try {
                    if (CC_JSB) {
                        const texture = await this.preloadWordSpriteFrame(wordId);
                        if (texture) {
                            const sf = new cc.SpriteFrame(texture);
                            sf.addRef();
                            this._resImgCache[wordId] = sf;
                        }
                    } else {
                        if (this._wordsRes?.[wordId]?.img_url) {
                            this._resImgCache[wordId] = ToolsUseful.convertImgToSpriteFrame(this._wordsRes[wordId].img_url);
                        }
                    }
                } catch (e) {
                    cc.warn(`preload word failed id=${wordId}`, e);
                }
            })();
        }
    }

    async getWordSpriteFrame(wordId: number) {
        if (this._resImgCache[wordId]) {
            return this._resImgCache[wordId];
        }
        if (CC_JSB) {
            let texture: cc.Texture2D = await this.preloadWordSpriteFrame(wordId);
            if (texture) {
                this._resImgCache[wordId] = new cc.SpriteFrame(texture);
                this._resImgCache[wordId].addRef();//Comp缓存增加初始引用
            }
        } else {
            this._resImgCache[wordId] = ToolsUseful.convertImgToSpriteFrame(this._wordsRes[wordId].img_url);
        }
        return this._resImgCache[wordId];
    }

    async preloadWordSpriteFrame(wordId: number): Promise<cc.Texture2D> {
        const self = this;
        return new Promise<cc.Texture2D>((resolve, reject) => {
            const path = self.getImgPath(wordId);
            cc.assetManager.loadRemote<cc.Texture2D>(path, (err, texture) => {
                if (err) {
                    PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts04"), 1, 2);
                    reject(null);
                    return;
                }
                if (texture == null || texture == undefined) {
                    PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts05"), 1, 2);
                    resolve(null);
                    return;
                }
                //资源增加一次引用
                texture.addRef();
                // PopInfo.popText("生成单词图片:" + wordId, 1, 2);
                resolve(texture);
            });
        });
    }
    /**
     * 替换SpriteFrame
     * 为了保证资源被正确引用计数，在替换时请使用此接口而不是直接使用引擎接口
     *      错误示例: sprite.spriteFrame = newSpriteFrame 或者 sprite.spriteFrame = null
     */
    public setSpriteFrame(oldId: number, newId: number, image: cc.Sprite | cc.Mask, newSpriteFrame: cc.SpriteFrame) {
        if (!image) return;
        let oldSpriteFrame = image.spriteFrame;
        if (oldSpriteFrame == newSpriteFrame) return;
        if (CC_JSB) {
            if (oldSpriteFrame) {
                oldSpriteFrame.decRef();
                // TKLog.LogInfo("[WordsManager]原图片组件:" + (oldId? oldId : "空Id"), "-1，引用数:", oldSpriteFrame.refCount);
                oldSpriteFrame = null;
            }
            if (newSpriteFrame) {
                newSpriteFrame.addRef();
                // TKLog.LogInfo("[WordsManager]新图片组件:" + newId, "+1，引用数:", newSpriteFrame.refCount);
            }
        }
        try {
            image.spriteFrame = newSpriteFrame;
        } catch (e) {
            cc.warn(e)
        }
    }

    public getImgPath(wordId: number) {
        if (CC_JSB) {
            const pngPath = `${this._imgPath}/${wordId}.png`;
            if (jsb.fileUtils.isFileExist(pngPath)) {
                return pngPath;
            }
        }
        return `${this._imgPath}/${wordId}.jpg`;
    }

    loadStrokeData(fileName: string) {
        if (!fileName) {
            return null;
        }
        fileName = `${fileName}.json`
        if (this._strokeJsonCache[fileName]) {
            return this._strokeJsonCache[fileName];
        }

        let content = "";
        if (CC_JSB) {
            const filePath = `${this._strokePath}/${fileName}`;
            if (!jsb.fileUtils.isFileExist(filePath)) {
                return null;
            }
            content = jsb.fileUtils.getStringFromFile(filePath);
        }
        else {
            content = this._strokeWebFileCache[fileName];
        }

        if (!content) {
            return null;
        }

        const jsonAsset = new cc.JsonAsset();
        jsonAsset.json = JSON.parse(content);
        this._strokeJsonCache[fileName] = jsonAsset;
        return jsonAsset;
    }

    private async ensureStrokeResources(callback: Function, onProgess?: (finish: number, total: number) => void) {
        RemoteResManager.loadRemoteRes(`${Global.ResourceUrl}/stroke.zip`, async (err, files) => {
            if (err) {
                cc.error(err);
                callback(-1);
                return;
            }

            const validKeys: string[] = [];
            for (const key in files) {
                if (files.hasOwnProperty(key) && !files[key].dir && key.indexOf(".json") !== -1) {
                    validKeys.push(key);
                }
            }

            const totalCount = validKeys.length;
            if (totalCount <= 0) {
                callback();
                return;
            }

            let finishCount = 0;
            const outputByType: "string" | "uint8array" = CC_JSB ? "uint8array" : "string";

            // --- 核心优化逻辑 ---
            const BATCH_SIZE = 100; // 每组并发处理 100 个文件，这个数值可以根据表现调整

            for (let i = 0; i < totalCount; i += BATCH_SIZE) {
                // 取出一组文件
                const batchKeys = validKeys.slice(i, i + BATCH_SIZE);

                // 【关键】：这一组文件内部使用 Promise.all 并行处理
                await Promise.all(batchKeys.map(async (key) => {
                    const file = files[key];
                    const output = await file.async(outputByType);
                    const fileName = key.split("/").pop();

                    if (CC_JSB) {
                        const filePath = `${this._strokePath}/${fileName}`;
                        if (!jsb.fileUtils.isFileExist(filePath)) {
                            jsb.fileUtils.writeDataToFile(output, filePath);
                        }
                    } else {
                        this._strokeWebFileCache[fileName] = output;
                    }
                    finishCount++;
                }));

                // 每处理完一组，刷新一次进度条
                if (onProgess) {
                    onProgess(finishCount, totalCount);
                }

                // // 每组处理完后，极其短暂地交还控制权给渲染层
                // await new Promise(resolve => {
                //     // 在 Cocos 中，使用 cc.director.once 监听渲染完成也是个好办法
                //     cc.director.once(cc.Director.EVENT_AFTER_DRAW, resolve);
                // });

                // 【让出主线程】：只在每个 Chunk 结束后暂停一下，给引擎渲染 UI 的时间
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            LocalStorage.getInst().setInt("stroke", 1);
            callback();
        });
    }
}
