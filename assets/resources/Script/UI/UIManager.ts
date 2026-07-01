import { GamePhase, PrepareTaskKey } from "../Core/GameDefines";
import { SceneRefs } from "../Core/SceneRefs";
import { BattleViewData } from "./BattleView";
import BattleView from "./BattleView";
import { PrepareViewData } from "./PrepareView";
import PrepareView from "./PrepareView";
import { QuestionViewData } from "./QuestionView1";
import { ResultViewData } from "./ResultView";
import ResultView from "./ResultView";

interface UIManagerCallbacks {
    onStartBattle: () => void;
    onSkipPrepare: () => void;
    onSpeedUp: () => void;
    onRoller: () => void;
    onBomb: () => void;
    onQuestionOption: (index: number, detail?: any) => void;
    onRetryPrepare: () => void;
    onCloseWinResult: () => void;
}

export default class UIManager {
    public readonly prepareView: PrepareView;
    public readonly battleView: BattleView;
    public resultView: ResultView | null = null;

    private readonly root: cc.Node;
    private readonly host: cc.Component | null;
    private questionViews: Array<QuestionViewLike | null> = [null, null, null, null, null, null];
    private activeQuestionViewIndex = -1;
    private pendingQuestionRequest: { data: QuestionViewData; fromNode: cc.Node | null; viewIndex: number } | null = null;
    private pendingResultActive = false;
    private pendingResultData: ResultViewData | null = null;

    public constructor(root: cc.Node, refs: SceneRefs, target: any, callbacks: UIManagerCallbacks) {
        this.root = root;
        this.host = target instanceof cc.Component ? target : null;

        this.prepareView = new PrepareView(
            refs,
            target,
            callbacks.onStartBattle,
            callbacks.onSkipPrepare,
        );
        this.battleView = new BattleView(refs, target, callbacks.onRoller, callbacks.onBomb, callbacks.onSpeedUp);
        this.loadQuestionView(callbacks.onQuestionOption);
        this.loadResultView(callbacks.onRetryPrepare, callbacks.onCloseWinResult);
    }

    public setPhase(phase: GamePhase): void {
        this.prepareView.setActive(phase === GamePhase.Prepare);
        this.battleView.setActive(phase === GamePhase.Battle || phase === GamePhase.Boss || phase === GamePhase.NormalPause || phase === GamePhase.QuestionPause);
        if (phase !== GamePhase.Prepare && phase !== GamePhase.QuestionPause) {
            this.hideQuestion();
        }
    }

    public renderPrepare(data: PrepareViewData, onTaskVisibilitySettled?: () => void): void {
        this.prepareView.render(data, onTaskVisibilitySettled);
    }

    public renderBattle(data: BattleViewData): void {
        this.battleView.render(data);
    }

    public renderResult(data: ResultViewData | null): void {
        this.pendingResultData = data;
        this.pendingResultActive = !!data;
        if (this.resultView) {
            this.resultView.setActive(this.pendingResultActive);
            if (data) {
                this.resultView.render(data);
            }
        }
    }

    public showPrepareQuestion(data: QuestionViewData, fromNode: cc.Node | null, viewIndex: number): void {
        this.pendingQuestionRequest = { data, fromNode, viewIndex };
        this.openQuestionView(viewIndex, fromNode, data);
    }

    public showBattleQuestion(data: QuestionViewData, viewIndex: number): void {
        this.pendingQuestionRequest = { data, fromNode: null, viewIndex };
        this.openQuestionView(viewIndex, null, data);
    }

    public closeQuestionTo(targetNode: cc.Node | null, onComplete: () => void): void {
        this.pendingQuestionRequest = null;
        const activeView = this.getActiveQuestionView();
        if (!activeView) {
            onComplete();
            return;
        }
        activeView.closeTo(targetNode, () => {
            this.activeQuestionViewIndex = -1;
            onComplete();
        });
    }

    public closePrepareQuestionTo(targetNode: cc.Node | null, onComplete: () => void): void {
        this.closeQuestionTo(targetNode, onComplete);
    }

    public hideQuestion(): void {
        this.pendingQuestionRequest = null;
        this.activeQuestionViewIndex = -1;
        this.questionViews.forEach((view) => {
            if (view) {
                view.hideImmediate();
            }
        });
    }

    public isQuestionViewReady(viewIndex: number): boolean {
        return !!this.questionViews[viewIndex];
    }

    public getPrepareQuestionTypeCount(): number {
        return this.questionViews.length;
    }

    public getFirstReadyPrepareQuestionType(): number {
        for (let i = 0; i < this.questionViews.length; i += 1) {
            if (this.questionViews[i]) {
                return i;
            }
        }
        return 0;
    }

    public delay(seconds: number, callback: () => void): void {
        if (!this.host) {
            callback();
            return;
        }
        this.host.scheduleOnce(callback, seconds);
    }

    public getPrepareTaskAnchor(taskKey: PrepareTaskKey | null): cc.Node | null {
        return this.prepareView.getTaskAnchor(taskKey);
    }

    public getCodeAnchor(): cc.Node | null {
        return this.prepareView.getCodeAnchor();
    }

    public playCodeGain(): void {
        this.prepareView.playCodeGain();
    }

    private loadResultView(onRetryPrepare: () => void, onCloseWinResult: () => void): void {
        const resources = (cc as any).resources;
        if (!resources || !resources.load) {
            return;
        }

        resources.load("prefab/resultUI", cc.Prefab, (error: Error | null, prefab: cc.Prefab) => {
            if (error || !prefab) {
                return;
            }

            const node = cc.instantiate(prefab);
            node.parent = this.root;
            this.resultView = node.getComponent(ResultView);
            if (!this.resultView) {
                this.resultView = node.addComponent(ResultView);
            }
            this.resultView.initialize(onRetryPrepare, onCloseWinResult);
            this.resultView.setActive(this.pendingResultActive);
            if (this.pendingResultData) {
                this.resultView.render(this.pendingResultData);
            }
        });
    }

    private loadQuestionView(onQuestionOption: (index: number, detail?: any) => void): void {
        const resources = (cc as any).resources;
        if (!resources || !resources.load) {
            return;
        }

        const viewConfigs: QuestionViewConfig[] = [
            { path: "prefab/questionUI1", componentName: "QuestionView1" },
            { path: "prefab/questionUI2", componentName: "QuestionView2" },
            { path: "prefab/questionUI3", componentName: "QuestionView3" },
            { path: "prefab/questionUI4", componentName: "QuestionView4" },
            { path: "prefab/questionUI5", componentName: "QuestionView5" },
            { path: "prefab/questionUI6", componentName: "QuestionView6" },
        ];

        viewConfigs.forEach((config, index) => {
            resources.load(config.path, cc.Prefab, (error: Error | null, prefab: cc.Prefab) => {
                if (error || !prefab) {
                    return;
                }

                const node = cc.instantiate(prefab);
                node.parent = this.root;
                const view = node.getComponent(config.componentName) as QuestionViewLike;
                if (!view) {
                    return;
                }
                view.initialize(onQuestionOption);
                // view.hideImmediate();
                this.questionViews[index] = view;

                if (this.pendingQuestionRequest && this.pendingQuestionRequest.viewIndex === index) {
                    this.openQuestionView(index, this.pendingQuestionRequest.fromNode, this.pendingQuestionRequest.data);
                }
            });
        });
    }

    private openQuestionView(viewIndex: number, fromNode: cc.Node | null, data: QuestionViewData): void {
        const nextIndex = this.normalizeQuestionViewIndex(viewIndex);
        const nextView = this.questionViews[nextIndex];
        if (!nextView) {
            return;
        }

        const activeView = this.getActiveQuestionView();
        if (activeView && activeView !== nextView) {
            activeView.hideImmediate();
        }

        this.activeQuestionViewIndex = nextIndex;
        nextView.openFrom(fromNode, data);
    }

    private normalizeQuestionViewIndex(viewIndex: number): number {
        if (viewIndex >= 0 && viewIndex < this.questionViews.length) {
            return viewIndex;
        }
        return 0;
    }

    private getActiveQuestionView(): QuestionViewLike | null {
        if (this.activeQuestionViewIndex < 0 || this.activeQuestionViewIndex >= this.questionViews.length) {
            return null;
        }
        return this.questionViews[this.activeQuestionViewIndex];
    }
}

interface QuestionViewLike extends cc.Component {
    initialize(onSelect: (index: number, detail?: any) => void): void;
    openFrom(anchorNode: cc.Node | null, data: QuestionViewData): void;
    closeTo(anchorNode: cc.Node | null, onComplete?: () => void): void;
    hideImmediate(): void;
}

interface QuestionViewConfig {
    path: string;
    componentName: string;
}
