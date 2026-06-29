import IUIBridge from "./TD_IUIBridge";
import UIRoot from "./TD_UIRoot";
import TKLog from "../log/TD_TKLog";
import ResLoadManager from "../TD_ResLoadManager";
import UIFrame from "./TD_UIFrame";

export default class UIBridgeNormal implements IUIBridge {
    initBridge() {

    }
    createUIController(uiNode: cc.Node, uiTemplateName: string): import("./TD_UIFrame").default {
        // let frame = uiNode.getComponent("TD_UIFrame") as UIFrame;

        // 解析prefab的名称
        const nameArr = uiTemplateName.split("/");
        const componentName = nameArr[nameArr.length - 1];

        let frame = uiNode.getComponent(componentName) as UIFrame;
        if (frame == null) {
            const components = uiNode.getComponents(cc.Component) || [];
            for (let i = 0; i < components.length; i++) {
                const component = components[i];
                if (component instanceof UIFrame) {
                    frame = component as UIFrame;
                    break;
                }
            }
        }
        if (frame == null) {
            TKLog.LogErr("UIModule.createUIController 找不到UIFrame组件:" + uiTemplateName);
            return null;
        }

        // uiNode.position = new cc.Vec2(0,0);
        // uiNode.scale = 1;

        let panel = UIRoot.getInstance().getPanel(frame.PanelIndex);
        if (panel == null) {
            panel = UIRoot.getInstance().getPanel(0);
            TKLog.LogWarn("找不到UIRoot的Panel(" + frame.PanelIndex + ")");
        }
        if (panel != null) {
            panel.node.addChild(frame.node);
            // frame.node.scale = 1;
            // frame.node.position = cc.Vec2.ZERO;
        }
        return frame;
    }
    uiObjectFilter(controller: import("./TD_UIFrame").default, uiNode: cc.Node) {

    }
    loadUIAsset(uiTemplateName: string): Promise<cc.Prefab> {
        return ResLoadManager.getInstance().loadRes(uiTemplateName, cc.Prefab);
    }


}
