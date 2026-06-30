import { QuestionMode } from "./GameDefines";

const BULLET_ANGLE_OFFSET_DEG = 0;
const PLAYER_ATTACK_RANGE = 600;
const MONSTER_LANE_Y = -100;

export const GameConfig = {
    designWidth: 1280,
    designHeight: 720,

    campaign: {
        totalRounds: 5,
        interRoundAdvanceDistance: 300,
        interRoundAdvanceDuration: 1.1,
    },

    prepare: {
        totalQuestionCount: 16,
        demoAlwaysCorrect: false,
    },

    player: {
        maxHp: 1800,
        baseAttack: 350,
        attackAddPerLevel: 4,
        shootInterval: 0.9,
        bulletsPerShot: 5,
        bulletSpeed: 1000,
        bulletRandomAngle: 5,
        bulletRandomDelayMax: 0.1,
        bulletAngleOffset: BULLET_ANGLE_OFFSET_DEG,
        attackRange: PLAYER_ATTACK_RANGE,
        energyMax: 100,
        baseEnergyRegen: 0.2,
        energyRegenAddPerLevel: 0.02,
    },

    car: {
        baseSpeed: 100,
        bossTriggerX: 5000,
    },

    sawCar: {
        baseHp: 2000,
        hpAddPerLevel: 1000,
        baseAttack: 8,
        attackAddPerLevel: 1,
        attackInterval: 0.3,
    },

    monster: {
        laneY: MONSTER_LANE_Y,
        attackInterval: 1.5,
        speed: 50,
        width: 46,
        height: 58,
        slowFactorPerMonster: 0.2,
        normal: {
            hp: 160,
            attack: 100,
        },
        elite: {
            hp: 180,
            attack: 350,
        },
        langtou: {
            hp: 200,
            attack: 350,
        },
        glowRateRound: 1.1,
        battleSpawnPhases: [
            { start: 0, end: 10, rate: 0.5 },
            { start: 10, end: 25, rate: 1 },
            { start: 25, end: 40, rate: 1 },
            { start: 40, end: 60, rate: 2 },
        ],
        bossSpawnPerSecond: 3,
        bossPreSpawnCount: 14,
    },

    boss: {
        x: 5100,
        spawnX: 5200,
        maxMonsterCount: 40,
        maxVisibleMonsterCount: 18,
        entranceScreenPadding: 160,
        stopScreenOffsetX: 150,
        width: 160,
        height: 180,
        waves: [
            {
                round: 1,
                bossHp: 6800,
                monsterRatios: { normal: 1, elite: 0, langtou: 0 },
                remark: "-",
            },
            {
                round: 2,
                bossHp: 13600,
                monsterRatios: { normal: 0.7, elite: 0.3, langtou: 0 },
                remark: "-",
            },
            {
                round: 3,
                bossHp: 20400,
                monsterRatios: { normal: 0.5, elite: 0.4, langtou: 0.1 },
                remark: "-",
            },
            {
                round: 4,
                bossHp: 27200,
                monsterRatios: { normal: 0.4, elite: 0.4, langtou: 0.2 },
                remark: "-",
            },
            {
                round: 5,
                bossHp: 40000,
                monsterRatios: { normal: 0.3, elite: 0.5, langtou: 0.2 },
                remark: "终极 BOSS",
            },
        ],
    },

    skill: {
        roller: {
            cost: 4,
            cooldown: 0.5,
            hideDuration: 0.2,
            speed: 1000,
            damage: 600,
            size: 56,
        },
        bomb: {
            cost: 2,
            cooldown: 0.3,
            searchRadius: 800,
            explosionRadius: 150,
            gridSize: 300,
            damage: 400,
        },
    },

    world: {
        groundY: -220,
        carY: -180,
        sawCarY: -230,
        heroY: -144,
        monsterY: MONSTER_LANE_Y,
        bossY: -154,
    },

    battleQuestion: {
        rewardMode: QuestionMode.BattleEnergyLack,
        fillEnoughEnergyForSkill: true,
        autoCastAfterAnswer: false,
    },
};

export const DebugConfig = {
    showCollider: false,
    showCarSpeed: true,
    showMonsterState: false,
    demoAlwaysCorrect: false,
    usePlaceholderArt: true,
};
