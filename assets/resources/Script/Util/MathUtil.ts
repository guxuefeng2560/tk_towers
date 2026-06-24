export interface RectLike {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

export function rotateVector(vector: cc.Vec2, angleDegree: number): cc.Vec2 {
    const rad = angleDegree * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return cc.v2(vector.x * cos - vector.y * sin, vector.x * sin + vector.y * cos).normalize();
}

export function distance(a: cc.Vec2, b: cc.Vec2): number {
    return a.sub(b).mag();
}

export function rectIntersects(a: RectLike, b: RectLike): boolean {
    return Math.abs(a.x - b.x) * 2 < a.width + b.width
        && Math.abs(a.y - b.y) * 2 < a.height + b.height;
}
