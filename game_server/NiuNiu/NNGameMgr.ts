import { ConditionFilter } from "../../utils/ConditionFilter";
import { ErrorCode } from "../ErrorCode";
import GamberModel from "../Game/GamberModel";
import GameMgr from "../Game/GameMgr";
import { GameConst } from "../GameConst";
import NNCardPointMgr from "./NNCardPointMgr";
import NNOperate from "./NNOperate";


export default class NNGameMgr extends GameMgr {

    isTurnGame: boolean = false;

    StateOver_idle(...args: any) {
        this.updateGameState(GameConst.GameState.DRAW_CARD);
        this.State_drawCard();
    }

    StateOver_drawCard(...args: any): void {
        this.beginTimer(GameConst.GameTime.DRAW_CARD, () => {
            this.updateGameState(GameConst.GameState.ROB_BANKER);
            this.State_robBanker();
        });
    }

    StateOver_decideBanker(...args: any): void {
        this.beginTimer(GameConst.GameTime.DECIDE_BANKER, () => {
            this.updateGameState(GameConst.GameState.BETTING);
            this.State_betting();
        });
    }

    State_betting(gamber?: GamberModel) {
        this.net.G_Betting(NNOperate.BETTING_VALUES);
        this.beginTimer(GameConst.GameTime.BETTING, () => {
            this.nextState();
        })
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    C_Betting(gamber: GamberModel, value: number) {
        gamber.hasBetting = true;
        gamber.scoreBetting = value;
        this.notifyOperate(gamber, NNOperate.BETTING, value);

        this.nextState();
    }

    isGameCanOver(gamber: GamberModel): boolean {
        for (let gamber of this.gambers) {
            if (!gamber.hasBetting) {
                return false;
            }
        }
        return true;
    }
    
    StateOver_robBanker(...args: any) {
        this.updateGameState(GameConst.GameState.DECIDE_BANKER);
        this.State_decideBanker();
    }

    StateOver_betting(gamber: GamberModel, ...args: any): void {
        if (this.isGameCanOver(gamber)) {
            this.clearStateTimer();
            this.updateGameState(GameConst.GameState.SHOW_CARD);
            this.State_showCard();
        }
    }

    State_showCard() {
        let data: any = {};
        for (let gamber of this.gambers) {
            gamber.cardType = NNCardPointMgr.calculate(gamber.holds);
            data[gamber.userId] = {
                userId: gamber.userId,
                holds: gamber.holds,
                cardType: gamber.cardType,
            };
        }
        this.net.G_ShowCard(data);
        this.nextState();
    }

    settle() {
        for (let gamber of this.gambers) {
            if (!gamber.scoreRobBanker) {
                gamber.scoreRobBanker = 1;
            }
            if (!gamber.scoreBetting) {
                gamber.scoreBetting = 1;
            }
        }

        var banker = this.banker;
        var value = NNCardPointMgr.calculate(banker.holds);
        banker.cardType = value;
        var beishu = NNCardPointMgr.typeResult(value);
        let bankerScore = 0;
        for (let gamber of this.gambers) {
            if (gamber == banker) {
                continue;
            }
            var value2 = NNCardPointMgr.calculate(gamber.holds);
            gamber.cardType = value2;
            let scoreBeforeMulti = (banker.scoreRobBanker || 1) * gamber.scoreBetting * this.baseScore;
            if(value > value2){
                let score = scoreBeforeMulti * beishu;
                bankerScore += score;
                this.changeGamberScore(gamber, -score);
            }
            else if(value == value2){
                var result = NNCardPointMgr.compare(banker.holds, gamber.holds, value);
                if(result > 0){
                    var score = scoreBeforeMulti * beishu;
                    bankerScore += score;
                    this.changeGamberScore(gamber, -score);
                }
                else if(result < 0){
                    var beishu2 = NNCardPointMgr.typeResult(value2);
                    var score = scoreBeforeMulti * beishu2;
                    bankerScore -= score;
                    this.changeGamberScore(gamber, score);
                }
            }
            else if(value < value2){
                var beishu2 = NNCardPointMgr.typeResult(value2);
                var score = scoreBeforeMulti * beishu2;
                bankerScore -= score;
                this.changeGamberScore(gamber, score);
            }
        }
        this.changeGamberScore(banker, bankerScore);
    }

    getRobBankerValues(): number[] {
        return NNOperate.ROB_BANKER_VALUES;
    }
}