/**
 * 网络请求界面
 */

import UIFrame from "../ui/TD_UIFrame";
import HttpManager from "../../tools/net/TD_HttpManager";
import UIModule from "../ui/TD_UIModule";
import { EVENT_LOAD_MAIN_SCENE } from "../../global/TD_Event";
import Global from "../../global/TD_Global";
import ResPathDefine from "../../global/TD_ResDefine";
import LanguageSprite from "../language/TD_LanguageSprite";

const { ccclass, property } = cc._decorator;

@ccclass('TD_LoadingController')
export default class TD_LoadingController extends UIFrame {
	@property({
		type: cc.Node,
		tooltip: "对话框背景"
	})
	NodeBg: cc.Node = null;

	@property({
		type: cc.Node,
		tooltip: "旋转 Sprite 所在节点"
	})
	NodeLoading: cc.Node = null;

	private _netTipCallback: Function = null;

	onEnable() {
		HttpManager.getInstance().RegisterErrorListener(this.OnMsgError, this);
		this.show();
	}

	OnMsgError(name: any, err: Error) {
		UIModule.getInstance().closeWindow(ResPathDefine.UINAME_LOADING_CONTROLLER);
	}

	show() {
		this.node.active = true;

		// 背景从透明变半透明
		this.NodeBg.stopAllActions();
		this.NodeBg.opacity = 0;

		cc.tween(this.NodeBg)
			.to(0.24, { opacity: 180 })
			.start();

		// 一直旋转
		this.NodeLoading.stopAllActions();
		cc.tween(this.NodeLoading)
			.by(1, { angle: -360 })
			.repeatForever()
			.start()

		this._netTipCallback = () => {
			Global.netError = true;
			this.node.active = false;

			// if (Global.isBattleScene) { // 战斗场景特殊处理
			// 	TKFarmGame.getInstance().event.fire(EVENT_LOAD_MAIN_SCENE);
			// 	return;
			// }

			// PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts06"), 1, 2);
		}

		this.scheduleOnce(this._netTipCallback, 10)
	}

	hide() {
		// 背景从半透明变透明，之后隐藏节点
		this.NodeBg.stopAllActions();
		cc.tween(this.NodeBg)
			.to(0.24, { opacity: 0 })
			.call(() => {
				this.node.active = false;
			})
			.start();

		// 停止旋转
		this.NodeLoading.stopAllActions();
	}

	onDisable() {
		this._netTipCallback && this.unschedule(this._netTipCallback);
		HttpManager.getInstance().UnRegisterErrorListener(this.OnMsgError, this);
	}

	static openLoading(): Promise<UIFrame> {
		return UIModule.getInstance().openWindow(ResPathDefine.UINAME_LOADING_CONTROLLER);
	}

	static closeLoading() {
		UIModule.getInstance().closeWindow(ResPathDefine.UINAME_LOADING_CONTROLLER);
	}
}
