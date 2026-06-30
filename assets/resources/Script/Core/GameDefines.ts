export enum GamePhase {
    Prepare = 0,
    Battle = 1,
    QuestionPause = 2,
    Boss = 3,
    NormalPause = 4,
    Win = 5,
    Fail = 6,
}

export enum UpgradeType {
    UnlockSawCar = 0,
    UnlockSkill = 1,
    Attack = 2,
    Hp = 3,
    UnlockDefense = 4,
    EnergyRegen = 5,
}

export enum QuestionMode {
    Prepare = 0,
    BattleEnergyLack = 1,
    RetryFixWrong = 2,
}

export enum QuestionType {
    FillBlankChoice = 1,
    ImageChoice = 2,
    Matching = 3,
    Ordering = 4,
    SplitSentenceChoice = 5,
    CheckRight = 6,
}

export enum PrepareTaskKey {
    BuyCar = "buyCar",
    UnlockSkill = "unlockSkill",
    Hurt = "hurt",
    Hp = "hp",
    UnlockDef = "unlockDef",
    Energy = "energy",
}

export interface BossMonsterRatios {
    normal: number;
    elite: number;
    langtou: number;
}

export interface BossWaveConfig {
    round: number;
    bossHp: number;
    monsterRatios: BossMonsterRatios;
    remark: string;
}

export interface QuestionOption {
    id: string;
    text: string;
}

export interface FillBlankChoiceQuestionData {
    prompt: string;
    options: QuestionOption[];
    correctOptionId: string;
}

export interface ImageChoiceQuestionData {
    imagePath: string;
    prompt: string;
    options: QuestionOption[];
    correctOptionId: string;
}

export interface MatchingQuestionSideOption {
    id: string;
    text: string;
}

export interface MatchingQuestionData {
    prompt: string;
    leftOptions: MatchingQuestionSideOption[];
    rightOptions: MatchingQuestionSideOption[];
    correctMatches: Array<{
        leftId: string;
        rightId: string;
    }>;
}

export interface OrderingQuestionData {
    prompt: string;
    options: QuestionOption[];
    correctOrder: string[];
}

export interface SplitSentenceChoiceQuestionData {
    sentence1: string;
    sentence2WithBlank: string;
    options: QuestionOption[];
    correctOptionId: string;
}

export interface CheckRightQuestionData {
    prompt: string;
    options: QuestionOption[];
    correctOptionId: string;
}

export interface QuestionItem {
    id: string;
    questionType: QuestionType;
    title?: string;
    aleart?: string;
    ques: string;
    answer1: string;
    answer2: string;
    answer3?: string;
    answer4?: string;
    correctAnswerIndex?: number;
    fillBlankChoice?: FillBlankChoiceQuestionData;
    imageChoice?: ImageChoiceQuestionData;
    matching?: MatchingQuestionData;
    ordering?: OrderingQuestionData;
    splitSentenceChoice?: SplitSentenceChoiceQuestionData;
    checkRight?: CheckRightQuestionData;
}

