/**
 *                  ___====-_  _-====___
 *            _--^^^#####//      \\#####^^^--_
 *         _-^##########// (    ) \\##########^-_
 *        -############//  |\^^/|  \\############-
 *      _/############//   (@::@)   \\############\_
 *     /#############((     \\//     ))#############\
 *    -###############\\    (oo)    //###############-
 *   -#################\\  / VV \  //#################-
 *  -###################\\/      \//###################-
 * _#/|##########/\######(   /\   )######/\##########|\#_
 * |/ |#/\#/\#/\/  \#/\##\  |  |  /##/\#/  \/\#/\#/\#| \|
 * `  |/  V  V  `   V  \#\| |  | |/#/  V   '  V  V  \|  '
 *    `   `  `      `   / | |  | | \   '      '  '   '
 *                     (  | |  | |  )
 *                    __\ | |  | | /__
 *                   (vvv(VVV)(VVV)vvv)
 *                        神兽保佑
 *                       代码无BUG!
 */

import Singleton from "../TD_Singleton";
import UIModule from "../ui/TD_UIModule";
import ArrayUtil from "../utils/TD_ArrayUtil";
import ResPathDefine from "../../global/TD_ResDefine";
import Global from "../../global/TD_Global";
import TKFarmGame from "../../game/TD_TKFarmGame";
import { EVENT_UPDATE_MAIL_LIST, EVENT_UPDATE_FRIEND_LIST } from "../../global/TD_Event";
import RequestManager from "../../netMessage/TD_RequestManager";

/**
 * UI管理器
 */
export default class UIManager extends Singleton {
    private _uiStack: Array<string> = null;

    constructor() {
        super();
        this._uiStack = [];
    }

    /** 关闭所有ui */
    clearUIStack() {
        if (!this._uiStack || this._uiStack.length <= 0) {
            this._uiStack = [];
            return;
        }

        const uiNames = Array.from(new Set(this._uiStack.filter((name) => !!name)));
        this._uiStack = [];

        for (let i = 0, length = uiNames.length; i < length; i++) {
            UIModule.getInstance().destroyWindow(uiNames[i], true, false);
        }
    }

    // 添加ui到栈
    addUI(uiName: string) {
        this._uiStack.push(uiName);
    }

    /** 获取栈顶ui */
    getTopUI(): string {
        if (this._uiStack && this._uiStack.length > 0) {
            return this._uiStack.slice(-1)[0];
        }
        return "";
    }

    /** 关闭栈顶ui */
    finishTopUI() {
        if (Global.openingUI) {
            return;
        }

        if (this._uiStack) {
            if (this._uiStack.length > 0) {
                const uiName = this._uiStack.slice(-1)[0];
                if (uiName) {
                    this.finishUI(uiName);
                }
            } else {
                if (Global.isLoadScene) {
                    //     if (Global.openingUI) { return; }
                    //     Global.openingUI = true;
                    //     UIModule.getInstance().openWindow(ResPathDefine.UINAME_END_GAME);
                    // } else {
                    cc.game.end();
                }
            }
        }
    }

    /**
     * 关闭指定ui集
     * @param uiNames 
     */
    finishUIs(uiNames: string[]) {
        if (uiNames && uiNames.length > 0) {
            for (let i = 0, length = uiNames.length; i < length; i++) {
                this.finishUI(uiNames[i]);
            }
        }
    }

    /**
     * 关闭指定ui
     * @param uiName 
     */
    finishUI(uiName: string, anim: boolean = true) {
        if (uiName) {
            if (this._uiStack && this._uiStack.length > 0) {
                const success = ArrayUtil.removeArrayItem(this._uiStack, uiName);
                if (success) {
                    UIModule.getInstance().destroyWindow(uiName, true, anim);
                    /** 从这些界面返回主界面需要调一下物品刷新，任务刷新 接口 */
                    if (uiName == ResPathDefine.UINAME_MAGIC_BOX ||
                        uiName == ResPathDefine.UINAME_QUEST_LIST ||
                        uiName == ResPathDefine.UINAME_HERO_LIST ||
                        uiName == ResPathDefine.UINAME_COMPOSITE ||
                        uiName ==  ResPathDefine.UINAME_LEARN_CODE) {
                        // RequestManager.getInstance().sendReqUserHome();
                        /** 获取背包 */
                        RequestManager.getInstance().sendReqInventory();
                        /** 任务信息 */
                        RequestManager.getInstance().sendReqGetDailyTasks();
                    }
                }
            }
        }
    }

    /**
     * 是否存在ui
     * @param uiName 
     */
    isExistUI(uiName: string): boolean {
        if (this._uiStack && this._uiStack.length > 0) {
            const success = ArrayUtil.arrayContainItem(this._uiStack, uiName);
            return success > -1;
        }

        return false;
    }
}
