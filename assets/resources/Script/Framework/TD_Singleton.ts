/**
 * 单例基础组件
 */

export default class Singleton{
    // 存储所有Singleton实例
    private static _instances: Map<Function, Singleton> = new Map();

    static getInstance<T extends {}>(this : new () => T): T {
        if(!(<any>this).instance){
            (<any>this).instance = new this();
            // 注册到容器
            Singleton._instances.set(this, (<any>this).instance);
        }
        return (<any>this).instance;
    }

    // 子类可重写此方法实现清理逻辑
    protected onDestroy?(): void;

    // 清理单个Singleton实例
    static destroyInstance<T extends {}>(this: new () => T): void {
        const instance = (<any>this).instance;
        if (instance) {
            // 调用清理钩子
            if (typeof instance.onDestroy === 'function') {
                instance.onDestroy();
            }
            // 从容器移除
            Singleton._instances.delete(this);
            // 清除引用
            (<any>this).instance = null;
        }
    }

    // 清理所有Singleton实例
    static destroyAllInstances(): void {
        const instances = Array.from(Singleton._instances.entries());

        // 按优先级清理（先清理依赖其他Singleton的类）
        instances.forEach(([constructor, instance]) => {
            if (typeof instance.onDestroy === 'function') {
                try {
                    instance.onDestroy();
                } catch (e) {
                    cc.error(`[Singleton] Failed to destroy ${constructor.name}:`, e);
                }
            }
        });

        // 清空容器和引用
        instances.forEach(([constructor]) => {
            (<any>constructor).instance = null;
        });
        Singleton._instances.clear();
    }
}
