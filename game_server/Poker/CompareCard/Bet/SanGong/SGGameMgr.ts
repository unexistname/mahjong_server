import { ConditionFilter } from "../../../../../utils/ConditionFilter";
import { ErrorCode } from "../../../../ErrorCode";
import GamberModel from "../../../../Game/GamberModel";
import GameMgr from "../../../../Game/GameMgr";
import { GameConst } from "../../../../GameConst";
import SGCardPointMgr from "./SGCardPointMgr";
import SGOperate from "./SGOperate";


export default class SGGameMgr extends GameMgr {
    
    bankerId: string;

    State_betting(gamber?: GamberModel) {
        this.net.G_Betting(SGOperate.BETTING_VALUES);
        this.beginTimer(GameConst.GameTime.BETTING, () => {
            this.nextState();
        })
    }

    getRobBankerValues(): number[] {
        return SGOperate.ROB_BANKER_VALUES;
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    C_Betting(gamber: GamberModel, value: number) {
        gamber.hasBetting = true;
        gamber.scoreBetting = value;
        this.notifyOperate(gamber, SGOperate.BETTING, value);
        this.nextState();
    }

    StateOver_betting(gamber: GamberModel, ...args: any): void {
        if (this.isGameCanOver(gamber)) {
            this.clearStateTimer();
            this.updateGameState(GameConst.GameState.SHOW_CARD);
            this.State_showCard();
        }
    }

    isGameCanOver(gamber: GamberModel): boolean {
        for (let gamber of this.gambers) {
            if (!gamber.hasBetting) {
                return false;
            }
        }
        return true;
    }

    settle(): void {
        let baseScore = this.baseScore;
        let bankerValue = SGCardPointMgr.calculate(this.banker.holds);
        let bankerFactor = SGCardPointMgr.getCardTypeFactor(this.banker.holds);
        let bankerScore = 0;
        
        for (let gamber of this.gambers) {
            if (!gamber.scoreBetting) {
                gamber.scoreBetting = 1;
            }
        }

        for (let gamber of this.gambers) {
            if (gamber == this.banker) {
                continue;
            }
            let value = SGCardPointMgr.calculate(gamber.holds);
            let factor = SGCardPointMgr.getCardTypeFactor(gamber.holds);
            gamber.cardType = SGCardPointMgr.getCardType(gamber.holds);
            if (value > bankerValue) {  // 闲家赢
                this.changeGamberScore(gamber, gamber.scoreBetting * baseScore * factor);
                bankerScore -= gamber.scoreBetting * baseScore * factor;
            } else {    // 庄家赢
                this.changeGamberScore(gamber, -gamber.scoreBetting * baseScore * bankerFactor);
                bankerScore += gamber.scoreBetting * baseScore * bankerFactor;
            }
        }
        this.changeGamberScore(this.banker, bankerScore);
    }

    getBrightCardNum() {
        return 3;
    }
}