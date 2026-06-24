import {
    CheckRightQuestionData,
    FillBlankChoiceQuestionData,
    ImageChoiceQuestionData,
    MatchingQuestionData,
    OrderingQuestionData,
    QuestionItem,
    QuestionMode,
    QuestionType,
    SplitSentenceChoiceQuestionData,
} from "../Core/GameDefines";

interface QuestionBankItem {
    title: string;
    aleart: string;
    ques: string;
    answer1: string;
    answer2: string;
    answer3?: string;
    answer4?: string;
    correctAnswerIndex?: number;
    questionType: QuestionType;
    fillBlankChoice?: FillBlankChoiceQuestionData;
    imageChoice?: ImageChoiceQuestionData;
    matching?: MatchingQuestionData;
    ordering?: OrderingQuestionData;
    splitSentenceChoice?: SplitSentenceChoiceQuestionData;
    checkRight?: CheckRightQuestionData;
}

/**
 * 题型 1：选择填空题集。
 * 后续新增同类题目时，直接追加到该数组中，战斗中会在本题集内循环取题。
 */
const TEST_FILL_BLANK_CHOICE_QUESTIONS: QuestionBankItem[] = [
    // {
    //     title: "题型1 选择填空",
    //     aleart: "选择正确的搭配",
    //     ques: "妈妈叫我____。",
    //     answer1: "回家吃饭",
    //     answer2: "吃饭回家",
    //     correctAnswerIndex: 0,
    //     questionType: QuestionType.FillBlankChoice,
    //     fillBlankChoice: {
    //         prompt: "妈妈叫我_____。",
    //         options: [
    //             { id: "fill_1_a", text: "回家吃饭" },
    //             { id: "fill_1_b", text: "吃饭回家" },
    //         ],
    //         correctOptionId: "fill_1_a",
    //     },
    // },
    {
        title: "题型1 选择填空",
        aleart: "选择正确的搭配",
        ques: "妈妈____我去玩。",
        answer1: "不让",
        answer2: "让不",
        correctAnswerIndex: 0,
        questionType: QuestionType.FillBlankChoice,
        fillBlankChoice: {
            prompt: "妈妈____我去玩。",
            options: [
                { id: "fill_1_a", text: "不让" },
                { id: "fill_1_b", text: "让不" },
            ],
            correctOptionId: "fill_1_a",
        },
    },
    {
        title: "题型1 选择填空",
        aleart: "选择正确的搭配",
        ques: "我____来我家里吃饭。",
        answer1: "请朋友们",
        answer2: "朋友们请",
        correctAnswerIndex: 0,
        questionType: QuestionType.FillBlankChoice,
        fillBlankChoice: {
            prompt: "我____来我家里吃饭。",
            options: [
                { id: "fill_1_a", text: "请朋友们" },
                { id: "fill_1_b", text: "朋友们请" },
            ],
            correctOptionId: "fill_1_a",
        },
    },
    {
        title: "题型1 选择填空",
        aleart: "选择正确的搭配",
        ques: "医生____他喝冷水。",
        answer1: "不让",
        answer2: "让不",
        correctAnswerIndex: 0,
        questionType: QuestionType.FillBlankChoice,
        fillBlankChoice: {
            prompt: "医生____他喝冷水。",
            options: [
                { id: "fill_1_a", text: "不让" },
                { id: "fill_1_b", text: "让不" },
            ],
            correctOptionId: "fill_1_a",
        },
    },
    {
        title: "题型1 选择填空",
        aleart: "选择正确的搭配",
        ques: "他生病了，妈妈____早点儿休息。",
        answer1: "让他",
        answer2: "他让",
        correctAnswerIndex: 0,
        questionType: QuestionType.FillBlankChoice,
        fillBlankChoice: {
            prompt: "他生病了，妈妈____早点儿休息。",
            options: [
                { id: "fill_1_a", text: "让他" },
                { id: "fill_1_b", text: "他让" },
            ],
            correctOptionId: "fill_1_a",
        },
    },
    {
        title: "题型1 选择填空",
        aleart: "选择正确的搭配",
        ques: "爸爸工作太忙，他____去学校接妹妹。",
        answer1: "叫我",
        answer2: "我叫",
        correctAnswerIndex: 0,
        questionType: QuestionType.FillBlankChoice,
        fillBlankChoice: {
            prompt: "爸爸工作太忙，他____去学校接妹妹。",
            options: [
                { id: "fill_1_a", text: "叫我" },
                { id: "fill_1_b", text: "我叫" },
            ],
            correctOptionId: "fill_1_a",
        },
    },
    {
        title: "题型1 选择填空",
        aleart: "选择正确的搭配",
        ques: "姐姐工作太忙了，今天她____大家看电影。",
        answer1: "没请",
        answer2: "请没",
        correctAnswerIndex: 0,
        questionType: QuestionType.FillBlankChoice,
        fillBlankChoice: {
            prompt: "姐姐工作太忙了，今天她____大家看电影。",
            options: [
                { id: "fill_1_a", text: "没请" },
                { id: "fill_1_b", text: "请没" },
            ],
            correctOptionId: "fill_1_a",
        },
    },
];

/**
 * 题型 2：看图选择题集。
 * 战斗轮次命中该题集时，只会从该数组中按顺序轮询题目。
 */
const TEST_IMAGE_CHOICE_QUESTIONS: QuestionBankItem[] = [
    {
        title: "题型2 看图选择",
        aleart: "选择图片表达的内容",
        ques: "选择图片表达的内容",
        answer1: "妈妈叫我回家吃饭",
        answer2: "妈妈让我去接弟弟",
        answer3: "妈妈让弟弟去学校",
        correctAnswerIndex: 1,
        questionType: QuestionType.ImageChoice,
        imageChoice: {
            imagePath: "resources/images/temp_bus",
            prompt: "图片里妈妈在干什么？",
            options: [
                { id: "img_1_a", text: "妈妈叫我回家吃饭" },
                { id: "img_1_b", text: "妈妈让我去接弟弟" },
                { id: "img_1_c", text: "妈妈让弟弟去学校" },
            ],
            correctOptionId: "img_1_b",
        },
    },
];

/**
 * 题型 3：连线配对题集。
 */
const TEST_MATCHING_QUESTIONS: QuestionBankItem[] = [
    // {
    //     title: "题型3 连线配对",
    //     aleart: "左右两侧的语句进行正确的配对",
    //     ques: "",
    //     answer1: "",
    //     answer2: "",
    //     questionType: QuestionType.Matching,
    //     matching: {
    //         prompt: "左右两侧的语句进行正确的配对",
    //         leftOptions: [
    //             { id: "match_l_1", text: "老师叫你做什么？" },
    //             { id: "match_l_2", text: "你请谁喝茶？" },
    //             { id: "match_l_3", text: "妈妈让你吃什么？" },
    //         ],
    //         rightOptions: [
    //             { id: "match_r_1", text: "妈妈让我吃米饭。" },
    //             { id: "match_r_2", text: "老师叫我去学校。" },
    //             { id: "match_r_3", text: "我请朋友喝茶。" },
    //         ],
    //         correctMatches: [
    //             { leftId: "match_l_1", rightId: "match_r_2" },
    //             { leftId: "match_l_2", rightId: "match_r_3" },
    //             { leftId: "match_l_3", rightId: "match_r_1" },
    //         ],
    //     },
    // },
    {
        title: "题型3 连线配对",
        aleart: "左右两侧的语句进行正确的配对",
        ques: "",
        answer1: "",
        answer2: "",
        questionType: QuestionType.Matching,
        matching: {
            prompt: "左右两侧的语句进行正确的配对",
            leftOptions: [
                { id: "match_l_1", text: "谁让你去超市买东西？" },
                { id: "match_l_2", text: "老师想和大家说什么？" },
                { id: "match_l_3", text: "谁来给妹妹看病？" },
            ],
            rightOptions: [
                { id: "match_r_1", text: "爸爸请医生来家里。" },
                { id: "match_r_2", text: "妈妈让我在超市买东西。" },
                { id: "match_r_3", text: "老师请大家不要说话。" },
            ],
            correctMatches: [
                { leftId: "match_l_1", rightId: "match_r_2" },
                { leftId: "match_l_2", rightId: "match_r_3" },
                { leftId: "match_l_3", rightId: "match_r_1" },
            ],
        },
    },
    {
        title: "题型3 连线配对",
        aleart: "左右两侧的语句进行正确的配对",
        ques: "",
        answer1: "",
        answer2: "",
        questionType: QuestionType.Matching,
        matching: {
            prompt: "左右两侧的语句进行正确的配对",
            leftOptions: [
                { id: "match_l_1", text: "你去哪里接他？" },
                { id: "match_l_2", text: "你为什么不吃冷的？" },
                { id: "match_l_3", text: "谁请你看电影？" },
            ],
            rightOptions: [
                { id: "match_r_1", text: "医生不让我吃冷的东西。" },
                { id: "match_r_2", text: "姐姐请我看电影。" },
                { id: "match_r_3", text: "爸爸叫我去学校接他。" },
            ],
            correctMatches: [
                { leftId: "match_l_1", rightId: "match_r_3" },
                { leftId: "match_l_2", rightId: "match_r_1" },
                { leftId: "match_l_3", rightId: "match_r_2" },
            ],
        },
    },
];

/**
 * 题型 4：排序题集。
 */
const TEST_ORDERING_QUESTIONS: QuestionBankItem[] = [
    // {
    //     title: "题型4 排序",
    //     aleart: "将打乱的字词正确排列成句子",
    //     ques: "",
    //     answer1: "妈妈",
    //     answer2: "叫我",
    //     answer3: "接弟弟",
    //     answer4: "回家",
    //     questionType: QuestionType.Ordering,
    //     ordering: {
    //         prompt: "请把词语按正确顺序排列成句子。",
    //         options: [
    //             { id: "order_1", text: "妈妈" },
    //             { id: "order_2", text: "叫我" },
    //             { id: "order_3", text: "接弟弟" },
    //             { id: "order_4", text: "回家" },
    //         ],
    //         correctOrder: ["order_1", "order_2", "order_3", "order_4"],
    //     },
    // },
    {
        title: "题型4 排序",
        aleart: "将打乱的字词正确排列成句子",
        ques: "",
        answer1: "医生",
        answer2: "让我",
        answer3: "吃",
        answer4: "药。",
        questionType: QuestionType.Ordering,
        ordering: {
            prompt: "请把词语按正确顺序排列成句子。",
            options: [
                { id: "order_1", text: "让我" },
                { id: "order_2", text: "吃" },
                { id: "order_3", text: "医生" },
                { id: "order_4", text: "药。" },
            ],
            correctOrder: ["order_3", "order_1", "order_2", "order_4"],
        },
    },
    {
        title: "题型4 排序",
        aleart: "将打乱的字词正确排列成句子",
        ques: "",
        answer1: "医生",
        answer2: "不",
        answer3: "让你",
        answer4: "吃",
        questionType: QuestionType.Ordering,
        ordering: {
            prompt: "请把词语按正确顺序排列成句子。",
            options: [
                { id: "order_1", text: "面条儿。" },
                { id: "order_2", text: "不" },
                { id: "order_3", text: "吃" },
                { id: "order_4", text: "医生" },
                { id: "order_5", text: "让你" },
            ],
            correctOrder: ["order_4", "order_2", "order_5", "order_3", "order_1"],
        },
    },
    {
        title: "题型4 排序",
        aleart: "将打乱的字词正确排列成句子",
        ques: "",
        answer1: "老师",
        answer2: "叫我",
        answer3: "去",
        answer4: "学校",
        questionType: QuestionType.Ordering,
        ordering: {
            prompt: "请把词语按正确顺序排列成句子。",
            options: [
                { id: "order_1", text: "叫我" },
                { id: "order_2", text: "去" },
                { id: "order_3", text: "学校" },
                { id: "order_4", text: "老师" },
                { id: "order_5", text: "看书。" },
            ],
            correctOrder: ["order_4", "order_1", "order_2", "order_3", "order_5"],
        },
    },
    {
        title: "题型4 排序",
        aleart: "将打乱的字词正确排列成句子",
        ques: "",
        answer1: "爸爸",
        answer2: "不",
        answer3: "让我",
        answer4: "去",
        questionType: QuestionType.Ordering,
        ordering: {
            prompt: "请把词语按正确顺序排列成句子。",
            options: [
                { id: "order_1", text: "去" },
                { id: "order_2", text: "爸爸" },
                { id: "order_3", text: "接他。" },
                { id: "order_4", text: "不" },
                { id: "order_5", text: "让我" },
            ],
            correctOrder: ["order_2", "order_4", "order_5", "order_1", "order_3"],
        },
    },
    {
        title: "题型4 排序",
        aleart: "将打乱的字词正确排列成句子",
        ques: "",
        answer1: "我",
        answer2: "请朋友们",
        answer3: "来",
        answer4: "家里",
        questionType: QuestionType.Ordering,
        ordering: {
            prompt: "请把词语按正确顺序排列成句子。",
            options: [
                { id: "order_1", text: "请朋友们" },
                { id: "order_2", text: "吃" },
                { id: "order_3", text: "面条儿。" },
                { id: "order_4", text: "我" },
                { id: "order_5", text: "来" },
                { id: "order_6", text: "家里" },
            ],
            correctOrder: ["order_4", "order_1", "order_5", "order_6", "order_2", "order_3"],
        },
    },
    {
        title: "题型4 排序",
        aleart: "将打乱的字词正确排列成句子",
        ques: "",
        answer1: "老师",
        answer2: "不",
        answer3: "叫我们",
        answer4: "来",
        questionType: QuestionType.Ordering,
        ordering: {
            prompt: "请把词语按正确顺序排列成句子。",
            options: [
                { id: "order_1", text: "不" },
                { id: "order_2", text: "叫我们" },
                { id: "order_3", text: "老师" },
                { id: "order_4", text: "来" },
                { id: "order_5", text: "学校。" },
            ],
            correctOrder: ["order_3", "order_1", "order_2", "order_4", "order_5"],
        },
    },
];

/**
 * 题型 5：情景对话补全题集。
 */
const TEST_SPLIT_SENTENCE_CHOICE_QUESTIONS: QuestionBankItem[] = [
    // {
    //     title: "题型5 情景对话补全",
    //     aleart: "选择正确的搭配",
    //     ques: "请选择最合适的句子补全下面的对话。",
    //     answer1: "谁让你给姐姐买水",
    //     answer2: "妈妈让你给谁买水",
    //     answer3: "你给谁买了一瓶水",
    //     correctAnswerIndex: 0,
    //     questionType: QuestionType.SplitSentenceChoice,
    //     splitSentenceChoice: {
    //         sentence1: "问：_____？",
    //         sentence2WithBlank: "答：妈妈让我给姐姐买水。",
    //         options: [
    //             { id: "split_1_a", text: "谁让你给姐姐买水" },
    //             { id: "split_1_b", text: "妈妈让你给谁买水" },
    //             { id: "split_1_c", text: "你给谁买了一瓶水" },
    //         ],
    //         correctOptionId: "split_1_a",
    //     },
    // },
    {
        title: "题型5 情景对话补全",
        aleart: "选择正确的回答",
        ques: "老师叫他做什么？",
        answer1: "老师叫他不看书。",
        answer2: "老师不叫他看书。",
        answer3: "老师叫他看书。",
        correctAnswerIndex: 2,
        questionType: QuestionType.SplitSentenceChoice,
        splitSentenceChoice: {
            sentence1: "问：老师叫他做什么？",
            sentence2WithBlank: "答：_____",
            options: [
                { id: "split_1_a", text: "老师叫他不看书。" },
                { id: "split_1_b", text: "老师不叫他看书。" },
                { id: "split_1_c", text: "老师叫他看书。" },
            ],
            correctOptionId: "split_1_c",
        },
    },
    {
        title: "题型5 情景对话补全",
        aleart: "选择正确的回答",
        ques: "他生病了，妈妈让他去玩吗？",
        answer1: "妈妈不让他去玩。",
        answer2: "妈妈让他不去玩。",
        answer3: "爸爸不让他去玩。",
        correctAnswerIndex: 0,
        questionType: QuestionType.SplitSentenceChoice,
        splitSentenceChoice: {
            sentence1: "问：他生病了，妈妈让他去玩吗？",
            sentence2WithBlank: "答：_____",
            options: [
                { id: "split_1_a", text: "妈妈不让他去玩。" },
                { id: "split_1_b", text: "妈妈让他不去玩。" },
                { id: "split_1_c", text: "爸爸不让他去玩。" },
            ],
            correctOptionId: "split_1_a",
        },
    },
];

/**
 * 题型 6：判断题题集。
 */
const TEST_CHECK_RIGHT_QUESTIONS: QuestionBankItem[] = [
    // {
    //     title: "题型6 判断题",
    //     aleart: "判断下面语句是否正确",
    //     ques: "妈妈叫我回家吃饭。",
    //     answer1: "正确",
    //     answer2: "错误",
    //     correctAnswerIndex: 0,
    //     questionType: QuestionType.CheckRight,
    //     checkRight: {
    //         prompt: "妈妈叫我回家吃饭。",
    //         options: [
    //             { id: "check_1_a", text: "√" },
    //             { id: "check_1_b", text: "×" },
    //         ],
    //         correctOptionId: "check_1_a",
    //     },
    // },
    {
        title: "题型6 判断题",
        aleart: "判断下面语句是否正确",
        ques: "老师让我去学校。",
        answer1: "正确",
        answer2: "错误",
        correctAnswerIndex: 0,
        questionType: QuestionType.CheckRight,
        checkRight: {
            prompt: "老师让我去学校。",
            options: [
                { id: "check_1_a", text: "√" },
                { id: "check_1_b", text: "×" },
            ],
            correctOptionId: "check_1_a",
        },
    },
    {
        title: "题型6 判断题",
        aleart: "判断下面语句是否正确",
        ques: "妈妈请我给妹妹帮忙。",
        answer1: "正确",
        answer2: "错误",
        correctAnswerIndex: 0,
        questionType: QuestionType.CheckRight,
        checkRight: {
            prompt: "妈妈请我给妹妹帮忙。",
            options: [
                { id: "check_1_a", text: "√" },
                { id: "check_1_b", text: "×" },
            ],
            correctOptionId: "check_1_a",
        },
    },
    {
        title: "题型6 判断题",
        aleart: "判断下面语句是否正确",
        ques: "爸爸不让我去接他。",
        answer1: "正确",
        answer2: "错误",
        correctAnswerIndex: 0,
        questionType: QuestionType.CheckRight,
        checkRight: {
            prompt: "爸爸不让我去接他。",
            options: [
                { id: "check_1_a", text: "√" },
                { id: "check_1_b", text: "×" },
            ],
            correctOptionId: "check_1_a",
        },
    },
    {
        title: "题型6 判断题",
        aleart: "判断下面语句是否正确",
        ques: "医生让不我喝冷水。",
        answer1: "正确",
        answer2: "错误",
        correctAnswerIndex: 1,
        questionType: QuestionType.CheckRight,
        checkRight: {
            prompt: "医生让不我喝冷水。",
            options: [
                { id: "check_1_a", text: "√" },
                { id: "check_1_b", text: "×" },
            ],
            correctOptionId: "check_1_b",
        },
    },
    {
        title: "题型6 判断题",
        aleart: "判断下面语句是否正确",
        ques: "姐姐不请我吃晚饭。",
        answer1: "正确",
        answer2: "错误",
        correctAnswerIndex: 0,
        questionType: QuestionType.CheckRight,
        checkRight: {
            prompt: "姐姐不请我吃晚饭。",
            options: [
                { id: "check_1_a", text: "√" },
                { id: "check_1_b", text: "×" },
            ],
            correctOptionId: "check_1_a",
        },
    },
    {
        title: "题型6 判断题",
        aleart: "判断下面语句是否正确",
        ques: "老师让我不去她家。",
        answer1: "正确",
        answer2: "错误",
        correctAnswerIndex: 1,
        questionType: QuestionType.CheckRight,
        checkRight: {
            prompt: "老师让我不去她家。",
            options: [
                { id: "check_1_a", text: "√" },
                { id: "check_1_b", text: "×" },
            ],
            correctOptionId: "check_1_b",
        },
    },
];

/**
 * 战斗题集轮换顺序。
 * 第 1 轮使用数组 0，第 2 轮使用数组 1，以此类推；
 * 超过 6 轮后从第 1 个题集重新开始轮询。
 */
const TEST_BATTLE_QUESTION_SETS: QuestionBankItem[][] = [
    TEST_FILL_BLANK_CHOICE_QUESTIONS,
    TEST_IMAGE_CHOICE_QUESTIONS,
    TEST_MATCHING_QUESTIONS,
    TEST_ORDERING_QUESTIONS,
    TEST_SPLIT_SENTENCE_CHOICE_QUESTIONS,
    TEST_CHECK_RIGHT_QUESTIONS,
];

const ACTIVE_BATTLE_QUESTION_SETS: QuestionBankItem[][] = [
    TEST_FILL_BLANK_CHOICE_QUESTIONS,
    TEST_MATCHING_QUESTIONS,
    TEST_ORDERING_QUESTIONS,
    TEST_SPLIT_SENTENCE_CHOICE_QUESTIONS,
    TEST_CHECK_RIGHT_QUESTIONS,
];

/**
 * 准备阶段仍然需要一个完整题库做题型轮询，因此将 6 个题集汇总为总题库。
 * 战斗阶段不直接使用该数组选题，而是通过 TEST_BATTLE_QUESTION_SETS 按轮次选择单一题集。
 */
const TEST_QUESTION_BANK: QuestionBankItem[] = ([] as QuestionBankItem[]).concat(
    TEST_FILL_BLANK_CHOICE_QUESTIONS,
    TEST_IMAGE_CHOICE_QUESTIONS,
    TEST_MATCHING_QUESTIONS,
    TEST_ORDERING_QUESTIONS,
    TEST_SPLIT_SENTENCE_CHOICE_QUESTIONS,
    TEST_CHECK_RIGHT_QUESTIONS
);

/**
 * 将任意题目索引归一化为数组内可用下标，支持负数和超过数组长度的索引。
 */
function getLoopIndex(index: number, length: number): number {
    if (length <= 0) {
        return 0;
    }

    const normalizedIndex = Math.floor(index);
    return ((normalizedIndex % length) + length) % length;
}

/**
 * 根据当前轮次选择本轮使用的题集。
 * round 为 1 基下标：1=>题型1，2=>题型2，...，6=>题型6，7=>题型1。
 * 准备阶段和战斗阶段都使用该方法，确保同一轮只出现单一题型。
 */
function getQuestionSetByRound(round: number): QuestionBankItem[] {
    if (ACTIVE_BATTLE_QUESTION_SETS.length <= 0) {
        return TEST_QUESTION_BANK;
    }
    const roundIndex = getLoopIndex(Math.max(1, Math.floor(round)) - 1, ACTIVE_BATTLE_QUESTION_SETS.length);
    const selectedSet = ACTIVE_BATTLE_QUESTION_SETS[roundIndex];
    return selectedSet && selectedSet.length > 0 ? selectedSet : TEST_QUESTION_BANK;
}

function makeQuestion(prefix: string, index: number, source: QuestionBankItem): QuestionItem {
    return {
        id: `${prefix}_${index + 1}`,
        questionType: source.questionType,
        title: source.title,
        aleart: source.aleart,
        ques: source.ques,
        answer1: source.answer1,
        answer2: source.answer2,
        answer3: source.answer3,
        answer4: source.answer4,
        correctAnswerIndex: source.correctAnswerIndex ?? 0,
        fillBlankChoice: source.fillBlankChoice,
        imageChoice: source.imageChoice,
        matching: source.matching,
        ordering: source.ordering,
        splitSentenceChoice: source.splitSentenceChoice,
        checkRight: source.checkRight,
    };
}

export function buildPrepareQuestionList(totalCount: number, prepareRound: number = 1): QuestionItem[] {
    const list: QuestionItem[] = [];
    const questionSet = getQuestionSetByRound(prepareRound);
    if (questionSet.length <= 0 || totalCount <= 0) {
        return list;
    }

    const normalizedRound = Math.max(1, Math.floor(prepareRound));
    for (let i = 0; i < totalCount; i += 1) {
        const source = questionSet[getLoopIndex(i, questionSet.length)];
        list.push(makeQuestion(`prepare_r${normalizedRound}`, i, source));
    }
    return list;
}

/**
 * 构建战斗题目。
 * 同一轮战斗只从一个题集中取题，questionIndex 控制在该题集内的轮询位置。
 */
export function buildBattleQuestion(_mode: QuestionMode, questionIndex: number, battleRound: number = 1): QuestionItem {
    const questionSet = getQuestionSetByRound(battleRound);
    const source = questionSet[getLoopIndex(questionIndex, questionSet.length)];
    return makeQuestion(`battle_r${Math.max(1, Math.floor(battleRound))}`, questionIndex, source);
}
