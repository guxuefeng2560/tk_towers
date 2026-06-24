/**
 * 事件总线
 * 提供发布-订阅模式的事件通信机制
 * 用于模块间解耦通信
 */
type EventHandler = (data?: any) => void;

export class EventBus {
    private static _instance: EventBus | null = null;
    private handlers: Map<string, EventHandler[]> = new Map();
    private onceHandlers: Map<string, EventHandler[]> = new Map();

    /**
     * 获取单例实例
     */
    public static get instance(): EventBus {
        if (!EventBus._instance) {
            EventBus._instance = new EventBus();
        }
        return EventBus._instance;
    }

    /**
     * 私有构造函数，防止直接实例化
     */
    private constructor() { }

    /**
     * 注册事件监听器
     * @param event 事件名称
     * @param handler 处理函数
     */
    public on(event: string, handler: EventHandler): void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }
        this.handlers.get(event)!.push(handler);
    }

    /**
     * 注册一次性事件监听器，触发后自动移除
     * @param event 事件名称
     * @param handler 处理函数
     */
    public once(event: string, handler: EventHandler): void {
        if (!this.onceHandlers.has(event)) {
            this.onceHandlers.set(event, []);
        }
        this.onceHandlers.get(event)!.push(handler);
    }

    /**
     * 移除事件监听器
     * @param event 事件名称
     * @param handler 处理函数（可选，不传入则移除该事件的所有监听器）
     */
    public off(event: string, handler?: EventHandler): void {
        if (handler) {
            // 移除指定的普通监听器
            const handlers = this.handlers.get(event);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index >= 0) {
                    handlers.splice(index, 1);
                }
            }
            // 移除指定的一次性监听器
            const onceHandlers = this.onceHandlers.get(event);
            if (onceHandlers) {
                const index = onceHandlers.indexOf(handler);
                if (index >= 0) {
                    onceHandlers.splice(index, 1);
                }
            }
        } else {
            // 移除该事件的所有监听器
            this.handlers.delete(event);
            this.onceHandlers.delete(event);
        }
    }

    /**
     * 发布事件
     * @param event 事件名称
     * @param data 事件数据（可选）
     */
    public emit(event: string, data?: any): void {
        // 处理普通监听器
        const handlers = this.handlers.get(event);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(data);
                } catch (e) {
                    console.error(`[EventBus] Error handling event '${event}':`, e);
                }
            }
        }

        // 处理一次性监听器
        const onceHandlers = this.onceHandlers.get(event);
        if (onceHandlers) {
            for (const handler of onceHandlers) {
                try {
                    handler(data);
                } catch (e) {
                    console.error(`[EventBus] Error handling once event '${event}':`, e);
                }
            }
            this.onceHandlers.delete(event);
        }
    }

    /**
     * 检查是否有指定事件的监听器
     * @param event 事件名称
     */
    public hasListeners(event: string): boolean {
        const handlers = this.handlers.get(event);
        const onceHandlers = this.onceHandlers.get(event);
        return (handlers && handlers.length > 0) || (onceHandlers && onceHandlers.length > 0);
    }

    /**
     * 清空所有事件监听器
     */
    public clearAll(): void {
        this.handlers.clear();
        this.onceHandlers.clear();
    }

    /**
     * 获取所有已注册的事件名称
     */
    public getEventNames(): string[] {
        const events = new Set<string>();
        const handlerKeys = Array.from(this.handlers.keys());
        for (const event of handlerKeys) {
            events.add(event);
        }
        const onceHandlerKeys = Array.from(this.onceHandlers.keys());
        for (const event of onceHandlerKeys) {
            events.add(event);
        }
        return Array.from(events);
    }

    /**
     * 获取指定事件的监听器数量
     * @param event 事件名称
     */
    public getListenerCount(event: string): number {
        const handlers = this.handlers.get(event) || [];
        const onceHandlers = this.onceHandlers.get(event) || [];
        return handlers.length + onceHandlers.length;
    }
}

/**
 * 便捷导出单例实例
 */
export const eventBus = EventBus.instance;