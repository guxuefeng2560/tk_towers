import ToolsUseful from "../../tools/TD_ToolsUseful";

/**
 * 时间工具
 */
export default class TimeUtil {
    private static start_date = new Date();

    static time() {
        return TimeUtil.getSecWhenStart();
    }
    /**
     * 获取游戏开始到现在经历了多少秒
     */
    static getSecWhenStart() {
        return Math.floor(TimeUtil.getMilSecWhenStart() / 1000);
    }
    /**
     * 获取游戏开始到现在经历了多少毫秒
     */
    static getMilSecWhenStart() {
        return Date.now() - this.start_date.valueOf();
    }
    /**
     * 获取格林威治时间秒数
     */
    static nowSec() {
        return Math.floor(Date.now() / 1000);
    }

    /**
     * 获取当前时间的字符串格式 Year-Month-Day Hour:Minute:Second
     */
    static nowDateFormatString(): string {
        let d = new Date();
        return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
    }

    /**
     * 获取年月日的字符串格式，并使用split间隔
     * 比如split为 - 则返回 2020-02-02
     * @param split 间隔符号
     */
    static nowDataYMDFormatString(split: string): string {
        let d = new Date();
        return d.getFullYear() + split + ToolsUseful.supplementZero((d.getMonth() + 1) + "", 2) + split + ToolsUseful.supplementZero(d.getDate() + "", 2);
    }

    static lastDataYMDFormatString(split: string): string {
        const time = new Date().getTime() - 24 * 60 * 60 * 1000;
        const d = new Date(time);
        return d.getFullYear() + split + ToolsUseful.supplementZero((d.getMonth() + 1) + "", 2) + split + ToolsUseful.supplementZero(d.getDate() + "", 2);
    }

    /**
     * 获取当天指定时间的时间戳
     * @param hour 时
     * @param minute 分
     * @param second 秒
     * @example
     * const time = TimeUtil.getTargetTimestamp(10, 20, 30); // 1601259630000
     * const timeString = new Date(time).toLocaleString(); // "上午10:20:30"
     */
    static getTargetTimestamp(hour: number = 0, minute: number = 0, second: number = 0): number {
        const start = new Date(new Date().toLocaleDateString()).getTime();
        const target = ((hour * 3600) + (minute * 60) + second) * 1000;
        return new Date(start + target).getTime();
    }

    /**
     * 获取当前时间戳
     */
    static getCurrentTimestamp(): number {
        return new Date().getTime();
    }

    /**
     * 转换秒数为天，向上取整
     * @param sec 秒数
     */
    static takeUpSecToDay(sec: number): number {
        let x = sec / 86400; // 60 * 60 * 24
        let day = Math.ceil(x);
        return day;
    }

    /**
     * 转换秒数为天，向下取整
     * @param sec 秒数
     */
    static roundDownSecToDay(sec: number): number {
        let x = sec / 86400;
        let day = Math.floor(x);
        return day;
    }

    /**
     * 将毫秒转为时分秒的格式（最小单位为秒，如：”00:01:59“）
     * @param time 毫秒数
     * @param separator 分隔符
     * @param keepHours 当小时数为 0 时依然展示小时数
     * @example 
     * const HMS = TimeUtil.msToHMS(119000); // "00:01:59"
     */
    static msToHMS(time: number, separator: string = ':', keepHours: boolean = true): string {
        const hours = Math.floor(time / 3600000);
        const minutes = Math.floor((time - (hours * 3600000)) / 60000);
        const seconds = Math.floor((time - (hours * 3600000) - (minutes * 60000)) / 1000);
        const hoursString = (hours === 0 && !keepHours) ? '' : hours.toString().padStart(2, '0');
        return `${hoursString}${separator}${minutes.toString().padStart(2, '0')}${separator}${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * 将秒数转为hh:mm:ss的形式
     * 比如128秒换成：00:02:08
     * @param totalSec 秒数
     */
    static sToHMS(totalSec: number): string {
        if (totalSec <= 0) {
            return "00:00:00";
        }
        let min = Math.floor(totalSec / 60);
        let hour = Math.floor(min / 60);
        min = Math.floor((totalSec - hour * 3600) / 60);
        let sec = totalSec % 60;
        return ToolsUseful.supplementZero(hour + "", 2) + ":" + ToolsUseful.supplementZero(min + "", 2) + ":" + ToolsUseful.supplementZero(sec + "", 2);
    }

    static formatSec(sec: number): string {
        const day = Math.floor(sec / 86400);
        const hour = Math.floor((sec - day * 86400) / 3600);
        const minute = Math.floor((sec - day * 86400 - hour * 3600) / 60);
        const second = sec - day * 86400 - hour * 3600 - minute * 60;

        let strHour = hour.toString();
        if (hour < 10) {
            strHour = "0" + hour;
        }
        let strMinute = minute.toString();
        if (minute < 10) {
            strMinute = "0" + minute;
        }
        let strSecond = second.toString();
        if (second < 10) {
            strHour = "0" + second;
        }

        return `${strHour}:${strMinute}:${strSecond}`;
    }

    /**
     * 转换成时分 00:00
     * @param totalSec 要转换的秒数
     */
    static sToHM(totalSec: number): string {
        if (totalSec <= 0) {
            return "00:00";
        }

        let min = Math.floor(totalSec / 60);
        let hour = Math.floor(min / 60);
        min = Math.floor((totalSec - hour * 3600) / 60);
        return ToolsUseful.supplementZero(hour + "", 2) + ":" + ToolsUseful.supplementZero(min + "", 2);
    }

    /**
     * 转换成分秒 00:00 
     * @param totalSec 秒数
     */
    static sToMS(totalSec: number): string {
        if (totalSec <= 0) {
            return "00:00";
        }
        let min = Math.floor(totalSec / 60);
        let sec = totalSec % 60;

        return ToolsUseful.supplementZero(min + "", 2) + ":" + ToolsUseful.supplementZero(sec + "", 2);
    }

    /**
     * 将秒数转为时分的对象
     * @param seconds 
     */
    static generateMinutes(seconds: number): { hour: number, min: number } {
        if (seconds <= 0) {
            return { hour: 0, min: 0 };
        }
        let min = Math.ceil(seconds / 60);
        let hour = Math.floor(min / 60);
        let time = {
            hour: hour,
            min: min
        }
        return time;
    }
}
