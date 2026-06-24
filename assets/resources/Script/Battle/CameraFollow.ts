import { GameConfig } from "../Core/GameConfig";
import { GamePhase } from "../Core/GameDefines";
import GameRuntime from "../Core/GameRuntime";

export default class CameraFollow {
    private static readonly BG_REUSE_OFFSCREEN_PADDING = 500;

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
        const bgNodes = this.runtime.refs.bgNodes;
        if (bgNodes.length === 0) {
            return;
        }

        const visibleLeft = this.runtime.cameraTrackX - GameConfig.designWidth / 2;
        for (let count = 0; count < bgNodes.length; count += 1) {
            const leftMostIndex = this.runtime.bgOrderIndices[0];
            const rightMostIndex = this.runtime.bgOrderIndices[this.runtime.bgOrderIndices.length - 1];
            const leftMost = leftMostIndex === undefined ? null : bgNodes[leftMostIndex];
            const rightMost = rightMostIndex === undefined ? null : bgNodes[rightMostIndex];
            if (!leftMost || !rightMost) {
                return;
            }
            const leftMostRightEdge = leftMost.x + this.runtime.bgWidth / 2;
            if (leftMostRightEdge >= visibleLeft - CameraFollow.BG_REUSE_OFFSCREEN_PADDING) {
                return;
            }

            leftMost.x = rightMost.x + this.runtime.bgWidth;
            this.runtime.bgOrderIndices.push(this.runtime.bgOrderIndices.shift() as number);
        }
    }
}
