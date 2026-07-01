/**
 * 模块加载接口
 */
export default interface IModuleInitable {
    moduleInit(arg: any);
    moduleInitProgress(): number;
}
