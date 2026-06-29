import UIPanel from "./TD_UIPanel";

const { ccclass, property } = cc._decorator;

@ccclass('TD_UIRoot')
export default class TD_UIRoot extends cc.Component {
    @property(cc.Node)
    panelRoot: cc.Node = null;
    @property(cc.Camera)
    uiCam: cc.Camera = null;

    _listPanel: Array<UIPanel> = [];

    static _instance: TD_UIRoot = null;
    static getInstance(): TD_UIRoot {
        return this._instance;
    }

    onLoad() {
        if (TD_UIRoot._instance == null) {
            TD_UIRoot._instance = this;
        } else {
            this.destroy();
            return;
        }

        this._listPanel = [];

        let panels = this.panelRoot.getComponentsInChildren("TD_UIPanel");
        for (let index = 0; index < panels.length; index++) {
            const element = panels[index];
            this._listPanel.push(element);
        }

        this._listPanel.sort((p1, p2) => {
            let index1 = p1.node.getSiblingIndex();
            let index2 = p2.node.getSiblingIndex();
            return (index1 == index2) ? 0 : (index1 > index2 ? 1 : -1);
        })
    }

    start() {
    }

    onDestroy() {
        TD_UIRoot._instance = null;
    }

    /**
     * 获取指定索引的Panel
     * @param index 索引
     */
    getPanel(index: number): UIPanel {
        if (index < 0 || index >= this._listPanel.length) {
            return null;
        }
        return this._listPanel[index];
    }

}
