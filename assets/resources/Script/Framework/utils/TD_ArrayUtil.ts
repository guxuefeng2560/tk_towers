/**
 * 数组工具
 */
export default class ArrayUtil {

    /**
     * 复制二维数组
     * @param array 目标数组 
     */
    static copy2DArray(array: any[][]): any[][] {
        let newArray: any[][] = [];
        for (let i = 0; i < array.length; i++) {
            newArray.push(array[i].concat());
        }
        return newArray;
    }

    /**
    * Fisher-Yates Shuffle 随机置乱算法
    * @param array 目标数组
    */
    static fisherYatesShuffle(array: any[]): any[] {
        let count = array.length;
        while (count) {
            let index = Math.floor(Math.random() * count--);
            let temp = array[count];
            array[count] = array[index];
            array[index] = temp;
        }
        return array;
    }

    /**
     * 洗牌
     * @param array 要洗牌的队列
     */
    static shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            let tmp = array[i];
            array[i] = array[randomIndex];
            array[randomIndex] = tmp;
        }
        return array;
    }

    /**
    * 混淆数组
    * @param array 目标数组
    */
    static confound(array: []): any[] {
        let result = array.slice().sort(() => Math.random() - .5);
        return result;
    }

    /**
     * 数组扁平化
     * @param array 目标数组
     */
    static flattening(array: any[]) {
        for (; array.some(v => Array.isArray(v));) {    // 判断 array 中是否有数组
            array = [].concat.apply([], array); // 压扁数组
        }
        return array;
    }

    // /**
    // * 数组去重
    // * @param array 目标数组
    // */
    // static removeRepeated(array: []): any[] {
    //     let newArray = [...new Set(array)];
    //     return newArray;
    // }

    /**
    * 合并数组
    * @param array1 目标数组1
    * @param array2 目标数组2
    */
    static combineArrays(array1: any[], array2: any[]): any[] {
        let newArray = [...array1, ...array2];
        return newArray;
    }

    /**
    * 获取随机数组成员
    * @param array 目标数组
    */
    static getRandomValueInArray(array: any[]): any {
        let newArray = array[Math.floor(Math.random() * array.length)];
        return newArray;
    }

    /**
     * 从数组中移除指定数据
     * @param array 操作数组
     * @param item 要删除的item
     * @returns 如果存在元素且删除了，则返回true;否则返回false
     */
    static removeArrayItem<T>(array: T[], item: T): boolean {
        if (!array || array.length == 0) {
            return false;
        }
        let index = array.indexOf(item);
        if (index >= 0) {
            array.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * 从数组中移除符合条件的数据
     * @param array 操作的数组
     * @param needRemoveCondition 条件判断函数，返回boolean类型。如果判断返回true则会从数组中移出
     */
    static removeArrayItemWithCondition<T>(array: T[], needRemoveCondition: Function): T[] {
        let copy: Array<T> = new Array<T>();
        array.forEach(element => {
            if (needRemoveCondition != null && needRemoveCondition(element)) {

            } else {
                copy.push(element);
            }
        });
        return copy;
    }

    /**
     * 判断item是否存在于array中
     * @param array 要检测的数组
     * @param item 要检测的元素
     * @returns 如果存在返回索引，否则返回-1
     */
    static arrayContainItem<T>(array: T[], item: T): number {
        for (let index = 0, length = array.length; index < length; index++) {
            const element = array[index];
            if (element == item) {
                return index;
            }
        }
        return -1;
    }

    /**
     * 判断item是否存在于array中，使用自定义的比较函数
     * 该函数原型为 func(itemInArray : T, item : T) : boolean
     * @param array 要检测的数组
     * @param item 要检测的元素
     * @param compareFunc 比较函数，比较array中的元素与item是否相等，如果相等返回true
     * @returns 如果存在则返回索引，否则返回-1
     */
    static arrayContainItemWithFunc<T>(array: T[], item: T, compareFunc: Function): number {
        for (let index = 0, length = array.length; index < length; index++) {
            const element = array[index];
            if (compareFunc(element, item)) {
                return index;
            }
        }
        return -1;
    }

    /** 去重 */
    static unique(array: number[]): number[] {
        if (!array || array.length == 0) {
            return null;
        }

        const arr = [];
        for (let i = 0, len = array.length; i < len; i++) {
            if (arr.indexOf(array[i]) === -1) {
                arr.push(array[i]);
            }
        }

        return arr;
    }
}
