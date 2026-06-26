export type SkillType = "roller" | "bomb";
export type MonsterKind = "normal" | "elite";

export interface UiBarLike {
    root: cc.Node;
    fill: cc.Node;
    label: cc.Label;
    width: number;
    height: number;
    fillColor: cc.Color;
    progressBar?: cc.ProgressBar | null;
}

export interface MonsterRuntime {
    id: number;
    node: cc.Node;
    kind: MonsterKind;
    laneIndex: number;
    hp: number;
    maxHp: number;
    attack: number;
    attackTimer: number;
    contactCar: boolean;
    contactCarIndex: number;
    contactHero: boolean;
    lockedAtOneHp: boolean;
    stackedOnMonsterId: number;
    hasStackJumped: boolean;
    blockedByMonsterLastFrame: boolean;
    stackJumpProgress: number;
    stackJumpStartX: number;
    stackJumpStartY: number;
    knockbackVelocityX: number;
    knockbackVelocityY: number;
    dying: boolean;
    hpBar: UiBarLike;
}

export interface BulletRuntime {
    node: cc.Node;
    velocity: cc.Vec2;
    gravityScale: number;
    delay: number;
    damage: number;
    bossOnly?: boolean;
    craterTriggered?: boolean;
    pendingCraterDelay?: number;
}

export interface RollerRuntime {
    node: cc.Node;
    hitMonsterIds: Record<number, boolean>;
    sourceCarIndex: number;
}

export interface EffectRuntime {
    key: string;
    node: cc.Node;
    life: number;
    maxLife: number;
    driftY: number;
    fadeDelay?: number;
    disableFadeScale?: boolean;
}
