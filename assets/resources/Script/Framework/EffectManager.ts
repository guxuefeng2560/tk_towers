import PoolManager from "../Util/PoolManager";
import { eventBus } from "./EventBus";
import { GameEvent, FloatTextData, ExplosionData } from "./GameEvents";

/**
 * 特效管理器
 * 负责管理游戏中的所有特效：浮字、爆炸、命中、烟雾等
 */
export class EffectManager {
    private static _instance: EffectManager | null = null;

    private poolManager: PoolManager | null = null;
    private effectRoot: cc.Node | null = null;
    private uiRoot: cc.Node | null = null;

    // 对象池 Key 定义
    private static readonly POOL_FLOAT_TEXT = "floatText";
    private static readonly POOL_EXPLOSION = "explosion";
    private static readonly POOL_HIT_EFFECT = "hitEffect";

    /**
     * 获取单例实例
     */
    public static get instance(): EffectManager {
        if (!EffectManager._instance) {
            EffectManager._instance = new EffectManager();
        }
        return EffectManager._instance;
    }

    /**
     * 私有构造函数
     */
    private constructor() {
        this.registerEventListeners();
    }

    /**
     * 注册事件监听器
     */
    private registerEventListeners(): void {
        // 监听浮字显示事件
        eventBus.on(GameEvent.SHOW_FLOAT_TEXT, (data: FloatTextData) => {
            this.showFloatText(data.x, data.y, data.text, data.color);
        });

        // 监听爆炸特效事件
        eventBus.on(GameEvent.PLAY_EXPLOSION, (data: ExplosionData) => {
            this.playExplosion(data.x, data.y, data.scale);
        });
    }

    /**
     * 初始化特效管理器
     * @param poolManager 对象池管理器
     * @param effectRoot 特效根节点
     * @param uiRoot UI 根节点（用于 UI 特效）
     */
    public init(poolManager: PoolManager, effectRoot: cc.Node, uiRoot: cc.Node | null = null): void {
        this.poolManager = poolManager;
        this.effectRoot = effectRoot;
        this.uiRoot = uiRoot;
    }

    /**
     * 显示浮字特效
     * @param x X 坐标（世界坐标）
     * @param y Y 坐标（世界坐标）
     * @param text 显示文本
     * @param color 文本颜色（默认白色）
     */
    public showFloatText(x: number, y: number, text: string, color?: cc.Color): void {
        if (!this.poolManager || !this.effectRoot) {
            console.warn("[EffectManager] Not initialized, cannot show float text");
            return;
        }

        try {
            // 从对象池获取浮字节点
            const node = this.poolManager.get(
                EffectManager.POOL_FLOAT_TEXT,
                this.effectRoot,
                () => this.createFloatTextNode()
            );

            // 设置位置
            node.setPosition(x, y);
            node.active = true;

            // 设置文本和颜色
            const label = node.getComponent(cc.Label);
            if (label) {
                label.string = text;
                label.node.color = color || cc.Color.WHITE;
            }

            // 播放动画
            node.stopAllActions();
            node.opacity = 255;
            node.setScale(1);

            const action = cc.sequence(
                cc.spawn(
                    cc.moveBy(0.5, 0, 40).easing(cc.easeSineOut()),
                    cc.fadeOut(0.5),
                    cc.scaleTo(0.5, 1.2)
                ),
                cc.callFunc(() => {
                    this.poolManager!.put(EffectManager.POOL_FLOAT_TEXT, node);
                })
            );

            node.runAction(action);
        } catch (e) {
            console.error("[EffectManager] Error showing float text:", e);
        }
    }

    /**
     * 播放爆炸特效
     * @param x X 坐标（世界坐标）
     * @param y Y 坐标（世界坐标）
     * @param scale 缩放比例（默认 1）
     */
    public playExplosion(x: number, y: number, scale: number = 1): void {
        if (!this.poolManager || !this.effectRoot) {
            console.warn("[EffectManager] Not initialized, cannot play explosion");
            return;
        }

        try {
            // 从对象池获取爆炸特效节点
            const node = this.poolManager.get(
                EffectManager.POOL_EXPLOSION,
                this.effectRoot,
                () => this.createExplosionNode()
            );

            node.setPosition(x, y);
            node.setScale(scale);
            node.active = true;

            // 播放动画
            node.stopAllActions();
            node.opacity = 255;

            const action = cc.sequence(
                cc.scaleTo(0.15, scale * 1.3),
                cc.scaleTo(0.1, scale * 1.1),
                cc.delayTime(0.2),
                cc.fadeOut(0.1),
                cc.callFunc(() => {
                    this.poolManager!.put(EffectManager.POOL_EXPLOSION, node);
                })
            );

            node.runAction(action);
        } catch (e) {
            console.error("[EffectManager] Error playing explosion:", e);
        }
    }

    /**
     * 播放命中特效
     * @param x X 坐标（世界坐标）
     * @param y Y 坐标（世界坐标）
     */
    public playHitEffect(x: number, y: number): void {
        if (!this.poolManager || !this.effectRoot) {
            console.warn("[EffectManager] Not initialized, cannot play hit effect");
            return;
        }

        try {
            const node = this.poolManager.get(
                EffectManager.POOL_HIT_EFFECT,
                this.effectRoot,
                () => this.createHitEffectNode()
            );

            node.setPosition(x, y);
            node.active = true;

            node.stopAllActions();
            node.opacity = 255;

            const action = cc.sequence(
                cc.scaleTo(0.15, 1.2),
                cc.fadeOut(0.15),
                cc.callFunc(() => {
                    this.poolManager!.put(EffectManager.POOL_HIT_EFFECT, node);
                })
            );

            node.runAction(action);
        } catch (e) {
            console.error("[EffectManager] Error playing hit effect:", e);
        }
    }

    /**
     * 显示伤害浮字（便捷方法）
     * @param x X 坐标
     * @param y Y 坐标
     * @param damage 伤害数值
     */
    public showDamageFloat(x: number, y: number, damage: number): void {
        this.showFloatText(x, y, `-${Math.round(damage)}`, cc.Color.RED);
    }

    /**
     * 显示治疗浮字（便捷方法）
     * @param x X 坐标
     * @param y Y 坐标
     * @param amount 治疗数值
     */
    public showHealFloat(x: number, y: number, amount: number): void {
        this.showFloatText(x, y, `+${Math.round(amount)}`, cc.Color.GREEN);
    }

    /**
     * 显示金币浮字（便捷方法）
     * @param x X 坐标
     * @param y Y 坐标
     * @param amount 金币数值
     */
    public showGoldFloat(x: number, y: number, amount: number): void {
        this.showFloatText(x, y, `+${amount}`, cc.Color.YELLOW);
    }

    /**
     * 创建浮字节点（对象池工厂）
     */
    private createFloatTextNode(): cc.Node {
        const node = new cc.Node("FloatText");
        const label = node.addComponent(cc.Label);
        label.fontSize = 24;
        label.lineHeight = 28;
        label.overflow = cc.Label.Overflow.NONE;
        label.enableBold = true;

        // 添加阴影效果
        const outline = node.addComponent(cc.LabelOutline);
        outline.color = cc.Color.BLACK;
        outline.width = 2;

        return node;
    }

    /**
     * 创建爆炸特效节点（对象池工厂）
     */
    private createExplosionNode(): cc.Node {
        const node = new cc.Node("Explosion");
        const sprite = node.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        node.setContentSize(100, 100);

        // 默认使用圆形渐变
        const graphics = node.addComponent(cc.Graphics);
        graphics.circle(0, 0, 50);
        const gradient = graphics.fillColor;
        gradient.setR(255);
        gradient.setG(200);
        gradient.setB(100);
        gradient.setA(255);
        graphics.fill();

        return node;
    }

    /**
     * 创建命中特效节点（对象池工厂）
     */
    private createHitEffectNode(): cc.Node {
        const node = new cc.Node("HitEffect");
        const sprite = node.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        node.setContentSize(30, 30);

        const graphics = node.addComponent(cc.Graphics);
        graphics.circle(0, 0, 15);
        graphics.fillColor = cc.Color.WHITE;
        graphics.fill();

        return node;
    }

    /**
     * 清除所有特效
     */
    public clearAll(): void {
        if (this.effectRoot) {
            this.effectRoot.removeAllChildren();
        }
    }

    /**
     * 清理资源
     */
    public dispose(): void {
        eventBus.off(GameEvent.SHOW_FLOAT_TEXT);
        eventBus.off(GameEvent.PLAY_EXPLOSION);
        this.clearAll();
    }
}

/**
 * 便捷导出单例实例
 */
export const effectManager = EffectManager.instance;