export default class TimeController {
    private battleTimeScale = 1;

    public isBattleTimeRunning(): boolean {
        return this.battleTimeScale > 0;
    }

    public pauseBattleTime(): void {
        this.battleTimeScale = 0;
    }

    public resumeBattleTime(): void {
        this.battleTimeScale = 1;
    }

    public getBattleDt(dt: number): number {
        return dt * this.battleTimeScale;
    }
}
