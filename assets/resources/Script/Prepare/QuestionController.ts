import { GameConfig } from "../Core/GameConfig";
import { QuestionItem, QuestionMode, QuestionType } from "../Core/GameDefines";
import { buildBattleQuestion, buildPrepareQuestionList, getRoundQuestionSetInfo } from "../Data/QuestionData";

export default class QuestionController {
    private prepareQuestions: QuestionItem[];

    public constructor(totalPrepareQuestions: number, prepareRound: number = 1) {
        this.prepareQuestions = buildPrepareQuestionList(totalPrepareQuestions, prepareRound);
    }

    public rebuildPrepareQuestions(totalPrepareQuestions: number, prepareRound: number = 1): void {
        this.prepareQuestions = buildPrepareQuestionList(totalPrepareQuestions, prepareRound);
    }

    public rebuildPrepareQuestionsByIds(questionIds: string[], prepareRound: number = 1, unitId: number = 1): void {
        const fullQuestions = buildPrepareQuestionList(GameConfig.prepare.totalQuestionCount, prepareRound, unitId);
        const questionMap = new Map<string, QuestionItem>();
        fullQuestions.forEach((question) => {
            questionMap.set(question.id, question);
        });
        this.prepareQuestions = questionIds
            .map((questionId) => questionMap.get(questionId) || null)
            .filter((question): question is QuestionItem => !!question);
    }

    public createPrepareQuestionIds(totalPrepareQuestions: number, prepareRound: number = 1, unitId: number = 1): string[] {
        return buildPrepareQuestionList(totalPrepareQuestions, prepareRound, unitId).map((question) => question.id);
    }

    public getRoundQuestionSetInfo(prepareRound: number = 1, unitId: number = 1): { questionType: QuestionType; questionCount: number } {
        return getRoundQuestionSetInfo(prepareRound, unitId);
    }

    public getPrepareQuestion(index: number): QuestionItem | null {
        return this.prepareQuestions[index] || null;
    }

    public findPrepareQuestionById(questionId: string): QuestionItem | null {
        return this.prepareQuestions.find((question) => question.id === questionId) || null;
    }

    public getPrepareQuestions(): QuestionItem[] {
        return this.prepareQuestions.slice();
    }

    /**
     * 创建战斗阶段题目。
     * questionIndex：当前战斗轮内的题目序号，用于在本轮题集中循环取题。
     * battleRound：当前战斗轮次，用于决定本轮使用 6 个题集中的哪一个。
     */
    public createBattleQuestion(mode: QuestionMode, questionIndex: number, battleRound: number): QuestionItem {
        return buildBattleQuestion(mode, questionIndex, battleRound);
    }
}
