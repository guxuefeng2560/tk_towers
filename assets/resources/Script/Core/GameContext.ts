import { GameConfig } from "./GameConfig";
import { GamePhase, PrepareTaskKey, UpgradeType } from "./GameDefines";

export interface PrepareRoundState {
    round: number;
    answeredCount: number;
    correctCount: number;
    wrongCount: number;
    taskProgress: Record<PrepareTaskKey, number>;
    pendingQuestionIds: string[];
}

export class GameContext {
    public phase: GamePhase = GamePhase.Prepare;
    public lastBattlePhaseBeforeQuestionPause: GamePhase = GamePhase.Battle;

    public sawCarUnlocked = false;
    public sawCarCount = 0;
    public sawCarRemainingCount = 0;
    public skillUnlocked = false;
    public defenseUnlocked = false;
    public attackLevel = 0;
    public defenseLevel = 0;
    public energyRegenLevel = 0;
    public prepareWrongCount = 0;

    public playerHp = 0;
    public playerMaxHp = 0;
    public playerAttack = 0;
    public energy = 0;
    public energyMax = 0;
    public energyRegen = 0;

    public sawCarHpList: number[] = [];
    public sawCarMaxHpList: number[] = [];
    public sawCarAttackList: number[] = [];
    public sawCarHp = 0;
    public sawCarMaxHp = 0;
    public sawCarAttack = 0;
    public sawCarAlive = false;

    public totalAnswered = 0;
    public totalCorrect = 0;
    public prepareAnsweredCount = 0;
    public prepareCorrectCount = 0;

    public killCount = 0;
    public battleTime = 0;
    public rollerUseCount = 0;
    public bombUseCount = 0;
    public reachedDistance = 0;
    public roundStartDistance = 0;
    public currentRound = 1;
    public prepareRoundStates: PrepareRoundState[] = [];

    public constructor() {
        this.resetAllProgress();
    }

    public resetAllProgress(): void {
        this.phase = GamePhase.Prepare;
        this.lastBattlePhaseBeforeQuestionPause = GamePhase.Battle;

        this.sawCarUnlocked = false;
        this.sawCarCount = 0;
        this.sawCarRemainingCount = 0;
        this.skillUnlocked = false;
        this.defenseUnlocked = false;
        this.attackLevel = 0;
        this.defenseLevel = 0;
        this.energyRegenLevel = 0;
        this.prepareWrongCount = 0;
        this.totalAnswered = 0;
        this.totalCorrect = 0;
        this.prepareAnsweredCount = 0;
        this.prepareCorrectCount = 0;
        this.reachedDistance = 0;
        this.roundStartDistance = 0;
        this.currentRound = 1;
        this.prepareRoundStates = [];
        this.sawCarHpList = [];
        this.ensurePrepareRoundState(1);
        this.recalculateStats();
        this.resetBattleRuntime();
    }

    public resetBattleRuntime(preserveReachedDistance: boolean = false): void {
        const nextDistance = preserveReachedDistance ? this.reachedDistance : 0;
        this.roundStartDistance = nextDistance;
        this.applyBattleRuntime(nextDistance);
    }

    public resetBattleRuntimeForRetry(): void {
        this.applyBattleRuntime(this.roundStartDistance);
    }

    public resetBattleRuntimeForRetryFromFirstRound(): void {
        this.currentRound = 1;
        this.roundStartDistance = 0;
        this.applyBattleRuntime(0);
    }

    public resetBattleRuntimeForNextRoundPrepare(): void {
        const nextDistance = this.reachedDistance;
        this.roundStartDistance = nextDistance;
        this.energy = 0;
        this.killCount = 0;
        this.battleTime = 0;
        this.rollerUseCount = 0;
        this.bombUseCount = 0;
        this.reachedDistance = nextDistance;
        this.playerHp = Math.max(0, Math.min(this.playerHp, this.playerMaxHp));
        this.syncSawCarState();
    }

    public ensurePrepareRoundState(round: number = this.currentRound): PrepareRoundState {
        const normalizedRound = Math.max(1, Math.floor(round));
        let state = this.prepareRoundStates.find((item) => item.round === normalizedRound);
        if (!state) {
            state = this.createPrepareRoundState(normalizedRound);
            this.prepareRoundStates.push(state);
            this.prepareRoundStates.sort((left, right) => left.round - right.round);
        }
        return state;
    }

    public resetCurrentPrepareSession(): void {
        this.prepareAnsweredCount = 0;
        this.prepareCorrectCount = 0;
        this.prepareWrongCount = 0;
        this.ensurePrepareRoundState();
    }

    public beginPrepareRoundQuestionSession(initialQuestionIds: string[], round: number = this.currentRound): string[] {
        const state = this.ensurePrepareRoundState(round);
        if (state.pendingQuestionIds.length <= 0 && this.shouldInitializePrepareQuestionIds(state)) {
            state.pendingQuestionIds = initialQuestionIds.slice();
        }
        return state.pendingQuestionIds.slice();
    }

    public getCurrentRoundTaskProgress(taskKey: PrepareTaskKey): number {
        return this.getRoundTaskProgress(this.currentRound, taskKey);
    }

    public getCurrentRoundActivePrepareTaskKey(): PrepareTaskKey | null {
        const taskOrder: PrepareTaskKey[] = [
            PrepareTaskKey.BuyCar,
            PrepareTaskKey.UnlockSkill,
            PrepareTaskKey.Hurt,
            PrepareTaskKey.Hp,
            PrepareTaskKey.UnlockDef,
            PrepareTaskKey.Energy,
        ];
        const requiredCountByTask: Record<PrepareTaskKey, number> = {
            [PrepareTaskKey.BuyCar]: 1,
            [PrepareTaskKey.UnlockSkill]: 1,
            [PrepareTaskKey.Hurt]: 5,
            [PrepareTaskKey.Hp]: 3,
            [PrepareTaskKey.UnlockDef]: 1,
            [PrepareTaskKey.Energy]: 5,
        };

        for (const taskKey of taskOrder) {
            if (this.getCurrentRoundTaskProgress(taskKey) < requiredCountByTask[taskKey]) {
                return taskKey;
            }
        }
        return null;
    }

    public getRoundTaskProgress(round: number, taskKey: PrepareTaskKey): number {
        const state = this.ensurePrepareRoundState(round);
        return state.taskProgress[taskKey] || 0;
    }

    public recordPrepareAnswer(isCorrect: boolean): void {
        const state = this.ensurePrepareRoundState();
        this.totalAnswered += 1;
        this.prepareAnsweredCount += 1;
        state.answeredCount += 1;

        if (isCorrect) {
            this.totalCorrect += 1;
            this.prepareCorrectCount += 1;
            state.correctCount += 1;
            return;
        }

        this.prepareWrongCount += 1;
        state.wrongCount += 1;
    }

    public resolvePrepareQuestion(questionId: string, isCorrect: boolean, round: number = this.currentRound): void {
        if (!isCorrect) {
            return;
        }

        const state = this.ensurePrepareRoundState(round);
        state.pendingQuestionIds = state.pendingQuestionIds.filter((id) => id !== questionId);
    }

    public recordPrepareUpgrade(upgradeType: UpgradeType): void {
        const taskKey = this.getTaskKeyByUpgradeType(upgradeType);
        const state = this.ensurePrepareRoundState();
        state.taskProgress[taskKey] = (state.taskProgress[taskKey] || 0) + 1;
        this.recalculateStats();
    }

    public getTotalPrepareAnsweredCount(): number {
        return this.prepareRoundStates.reduce((sum, state) => sum + state.answeredCount, 0);
    }

    public getTotalPrepareCorrectCount(): number {
        return this.prepareRoundStates.reduce((sum, state) => sum + state.correctCount, 0);
    }

    public getAliveCarCount(): number {
        return this.getAliveCarIndices().length;
    }

    public getAliveCarIndices(): number[] {
        const indices: number[] = [];
        for (let index = 0; index < Math.min(this.sawCarHpList.length, this.sawCarCount); index += 1) {
            if (this.sawCarHpList[index] > 0) {
                indices.push(index);
            }
        }
        return indices;
    }

    public getLeadCarIndex(): number {
        for (let index = Math.min(this.sawCarHpList.length, this.sawCarCount) - 1; index >= 0; index -= 1) {
            if (this.sawCarHpList[index] > 0) {
                return index;
            }
        }
        return -1;
    }

    public getCarHp(index: number): number {
        if (index < 0 || index >= this.sawCarHpList.length) {
            return 0;
        }
        return this.sawCarHpList[index] || 0;
    }

    public getCarMaxHp(index: number): number {
        if (index < 0 || index >= this.sawCarCount) {
            return GameConfig.sawCar.baseHp;
        }
        return this.sawCarMaxHpList[index] || GameConfig.sawCar.baseHp;
    }

    public getCarHpUpgradeLevel(index: number): number {
        if (index < 0 || index >= this.sawCarCount) {
            return 0;
        }
        const state = this.getCarPrepareRoundState(index);
        return state ? (state.taskProgress[PrepareTaskKey.Hp] || 0) : 0;
    }

    public getCarAttack(index: number): number {
        if (index < 0 || index >= this.sawCarCount) {
            return GameConfig.sawCar.baseAttack;
        }
        return this.sawCarAttackList[index] || GameConfig.sawCar.baseAttack;
    }

    public getCurrentRoundCarIndex(): number {
        for (let index = 0; index < this.sawCarCount; index += 1) {
            if (this.getCarRound(index) === this.currentRound) {
                return index;
            }
        }
        return Math.max(0, Math.min(this.sawCarCount - 1, this.currentRound - 1));
    }

    public getCarDefenseUnlocked(index: number): boolean {
        const state = this.getCarPrepareRoundState(index);
        return !!state && (state.taskProgress[PrepareTaskKey.UnlockDef] || 0) > 0;
    }

    public getCarSkillUnlocked(index: number): boolean {
        const state = this.getCarPrepareRoundState(index);
        return !!state && (state.taskProgress[PrepareTaskKey.UnlockSkill] || 0) > 0;
    }

    public hasAliveCarSkillUnlocked(): boolean {
        return this.getAliveCarIndices().some((index) => this.getCarSkillUnlocked(index));
    }

    public getLowestAliveCarIndexWithSkill(): number {
        const aliveIndices = this.getAliveCarIndices();
        for (let order = 0; order < aliveIndices.length; order += 1) {
            const index = aliveIndices[order];
            if (this.getCarSkillUnlocked(index)) {
                return index;
            }
        }
        return -1;
    }

    public setCarHp(index: number, value: number): void {
        if (index < 0 || index >= this.sawCarCount) {
            return;
        }
        this.syncCarStatListLength();
        while (this.sawCarHpList.length < this.sawCarCount) {
            this.sawCarHpList.push(this.getCarMaxHp(this.sawCarHpList.length));
        }
        const maxHp = this.getCarMaxHp(index);
        this.sawCarHpList[index] = Math.max(0, Math.min(value, maxHp));
        this.syncSawCarState();
    }

    public damageLeadCar(damage: number): { targetIndex: number; destroyed: boolean } {
        const targetIndex = this.getLeadCarIndex();
        if (targetIndex < 0) {
            return { targetIndex: -1, destroyed: false };
        }

        this.setCarHp(targetIndex, this.getCarHp(targetIndex) - damage);
        return {
            targetIndex,
            destroyed: this.getCarHp(targetIndex) <= 0,
        };
    }

    public damageCar(index: number, damage: number): { targetIndex: number; destroyed: boolean } {
        if (index < 0 || index >= this.sawCarCount || this.getCarHp(index) <= 0) {
            return { targetIndex: -1, destroyed: false };
        }

        this.setCarHp(index, this.getCarHp(index) - damage);
        return {
            targetIndex: index,
            destroyed: this.getCarHp(index) <= 0,
        };
    }

    public refreshCarsAfterUnlock(): void {
        while (this.sawCarHpList.length < this.sawCarCount) {
            const index = this.sawCarHpList.length;
            this.ensureCarStats(index);
            this.sawCarHpList.push(this.getCarMaxHp(index));
        }
        if (this.sawCarHpList.length > this.sawCarCount) {
            this.sawCarHpList.length = this.sawCarCount;
        }
        this.syncSawCarState();
    }

    private applyBattleRuntime(nextDistance: number): void {
        this.playerHp = this.playerMaxHp;
        this.energy = 0;
        this.syncCarStatListLength();
        this.sawCarHpList = [];
        for (let index = 0; index < this.sawCarCount; index += 1) {
            this.sawCarHpList.push(this.getCarMaxHp(index));
        }
        this.killCount = 0;
        this.battleTime = 0;
        this.rollerUseCount = 0;
        this.bombUseCount = 0;
        this.reachedDistance = nextDistance;
        this.syncSawCarState();
    }

    public recalculateStats(): void {
        this.sawCarCount = this.getTotalTaskProgress(PrepareTaskKey.BuyCar);
        this.attackLevel = this.getTotalTaskProgress(PrepareTaskKey.Hurt);
        this.defenseLevel = this.getTotalTaskProgress(PrepareTaskKey.Hp);
        this.energyRegenLevel = this.getTotalTaskProgress(PrepareTaskKey.Energy);
        this.skillUnlocked = this.getTotalTaskProgress(PrepareTaskKey.UnlockSkill) > 0;
        this.defenseUnlocked = this.getTotalTaskProgress(PrepareTaskKey.UnlockDef) > 0;
        this.playerMaxHp = GameConfig.player.maxHp;
        this.playerAttack = GameConfig.player.baseAttack;// + this.attackLevel * GameConfig.player.attackAddPerLevel;
        this.energyMax = GameConfig.player.energyMax;
        this.energyRegen = GameConfig.player.baseEnergyRegen + this.energyRegenLevel * GameConfig.player.energyRegenAddPerLevel;
        this.sawCarUnlocked = this.sawCarCount > 0;
        for (let index = 0; index < this.sawCarCount; index += 1) {
            this.refreshCarStats(index);
        }
        this.sawCarMaxHp = this.sawCarMaxHpList[0] || GameConfig.sawCar.baseHp;
        this.sawCarAttack = this.sawCarAttackList[0] || GameConfig.sawCar.baseAttack;
        this.playerHp = Math.min(this.playerHp || this.playerMaxHp, this.playerMaxHp);
        this.energy = Math.min(this.energy || 0, this.energyMax);
        if (this.sawCarHpList.length > this.sawCarCount) {
            this.sawCarHpList.length = this.sawCarCount;
        }
        while (this.sawCarHpList.length < this.sawCarCount) {
            const index = this.sawCarHpList.length;
            this.refreshCarStats(index);
            this.sawCarHpList.push(this.getCarMaxHp(index));
        }
        this.sawCarHpList = this.sawCarHpList.map((hp, index) => {
            if (hp <= 0) {
                return 0;
            }
            const currentMaxHp = this.getCarMaxHp(index);
            return Math.min(hp, currentMaxHp);
        });
        this.syncSawCarState();
    }

    private ensureCarStats(index: number): void {
        if (index < 0 || index >= this.sawCarCount) {
            return;
        }
        if (this.sawCarMaxHpList[index] === undefined) {
            this.sawCarMaxHpList[index] = this.calculateCarMaxHp(index);
        }
        if (this.sawCarAttackList[index] === undefined) {
            this.sawCarAttackList[index] = this.calculateCarAttack(index);
        }
    }

    private refreshCarStats(index: number): void {
        if (index < 0 || index >= this.sawCarCount) {
            return;
        }

        const previousMaxHp = this.sawCarMaxHpList[index];
        const previousHp = this.sawCarHpList[index];
        const nextMaxHp = this.calculateCarMaxHp(index);
        this.sawCarMaxHpList[index] = nextMaxHp;
        this.sawCarAttackList[index] = this.calculateCarAttack(index);

        if (previousHp === undefined) {
            return;
        }
        if (previousHp <= 0) {
            this.sawCarHpList[index] = 0;
            return;
        }
        this.sawCarHpList[index] = previousMaxHp === undefined || previousHp >= previousMaxHp
            ? nextMaxHp
            : Math.min(previousHp, nextMaxHp);
    }

    private syncCarStatListLength(): void {
        if (this.sawCarMaxHpList.length > this.sawCarCount) {
            this.sawCarMaxHpList.length = this.sawCarCount;
        }
        if (this.sawCarAttackList.length > this.sawCarCount) {
            this.sawCarAttackList.length = this.sawCarCount;
        }
    }

    private calculateCarMaxHp(index: number): number {
        const state = this.getCarPrepareRoundState(index);
        const hpLevel = state ? (state.taskProgress[PrepareTaskKey.Hp] || 0) : 0;
        return GameConfig.sawCar.baseHp + hpLevel * GameConfig.sawCar.hpAddPerLevel;
    }

    private calculateCarAttack(index: number): number {
        const state = this.getCarPrepareRoundState(index);
        const attackLevel = state ? (state.taskProgress[PrepareTaskKey.Hurt] || 0) : 0;
        return GameConfig.sawCar.baseAttack + attackLevel * GameConfig.sawCar.attackAddPerLevel;
    }

    private getCarRound(index: number): number {
        if (index < 0) {
            return 1;
        }
        const unlockedRounds = this.getUnlockedCarRounds();
        return unlockedRounds[index] || (index + 1);
    }

    private getCarPrepareRoundState(index: number): PrepareRoundState | undefined {
        const round = this.getCarRound(index);
        return this.prepareRoundStates.find((item) => item.round === round);
    }

    private getUnlockedCarRounds(): number[] {
        const rounds: number[] = [];
        this.prepareRoundStates
            .slice()
            .sort((left, right) => left.round - right.round)
            .forEach((state) => {
                const buyCount = Math.max(0, state.taskProgress[PrepareTaskKey.BuyCar] || 0);
                for (let count = 0; count < buyCount; count += 1) {
                    rounds.push(state.round);
                }
            });
        return rounds;
    }

    private getTotalTaskProgress(taskKey: PrepareTaskKey): number {
        return this.prepareRoundStates.reduce((sum, state) => sum + (state.taskProgress[taskKey] || 0), 0);
    }

    private getTaskKeyByUpgradeType(upgradeType: UpgradeType): PrepareTaskKey {
        if (upgradeType === UpgradeType.UnlockSawCar) {
            return PrepareTaskKey.BuyCar;
        }
        if (upgradeType === UpgradeType.UnlockSkill) {
            return PrepareTaskKey.UnlockSkill;
        }
        if (upgradeType === UpgradeType.Attack) {
            return PrepareTaskKey.Hurt;
        }
        if (upgradeType === UpgradeType.Hp) {
            return PrepareTaskKey.Hp;
        }
        if (upgradeType === UpgradeType.UnlockDefense) {
            return PrepareTaskKey.UnlockDef;
        }
        return PrepareTaskKey.Energy;
    }

    private createPrepareRoundState(round: number): PrepareRoundState {
        return {
            round,
            answeredCount: 0,
            correctCount: 0,
            wrongCount: 0,
            pendingQuestionIds: [],
            taskProgress: {
                [PrepareTaskKey.BuyCar]: 0,
                [PrepareTaskKey.UnlockSkill]: 0,
                [PrepareTaskKey.Hurt]: 0,
                [PrepareTaskKey.Hp]: 0,
                [PrepareTaskKey.UnlockDef]: 0,
                [PrepareTaskKey.Energy]: 0,
            },
        };
    }

    private shouldInitializePrepareQuestionIds(state: PrepareRoundState): boolean {
        if (state.answeredCount > 0 || state.correctCount > 0 || state.wrongCount > 0) {
            return false;
        }

        for (const key of Object.keys(state.taskProgress)) {
            if ((state.taskProgress[key as PrepareTaskKey] || 0) > 0) {
                return false;
            }
        }

        return true;
    }

    private syncSawCarState(): void {
        this.syncCarStatListLength();
        if (this.sawCarHpList.length > this.sawCarCount) {
            this.sawCarHpList.length = this.sawCarCount;
        }
        this.sawCarHpList = this.sawCarHpList.map((hp, index) => Math.max(0, Math.min(hp, this.getCarMaxHp(index))));
        const leadCarIndex = this.getLeadCarIndex();
        this.sawCarRemainingCount = this.getAliveCarCount();
        this.sawCarAlive = leadCarIndex >= 0;
        this.sawCarHp = leadCarIndex >= 0 ? this.sawCarHpList[leadCarIndex] : 0;
        this.sawCarMaxHp = leadCarIndex >= 0 ? this.getCarMaxHp(leadCarIndex) : (this.sawCarMaxHpList[0] || GameConfig.sawCar.baseHp);
        this.sawCarAttack = leadCarIndex >= 0 ? this.getCarAttack(leadCarIndex) : (this.sawCarAttackList[0] || GameConfig.sawCar.baseAttack);
    }
}
