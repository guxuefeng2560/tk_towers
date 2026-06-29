/**
 * 字符串工具
 */
export default class StringUtil {

    /**
     * 格式化字符串
     * @param str 要格式化的字符串
     * @param option 保留几位
     */
    static formatText(str: string, option: number = 6): string {
        str = str.replace(/\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g, "*"); // 过滤emoji
        if (str.length > option) {
            let ret = str.substr(0, option - 1);
            ret += '...';
            return ret;
        }

        return str;
    }

    /**
     * 字符串转数字，舍弃小数
     * @param strValue 字符串数字
     * @param defaultValue 如果转换错误的默认返回
     */
    static translateStringToNumber(strValue: string, defaultValue: number): number {
        if (strValue.length == 0) {
            return defaultValue;
        }
        let num = Number.parseInt(strValue);
        if (num == Number.NaN) {
            return defaultValue;
        }
        return num;
    }
}
