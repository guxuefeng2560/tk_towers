/**
 *
 *
 *                                                    __----~~~~~~~~~~~------___
 *                                   .  .   ~~//====......          __--~ ~~
 *                   -.            \_|//     |||\\  ~~~~~~::::... /~
 *                ___-==_       _-~o~  \/    |||  \\            _/~~-
 *        __---~~~.==~||\=_    -_--~/_-~|-   |\\   \\        _/~
 *    _-~~     .=~    |  \\-_    '-~7  /-   /  ||    \      /
 *  .~       .~       |   \\ -_    /  /-   /   ||      \   /
 * /  ____  /         |     \\ ~-_/  /|- _/   .||       \ /
 * |~~    ~~|--~~~~--_ \     ~==-/   | \~--===~~        .\
 *          '         ~-|      /|    |-~\~~       __--~~
 *                      |-~~-_/ |    |   ~\_   _-~            /\
 *                           /  \     \__   \/~                \__
 *                       _--~ _/ | .-~~____--~-/                  ~~==.
 *                      ((->/~   '.|||' -_|    ~~-/ ,              . _||
 *                                 -_     ~\      ~~---l__i__i__i--~~_/
 *                                 _-~-__   ~)  \--______________--~~
 *                               //.-~~~-~_--~- |-------~~~~~~~~
 *                                      //.-~~~--\
 *                               神兽保佑
 *                              代码无BUG!
 */

import Global from "../../global/TD_Global";



/**
 * @classdesc 多分辨率下屏幕适配方案，包括场景适配、背景图片适配、节点内容适配
 * @description 
 * 用法：
 *      1.将本组件挂在节点上即可
 *      2.选择适配类型
 * 适配原理：
 *      1.将目标的宽高调整为画布的大小，以进行Size适配
 * @author mnkyc
 * @since 2020-06-01
 * @note 
 * 注意：
 *      1.适配背景图片和内容时，挂载这个脚本的节点不能加入Widget组件，不然这个适配是没有效果的
 *      2.只支持 SHOW_ALL 模式下的缩放适配，不支持其他模式
 * 
 * 代码设置 SHOW_ALL 模式
 *      cc.view.setDesignResolutionSize(1280, 720, cc.ResolutionPolicy.SHOW_ALL);
 * 
 * 或 Canvas 组件中同时勾选 Fit Width 和 Fit Height
 * 
 */

const { ccclass, property, executionOrder } = cc._decorator;

/**
 * 适配类型
 */
enum AdapterTypeEnum {
    Canvas,         //场景
    Background,     //背景
    Content         //节点内容
}

@ccclass("TD_MultiResolution")
@executionOrder(-9003)
export default class MultiResolution extends cc.Component {
    @property({
        type: cc.Enum(AdapterTypeEnum),
        tooltip: "适配类型"
    })
    AdapterType: AdapterTypeEnum = AdapterTypeEnum.Canvas;

    onLoad() {
        // 先找到 SHOW_ALL 模式适配后，本节点的实际宽高和初始缩放值
        let srcScaleForShowAll = Math.min(cc.view.getCanvasSize().width / this.node.width, cc.view.getCanvasSize().height / this.node.height);
        let realWidth = this.node.width * srcScaleForShowAll;
        let realHeight = this.node.height * srcScaleForShowAll;
        this.setAdapter(realWidth, realHeight);
    }

    /**
     * 
     * @param realWidth 真实宽度
     * @param realHeight 真实高度
     */
    setAdapter(realWidth: number, realHeight: number) {
        switch (this.AdapterType) {
            case AdapterTypeEnum.Canvas:
                this.adaptCanvas();
                break;
            case AdapterTypeEnum.Background:
                this.adaptBackground(realWidth, realHeight);
                break;
            case AdapterTypeEnum.Content:
                this.adaptContent(realWidth, realHeight);
                break;
            default:
                this.adaptCanvas();
                break;
        }
    }

    /**
     * 场景适配
     */
    adaptCanvas() {
        let cvs = cc.find("Canvas").getComponent(cc.Canvas);
        let frameSize = cc.view.getFrameSize();
        let rtFrame = frameSize.width / frameSize.height;
        let deFrame = cvs.designResolution.width / cvs.designResolution.height;
        cvs.fitWidth = rtFrame < deFrame ? true : false;
        cvs.fitHeight = !cvs.fitWidth;
    }

    /**
     * 背景图适配，节点保持和设计分辨率一样的宽高
     * @param realWidth 真实宽度
     * @param realHeight 真实高度
     */
    adaptBackground(realWidth: number, realHeight: number) {
        // 将背景图片整体缩放，不会产生高度或者宽度的压缩拉伸
        this.node.scale = Math.max(cc.view.getCanvasSize().width / realWidth, cc.view.getCanvasSize().height / realHeight);
        Global.bgScale = this.node.scale;
    }

    /**
     * 内容适配，节点保持和设计分辨率一样的宽高
     * @note 这里注意不要设置节点的scale，因为会影响子节点的大小
     * @param realWidth 
     * @param realHeight 
     */
    adaptContent(realWidth: number, realHeight: number) {
        let cvs = cc.find("Canvas").getComponent(cc.Canvas);
        if (cvs.fitWidth) {
            this.node.height = this.node.height * Math.max(cc.view.getCanvasSize().width / realWidth, cc.view.getCanvasSize().height / realHeight);
        }
        if (cvs.fitHeight) {
            this.node.width = this.node.width * Math.max(cc.view.getCanvasSize().width / realWidth, cc.view.getCanvasSize().height / realHeight);
        }
    }
}
