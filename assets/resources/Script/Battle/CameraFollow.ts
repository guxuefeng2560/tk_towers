import { GameConfig } from "../Core/GameConfig";
import { GamePhase } from "../Core/GameDefines";
import GameRuntime from "../Core/GameRuntime";

export default class CameraFollow {
    private readonly runtime: GameRuntime;

    public constructor(runtime: GameRuntime) {
        this.runtime = runtime;
    }

    public update(): void {
        const { context, refs, worldRoot } = this.runtime;
        if (!worldRoot || !refs.heroNode) {
            return;
        }

        const isCameraFrozen = context.phase === GamePhase.QuestionPause || context.phase === GamePhase.NormalPause;
        if (context.phase === GamePhase.Win) {
            this.runtime.cameraTrackX = Math.max(0, this.runtime.cameraTrackX);
        } else if (isCameraFrozen) {
            this.runtime.cameraTrackX = Math.max(0, this.runtime.cameraTrackX);
        } else if (context.phase === GamePhase.Boss && this.runtime.bossEntranceActive) {
            const heroWorldPosition = this.runtime.getHeroWorldPosition();
            const followX = Math.max(0, heroWorldPosition.x - this.runtime.heroScreenAnchorX);
            this.runtime.cameraTrackX = Math.min(followX, this.runtime.getBossCameraLockX());
            this.runtime.completeBossEntranceIfCentered();
        } else if (context.phase === GamePhase.Boss) {
            this.runtime.cameraTrackX = this.runtime.getBossCameraLockX();
        } else {
            const heroWorldPosition = this.runtime.getHeroWorldPosition();
            this.runtime.cameraTrackX = Math.max(0, heroWorldPosition.x - this.runtime.heroScreenAnchorX);
        }

        worldRoot.x = -this.runtime.cameraTrackX;
        if (isCameraFrozen) {
            return;
        }
        this.updateBackgroundLoop();
    }

    private updateBackgroundLoop(): void {
        this.runtime.syncBackgroundLoopToCamera();
    }
}
