import UIFrame from "./TD_UIFrame";

export default interface IUIBridge {

    initBridge();

    createUIController(uiNode: cc.Node, uiTemplateName: string): UIFrame;

    uiObjectFilter(controller: UIFrame, uiNode: cc.Node);

    loadUIAsset(uiTemplateName: string): Promise<cc.Prefab>;
}
