import { eventBus } from "./EventBus";
import { GameEvent } from "./GameEvents";

/**
 * 游戏阶段接口
 * 所有游戏阶段都需要实现此接口
 */
export interface IStage {
    /**
     * 阶段名称
     */
    readonly name: string;

    /**
     * 进入阶段时调用
     * @param previousStage 上一个阶段（如果是第一个阶段则为 null）
     */
    enter(previousStage: IStage | null): void;

    /**
     * 每帧更新
     * @param dt 帧间隔时间
     */
    update(dt: number): void;

    /**
     * 离开阶段时调用
     * @param nextStage 下一个阶段
     */
    exit(nextStage: IStage): void;
}

/**
 * 游戏阶段枚举
 */
export enum GameStage {
    PREPARE = "prepare",
    BATTLE = "battle",
    BOSS = "boss",
    QUESTION = "question",
    RESULT = "result",
}

/**
 * 状态机
 * 管理游戏状态的切换
 */
export class StageMachine {
    private static _instance: StageMachine | null = null;

    // 已注册的阶段
    private stages: Map<string, IStage> = new Map();

    // 当前阶段
    private currentStage: IStage | null = null;

    // 历史阶段记录
    private stageHistory: IStage[] = [];

    /**
     * 获取单例实例
     */
    public static get instance(): StageMachine {
        if (!StageMachine._instance) {
            StageMachine._instance = new StageMachine();
        }
        return StageMachine._instance;
    }

    /**
     * 私有构造函数
     */
    private constructor() { }

    /**
     * 注册阶段
     * @param stage 阶段实例
     */
    public register(stage: IStage): void {
        if (this.stages.has(stage.name)) {
            console.warn(`[StageMachine] Stage '${stage.name}' already registered`);
            return;
        }

        this.stages.set(stage.name, stage);
        console.log(`[StageMachine] Stage '${stage.name}' registered`);
    }

    /**
     * 切换到指定阶段
     * @param stageName 阶段名称
     * @param clearHistory 是否清空历史记录（默认 false）
     */
    public changeTo(stageName: string, clearHistory: boolean = false): void {
        const nextStage = this.stages.get(stageName);
        if (!nextStage) {
            console.error(`[StageMachine] Stage '${stageName}' not found`);
            return;
        }

        const previousStage = this.currentStage;

        // 离开当前阶段
        if (previousStage) {
            try {
                previousStage.exit(nextStage);
            } catch (e) {
                console.error(`[StageMachine] Error exiting stage '${previousStage.name}':`, e);
            }

            // 记录历史
            if (!clearHistory) {
                this.stageHistory.push(previousStage);
            } else {
                this.stageHistory = [];
            }
        }

        // 切换到新阶段
        this.currentStage = nextStage;

        try {
            nextStage.enter(previousStage);
        } catch (e) {
            console.error(`[StageMachine] Error entering stage '${nextStage.name}':`, e);
        }

        // 发送阶段切换事件
        eventBus.emit(GameEvent.STAGE_CHANGED, {
            previous: previousStage ? previousStage.name : null,
            current: nextStage.name,
        });

        console.log(`[StageMachine] Changed to stage: '${nextStage.name}'`);
    }

    /**
     * 返回上一个阶段
     */
    public goBack(): void {
        if (this.stageHistory.length === 0) {
            console.warn("[StageMachine] No previous stage to go back to");
            return;
        }

        const previousStage = this.stageHistory.pop()!;
        this.changeTo(previousStage.name, true);
    }

    /**
     * 获取当前阶段
     */
    public getCurrentStage(): IStage | null {
        return this.currentStage;
    }

    /**
     * 获取当前阶段名称
     */
    public getCurrentStageName(): string | null {
        return this.currentStage ? this.currentStage.name : null;
    }

    /**
     * 检查当前是否在指定阶段
     * @param stageName 阶段名称
     */
    public isInStage(stageName: string): boolean {
        return this.currentStage !== null && this.currentStage.name === stageName;
    }

    /**
     * 更新当前阶段
     * @param dt 帧间隔时间
     */
    public update(dt: number): void {
        if (this.currentStage) {
            try {
                this.currentStage.update(dt);
            } catch (e) {
                console.error(`[StageMachine] Error updating stage '${this.currentStage.name}':`, e);
            }
        }
    }

    /**
     * 获取所有已注册的阶段名称
     */
    public getRegisteredStageNames(): string[] {
        return Array.from(this.stages.keys());
    }

    /**
     * 获取历史阶段记录
     */
    public getStageHistory(): string[] {
        return this.stageHistory.map(s => s.name);
    }

    /**
     * 清空所有注册的阶段
     */
    public clear(): void {
        this.stages.clear();
        this.currentStage = null;
        this.stageHistory = [];
    }

    /**
     * 重置状态机（保留注册的阶段）
     */
    public reset(): void {
        this.currentStage = null;
        this.stageHistory = [];
    }
}

/**
 * 便捷导出单例实例
 */
export const stageMachine = StageMachine.instance;