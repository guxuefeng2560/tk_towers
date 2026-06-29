import UIModule from "./TD_UIModule";

const { ccclass, property } = cc._decorator;

@ccclass('TD_UIFrame')
export default class TD_UIFrame extends cc.Component {
    // 所在panel的索引，从0开始，如果超出UIRoot的panel范围，则用0号索引
    @property(cc.Integer)
    PanelIndex = 0;

    UITemplateName: string = "";
    UIName: string = "";

    /**
     * 初始化，会在加载完成后调用
     * 只会调用一次
     */
    onInit() {
        // TKLog.LogInfo("UIFrame onInit");
    }

    /**
     * 在实际打开之前先执行
     * @param doOpen 在打开之前先执行一些不可告人的事情
     * @param openArgs 参数
     */
    beforeOpen(doOpen?: Function, ...openArgs: any) {
        // TKLog.LogInfo("UIFrame beforeOpen");
        if (doOpen != null) {
            doOpen();
        }
    }

    /**
     * 在打开窗口时显示
     * @param args 参数
     */
    onOpen(...args: any) {

    }

    /**
     * 在关闭窗口时执行
     */
    onClose() {
        // TKLog.LogInfo("UIFrame onClose");
    }

    protected openWindow(uiName: string, ...args: any) {
        UIModule.getInstance().openWindow(uiName, args);
    }

    protected closeWindow(uiName: string = "") {
        UIModule.getInstance().closeWindow(uiName.length == 0 ? this.UIName : uiName);
    }
}
