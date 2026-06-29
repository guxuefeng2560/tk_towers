/** 配置文件加载接口 */
export interface IConfigLoader {
    preload(afterLoadCallBack: Function);
}
