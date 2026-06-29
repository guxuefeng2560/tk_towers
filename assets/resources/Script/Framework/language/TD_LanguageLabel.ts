import LanguageSprite from "./TD_LanguageSprite";

const { ccclass, property } = cc._decorator;

// 语言字体大小配置接口
interface LanguageFontSize {
    // cn: number;
    // de: number;
    en: number;
    // es: number;
    // fr: number;
    // in: number;
    // ja: number;
    // pt: number;
    // tw: number;
}

// 声明全局变量
declare const EVENT_NAME: {
    LANGUAGE_UPDATE: string;
};

// 扩展 String 原型以支持 format 方法
declare global {
    interface String {
        format(...args: any[]): string;
    }
}

@ccclass("TD_LanguageLabel")
export default class LanguageLabel extends cc.Component {

    @property({
        type: cc.Class({
            name: 'TD_LanguageFontSize',
            properties: {
                // de: cc.Integer,
                en: cc.Integer,
                // es: cc.Integer,
                // fr: cc.Integer,
                // in: cc.Integer,
                // ja: cc.Integer,
                // pt: cc.Integer,
                // tw: cc.Integer
            }
        })
    })
    mFontSize: LanguageFontSize = null;

    @property(cc.String)
    mKey: string = "";

    // 私有属性
    private _oFontSize: number = 0;
    private _oy: number = 0;
    private mStr: string = "";

    onLoad(): void {
        const label = this.node.getComponent(cc.Label);
        this._oFontSize = label.fontSize;
        this._oy = this.node.y;
        
        this.initLanguageSprite();
    }

    onDestroy(): void {
        
    }

    setKey(key: string, str?: string): void {
        this.mKey = key;
        this.mStr = str || "";
        const label = this.node.getComponent(cc.Label);
        if (this.mStr) {
            const labelText = LanguageSprite.getLabelByLanguage(this.mKey);
            label.string = (labelText as any).format(this.mStr);
        } else {
            label.string = LanguageSprite.getLabelByLanguage(this.mKey);
        }
    }

    initLanguageSprite(): void {
        const label = this.node.getComponent(cc.Label);

        if (this.mStr) {
            const labelText = LanguageSprite.getLabelByLanguage(this.mKey);
            label.string = (labelText as any).format(this.mStr);
        } else {
            label.string = LanguageSprite.getLabelByLanguage(this.mKey);
        }

        const fontSize = this.mFontSize ? this.mFontSize[LanguageSprite.getLanguage()] : 0;

        if (fontSize > 0) {
            label.fontSize = fontSize;
        } else {
            label.fontSize = this._oFontSize;
        }
    }
}
