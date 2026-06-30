import { DebugConfig, GameConfig } from "../Core/GameConfig";
import { GameContext } from "../Core/GameContext";
import { PrepareTaskKey, QuestionItem, QuestionType, UpgradeType } from "../Core/GameDefines";
import { PrepareTaskViewState, PrepareViewData } from "../UI/PrepareView";
import QuestionController from "./QuestionController";
import UpgradeController from "./UpgradeController";

interface PrepareTaskConfig {
    key: PrepareTaskKey;
    requiredCount: number;
    upgradeType: UpgradeType;
}

export interface PrepareAnswerResult {
    isCorrect: boolean;
    upgradeGranted: boolean;
    sourceTaskKey: PrepareTaskKey | null;
    taskCompleted: boolean;
    hasRemainingQuestion: boolean;
}

const BASE_PREPARE_TASKS: PrepareTaskConfig[] = [
    { key: PrepareTaskKey.BuyCar, requiredCount: 1, upgradeType: UpgradeType.UnlockSawCar },
    { key: PrepareTaskKey.UnlockSkill, requiredCount: 1, upgradeType: UpgradeType.UnlockSkill },
    { key: PrepareTaskKey.Hurt, requiredCount: 5, upgradeType: UpgradeType.Attack },
    { key: PrepareTaskKey.Hp, requiredCount: 3, upgradeType: UpgradeType.Hp },
    { key: PrepareTaskKey.UnlockDef, requiredCount: 1, upgradeType: UpgradeType.UnlockDefense },
    { key: PrepareTaskKey.Energy, requiredCount: 5, upgradeType: UpgradeType.EnergyRegen },
];

export default class PrepareController {
    private readonly context: GameContext;
    private readonly questionController: QuestionController;
    private readonly upgradeController = new UpgradeController();

    private currentPrepareQuestion: QuestionItem | null = null;
    private prepareQuestionTargetCount = GameConfig.prepare.totalQuestionCount;

    public constructor(context: GameContext, questionController: QuestionController) {
        this.context = context;
        this.questionController = questionController;
        this.prepareCurrentRoundQuestions();
    }

    public resetAllProgress(): void {
        this.prepareCurrentRoundQuestions();
    }

    public prepareNextRoundQuestions(): void {
        this.prepareCurrentRoundQuestions();
    }

    public prepareCurrentRoundQuestions(): void {
        this.context.ensurePrepareRoundState();
        this.context.resetCurrentPrepareSession();
        const initialQuestionIds = this.questionController.createPrepareQuestionIds(
            GameConfig.prepare.totalQuestionCount,
            this.context.currentRound,
        );
        const sessionQuestionIds = this.context.beginPrepareRoundQuestionSession(initialQuestionIds, this.context.currentRound);
        this.prepareQuestionTargetCount = sessionQuestionIds.length;
        this.questionController.rebuildPrepareQuestionsByIds(sessionQuestionIds, this.context.currentRound);
        this.refreshCurrentQuestion();
    }

    public canStartBattle(): boolean {
        return this.context.prepareAnsweredCount >= this.prepareQuestionTargetCount || !this.currentPrepareQuestion;
    }

    public getCurrentTaskKey(): PrepareTaskKey | null {
        const currentTask = this.getCurrentTask();
        return currentTask ? currentTask.key : null;
    }

    public getQuestionViewData(): any | null {
        if (!this.currentPrepareQuestion) {
            return null;
        }

        const totalCount = this.prepareQuestionTargetCount;
        const answeredCount = this.context.prepareAnsweredCount;

        return {
            questionType: this.currentPrepareQuestion.questionType,
            title: `\u51c6\u5907\u7b54\u9898 ${Math.min(answeredCount + 1, totalCount)}/${totalCount}`,
            aleart: this.currentPrepareQuestion.aleart,
            ques: this.currentPrepareQuestion.ques,
            answer1: this.currentPrepareQuestion.answer1,
            answer2: this.currentPrepareQuestion.answer2,
            answer3: this.currentPrepareQuestion.answer3,
            correctAnswerIndex: this.currentPrepareQuestion.correctAnswerIndex,
            fillBlankChoice: this.currentPrepareQuestion.fillBlankChoice,
            imageChoice: this.currentPrepareQuestion.imageChoice,
            matching: this.currentPrepareQuestion.matching,
            ordering: this.currentPrepareQuestion.ordering,
            splitSentenceChoice: this.currentPrepareQuestion.splitSentenceChoice,
            checkRight: this.currentPrepareQuestion.checkRight,
        };
    }

    public getViewData(visibleTaskKeyOverride?: PrepareTaskKey | null): PrepareViewData {
        const currentTask = this.getCurrentTask();
        const visibleTaskKey = visibleTaskKeyOverride === undefined
            ? (currentTask ? currentTask.key : null)
            : visibleTaskKeyOverride;
        const prepareFinished = this.context.prepareAnsweredCount >= this.prepareQuestionTargetCount
            || !this.currentPrepareQuestion;
        const currentRoundCarIndex = this.context.getCurrentRoundCarIndex();

        return {
            showStartButton: prepareFinished,
            showSkipButton: !prepareFinished,
            visibleTaskKey,
            currentPowerPercent: this.getPowerPercent(),
            totalPowerPercent: this.getTotalPowerPercent(),
            powerPercent: this.getPowerPercent(),
            hurtValueText: `${Math.round(this.context.getCarAttack(currentRoundCarIndex))}`,
            hpValueText: `${Math.round(this.context.getCarMaxHp(currentRoundCarIndex))}`,
            energyRateText: this.formatEnergyRate(this.context.energyRegen),
            tasks: this.getPrepareTasks().map((task) => this.toTaskViewState(task, visibleTaskKey, currentTask ? currentTask.key : null)),
        };
    }

    public answerQuestion(optionIndex: number): PrepareAnswerResult {
        const currentTask = this.getCurrentTask();
        if (!currentTask || !this.currentPrepareQuestion) {
            return {
                isCorrect: false,
                upgradeGranted: false,
                sourceTaskKey: null,
                taskCompleted: false,
                hasRemainingQuestion: !!this.currentPrepareQuestion,
            };
        }

        const sourceTaskKey = currentTask.key;
        const sourceProgress = this.getTaskProgress(sourceTaskKey);
        const isCorrect = DebugConfig.demoAlwaysCorrect
            || GameConfig.prepare.demoAlwaysCorrect
            || this.isAnswerCorrect(this.currentPrepareQuestion, optionIndex);
        const upgradeGranted = isCorrect;

        this.context.recordPrepareAnswer(isCorrect);
        this.context.resolvePrepareQuestion(this.currentPrepareQuestion.id, isCorrect);

        if (upgradeGranted) {
            this.upgradeController.applyUpgrade(this.context, currentTask.upgradeType);
        }

        this.refreshCurrentQuestion();

        return {
            isCorrect,
            upgradeGranted,
            sourceTaskKey,
            taskCompleted: upgradeGranted && sourceProgress + 1 >= currentTask.requiredCount,
            hasRemainingQuestion: !!this.currentPrepareQuestion,
        };
    }

    private getPowerPercent(): number {
        const currentPower = this.context.getTotalPrepareCorrectCount();
        const totalQuestionCount = Math.max(0, this.context.prepareRoundStates.length) * GameConfig.prepare.totalQuestionCount;
        if (totalQuestionCount <= 0) {
            return 0;
        }
        return (currentPower / totalQuestionCount) * 100;
    }

    private getTotalPowerPercent(): number {
        return this.context.getTotalPrepareAnsweredCount() > 0 ? 100 : 0;
    }

    public prepareRetryQuestionsForRemainingUpgrades(): void {
        this.prepareCurrentRoundQuestions();
    }

    public skipRemainingQuestions(): void {
        this.currentPrepareQuestion = null;
    }

    private formatEnergyRate(value: number): string {
        return `${value.toFixed(2).replace(/\.?0+$/, "")}/s`;
    }

    private getCurrentTask(): PrepareTaskConfig | null {
        const tasks = this.getPrepareTasks();
        for (const task of tasks) {
            if (this.getTaskProgress(task.key) < task.requiredCount) {
                return task;
            }
        }
        return null;
    }

    private getTaskProgress(taskKey: PrepareTaskKey): number {
        return this.context.getCurrentRoundTaskProgress(taskKey);
    }

    private refreshCurrentQuestion(): void {
        const totalCount = this.prepareQuestionTargetCount;
        if (totalCount <= 0 || this.context.prepareAnsweredCount >= totalCount) {
            this.currentPrepareQuestion = null;
            return;
        }

        const currentTask = this.getCurrentTask();
        if (!currentTask) {
            this.currentPrepareQuestion = null;
            return;
        }

        const index = Math.min(this.context.prepareAnsweredCount, totalCount - 1);
        this.currentPrepareQuestion = this.questionController.getPrepareQuestion(index);
    }

    private isAnswerCorrect(question: QuestionItem, optionIndex: number): boolean {
        if (question.questionType === QuestionType.Matching || question.questionType === QuestionType.Ordering) {
            return optionIndex === 0;
        }
        return optionIndex === (question.correctAnswerIndex ?? 0);
    }

    private toTaskViewState(
        task: PrepareTaskConfig,
        visibleTaskKey: PrepareTaskKey | null,
        currentTaskKey: PrepareTaskKey | null,
    ): PrepareTaskViewState {
        const progress = Math.min(this.getTaskProgress(task.key), task.requiredCount);
        return {
            key: task.key,
            progress,
            required: task.requiredCount,
            visible: visibleTaskKey === task.key,
            completed: progress >= task.requiredCount,
            current: currentTaskKey === task.key,
        };
    }

    private getPrepareTasks(): PrepareTaskConfig[] {
        return BASE_PREPARE_TASKS.slice();
    }
}
