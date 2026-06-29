/**
 * 数学工具
 */
export default class MathUtil {

    /**
     * 黄金比例分割点
     */
    static goldPointRadio(): number {
        return 0.618;
    }

    /**
    * 获取一个 min 到 max 范围内的随机整数
    * @param min 最小值
    * @param max 最大值
    */
    static getRandomInt(min: number = 0, max: number = 1): number {
        return Math.floor(Math.random() * (max - min) + min);
    }

    /**
     * 获取一个伪随机整数
     * @param seed 随机种子
     * @param key key
     */
    static getPseudoRandomInt(seed: number, key: number): number {
        return Math.ceil((((seed * 9301 + 49297) % 233280) / 233280) * key);
    }

    /**
     * 获取两点间的距离
     * @param p1 点1
     * @param p2 点2
     */
    static getDistance(p1: cc.Vec2, p2: cc.Vec2): number {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    /**
     * 求两个位置的距离
     * @param pos1 位置1
     * @param pos2 位置2
     */
    static getDistanceEx(pos1: cc.Vec2, pos2: cc.Vec2): number {
        return pos1.sub(pos2).mag();
    }

    /**
     * 获取两点间的角度
     * @param p1 点1
     * @param p2 点2
     */
    static getAngle(p1: cc.Vec2, p2: cc.Vec2): number {
        return Math.atan((p2.y - p1.y) / (p2.x - p1.x));
    }

    /**
     * 角度转弧度
     * @param angle 角度
     */
    static angleToRadian(angle: number): number {
        return angle * Math.PI / 180;
    }

    /**
     * 弧度转角度
     * @param radian 弧度
     */
    static radianToAngle(radian: number): number {
        return radian * 180 / Math.PI;
    }

    /**
     * 0、1的互相转换
     * @param num 0或者1
     */
    static exchage0and1(num: number): number {
        if (num == 0) {
            return 1;
        }
        if (num == 1) {
            return 0;
        }
    }

    /**
     * number的lerp
     * @param value 当前值
     * @param target 目标值
     * @param t 获取比例
     */
    static lerpNumber(value: number, target: number, t: number): number {
        let off = target - value;
        let offDist = off * t;
        return value + offDist;
    }

    /**
     * 将一个值固定在01之间
     * @param value 要检测的值
     */
    static clamp01(value: number): number {
        return MathUtil.clamp(value, 0, 1);
    }

    /**
     * 将一个值固定在min和max之间
     * @param value 要固定的值
     * @param min 最小值
     * @param max 最大值
     */
    static clamp(value: number, min: number, max: number): number {
        if (value < min) {
            return min;
        }
        if (value > max) {
            return max;
        }
        return value;
    }
}
