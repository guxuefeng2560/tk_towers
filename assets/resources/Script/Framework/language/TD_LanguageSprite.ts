import ResModuleManager from "../moduleManager/TD_ResModuleManager";
import language_bm from "./TD_language_bm";
import language_cn from "./TD_language_cn";
import language_de from "./TD_language_de";
import language_en from "./TD_language_en";
import language_id from "./TD_language_id";
import language_sp from "./TD_language_sp";
import language_th from "./TD_language_th";
import language_vi from "./TD_language_vi";
import LanguageEnum from "./TD_LanguageEnum";


// 声明全局类型扩展
declare global {
    namespace cc {
        namespace vv {
            const LanguageSprite: LanguageSpriteInterface;
            const DEBUG: boolean;
        }
    }
}

declare const jsb: any;
declare const Editor: any;

interface LanguageSpriteInterface {
    _Languages: string[];
    _TTFFonts: { [key: string]: cc.TTFFont };
    _systemLanguage: string;
    _systemCountry: string;
    _IpCode?: number;
    init(): void;
    initlanguage(): string;
    getLanguages(): string[];
    getLanguage(): string;
    getLabelByLanguage(key: string): string;
    getLabelByLanguage(key: string, params: any[]): string;
    replaceLangVar(text: string, params: string[]): string;
    isLanguage(tag: string): boolean;
    isLanguageEn(): boolean;
    convertFont(label: cc.Label, alias: string): void;
    setSystemLanguage(lan: string);
    getSystemLanguage(): string;
    getWordByLanguage(item: any): string;
}

const LanguageSprite: LanguageSpriteInterface = {
    _Languages: LanguageEnum.getLanguages(),
    _TTFFonts: {},
    _systemLanguage: "zh",
    _systemCountry: "cn",

    init(): void {
        // if (cc.sys.isNative && cc.sys.os === cc.sys.OS_ANDROID) {
        //     const className = "org/cocos2dx/javascript/Language";
        //     this._systemLanguage = jsb.reflection.callStaticMethod(className, "getSystemLanguage", "()Ljava/lang/String;", "");
        //     this._systemCountry = jsb.reflection.callStaticMethod(className, "getCountry", "()Ljava/lang/String;", "");
        // } else if (cc.sys.isNative && cc.sys.os === cc.sys.OS_IOS) {
        //     const locale = jsb.reflection.callStaticMethod("GameTool", "getLocale", "()Ljava/lang/String;", "");
        //     if (cc.sys.language === cc.sys.LANGUAGE_ENGLISH) {
        //         this._systemLanguage = "en";
        //     } 
        // }
    },

    setSystemLanguage(lan: string) {
        this._systemLanguage = lan;
    },

    getSystemLanguage(): string {
        return this._systemLanguage;
    },

    initlanguage(): string {
        if (!this.isLanguage(this._systemLanguage)) {
            this._systemLanguage = "zh";
        }
        return this._systemLanguage;
    },

    getLanguages(): string[] {
        return this._Languages;
    },

    getLanguage(): string {
        return this._systemLanguage;
    },

    getLabelByLanguage(key: string, params: any[] = []): string {
        const language = this._systemLanguage;
        try {
            // 根据语言选择对应的语言文件
            let labelClass: { [key: string]: string } | null = null;

            switch (language) {
                case "zh":
                    labelClass = language_cn;
                    break;
                case "zh-CN":
                    labelClass = language_cn;
                    break;
                case "de-DE":
                    labelClass = language_de;
                    break;
                case "en":
                    labelClass = language_en;
                    break;
                case "en-US":
                    labelClass = language_en;
                    break;
                case "id-ID":
                    labelClass = language_id;
                    break;
                case "es-ES":
                    labelClass = language_sp;
                    break;
                case "th-TH":
                    labelClass = language_th;
                    break;
                case "vi-VN":
                    labelClass = language_vi;
                    break;
                case "ms-MY":
                    labelClass = language_bm;
                    break;
                default:
                    // 默认使用英文
                    labelClass = language_en;
                    break;
            }
            let str = labelClass ? (labelClass[key] || "") : "";
            if (str != "" && params && params.length > 0) {
                str = this.replaceLangVar(str, params);
            }
            return str;
        } catch (e) {
            cc.error("Failed to load language file: language_" + language, e);
            return "";
        }
    },

    replaceLangVar(text: string, params: any[]): string {
        // 按照索引替换字符串中的 {0}、{1}、{2}... 占位符
        return text.replace(/\{(\d+)\}/g, (match, index) => {
            const paramIndex = parseInt(index, 10);
            return paramIndex < params.length ? params[paramIndex] : match;
        });
    },

    isLanguage(tag: string): boolean {
        const len = this._Languages.length;
        for (let i = 0; i < len; i++) {
            const lan = this._Languages[i];
            if (tag === lan) {
                return true;
            }
        }
        return false;
    },

    isLanguageEn(): boolean {
        return LanguageEnum.is(this.getLanguage(), LanguageEnum.ENGLISH);
    },

    convertFont(label: cc.Label, alias: string): void {
        if (this._TTFFonts[alias]) {
            label.font = this._TTFFonts[alias];
            return;
        }
        ResModuleManager.loadRes(ResModuleManager.getDefaultModuleId(), "png/ttf/" + alias, cc.TTFFont, (err: any, res: cc.TTFFont) => {
            if (err) {
                console.error(err);
                return;
            }
            this._TTFFonts[alias] = res;
            label.font = res;
        });
    },

    getWordByLanguage(item: any) : string{
        let languageId = this.getLanguage();
        let key = "item_en";
        switch (languageId) {
                case "zh":
                    key = "item_en";
                    break;
                case "zh-CN":
                    key = "item_en";
                    break;
                case "de-DE":
                    key = "item_de";
                    break;
                case "en-US":
                    key = "item_en";
                    break;
                case "id-ID":
                    key = "item_idn";
                    break;
                case "es-ES":
                    key = "item_sp";
                    break;
                case "th-TH":
                    key = "item_th";
                    break;
                case "vi-VN":
                    key = "item_vi";
                    break;
                case "ms-MY":
                    key = "item_bm";
                    break;
                default:
                    // 默认使用英文
                    key = "item_en";
                    break;
            }
        return item[key] || item.item_en;
    },
};

// 全局注册 LanguageSprite
if (typeof window !== 'undefined') {
    (window as any).cc = (window as any).cc || {};
    (window as any).cc.vv = (window as any).cc.vv || {};
    // (window as any).LanguageSprite = LanguageSprite;
    (window as any).cc.vv.DEBUG = true;
}

export default LanguageSprite;
