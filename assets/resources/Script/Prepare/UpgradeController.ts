import { GameConfig } from "../Core/GameConfig";
import { GameContext } from "../Core/GameContext";
import { UpgradeType } from "../Core/GameDefines";
import AudioManager from "../Framework/audio/TD_AudioManager";
import { AudioID } from "../global/TD_Constants";

export default class UpgradeController {
    public applyUpgrade(context: GameContext, upgradeType: UpgradeType): void {
        const previousCarCount = context.sawCarCount;
        context.recordPrepareUpgrade(upgradeType);
        AudioManager.getInstance().playSFX(AudioID.AudioID_car_upgrade);
        context.sawCarCount = Math.min(context.sawCarCount, GameConfig.campaign.totalRounds);
        if (context.sawCarCount > previousCarCount && upgradeType === UpgradeType.UnlockSawCar) {
            context.refreshCarsAfterUnlock();
        }
    }
}
