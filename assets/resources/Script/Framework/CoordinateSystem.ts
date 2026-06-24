/**
 * 坐标系统管理器
 * 负责处理逻辑坐标、世界坐标、屏幕坐标之间的转换
 * 以及摄像机相关的坐标计算
 */
export class CoordinateSystem {
    private static _instance: CoordinateSystem | null = null;

    // 摄像机 X 位置（逻辑坐标）
    private _cameraX: number = 0;

    // 设计分辨率
    private readonly designWidth: number;
    private readonly designHeight: number;

    // 摄像机引用
    private cameraNode: cc.Node | null = null;

    /**
     * 获取单例实例
     */
    public static get instance(): CoordinateSystem {
        if (!CoordinateSystem._instance) {
            CoordinateSystem._instance = new CoordinateSystem();
        }
        return CoordinateSystem._instance;
    }

    /**
     * 私有构造函数
     */
    private constructor() {
        // 默认使用 Cocos Creator 设计分辨率
        const viewSize = cc.view.getVisibleSize();
        this.designWidth = viewSize.width;
        this.designHeight = viewSize.height;
    }

    /**
     * 设置摄像机节点
     * @param cameraNode 摄像机节点
     */
    public setCameraNode(cameraNode: cc.Node): void {
        this.cameraNode = cameraNode;
        this._cameraX = cameraNode.x;
    }

    /**
     * 获取摄像机 X 位置（逻辑坐标）
     */
    public get cameraX(): number {
        return this._cameraX;
    }

    /**
     * 设置摄像机 X 位置（逻辑坐标）
     */
    public set cameraX(value: number) {
        this._cameraX = value;
        if (this.cameraNode) {
            this.cameraNode.x = value;
        }
    }

    /**
     * 逻辑坐标转本地坐标（相对于摄像机）
     * @param logicalX 逻辑 X 坐标
     */
    public logicalToLocalX(logicalX: number): number {
        return logicalX - this._cameraX;
    }

    /**
     * 本地坐标转逻辑坐标
     * @param localX 本地 X 坐标
     */
    public localToLogicalX(localX: number): number {
        return localX + this._cameraX;
    }

    /**
     * 世界坐标转屏幕坐标
     * @param worldPos 世界坐标
     */
    public worldToScreen(worldPos: cc.Vec2): cc.Vec2 {
        if (!this.cameraNode) {
            return worldPos;
        }

        const camera = this.cameraNode.getComponent(cc.Camera);
        if (!camera) {
            return worldPos;
        }

        const vec3 = camera.getScreenToWorldPoint(new cc.Vec3(worldPos.x, worldPos.y, 0));
        return cc.v2(vec3.x, vec3.y);
    }

    /**
     * 屏幕坐标转世界坐标
     * @param screenPos 屏幕坐标
     */
    public screenToWorld(screenPos: cc.Vec2): cc.Vec2 {
        if (!this.cameraNode) {
            return screenPos;
        }

        const camera = this.cameraNode.getComponent(cc.Camera);
        if (!camera) {
            return screenPos;
        }

        const vec3 = camera.getWorldToScreenPoint(new cc.Vec3(screenPos.x, screenPos.y, 0));
        return cc.v2(vec3.x, vec3.y);
    }

    /**
     * 获取屏幕右边界（逻辑坐标）
     */
    public getScreenRight(): number {
        return this._cameraX + this.designWidth / 2;
    }

    /**
     * 获取屏幕左边界（逻辑坐标）
     */
    public getScreenLeft(): number {
        return this._cameraX - this.designWidth / 2;
    }

    /**
     * 获取屏幕宽度
     */
    public getScreenWidth(): number {
        return this.designWidth;
    }

    /**
     * 获取屏幕高度
     */
    public getScreenHeight(): number {
        return this.designHeight;
    }

    /**
     * 检查位置是否在屏幕内（带边界扩展）
     * @param logicalX 逻辑 X 坐标
     * @param logicalY 逻辑 Y 坐标
     * @param marginX X 轴边距（默认 0）
     * @param marginY Y 轴边距（默认 0）
     */
    public isInScreen(logicalX: number, logicalY: number, marginX: number = 0, marginY: number = 0): boolean {
        const left = this.getScreenLeft() - marginX;
        const right = this.getScreenRight() + marginX;
        const top = this.designHeight / 2 + marginY;
        const bottom = -this.designHeight / 2 - marginY;

        return logicalX >= left && logicalX <= right && logicalY >= bottom && logicalY <= top;
    }

    /**
     * 计算两个点之间的距离
     */
    public distance(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 计算两个点之间的距离平方（避免开方，用于性能优化）
     */
    public distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    }

    /**
     * 线性插值
     * @param from 起始值
     * @param to 目标值
     * @param t 插值因子（0-1）
     */
    public lerp(from: number, to: number, t: number): number {
        return from + (to - from) * t;
    }

    /**
     * 将值限制在指定范围内
     * @param value 输入值
     * @param min 最小值
     * @param max 最大值
     */
    public clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * 获取朝向目标的标准化方向向量
     * @param fromX 起点 X
     * @param fromY 起点 Y
     * @param toX 目标 X
     * @param toY 目标 Y
     */
    public getDirection(fromX: number, fromY: number, toX: number, toY: number): cc.Vec2 {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist === 0) {
            return cc.v2(0, 0);
        }

        return cc.v2(dx / dist, dy / dist);
    }

    /**
     * 计算角度（弧度）
     * @param x X 分量
     * @param y Y 分量
     */
    public getAngle(x: number, y: number): number {
        return Math.atan2(y, x);
    }

    /**
     * 从角度获取方向向量
     * @param angle 角度（弧度）
     */
    public angleToDirection(angle: number): cc.Vec2 {
        return cc.v2(Math.cos(angle), Math.sin(angle));
    }

    /**
     * 重置坐标系统
     */
    public reset(): void {
        this._cameraX = 0;
        if (this.cameraNode) {
            this.cameraNode.x = 0;
        }
    }
}

/**
 * 便捷导出单例实例
 */
export const coordinateSystem = CoordinateSystem.instance;