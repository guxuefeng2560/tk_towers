import LanguageSprite from "../../Framework/language/TD_LanguageSprite";
import TKLog from "../../Framework/log/TD_TKLog";
import Singleton from "../../Framework/TD_Singleton";
import Global from "../../global/TD_Global";
import INetManager, { NetEventType } from "./TD_INetManager";
import PopInfo from "../../Framework/components/TD_PopInfo"
import { NetMessageError, NetBaseReq } from "./TD_Message";
import Emitter from "../../Framework/event/TD_Emitter";



export default class HttpManager extends Singleton implements INetManager {
    event = new Emitter();

    url: string = "";
    token: string = "";

    log: boolean = false;

    // 消息码-重试次数
    resendCount: { [code: number]: number } = {};
    // 超时时间，毫秒
    checkTimeOut: number = 8000;

    constructor() {
        super();
    }

    SetToken(token: string) {
        this.token = token;
        if (this.log) {
            TKLog.LogInfo("重新设置token:" + token);
        }
    }

    // ## INetManager
    CreateInit(params: any) {
        let ip = params["ip"];
        if (ip == null || ip == undefined) {
            TKLog.LogErr("HttpManager.CreateInit错误，需要传入ip参数");
            return;
        }

        this.url = ip;
    }
    OnOpen(message: any) {
        // this.event.fire(NetEventType.OnOpen, message);
        // throw new Error("Method not implemented.");
    }
    OnClose(message: any) {
        // this.event.fire(NetEventType.OnClose, message);
        // throw new Error("Method not implemented.");
    }
    OnMessage(message: any) {
        let topic = message["topic"];
        let payload = message["payload"];

        if (this.log) {
            TKLog.LogInfo("OnMessage", message);
        }
        try {
            let errCode: number = payload["err"]
            let errMsg: string = payload["message"];
            let resultObj = payload["dat"];
            if (resultObj == undefined) {
                TKLog.LogWarn("获取到的数据没有dat结构：", payload);
                resultObj = { "err": 1 }
            }

            let errObj = new NetMessageError(errCode == undefined ? 0 : errCode, errMsg == undefined ? "" : errMsg);

            let errorCode = errObj.err;
            if (errorCode == 20021 || errorCode == 20022 || errorCode == 20023 ||
                errorCode == 20024 || errorCode == 20025 || errorCode == 20026 ||
                errorCode == 20028 || errorCode == 20029 || errorCode == 401) {
                errorCode = 401;
            }

            if (errorCode == 401) {
                this.event.fire(NetEventType.Unauthorized);
                return;
            }

            this.event.fire(NetEventType.OnMessage + "_" + topic, resultObj, errObj);
        } catch (e) {
            this.OnError(new Error(`解析消息${topic}异常${e}，payload=${payload}`));
        }
    }
    OnError(message: any) {
        this.event.fire(NetEventType.OnError, message);
    }
    SendRequest(req: NetBaseReq) {
        const content = req.serialize();
        if (this.log) {
            TKLog.LogInfo("HttpManager.Send(" + req.getMsgCode() + ")", req);
        }

        this._post(req.msg_code, content, req);
    }
    RegisterMsgListener(msgCode: string, callback: Function, context: any) {
        this.event.register(NetEventType.OnMessage + "_" + msgCode, callback, context);
    }
    UnRegisterMsgListener(msgCode: string, callback: Function, context: any) {
        this.event.remove(NetEventType.OnMessage + "_" + msgCode, callback, context);
    }
    RegisterDefaultMsgListener(callback: Function, context: any) {
        throw new Error("Method not implemented.");
    }
    // ##

    // 注册服务器错误监听
    RegisterErrorListener(callback: Function, context: any) {
        this.event.register(NetEventType.OnError, callback, context);
    }
    UnRegisterErrorListener(callback: Function, context: any) {
        this.event.remove(NetEventType.OnError, callback, context);
    }

    //注册401错误监听
    RegisterUnauthorizedListener(callback: Function, context: any) {
        this.event.register(NetEventType.Unauthorized, callback, context);
    }
    UnRegisterUnauthorizedListener(callback: Function, context: any) {
        this.event.remove(NetEventType.Unauthorized, callback, context);
    }

    reSend(req: NetBaseReq) {
        if (req == null || req == undefined) {
            return
        }

        if (!this.resendCount[req.getMsgCode()]) {
            this.resendCount[req.getMsgCode()] = 0
        }
        this.resendCount[req.getMsgCode()]++
        if (this.resendCount[req.getMsgCode()] >= 3) {
            HttpManager.getInstance().OnError(new Error("网络请求超时"))
            PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts36"), 2, 2);
            Global.openingScene = null;
        } else {
            TKLog.LogWarn("重新请求消息", this.resendCount[req.getMsgCode()], req)
            this.SendRequest(req)
        }
    }

    protected _post(method: string, body: string, req: NetBaseReq) {
        let url = this.url;
        if (method.startsWith("v1/gamex/")) {
            url = this.url + "/" + method;
        } else {
            url = this.url + "/" + method;
        }
        try {
            let xhr = new XMLHttpRequest();
            xhr.responseType = "json";
            xhr.open("POST", url, true);
            // 超时时间（毫秒）
            xhr.timeout = this.checkTimeOut;
            xhr.setRequestHeader("Content-Type", "application/json");
            // 渠道号和游戏内部版本号
            // xhr.setRequestHeader("X-Custom-Header", `${Constants.CHANNEL_CODE}-${Constants.headerVersionCode}`);
            // TKLog.LogInfo("header:token", url, this.token);
            if (Global.test_token.length > 0) {
                xhr.setRequestHeader("Authorization", "Bearer " + Global.test_token);//this.token);
            }
            xhr.onerror = (pe: ProgressEvent) => {
                if (this.checkPolicyNet()) {
                    PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts38"), 2, 2);
                } else {
                    PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts37"), 2, 2);
                }

                HttpManager.getInstance().OnError(new Error("网络请求失败"));
                TKLog.LogInfo("onerror:", xhr.statusText, url, pe);
                Global.openingScene = null;
                this.OnMessage({ "topic": req.msg_code, "payload": {"err":1, "message": "网络请求失败"}})
            }
            xhr.ontimeout = () => {
                // if (this.checkPolicyNet()) {
                //     PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts38"), 2, 2);
                // } else {
                //     PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts37"), 2, 2);
                // }
                Global.openingScene = null;
                // this.reSend(req)
                TKLog.LogInfo("ontimeout:", url, xhr.timeout, xhr.statusText, xhr.status);
                this.OnMessage({ "topic": req.msg_code, "payload": {"err":1, "message": "网络连接超时"}})
            }
            xhr.onreadystatechange = () => {
                if (xhr.readyState != 4) { return }
                if (xhr.status >= 200 && xhr.status < 400) {
                    if (this.resendCount[req.msg_code]) {
                        TKLog.LogInfo("重置重发次数", req.msg_code);
                        this.resendCount[req.msg_code] = 0
                    }
                    this.OnMessage({ "topic": req.msg_code, "payload": xhr.response })
                } else {
                    if (this.checkPolicyNet()) {
                        PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts38"), 2, 2);
                    } else {
                        PopInfo.popText(LanguageSprite.getLabelByLanguage("gjxlx_ts36"), 2, 2);
                    }

                    TKLog.LogInfo("onreadystatechange:", xhr.statusText, url, xhr.status);
                    HttpManager.getInstance().OnError(new Error("服务器连接错误" + xhr.status));
                    Global.openingScene = null;
                    this.OnMessage({ "topic": req.msg_code, "payload": {"err":1, "message": "服务器连接错误"}})
                }
            }
            xhr.send(body)
        } catch (error) {
            TKLog.LogInfo("catche error :", error)
            throw new Error("HttpMangaer._post Error:" + error + url);
        }

    }

    /**
     * 检测流量是否被禁用
     */
    checkPolicyNet(): boolean {
        return false;
    }
}
