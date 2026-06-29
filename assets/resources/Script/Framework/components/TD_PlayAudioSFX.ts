/**
 * 音效播放组件
 */

import AudioManager from "../audio/TD_AudioManager";



const { ccclass, property } = cc._decorator;

@ccclass("TD_PlayAudioSFX")
export default class TD_PlayAudioSFX extends cc.Component {
    /** 音频ID */
    @property(cc.Integer)
    audioId = 0;

    onLoad() {
        let button = this.node.getComponent(cc.Button);
        if (button) {
            let clickEventHandler = new cc.Component.EventHandler();
            clickEventHandler.target = this.node;
            clickEventHandler.component = "TD_PlayAudioSFX"; // 代码文件名
            clickEventHandler.handler = "excute";
            button.clickEvents.push(clickEventHandler);
        } else {
            this.node.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        }
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
    }

    excute() {
        AudioManager.getInstance().playSFX(this.audioId);
    }

    touchEnd() {
        AudioManager.getInstance().playSFX(this.audioId);
    }
}
