import Singleton from "../TD_Singleton";
import TKLog from "../log/TD_TKLog";
import UIFrame from "./TD_UIFrame";
import IUIBridge from "./TD_IUIBridge";
import UIBridgeNormal from "./TD_UIBridgeNormal";
import Global from "../../global/TD_Global";


interface IFrameState {
    (frame: UIFrame): void;
}

export default class UIModule extends Singleton {
    UIWindows: { [uiname: string]: UIFrame } = {};

    onInitEvent: IFrameState;
    onOpenEvent: IFrameState;
    onCloseEvent: IFrameState;

    protected _UIBridge: IUIBridge = null;

    constructor() {
        super();
        // TKLog.LogInfo("UIModule初始化");
        this._UIBridge = new UIBridgeNormal();
        this._UIBridge.initBridge();
    }

    /**
     * 打开窗口
     * @param uiTemplateName 窗口名称
     * @param args 要传入的参数
     */
    openWindow(uiTemplateName: string, ...args: any): Promise<UIFrame> {
        // if (Global.openingUI) {
        //     return Promise.resolve(null);
        // }
        // Global.openingUI = true;
        // TKLog.LogInfo("UIModule.openWindow(" + uiTemplateName + ")");
        let template = this.UIWindows[uiTemplateName];

        if (template) {
            if (template.isValid == false) {
                // TKLog.LogInfo("UIModule.openWindow 虽然已经存在，但无法使用，需要重新加载" + uiTemplateName);
                delete this.UIWindows[uiTemplateName];
            } else {
                // TKLog.LogInfo("UIModule.openWindow 已经存在，直接打开" + uiTemplateName);
                this.onOpen(this.UIWindows[uiTemplateName], ...args);
                return Promise.resolve(this.UIWindows[uiTemplateName]);
            }
        }

        return this.loadWindow(uiTemplateName, true, ...args);
    }

    /**
     * 关闭窗口
     * @param name 窗口名称
     */
    closeWindow(name: string) {
        // Global.openingUI = null;
        if (this.UIWindows[name] == null) {
            // TKLog.LogWarn("closeWindow 找不到窗口" + name);
            return;
        }

        let frame = this.UIWindows[name];
        frame.onClose();
        if (cc.isValid(frame.node)) {
            frame.node.active = false;
        }

        if (this.onCloseEvent != null) {
            this.onCloseEvent(frame);
        }
    }

    /**
     * 获取窗口对象
     * 如果该窗口还没有加载过，则会返回null
     * @param name 窗口名称
     */
    getFrame(name: string): UIFrame {
        if (this.UIWindows[name] == null) {
            return null;
        }
        return this.UIWindows[name];
    }

    /**
     * 判断该窗口是否已经加载过
     * @param name 窗口名称
     */
    isLoad(name: string): boolean {
        if (this.UIWindows[name] == null) {
            return false;
        }
        return true;
    }

    /**
     * 检测该窗口当前是否正在显示
     * @param name 窗口名称
     */
    isOpen(name: string): boolean {
        if (this.UIWindows[name] == null) {
            return false;
        }
        return this.UIWindows[name].node.active;
    }

    /**
     * 销毁窗口
     * 即destroy节点
     * @param uiTemplateName 窗口名称
     * @param release 是否释放该窗口的资源
     */
    destroyWindow(uiTemplateName: string, release: boolean = true, anim: boolean = true) {
        // Global.openingUI = null;
        // TKLog.LogInfo("UIModule.destroyWindow(" + uiTemplateName+")");

        if (this.UIWindows[uiTemplateName] == null) {
            // TKLog.LogWarn("UIModule.destroyWindow 找不到要销毁的窗口" + uiTemplateName);
            const canvas = cc.find("Canvas");
            const uiroot = canvas && cc.isValid(canvas) ? canvas.getChildByName("UIRoot") : null;
            if (uiroot && cc.isValid(uiroot) && uiroot.children.length > 0) {
                uiroot.children.forEach((child) => {
                    const nameArr = uiTemplateName.split("/");
                    let delui = child.getChildByName(nameArr[2]);
                    if (delui && cc.isValid(delui)) {
                        TKLog.LogInfo("uiwindows里找不到当前节点，从场景节点里遍历该节点并销毁");
                        delui.destroy();
                    }
                })
            }
            return;
        }
        let frame = this.UIWindows[uiTemplateName];
        if (cc.isValid(frame.node)) {
            if (anim) {
                const maskNode = frame.node.getComponentInChildren(ModalUI);
                if (maskNode && maskNode.node) {
                    maskNode.node.active = false;
                }
                // cc.tween(frame.node)
                //     .parallel(
                //         cc.tween().by(0.5, { position: cc.v3(400, 0, 0) }),
                //         cc.tween().to(0.5, { opacity: 50 })
                //     )
                //     .call(() => {
                //         frame.node.destroy();
                //     })
                //     .start();
                frame.node.runAction(
                    cc.sequence(
                        cc.spawn(
                            // cc.moveBy(0.5, 400, 0),
                            cc.scaleTo(0.15,0.2),
                            cc.fadeTo(0.15, 50)
                        ),
                        cc.callFunc(() => {
                            frame.node.destroy();
                        })
                    )
                );
            } else {
                frame.node.destroy();
            }
        }

        // if (release) {
        //     TKLog.LogInfo("TODO 释放窗口" + uiTemplateName + "资源");
        // }

        delete this.UIWindows[uiTemplateName];
        // this.UIWindows[uiTemplateName] = null;
    }

    /**
     * 销毁所有已加载的窗口
     */
    destroyAllWindow() {
        // TKLog.LogInfo("UIModule.destroyAllWindow()")
        let loadList: Array<string> = [];

        for (let item in this.UIWindows) {
            if (this.isLoad(item)) {
                loadList.push(item);
            }
        }

        loadList.forEach((name) => {
            this.destroyWindow(name, true, false);
        })
    }

    /**
     * 关闭所有窗口
     */
    closeAllWindow() {
        // TKLog.LogInfo("UIModule.closeAllWindow()")
        for (let item in this.UIWindows) {
            if (this.isOpen(item)) {
                this.closeWindow(item);
            }
        }
    }

    private loadWindow(uiTemplateName: string, openWhenFinish: boolean, ...args: any): Promise<UIFrame> {
        // TKLog.LogInfo("UIModule.loadWindow(" + uiTemplateName + ")");

        if (this.UIWindows[uiTemplateName]) {
            TKLog.LogWarn("UIModule.loadWindow 多次加载窗口:" + uiTemplateName);
        }

        return new Promise<UIFrame>((resolve, reject) => {
            this._UIBridge.loadUIAsset(uiTemplateName)
                .then(prefab => {
                    if (prefab == null) {
                        Global.openingUI = null;
                        resolve(null);
                    } else {
                        let inst = cc.instantiate(prefab);
                        let frame = this._UIBridge.createUIController(inst, uiTemplateName);
                        frame.UIName = uiTemplateName;
                        this._UIBridge.uiObjectFilter(frame, inst);

                        this.UIWindows[uiTemplateName] = frame;
                        this.initWindow(frame, openWhenFinish, ...args);
                        Global.openingUI = null;
                        resolve(frame);
                    }
                }).catch(e => {
                    TKLog.LogErr("加载窗口" + uiTemplateName + "失败:" + e);
                    Global.openingUI = null;
                    resolve(null);
                })
        }).catch(e => {
            Global.openingUI = null;
            TKLog.LogErr("UIModule.loadWindow(" + uiTemplateName + ") Err:" + e);
            throw new Error("UIModule.loadWindow(" + uiTemplateName + ") Err:" + e);
        })
    }

    private initWindow(frame: UIFrame, openWhenFinish: boolean, ...args: any) {
        // TKLog.LogInfo("UIModule.initWindow(" + frame + ")");
        frame.onInit();
        if (this.onInitEvent != null) {
            this.onInitEvent(frame);
        }
        if (openWhenFinish) {
            this.onOpen(frame, ...args);
        } else {
            frame.node.active = false;
        }
    }

    private onOpen(frame: UIFrame, ...args: any) {
        Global.openingUI = null;
        // TKLog.LogInfo("UIModule.onOpen(" + frame.name + ")");
        if (frame == null) {
            return;
        }
        // if(frame.node.active){
        //     frame.onClose();
        //     if(this.onCloseEvent != null){
        //         this.onCloseEvent(frame);
        //     }
        // }

        frame.beforeOpen(() => {
            frame.node.active = true;
            frame.onOpen(...args);

            if (this.onOpenEvent != null) {
                this.onOpenEvent(frame);
            }
            // let content = frame.node.getChildByName("Content");
            // if (content) {
            //     content.scale = 0.2;
            //     content.opacity = 50;
            //     cc.tween(content)
            //         .to(0.15, {scale: 1.05, opacity: 255})
            //         .to(0.05, {scale: 1.0})
            //         .start()
            // }
            
        }, ...args);
    }
}
