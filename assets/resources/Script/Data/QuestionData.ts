import {
    CheckRightQuestionData,
    FillBlankChoiceQuestionData,
    MatchingQuestionData,
    OrderingQuestionData,
    QuestionItem,
    QuestionMode,
    QuestionOption,
    QuestionType,
    SplitSentenceChoiceQuestionData,
} from "../Core/GameDefines";
import WordsConfig, { WordsConfigItem } from "./WordsConfig";

type QuestionBankItem = Omit<QuestionItem, "id">;

const QUESTION_SET_COUNT = 6;
const ROUND_TO_QUESTION_SET_INDEX = [0, 4, 2, 3, 5];
const DEFAULT_UNIT_ID = 1;

function toText(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
        return "";
    }
    return `${value}`;
}

function hasText(value: string | null | undefined): boolean {
    return toText(value).length > 0;
}

function getCorrectIndex(rawCorrectOption: number | null, optionCount: number): number {
    if (optionCount <= 0) {
        return 0;
    }

    const rawIndex = Number(rawCorrectOption);
    if (!isFinite(rawIndex)) {
        return 0;
    }

    return Math.max(0, Math.min(optionCount - 1, Math.floor(rawIndex) - 1));
}

function makeOption(id: string, text: string): QuestionOption {
    return { id, text };
}

function shuffleOptions<T>(items: T[]): T[] {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        const temp = result[index];
        result[index] = result[swapIndex];
        result[swapIndex] = temp;
    }
    return result;
}

function makeShuffledOrderingOptions(correctOptions: QuestionOption[]): QuestionOption[] {
    const displayOptions = shuffleOptions(correctOptions);
    const isSameAsCorrect = displayOptions.every((option, index) => option.id === correctOptions[index].id);
    if (isSameAsCorrect && displayOptions.length > 1) {
        const temp = displayOptions[0];
        displayOptions[0] = displayOptions[1];
        displayOptions[1] = temp;
    }
    return displayOptions;
}

function makeChoiceOptions(item: WordsConfigItem, prefix: string, maxCount: number): QuestionOption[] {
    const optionSources = [item.option_1, item.option_2, item.option_3];
    return optionSources
        .slice(0, maxCount)
        .filter((text): text is string => hasText(text))
        .map((text, index) => makeOption(`${prefix}_${index + 1}`, text));
}

function makeCheckRightQuestion(item: WordsConfigItem): QuestionBankItem | null {
    const options = makeChoiceOptions(item, `check_${item.id}`, 2);
    if (options.length <= 0 || !hasText(item.prompt)) {
        return null;
    }

    const correctAnswerIndex = getCorrectIndex(item.correct_option, options.length);
    const checkRight: CheckRightQuestionData = {
        prompt: toText(item.prompt),
        options,
        correctOptionId: options[correctAnswerIndex].id,
    };

    return {
        questionType: QuestionType.CheckRight,
        title: "",
        aleart: "",
        ques: checkRight.prompt,
        answer1: options[0] ? options[0].text : "",
        answer2: options[1] ? options[1].text : "",
        correctAnswerIndex,
        checkRight,
    };
}

function makeTwoChoiceQuestion(item: WordsConfigItem): QuestionBankItem | null {
    const options = makeChoiceOptions(item, `choice2_${item.id}`, 2);
    if (options.length <= 0 || !hasText(item.prompt)) {
        return null;
    }

    const correctAnswerIndex = getCorrectIndex(item.correct_option, options.length);
    const fillBlankChoice: FillBlankChoiceQuestionData = {
        prompt: toText(item.prompt),
        options,
        correctOptionId: options[correctAnswerIndex].id,
    };

    return {
        questionType: QuestionType.FillBlankChoice,
        title: "",
        aleart: "",
        ques: fillBlankChoice.prompt,
        answer1: options[0] ? options[0].text : "",
        answer2: options[1] ? options[1].text : "",
        correctAnswerIndex,
        fillBlankChoice,
    };
}

function makeThreeChoiceQuestion(item: WordsConfigItem): QuestionBankItem | null {
    const options = makeChoiceOptions(item, `choice3_${item.id}`, 3);
    if (options.length <= 0 || !hasText(item.prompt)) {
        return null;
    }

    const correctAnswerIndex = getCorrectIndex(item.correct_option, options.length);
    const splitSentenceChoice: SplitSentenceChoiceQuestionData = {
        sentence1: toText(item.prompt),
        sentence2WithBlank: "",
        options,
        correctOptionId: options[correctAnswerIndex].id,
    };

    return {
        questionType: QuestionType.SplitSentenceChoice,
        title: "",
        aleart: "",
        ques: splitSentenceChoice.sentence1,
        answer1: options[0] ? options[0].text : "",
        answer2: options[1] ? options[1].text : "",
        answer3: options[2] ? options[2].text : "",
        correctAnswerIndex,
        splitSentenceChoice,
    };
}

function makeMatchingQuestion(item: WordsConfigItem): QuestionBankItem | null {
    const leftSources = [item.match_left_1, item.match_left_2, item.match_left_3];
    const rightSources = [item.match_right_1, item.match_right_2, item.match_right_3];
    const leftOptions = leftSources
        .filter((text): text is string => hasText(text))
        .map((text, index) => ({ id: `match_${item.id}_l_${index + 1}`, text }));
    const rightOptions = rightSources
        .filter((text): text is string => hasText(text))
        .map((text, index) => ({ id: `match_${item.id}_r_${index + 1}`, text }));
    const pairCount = Math.min(leftOptions.length, rightOptions.length);
    if (pairCount <= 0) {
        return null;
    }

    const matching: MatchingQuestionData = {
        prompt: toText(item.prompt),
        leftOptions,
        rightOptions,
        correctMatches: leftOptions.slice(0, pairCount).map((leftOption, index) => ({
            leftId: leftOption.id,
            rightId: rightOptions[index].id,
        })),
    };

    return {
        questionType: QuestionType.Matching,
        title: "",
        aleart: matching.prompt,
        ques: matching.prompt,
        answer1: "",
        answer2: "",
        correctAnswerIndex: 0,
        matching,
    };
}

function makeOrderingQuestion(item: WordsConfigItem): QuestionBankItem | null {
    const parts = toText(item.sort_sentence)
        .split("|")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
    if (parts.length <= 0) {
        return null;
    }

    const correctOptions = parts.map((text, index) => makeOption(`order_${item.id}_${index + 1}`, text));
    const displayOptions = makeShuffledOrderingOptions(correctOptions);
    const ordering: OrderingQuestionData = {
        prompt: toText(item.prompt),
        options: displayOptions,
        correctOrder: correctOptions.map((option) => option.id),
    };

    return {
        questionType: QuestionType.Ordering,
        title: "",
        aleart: ordering.prompt,
        ques: ordering.prompt,
        answer1: parts[0] || "",
        answer2: parts[1] || "",
        answer3: parts[2] || "",
        answer4: parts[3] || "",
        correctAnswerIndex: 0,
        ordering,
    };
}

function makeQuestionBankItem(item: WordsConfigItem): QuestionBankItem | null {
    if (item.question_type === 1) {
        return makeCheckRightQuestion(item);
    }
    if (item.question_type === 2) {
        return makeTwoChoiceQuestion(item);
    }
    if (item.question_type === 3) {
        return makeThreeChoiceQuestion(item);
    }
    if (item.question_type === 4) {
        return makeMatchingQuestion(item);
    }
    if (item.question_type === 5) {
        return makeOrderingQuestion(item);
    }
    return null;
}

function getQuestionSetIndex(item: WordsConfigItem): number {
    if (item.question_type === 1) {
        return QuestionType.CheckRight - 1;
    }
    if (item.question_type === 2) {
        return QuestionType.FillBlankChoice - 1;
    }
    if (item.question_type === 3) {
        return QuestionType.SplitSentenceChoice - 1;
    }
    if (item.question_type === 4) {
        return QuestionType.Matching - 1;
    }
    if (item.question_type === 5) {
        return QuestionType.Ordering - 1;
    }
    return -1;
}

function normalizeUnitId(unitId: number = DEFAULT_UNIT_ID): number {
    const normalizedUnitId = Math.floor(Number(unitId));
    return isFinite(normalizedUnitId) && normalizedUnitId > 0 ? normalizedUnitId : DEFAULT_UNIT_ID;
}

function getRoundQuestionSetIndex(round: number): number {
    const normalizedRoundIndex = getLoopIndex(Math.max(1, Math.floor(round)) - 1, ROUND_TO_QUESTION_SET_INDEX.length);
    return ROUND_TO_QUESTION_SET_INDEX[normalizedRoundIndex];
}

function getQuestionTypeBySetIndex(setIndex: number): QuestionType {
    return (setIndex + 1) as QuestionType;
}

function buildQuestionSetsFromConfig(unitId: number = DEFAULT_UNIT_ID): QuestionBankItem[][] {
    const sets: QuestionBankItem[][] = [];
    for (let i = 0; i < QUESTION_SET_COUNT; i += 1) {
        sets.push([]);
    }

    const normalizedUnitId = normalizeUnitId(unitId);
    const configs = WordsConfig.getInstance().getAllConfigs() as { [key: number]: WordsConfigItem };
    Object.keys(configs)
        .map((key) => configs[Number(key)])
        .filter((item) => !!item && Number(item.unit_id) === normalizedUnitId)
        .sort((a, b) => a.id - b.id)
        .forEach((item) => {
            const setIndex = getQuestionSetIndex(item);
            const question = makeQuestionBankItem(item);
            if (setIndex >= 0 && question) {
                sets[setIndex].push(question);
            }
        });

    return sets;
}

function getAllQuestions(questionSets: QuestionBankItem[][]): QuestionBankItem[] {
    return ([] as QuestionBankItem[]).concat(...questionSets);
}

function getLoopIndex(index: number, length: number): number {
    if (length <= 0) {
        return 0;
    }

    const normalizedIndex = Math.floor(index);
    return ((normalizedIndex % length) + length) % length;
}

function getQuestionSetByRound(round: number, unitId: number = DEFAULT_UNIT_ID): QuestionBankItem[] {
    const questionSets = buildQuestionSetsFromConfig(unitId);
    const allQuestions = getAllQuestions(questionSets);
    if (allQuestions.length <= 0) {
        return [];
    }

    const roundIndex = getRoundQuestionSetIndex(round);
    const selectedSet = questionSets[roundIndex];
    return selectedSet && selectedSet.length > 0 ? selectedSet : allQuestions;
}

function makeEmptyQuestion(prefix: string, index: number): QuestionItem {
    return {
        id: `${prefix}_${index + 1}`,
        questionType: QuestionType.CheckRight,
        title: "",
        aleart: "",
        ques: "",
        answer1: "",
        answer2: "",
        correctAnswerIndex: 0,
    };
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

export function getRoundQuestionSetInfo(prepareRound: number = 1, unitId: number = DEFAULT_UNIT_ID): { questionType: QuestionType; questionCount: number } {
    const roundIndex = getRoundQuestionSetIndex(prepareRound);
    const questionSets = buildQuestionSetsFromConfig(unitId);
    const selectedSet = questionSets[roundIndex] || [];
    return {
        questionType: getQuestionTypeBySetIndex(roundIndex),
        questionCount: selectedSet.length,
    };
}

export function buildPrepareQuestionList(totalCount: number, prepareRound: number = 1, unitId: number = DEFAULT_UNIT_ID): QuestionItem[] {
    const list: QuestionItem[] = [];
    const questionSet = getQuestionSetByRound(prepareRound, unitId);
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

export function buildBattleQuestion(_mode: QuestionMode, questionIndex: number, battleRound: number = 1, unitId: number = DEFAULT_UNIT_ID): QuestionItem {
    const questionSet = getQuestionSetByRound(battleRound, unitId);
    if (questionSet.length <= 0) {
        return makeEmptyQuestion(`battle_r${Math.max(1, Math.floor(battleRound))}`, questionIndex);
    }

    const source = questionSet[getLoopIndex(questionIndex, questionSet.length)];
    return makeQuestion(`battle_r${Math.max(1, Math.floor(battleRound))}`, questionIndex, source);
}
