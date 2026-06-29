/**
 * 全局计时器，挂载到常驻节点下
 */

import Global from "../global/TD_Global";
import { Constants } from "../global/TD_Constants";

const { ccclass, property } = cc._decorator;

@ccclass("TD_GlobalScheduler")
export default class GlobalScheduler extends cc.Component {
    /** cd时间 */
    private _cd: number = 0;
    /** 计时间隔（秒） */
    private _interval: number = 1;
    /** 计时器 */
    private _timer: cc.Scheduler = cc.director.getScheduler();

    private _callback: Function = null;

    init(callback?: Function) {
        this._timer.enableForTarget(this);
        this._callback = callback;
    }

    /**
     * 获取当前cd
     */
    getCurrentCD(): number {
        return this._cd;
    }

    /**
     * 刷新当前cd
     * @param val 当前cd
     */
    refreshCD(val: number) {
        if (val <= 0) {
            return;
        }

        if (this._timer == null) {
            return;
        }

        this._cd = val;
        this._timer.unschedule(this.updateCD, this);
        this._timer.schedule(this.updateCD, this, this._interval);
    }

    clearInterval() {
        if (this._timer == null) {
            return;
        }
        this._timer.unschedule(this.updateCD, this);
        // this._callback && this._callback();
        Global.healthTips = Constants.COUNTDOWN_TIME;
    }

    updateCD() {
        if (this._cd <= 0) {
            this.clearInterval();
            return;
        }
        this._cd--;
    }

    pauseInterval() {
        if (this._timer == null) {
            return;
        }
        if (this._timer.isTargetPaused(this)) {
            return;
        }

        this._timer.pauseTarget(this);
    }

    resumeInterval() {
        if (this._timer == null) {
            return;
        }
        if (this._timer.isTargetPaused(this)) {
            this._timer.resumeTarget(this);
        }
    }
}
