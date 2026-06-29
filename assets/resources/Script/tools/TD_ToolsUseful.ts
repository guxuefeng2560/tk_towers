
import ObjectPoolController from "../Framework/pool/TD_ObjectPoolController";
import MathUtil from "../Framework/utils/TD_MathUtil";


interface ICheckNodeCondition {
    (checkNode: cc.Node): boolean;
}

interface IProcessNode {
    (node: cc.Node): void;
}

interface IValueUpdated {
    (value: number): void;
}

export default class ToolsUseful {

    /**
     * 转换一个整数位字符串，每隔三位会有一个逗号，比如
     * 12345678转换为“12,345,678”
     * @param num 数字
     */
    static translateIntToCommaString(num: number): string {
        let numStr = num + "";
        if (numStr.length <= 3) {
            return numStr;
        }

        let strRes = "";
        // 排在最前面的数字有几个
        let forwardLength = numStr.length % 3;
        // 先把排在前面的加到字符串中
        for (let i = 0; i < forwardLength; ++i) {
            strRes += numStr.charAt(i);
        }
        // 来个逗号
        if (forwardLength > 0) {
            strRes += ",";
        }
        // 之后的，每隔3个数就加个逗号，当然最后一个数是不加的
        let commaIndex = 0;
        for (let i = forwardLength; i < numStr.length; ++i) {
            strRes += numStr.charAt(i);
            commaIndex++;
            if (commaIndex == 3 && i != numStr.length - 1) {
                strRes += ",";
                commaIndex = 0;
            }
        }
        return strRes;
    }

    /**
     * 将nCheckData转换为[0,nTotalData)之间的值
     * 如果nCheckData>=nTotalData,则又从0开始重新计算
     * @param checkData 要检测是数字
     * @param totalData 数字范围最大值
     */
    static clampCircleData(checkData: number, totalData: number) {
        if (checkData >= 0
            && checkData < totalData) {
            return checkData;
        }
        else {
            let per = Math.floor(checkData < 0 ? (checkData / totalData) - 1 : checkData / totalData);
            checkData -= per * totalData;
            return checkData;
        }
    }

    /**
     * 二维坐标转为一维索引
     * @param xpos 横坐标
     * @param ypos 纵坐标
     * @param width 横长度
     */
    static coordTranslateToIndex(xpos: number, ypos: number, width: number): number {
        return ypos * width + xpos;
    }

    /**
     * 一维索引转换为二维坐标
     * @param index 一维索引
     * @param width 二维宽度
     */
    static indexTranslateToCoord(index: number, width: number): [number, number] {
        let [xpos, ypos] = [0, 0];
        ypos = Math.floor(index / width);
        xpos = index % width;
        return [xpos, ypos];
    }


    /**
     * 删除符合条件的子对象
     * 如果没有条件，就是删除所有子对象
     * @param root 根节点
     * @param destroyCondition 删除条件，如果为空表示没有条件全部删除
     */
    static DestroyChildren(root: cc.Node, destroyCondition?: ICheckNodeCondition) {
        if (root == null) {
            return;
        }
        let lstChild: Array<cc.Node> = [];
        root.children.forEach((node) => {
            lstChild.push(node);
        })

        for (let i = 0; i < lstChild.length; ++i) {
            if (destroyCondition == null || destroyCondition(lstChild[i])) {
                lstChild[i].setParent(null);
                lstChild[i].destroy();
            }
        }
    }

    /**
     * 删除符合条件的子对象
     * 使用内存池控制进行删除
     * @param root 根节点
     * @param destroyCondition 删除条件，如果为空表示没有条件
     */
    static DestroyChildrenUsePool(root: cc.Node, destroyCondition?: ICheckNodeCondition) {
        if (root == null) {
            return;
        }
        let lstChild: Array<cc.Node> = [];
        root.children.forEach((node) => {
            lstChild.push(node);
        })

        for (let i = 0; i < lstChild.length; ++i) {
            if (destroyCondition == null || destroyCondition(lstChild[i])) {
                ObjectPoolController.freeNode(lstChild[i]);
            }
        }
    }

    /**
     * 遍历子对象进行一些操作
     * @param root 根节点
     * @param processFunc 要对子对象进行的操作
     * @param interation 是否迭代，即是否也对子对象的子对象进行操作
     */
    static ProcessChildren(root: cc.Node, processFunc: IProcessNode, interation: boolean) {
        if (root == null) {
            return;
        }
        if (processFunc == null) {
            return;
        }
        let trsChild: cc.Node = null;
        for (let i = 0; i < root.childrenCount; ++i) {
            trsChild = root.children[i];
            processFunc(trsChild);

            if (interation && trsChild.childrenCount > 0) {
                ToolsUseful.ProcessChildren(trsChild, processFunc, interation);
            }
        }
    }

    /**
     * 检测某个数值是否在需求范围内
     * @param value 待检测的值
     * @param min 最小值
     * @param max 最大值
     */
    static isValid(value: number, min: number, max: number): boolean {
        if (value <= max && value > min) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * 将指定数字输出为指定长度，如果不够则前面补0；如果已经超出则不管
     * @param num 要检测的数字
     * @param length 要输出的长度
     */
    static supplementZero(num: string, length: number): string {
        if ((num + "").length >= length) {
            return num.toString();
        }
        return ToolsUseful.supplementZero("0" + num, length)
    }

    //位相关//////////////////////////////////////////////////////////////
    /**
     * 检查2的幂的包含情况
     * 检查ncheckValue是否包含在nContain中
     * 比如nContain为 2 + 4 = 6，nCheckValue = 1
     * 则返回false， 如果nCheckValue = 2， 则返回true
     * @param contain 容器值
     * @param checkValue 这个值必须是2的幂或几个2的幂的值的和
     */
    static bitContent(contain: number, checkValue: number): boolean {
        if ((contain & checkValue) != 0) {
            return true;
        }
        return false;
    }

    /**
     * 位中索引值
     * @param contain 容器值
     * @param index 取值范围为0~31
     */
    static bitValue(contain: number, index: number): boolean {
        if (index >= 32) {
            return false;
        }
        let obpos = index % 32;
        let i = 1;
        i <<= obpos;
        i &= contain;
        return (i != 0);
    }

    /**
     * 从位中去掉某些值
     * 比如 nContain = 1 + 2 + 4 + 8 = 15
     * nRemove = 2 + 4 = 6
     * 则返回 nContai & ~nRemove = 15 & ~6 = 9
     * @param contain 容器值
     * @param remove 要移出的值
     */
    static bitRemove(contain: number, remove: number): number {
        return contain & ~remove;
    }

    /**
     * 在位中添加一些值
     * 其实就是或操作了
     * 比如 2 | 6 = 6
     * 2 | 4 = 6
     * @param contain 容器值
     * @param add 要添加的值
     */
    static bitAdd(contain: number, add: number): number {
        return contain | add;
    }
    ////////////////////////////////////////////////////////////////

    //Promise//////////////////////////////////////////////////////////////
    /**
     * 等待一定的秒数
     * @param sec 秒数
     */
    static waitForSeconds(sec: number): Promise<void> {
        return new Promise<void>((resolve) => {
            setTimeout(resolve, sec * 1000);
        });
    }

    /**
     * 将值从start在durSec时间内渐变到end（基于 requestAnimationFrame，无 setTimeout 堆积）
     * @param durSec 持续时间（秒）
     * @param startValue 开始值
     * @param endValue 目标值
     * @param perUpdateFunc 每次更新回调
     * @param completeFunc 执行完成后回调
     * @param startDelaySec 开始时先延迟时间（秒）
     */
    static OnFadeInOrOutValue(durSec: number, startValue: number, endValue: number, perUpdateFunc: IValueUpdated, completeFunc?: Function, startDelaySec = 0): Promise<void> {
        return new Promise<void>((resolve) => {
            const start = () => {
                const dist = endValue - startValue;
                const beginTime = performance.now() / 1000;
                const duration = durSec;

                const tick = () => {
                    const elapsed = performance.now() / 1000 - beginTime;
                    if (elapsed >= duration) {
                        perUpdateFunc?.(endValue);
                        completeFunc?.();
                        resolve();
                        return;
                    }
                    // ease-out: alpha 从 2 衰减到 0
                    const alpha = MathUtil.clamp01(2.0 * (1.0 - elapsed / duration));
                    const percent = 1.0 - alpha;
                    perUpdateFunc(startValue + percent * dist);
                    requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            };

            if (startDelaySec > 0) {
                setTimeout(start, startDelaySec * 1000);
            } else {
                start();
            }
        });
    }
    /////////////////////////////////////////////////////////////////////

    /**
     * 生成随机值，随机出的值不能是except中的值
     * @param minNum 最小值
     * @param maxNum 最大值
     * @param except 需要排除的值列表
     */
    static getRandomNumExcept(wordsIdList: number[], ...except: number[]): number {
        let maxLoop = 1000;
        let minNum = 0;
        let maxNum = wordsIdList.length - 1;
        let num = this.getRandomNum(minNum, maxNum);
        if (except == null || except.length == 0) {
            return wordsIdList[num];
        }
        while (true) {
            let needReGen: boolean = false;
            // 判断生成的值是否在需要排除的列表中
            for (let i = 0; i < except.length; ++i) {
                // 如果存在，则需要重新获取一个随机值
                if (wordsIdList[num] == except[i]) {
                    needReGen = true;
                    break;
                }
            }
            if (needReGen) {
                maxLoop--;
                if (maxLoop <= 0) {
                    break;
                }
                num = this.getRandomNum(minNum, maxNum);
            } else {

                break;
            }
        }
        return wordsIdList[num];
    }

    /**
     * 生成从minNum到maxNum的随机数
     * 如果指定decimalNum位数，则生成指定小数位数的随机数
     * 若不指定任何参数，则生成0-1之间的随机数
     * @param minNum 最小值
     * @param maxNum 最大值
     * @param decimalNum 指定随机数的小数点后的位数
     */
    static getRandomNum(minNum?: number, maxNum?: number, decimalNum?: number): number {
        let max: number = 0, min: number = 0;
        minNum <= maxNum ? (min = minNum, max = maxNum) : (min = maxNum, max = minNum);

        // 如果相同
        if (min == max) {
            return min
        }

        switch (arguments.length) {
            case 1:
                return Math.floor(Math.random() * (max + 1));
                break;
            case 2:
                return Math.floor(Math.random() * (max - min + 1) + min);
                break;
            case 3:
                return Number((Math.random() * (max - min) + min).toFixed(decimalNum));
                break;
            default:
                return Math.random();
                break;
        }
    }

    /**
     * 生成控制曲率点的随机坐标
     * @param startPos 起始位置坐标
     * @param endPos 结束位置坐标
     */
    static getRandomBezierPoint(startPos: cc.Vec2, endPos: cc.Vec2, screenMaxY: number, screenHeight: number): cc.Vec2 {
        let aX = (endPos.x + startPos.x) / 2;
        let x = ToolsUseful.getRandomNum(aX, startPos.x);

        let dY = screenMaxY - startPos.y;
        let ran = Math.random();
        let y: number;
        if (ran <= 0.7) {
            y = ToolsUseful.getRandomNum(startPos.y, screenHeight);
        } else {
            y = ToolsUseful.getRandomNum(screenHeight, screenHeight + dY);
        }

        return cc.v2(x, y);
    }

    /**
     * 创建贝塞尔曲线
     * @param t 贝塞尔曲线的时间
     * @param node 目标节点
     * @param startPos 初始位置坐标
     * @param endPos 目标位置坐标
     * @param isUv 是否匀速
     */
    // static createBezier(t: number, node: cc.Node, startPos: cc.Vec2, endPos: cc.Vec2, isUv: boolean) {
    //     //随机高度值
    //     let height = (startPos.x - endPos.x) / 3;
    //     //根据起点和终点随机一个较为合适的角度值
    //     let angle = 25;
    //     // 把角度转换为弧度
    //     let radian = ToolsUseful.Deg2Rad(angle);
    //     // 第一个控制点为贝塞尔曲线左半弧的中点
    //     let q1x = startPos.x + (endPos.x - startPos.x) / 4 * 3;
    //     let q1y = height + startPos.y;

    //     // 第二个控制点为整个抛物线的中点
    //     let q2x = startPos.x + (endPos.x - startPos.x) / 4;
    //     let q2y = height + startPos.y + Math.cos(radian) * q2x;

    //     //将世界坐标下的点转换到节点坐标系
    //     let q1 = node.parent.convertToNodeSpaceAR(cc.v2(q1x, q1y));
    //     let q2 = node.parent.convertToNodeSpaceAR(cc.v2(q2x, q2y));
    //     let endPosN = node.parent.convertToNodeSpaceAR(startPos);
    //     // 曲线配置
    //     // TKLog.LogWarn("贝塞尔曲线配置", t, q1, q2);
    //     if(isUv) {
    //         return cc.bezierTo(t, [q1, q2, endPosN]);
    //     } else {
    //         return cc.bezierTo(t, [q1, q2, endPosN]).easing(cc.easeIn(t));
    //     }
    // }

    /**
     * 
     * @param startPos 起始坐标点
     * @param endPos   终点坐标
     * @param height   期望抛物线高度
     * @param t        期望抛物线运行时间
     */
    static createParacuve(startPos: cc.Vec2, endPos: cc.Vec2, height: number, t: number) {
        //起点
        let x1 = startPos.x;
        let y1 = startPos.y;
        //终点
        let x3 = endPos.x;
        let y3 = endPos.y;

        //发射路径宽度
        let width = Math.abs(x3 - x1);
        //算出中间会经过的一点
        let x2 = x1 + width / 2;
        let y2 = y1 - height;

        let dy = ((y1 - y3) * (Math.pow(x1, 2) - Math.pow(x2, 2)) - (y1 - y2) * (Math.pow(x1, 2) - Math.pow(x3, 2)));
        let dx = ((x1 - x3) * (Math.pow(x1, 2) - Math.pow(x2, 2)) - (x1 - x2) * (Math.pow(x1, 2) - Math.pow(x3, 2)));
        let b = dy / dx;
        let a = ((y1 - y2) - b * (x1 - x2)) / (Math.pow(x1, 2) - Math.pow(x2, 2));
        let c = y1 - a * x1 * x1 - b * x1;

        //x轴速度
        let vx = width / t;

        return { a, b, c, vx };
    }

    /**
     * 
     * @param node 需要做抛物线的精灵
     * @param startPos 起始位置
     * @param endPos 终止位置
     * @param startA 起始角度
     * @param endA 终止角度
     * @param t 起始点到终止点需要的时间
     */
    static createMovingCurve(node: cc.Node, startPos: cc.Vec2, endPos: cc.Vec2, startA: number, endA: number, t: number) {
        let sx = startPos.x;
        let sy = startPos.y;
        let ex = endPos.x + 50;
        let ey = endPos.y + 150;
        let h = node.height * 0.5;

        //设置精灵的起始角度
        node.angle = startA;
        let q1 = cc.v2(sx, sy);
        let q2 = cc.v2(sx + (ex - sx) * 0.5, sy + (ey - sy) * 0.5 + 200);
        let endP = cc.v2(endPos.x - 30, endPos.y + h);

        return cc.bezierTo(t, [q1, q2, endP]);
    }

    /**
     * 将元素列表输出为字符串，比如将数字list输出为
     * 1,3,4,5,6
     * @param array 元素列表
     */
    static listToString<T>(array: T[]): string {
        let content: string = "";
        for (let i = 0; i < array.length; ++i) {
            content += String(array[i]);
            if (i != (array.length - 1)) {
                content += ",";
            }
        }
        return content;
    }

    /**
     * 将颜色的16进制编码转换成颜色，
     * 比如ff0000,转换成Color(255, 0, 0)
     * @param strCode 16进制编码字符串
     */
    static translateCodeToColor(strCode: string): cc.Color {
        let color: cc.Color = cc.Color.WHITE
        if (strCode.length == 0) {
            return color
        }
        let strSplitCode = ""
        let colorValue: number[] = []
        for (let i = 0; i < strCode.length; ++i) {
            strSplitCode += strCode[i]
            if ((i + 1) % 2 == 0) {
                colorValue.push(Number.parseInt(strSplitCode, 16))
                strSplitCode = ""
            }
        }

        if (colorValue.length > 0) {
            color.setR(colorValue[0])
        }
        if (colorValue.length > 1) {
            color.setG(colorValue[1])
        }
        if (colorValue.length > 2) {
            color.setB(colorValue[2])
        }
        // if(colorValue.length > 3){
        //     color.setA(colorValue[3])
        // }
        return color
    }

    static getExpendNum(leftTime: number): number {
        //计算倒计时对应的晶石消耗
        let ranges = [60, 1200, 3600, 43200, 86400, 259200, 604800];
        let gems = [5, 50, 100, 900, 1500, 4000, 9000];
        for (let i = 1; i <= ranges.length - 1; i++) {
            if (leftTime <= ranges[i]) {
                return (Math.ceil((leftTime - ranges[i - 1]) / ((ranges[i] - ranges[i - 1]) / (gems[i] - gems[i - 1])) + gems[i - 1]));
            }
        }
    }

    /**
     * 将image转为SpriteFrame（带缓存，避免GPU纹理泄露）
     * @param url 图片URL
     */
    private static _imgSpriteCache: Map<string, cc.SpriteFrame> = new Map();

    static convertImgToSpriteFrame(url: string): cc.SpriteFrame {
        // 命中缓存直接返回
        const cached = this._imgSpriteCache.get(url);
        if (cached && cc.isValid(cached)) {
            return cached;
        }

        const img = new Image();
        img.src = url;
        const texture = new cc.Texture2D();
        texture.initWithElement(img);
        const spriteFrame = new cc.SpriteFrame(texture);

        // 缓存起来，避免同一URL重复创建GPU纹理
        this._imgSpriteCache.set(url, spriteFrame);
        return spriteFrame;
    }

    /**
     * 释放缓存的图片SpriteFrame（同时销毁GPU纹理）
     * @param url 图片URL，不传则释放全部
     */
    static releaseCachedImgSpriteFrame(url?: string) {
        if (url) {
            const sf = this._imgSpriteCache.get(url);
            if (sf && cc.isValid(sf)) {
                sf.destroy();
            }
            this._imgSpriteCache.delete(url);
        } else {
            this._imgSpriteCache.forEach((sf) => {
                if (sf && cc.isValid(sf)) {
                    sf.destroy();
                }
            });
            this._imgSpriteCache.clear();
        }
    }
}
