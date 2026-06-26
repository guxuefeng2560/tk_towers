import { DebugConfig, GameConfig } from "./GameConfig";
import { GamePhase, QuestionItem, QuestionMode, PrepareTaskKey, QuestionType } from "./GameDefines";
import GameRuntime from "./GameRuntime";
import TimeController from "./TimeController";
import { SkillType } from "../Entity/EntityTypes";
import PrepareController, { PrepareAnswerResult } from "../Prepare/PrepareController";
import QuestionController from "../Prepare/QuestionController";
import BattleController from "../Battle/BattleController";
import { BattleViewData } from "../UI/BattleView";
import { ResultViewData } from "../UI/ResultView";
import UIManager from "../UI/UIManager";

export default class GameFlowController {
    private static readonly FAIL_RESULT_DELAY = 1;

    private readonly runtime: GameRuntime;
    private readonly timeController = new TimeController();
    private readonly questionController: QuestionController;
    private readonly prepareController: PrepareController;
    private readonly battleController: BattleController;
    private readonly uiManager: UIManager;

    private currentBattleQuestion: QuestionItem | null = null;
    private currentQuestionMode = QuestionMode.Prepare;
    private pendingSkillType: SkillType | null = null;
    private pendingSkillCost = 0;
    private prepareFlowLocked = false;
    private prepareFlowToken = 0;
    private nextPrepareQuestionViewIndex = 0;
    private interRoundAdvanceRemaining = 0;
    private lastBattleViewData: BattleViewData | null = null;
    private lastResultViewData: ResultViewData | null = null;
    
    private battleQuestionIndexInRound = 0;

    public constructor(runtime: GameRuntime, target: any) {
        this.runtime = runtime;
        this.questionController = new QuestionController(GameConfig.prepare.totalQuestionCount);
        this.prepareController = new PrepareController(runtime.context, this.questionController);
        this.battleController = new BattleController(runtime, {
            onNeedQuestion: (skillType, cost) => this.enterQuestionPause(skillType, cost),
            onBattleFailSequenceStart: () => this.onBattleFailSequenceStart(),
            onBattleFinished: (isWin) => this.onBattleFinished(isWin),
        });
        this.uiManager = new UIManager(runtime.uiRoot, runtime.refs, target, {
            onStartBattle: () => this.startBattle(),
            onSkipPrepare: () => this.skipPrepareQuestions(),
            onSpeedUp: () => this.cycleCarBaseSpeed(),
            onRoller: () => this.onSkillClick("roller"),
            onBomb: () => this.onSkillClick("bomb"),
            onQuestionOption: (index) => this.onQuestionOption(index),
            onRetryPrepare: () => this.returnToPrepareFromFail(),
            onCloseWinResult: () => this.resetRun(true),
        });
    }

    public initialize(): void {
        this.resetRun(true);
    }

    public destroy(): void {
        this.runtime.destroy();
    }

    public update(dt: number): void {
        const battleDt = this.timeController.getBattleDt(dt);
        if (battleDt > 0) {
            this.battleController.update(battleDt);
        }
        if (this.interRoundAdvanceRemaining > 0) {
            this.updateInterRoundAdvance(dt);
        }

        this.battleController.updateVisuals();
        this.refreshBattleAndResultUi();
    }

    public resetRun(fullProgressReset: boolean): void {
        this.runtime.clearBattleObjects();
        this.runtime.resetTransientFlow();

        if (fullProgressReset) {
            this.runtime.context.resetAllProgress();
            this.prepareController.resetAllProgress();
        }

        this.currentBattleQuestion = null;
        this.pendingSkillType = null;
        this.pendingSkillCost = 0;
        this.prepareFlowLocked = false;
        this.prepareFlowToken += 1;
        this.resetPrepareQuestionRotation();
        this.interRoundAdvanceRemaining = 0;
        this.battleQuestionIndexInRound = 0;
        this.lastBattleViewData = null;
        this.lastResultViewData = null;
        this.runtime.bossHp = GameConfig.boss.hp;
        this.runtime.resetActorPlacement();
        this.changePhase(GamePhase.Prepare);
    }

    private startBattle(): void {
        if (!this.prepareController.canStartBattle()) {
            return;
        }

        this.battleController.startBattle();
        this.changePhase(GamePhase.Battle);
    }

    private skipPrepareQuestions(): void {
        if (this.runtime.context.phase !== GamePhase.Prepare) {
            return;
        }

        this.prepareFlowToken += 1;
        this.prepareFlowLocked = false;
        this.prepareController.skipRemainingQuestions();
        this.uiManager.hideQuestion();
        this.refreshPrepareUi();
    }

    private cycleCarBaseSpeed(): void {
        const currentSpeed = Math.max(100, Math.floor(GameConfig.car.baseSpeed));
        GameConfig.car.baseSpeed = currentSpeed >= 500 ? 100 : currentSpeed + 100;
    }

    private onSkillClick(skillType: SkillType): void {
        if (this.runtime.context.phase !== GamePhase.Battle && this.runtime.context.phase !== GamePhase.Boss) {
            return;
        }

        const cost = skillType === "roller"
            ? GameConfig.skill.roller.cost
            : GameConfig.skill.bomb.cost;
        if (this.runtime.context.energy < cost) {
            this.enterQuestionPause(skillType, cost);
            this.refreshBattleAndResultUi();
            return;
        }

        const buttonName = skillType === "roller" ? "BtnSawtooth" : "BtnBomb";
        this.runtime.pendingFloatTextAnchor = this.runtime.refs.btnBattleLayout
            ? this.runtime.refs.btnBattleLayout.getChildByName(buttonName)
            : null;
        this.battleController.tryUseSkill(skillType);
        this.runtime.pendingFloatTextAnchor = null;
        this.refreshBattleAndResultUi();
    }

    private enterQuestionPause(skillType: SkillType, cost: number): void {
        this.runtime.context.lastBattlePhaseBeforeQuestionPause = this.runtime.context.phase === GamePhase.Boss
            ? GamePhase.Boss
            : GamePhase.Battle;
        this.pendingSkillType = skillType;
        this.pendingSkillCost = cost;
        this.currentQuestionMode = QuestionMode.BattleEnergyLack;
        this.currentBattleQuestion = this.questionController.createBattleQuestion(
            this.currentQuestionMode,
            this.battleQuestionIndexInRound,
            this.runtime.context.currentRound
        );
        this.battleController.enterQuestionPauseVisualState();
        this.changePhase(GamePhase.QuestionPause);
    }

    private answerBattleQuestion(optionIndex: number): void {
        if (!this.currentBattleQuestion) {
            return;
        }

        const isCorrect = DebugConfig.demoAlwaysCorrect
            || this.isBattleAnswerCorrect(this.currentBattleQuestion, optionIndex);
        this.runtime.context.totalAnswered += 1;
        this.battleQuestionIndexInRound += 1;
        if (isCorrect) {
            this.runtime.context.totalCorrect += 1;
        }

        const skillType = this.pendingSkillType;
        this.currentBattleQuestion = null;
        this.pendingSkillType = null;
        this.pendingSkillCost = 0;
        this.changePhase(this.runtime.context.lastBattlePhaseBeforeQuestionPause);
        this.battleController.resumeBattleVisualState();

        if (isCorrect && skillType) {
            this.battleController.tryUseSkillAfterQuestion(skillType);
            this.refreshBattleAndResultUi();
        }
    }

    private onQuestionOption(index: number): void {
        if (this.runtime.context.phase === GamePhase.Prepare) {
            if (this.prepareFlowLocked) {
                return;
            }
            this.handlePrepareAnswer(this.prepareController.answerQuestion(index));
            return;
        }

        if (this.runtime.context.phase === GamePhase.QuestionPause) {
            this.answerBattleQuestion(index);
        }
    }

    private handlePrepareAnswer(result: PrepareAnswerResult): void {
        const closeTarget = result.upgradeGranted
            ? this.uiManager.getPrepareTaskAnchor(result.sourceTaskKey)
            : this.uiManager.getCodeAnchor();

        this.prepareFlowLocked = true;
        this.prepareFlowToken += 1;
        const currentToken = this.prepareFlowToken;

        this.uiManager.closePrepareQuestionTo(closeTarget, () => {
            if (currentToken !== this.prepareFlowToken || this.runtime.context.phase !== GamePhase.Prepare) {
                return;
            }

            if (!result.upgradeGranted) {
                this.uiManager.playCodeGain();
            }

            const visibleTaskKey = result.upgradeGranted && result.taskCompleted
                ? result.sourceTaskKey
                : this.prepareController.getCurrentTaskKey();
            this.refreshPrepareUi(visibleTaskKey);

            if (!result.hasRemainingQuestion) {
                this.prepareFlowLocked = false;
                this.refreshPrepareUi();
                this.uiManager.hideQuestion();
                return;
            }

            const reopenDelay = result.upgradeGranted && result.taskCompleted ? 1 : 0.5;
            this.queuePrepareQuestion(reopenDelay);
        });
    }

    private queuePrepareQuestion(delaySeconds: number): void {
        this.prepareFlowToken += 1;
        const currentToken = this.prepareFlowToken;

        this.uiManager.delay(delaySeconds, () => {
            if (currentToken !== this.prepareFlowToken || this.runtime.context.phase !== GamePhase.Prepare) {
                return;
            }

            this.prepareFlowLocked = false;
            this.refreshPrepareUi();
            this.showPrepareQuestion();
        });
    }

    private showPrepareQuestion(): void {
        const data = this.prepareController.getQuestionViewData();
        if (!data) {
            this.uiManager.hideQuestion();
            return;
        }

        const anchor = this.uiManager.getPrepareTaskAnchor(this.prepareController.getCurrentTaskKey());
        const viewIndex = typeof data.questionType === "number"
            ? this.getQuestionViewIndexByType(data.questionType)
            : this.getNextPrepareQuestionViewIndex();
        this.uiManager.showPrepareQuestion(data, anchor, viewIndex);
    }

    private showBattleQuestion(): void {
        if (!this.currentBattleQuestion) {
            this.uiManager.hideQuestion();
            return;
        }

        this.uiManager.showBattleQuestion({
            title: this.currentQuestionMode === QuestionMode.BattleEnergyLack ? "鑳介噺涓嶈冻" : "鎴樻枟闂瓟",
            aleart: this.currentBattleQuestion.aleart,
            ques: this.currentBattleQuestion.ques,
            answer1: this.currentBattleQuestion.answer1,
            answer2: this.currentBattleQuestion.answer2,
            answer3: this.currentBattleQuestion.answer3,
            correctAnswerIndex: this.currentBattleQuestion.correctAnswerIndex,
            fillBlankChoice: this.currentBattleQuestion.fillBlankChoice,
            imageChoice: this.currentBattleQuestion.imageChoice,
            matching: this.currentBattleQuestion.matching,
            ordering: this.currentBattleQuestion.ordering,
            splitSentenceChoice: this.currentBattleQuestion.splitSentenceChoice,
            checkRight: this.currentBattleQuestion.checkRight,
        }, this.getQuestionViewIndexByType(this.currentBattleQuestion.questionType));
    }

    private onBattleFinished(isWin: boolean): void {
        if (!isWin) {
            this.changePhase(GamePhase.Fail);
            return;
        }

        if (this.runtime.context.currentRound >= GameConfig.campaign.totalRounds) {
            this.changePhase(GamePhase.Win);
            return;
        }

        this.startInterRoundAdvance();
    }

    private onBattleFailSequenceStart(): void {
        this.timeController.pauseBattleTime();
        this.uiManager.delay(GameFlowController.FAIL_RESULT_DELAY, () => {
            if (this.runtime.context.playerHp > 0 || this.runtime.context.phase === GamePhase.Fail) {
                return;
            }
            this.onBattleFinished(false);
        });
    }

    private startInterRoundAdvance(): void {
        this.interRoundAdvanceRemaining = GameConfig.campaign.interRoundAdvanceDistance;
        this.runtime.context.currentRound += 1;
        this.battleQuestionIndexInRound = 0;
        this.currentBattleQuestion = null;
        this.pendingSkillType = null;
        this.pendingSkillCost = 0;
        this.runtime.clearBattleObjects();
        this.runtime.resetTransientFlow(true);
        this.changePhase(GamePhase.NormalPause);
    }

    private updateInterRoundAdvance(dt: number): void {
        if (this.interRoundAdvanceRemaining <= 0) {
            return;
        }

        const speed = GameConfig.campaign.interRoundAdvanceDuration > 0
            ? GameConfig.campaign.interRoundAdvanceDistance / GameConfig.campaign.interRoundAdvanceDuration
            : GameConfig.campaign.interRoundAdvanceDistance;
        const advanceDistance = Math.min(this.interRoundAdvanceRemaining, speed * dt);
        this.interRoundAdvanceRemaining = Math.max(0, this.interRoundAdvanceRemaining - advanceDistance);
        this.runtime.context.reachedDistance += advanceDistance;
        this.runtime.updateActorPlacement();
        this.runtime.syncCameraToCurrentDistance();

        if (this.interRoundAdvanceRemaining <= 0) {
            this.finishInterRoundAdvance();
        }
    }

    private finishInterRoundAdvance(): void {
        this.interRoundAdvanceRemaining = 0;
        this.runtime.clearBattleObjects();
        this.runtime.resetTransientFlow(true);
        this.runtime.context.resetBattleRuntimeForNextRoundPrepare();
        this.runtime.bossHp = GameConfig.boss.hp;
        this.runtime.resetActorPlacement();
        this.prepareController.prepareNextRoundQuestions();
        this.battleQuestionIndexInRound = 0;
        this.currentBattleQuestion = null;
        this.pendingSkillType = null;
        this.pendingSkillCost = 0;
        this.prepareFlowLocked = false;
        this.prepareFlowToken += 1;
        this.resetPrepareQuestionRotation();
        this.changePhase(GamePhase.Prepare);
    }

    private returnToPrepareFromFail(): void {
        this.runtime.clearBattleObjects();
        this.runtime.resetTransientFlow();
        this.runtime.context.resetBattleRuntimeForRetryFromFirstRound();
        this.runtime.bossHp = GameConfig.boss.hp;
        this.runtime.resetActorPlacement();
        this.prepareController.prepareCurrentRoundQuestions();
        this.battleQuestionIndexInRound = 0;
        this.currentBattleQuestion = null;
        this.pendingSkillType = null;
        this.pendingSkillCost = 0;
        this.prepareFlowLocked = false;
        this.prepareFlowToken += 1;
        this.resetPrepareQuestionRotation();
        this.changePhase(GamePhase.Prepare);
    }

    private changePhase(phase: GamePhase): void {
        if (phase !== GamePhase.Prepare) {
            this.prepareFlowToken += 1;
            this.prepareFlowLocked = false;
        }

        this.runtime.context.phase = phase;
        if (phase === GamePhase.Battle || phase === GamePhase.Boss) {
            this.timeController.resumeBattleTime();
        } else {
            this.timeController.pauseBattleTime();
        }

        this.uiManager.setPhase(phase);
        this.refreshBattleAndResultUi();

        if (phase === GamePhase.Prepare) {
            this.refreshPrepareUi();
            const firstPrepareDelay = this.prepareController.getCurrentTaskKey() === PrepareTaskKey.BuyCar
                ? 0.5
                : 0;
            this.queuePrepareQuestion(firstPrepareDelay);
        } else if (phase === GamePhase.QuestionPause) {
            this.showBattleQuestion();
        } else {
            this.uiManager.hideQuestion();
        }
    }

    private refreshPrepareUi(visibleTaskKeyOverride?: PrepareTaskKey | null): void {
        this.runtime.refreshPreparePresentation();
        this.uiManager.renderPrepare(this.prepareController.getViewData(visibleTaskKeyOverride));
    }

    private refreshBattleAndResultUi(): void {
        const battleViewData = this.battleController.getViewData();
        if (!this.isSameBattleViewData(this.lastBattleViewData, battleViewData)) {
            this.uiManager.renderBattle(battleViewData);
            this.lastBattleViewData = { ...battleViewData };
        }

        let resultViewData: ResultViewData | null = null;
        if (this.runtime.context.phase === GamePhase.Win || this.runtime.context.phase === GamePhase.Fail) {
            resultViewData = this.getResultViewData();
        }
        if (!this.isSameResultViewData(this.lastResultViewData, resultViewData)) {
            this.uiManager.renderResult(resultViewData);
            this.lastResultViewData = resultViewData ? { ...resultViewData } : null;
        }
    }

    private getResultViewData(): ResultViewData {
        const roundDistance = Math.max(0, this.runtime.context.reachedDistance - this.runtime.context.roundStartDistance);
        if (this.runtime.context.phase === GamePhase.Win) {
            return {
                title: "挑战成功",
                content: [
                    `通关轮次：${this.runtime.context.currentRound}/${GameConfig.campaign.totalRounds}`,
                    `评分：${this.calculateGrade()}`,
                    `击杀怪物：${this.runtime.context.killCount}`,
                    `主角血量：${Math.ceil(this.runtime.context.playerHp)} / ${this.runtime.context.playerMaxHp}`,
                    `战车状态：${this.runtime.context.sawCarAlive ? "可战斗" : "全部损毁"}`,
                    `答题正确：${this.runtime.context.totalCorrect} / ${this.runtime.context.totalAnswered}`,
                    `本轮用时：${this.runtime.context.battleTime.toFixed(1)} 秒`,
                    `滚轮次数：${this.runtime.context.rollerUseCount}`,
                    `炸弹次数：${this.runtime.context.bombUseCount}`,
                ].join("\n"),
                isWin: true,
            };
        }

        return {
            title: "挑战失败",
            content: [
                `失败轮次：${this.runtime.context.currentRound}/${GameConfig.campaign.totalRounds}`,
                "失败原因：主角血量归零。",
                `击杀怪物：${this.runtime.context.killCount}`,
                `本轮推进：${Math.floor(roundDistance)} / ${GameConfig.car.bossTriggerX}`,
                `距 BOSS 剩余：${Math.max(0, Math.floor(GameConfig.car.bossTriggerX - roundDistance))}`,
                "返回准备阶段后会保留已完成的解锁与升级进度。",
            ].join("\n"),
            isWin: false,
        };
    }

    private isSameBattleViewData(previous: BattleViewData | null, next: BattleViewData): boolean {
        return !!previous
            && previous.playerHp === next.playerHp
            && previous.playerMaxHp === next.playerMaxHp
            && previous.energy === next.energy
            && previous.energyMax === next.energyMax
            && previous.battleProgress === next.battleProgress
            && previous.completedRounds === next.completedRounds
            && previous.showBattleProgress === next.showBattleProgress
            && previous.phase === next.phase
            && previous.showBoss === next.showBoss
            && previous.bossHp === next.bossHp
            && previous.bossMaxHp === next.bossMaxHp
            && previous.rollerSkillVisible === next.rollerSkillVisible
            && previous.canUseRoller === next.canUseRoller
            && previous.canUseBomb === next.canUseBomb;
    }

    private isSameResultViewData(previous: ResultViewData | null, next: ResultViewData | null): boolean {
        if (!previous || !next) {
            return previous === next;
        }
        return previous.title === next.title
            && previous.content === next.content
            && previous.isWin === next.isWin;
    }

    private calculateGrade(): string {
        const hpRate = this.runtime.context.playerHp / Math.max(1, this.runtime.context.playerMaxHp);
        if (hpRate >= 0.75 && this.runtime.context.battleTime <= 80) {
            return "S";
        }
        if (hpRate >= 0.5) {
            return "A";
        }
        if (hpRate >= 0.25) {
            return "B";
        }
        return "C";
    }

    private isBattleAnswerCorrect(question: QuestionItem, optionIndex: number): boolean {
        if (question.questionType === QuestionType.Matching || question.questionType === QuestionType.Ordering) {
            return optionIndex === 0;
        }
        return optionIndex === (question.correctAnswerIndex ?? 0);
    }

    private getQuestionViewIndexByType(questionType: QuestionType): number {
        const normalized = Math.max(1, questionType);
        return normalized - 1;
    }

    private getNextPrepareQuestionViewIndex(): number {
        const availableViewIndices = [5, 0, 4, 2, 3];
        const totalTypeCount = Math.max(1, availableViewIndices.length);
        const roundIndex = ((Math.max(1, this.runtime.context.currentRound) - 1) % totalTypeCount + totalTypeCount) % totalTypeCount;
        const targetViewIndex = availableViewIndices[roundIndex];
        if (this.uiManager.isQuestionViewReady(targetViewIndex)) {
            return targetViewIndex;
        }

        const readyViewIndex = availableViewIndices.find((viewIndex) => this.uiManager.isQuestionViewReady(viewIndex));
        if (readyViewIndex !== undefined) {
            return readyViewIndex;
        }

        return this.uiManager.getFirstReadyPrepareQuestionType();
    }

    private resetPrepareQuestionRotation(): void {
        this.nextPrepareQuestionViewIndex = 0;
    }
}
