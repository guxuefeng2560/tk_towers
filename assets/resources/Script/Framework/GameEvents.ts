/**
 * 游戏事件定义
 * 所有跨模块通信的事件都应该在这里定义
 */
export enum GameEvent {
    // ============== 阶段事件 ==============
    /** 游戏阶段改变 */
    STAGE_CHANGED = 'stage_changed',
    /** 战斗开始 */
    BATTLE_START = 'battle_start',
    /** 战斗结束 */
    BATTLE_END = 'battle_end',
    /** Boss 阶段开始 */
    BOSS_STAGE_START = 'boss_stage_start',
    /** 答题阶段开始 */
    QUESTION_STAGE_START = 'question_stage_start',
    /** 准备阶段开始 */
    PREPARE_STAGE_START = 'prepare_stage_start',

    // ============== 怪物事件 ==============
    /** 怪物生成 */
    MONSTER_SPAWNED = 'monster_spawned',
    /** 怪物死亡 */
    MONSTER_KILLED = 'monster_killed',
    /** 怪物到达边界（玩家受伤） */
    MONSTER_REACHED_BOUNDARY = 'monster_reached_boundary',
    /** Boss 生成 */
    BOSS_SPAWNED = 'boss_spawned',
    /** Boss 受伤 */
    BOSS_DAMAGED = 'boss_damaged',
    /** Boss 死亡 */
    BOSS_KILLED = 'boss_killed',
    /** Boss 位置变化 */
    BOSS_POSITION_CHANGED = 'boss_position_changed',

    // ============== 玩家事件 ==============
    /** 玩家受伤 */
    PLAYER_DAMAGED = 'player_damaged',
    /** 玩家血量变化 */
    PLAYER_HP_CHANGED = 'player_hp_changed',
    /** 锯子车血量变化 */
    SAW_CAR_HP_CHANGED = 'saw_car_hp_changed',
    /** 锯子车解锁 */
    SAW_CAR_UNLOCKED = 'saw_car_unlocked',
    /** 防御解锁 */
    DEFENSE_UNLOCKED = 'defense_unlocked',

    // ============== 技能事件 ==============
    /** 技能使用成功 */
    SKILL_USED = 'skill_used',
    /** 技能冷却开始 */
    SKILL_COOLDOWN_START = 'skill_cooldown_start',
    /** 滚轮技能生效 */
    SKILL_SAWTOOTH_ACTIVATED = 'skill_sawtooth_activated',
    /** 炸弹技能释放 */
    SKILL_BOMB_ACTIVATED = 'skill_bomb_activated',

    // ============== 答题事件 ==============
    /** 答题开始 */
    QUESTION_STARTED = 'question_started',
    /** 答题正确 */
    QUESTION_CORRECT = 'question_correct',
    /** 答题错误 */
    QUESTION_WRONG = 'question_wrong',
    /** 答题结束 */
    QUESTION_ENDED = 'question_ended',

    // ============== 升级事件 ==============
    /** 属性升级 */
    ATTRIBUTE_UPGRADED = 'attribute_upgraded',
    /** 战斗力变化 */
    POWER_CHANGED = 'power_changed',
    /** 能量变化 */
    ENERGY_CHANGED = 'energy_changed',

    // ============== 战斗事件 ==============
    /** 子弹发射 */
    BULLET_FIRED = 'bullet_fired',
    /** 子弹命中 */
    BULLET_HIT = 'bullet_hit',
    /** 锯子接触伤害 */
    SAW_CONTACT_DAMAGE = 'saw_contact_damage',

    // ============== 特效事件 ==============
    /** 显示浮字 */
    SHOW_FLOAT_TEXT = 'show_float_text',
    /** 播放爆炸特效 */
    PLAY_EXPLOSION = 'play_explosion',
    /** 播放命中特效 */
    PLAY_HIT_EFFECT = 'play_hit_effect',

    // ============== 摄像机事件 ==============
    /** 摄像机移动 */
    CAMERA_MOVED = 'camera_moved',
}

/**
 * 浮字消息数据
 */
export interface FloatTextData {
    x: number;
    y: number;
    text: string;
    color?: cc.Color;
}

/**
 * 爆炸特效数据
 */
export interface ExplosionData {
    x: number;
    y: number;
    scale?: number;
}

/**
 * 怪物事件数据
 */
export interface MonsterEventData {
    monsterId: number;
    logicalX: number;
    hp?: number;
    maxHp?: number;
}

/**
 * 技能事件数据
 */
export interface SkillEventData {
    skillType: 'sawtooth' | 'bomb';
    cooldown?: number;
}

/**
 * 伤害事件数据
 */
export interface DamageEventData {
    damage: number;
    source: 'bullet' | 'saw' | 'bomb' | 'monster';
}