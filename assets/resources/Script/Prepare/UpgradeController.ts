import { GameConfig } from "../Core/GameConfig";
import { GameContext } from "../Core/GameContext";
import { UpgradeType } from "../Core/GameDefines";

export default class UpgradeController {
    public applyUpgrade(context: GameContext, upgradeType: UpgradeType): void {
        const previousCarCount = context.sawCarCount;
        context.recordPrepareUpgrade(upgradeType);
        context.sawCarCount = Math.min(context.sawCarCount, GameConfig.campaign.totalRounds);
        if (context.sawCarCount > previousCarCount && upgradeType === UpgradeType.UnlockSawCar) {
            context.refreshCarsAfterUnlock();
        }
    }
}
