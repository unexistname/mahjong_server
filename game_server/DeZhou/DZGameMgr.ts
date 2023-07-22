import GameMgr from "../Game/GameMgr";
import DZCardMgr from "./DZCardMgr";
import DZGamberModel from "./DZGamberModel";
import { GameConst } from "../GameConst";
import DZNet from "./DZNet";
import GamberModel from "../Game/GamberModel";
import { ConditionFilter } from "../../utils/ConditionFilter";
import GameUtil from "../../utils/GameUtil";
import { ErrorCode } from "../ErrorCode";
import DZOperate from "./DZOperate";
import DZCardPointMgr from "./DZCardPointMgr";


export default class DZGameMgr extends GameMgr {
    gambers: DZGamberModel[];
    net: DZNet;
    banker: DZGamberModel;
    bankerId: string;
    turnGamber: DZGamberModel;

    smallBlindBetGamber: DZGamberModel;
    bigBlindBetGamber: DZGamberModel;
    
    // 上一个加注的人
    lastRaiseGamber: DZGamberModel;
    // 加注次数
    raiseTime = 0;

    smallRound: number = 0;

    callNowCost: number;

    commonHolds: number[] = [];


    generateCardMgr() {
        return new DZCardMgr();
    }

    generateGamber() {
        return new DZGamberModel();
    }

    getBrightCardNum() {
        return 2;
    }

    getDarkCardNum() {
        return 0;
    }
    
    StateOver_idle(...args: any): void {
        this.updateGameState(GameConst.GameState.DECIDE_BANKER);
        this.State_decideBanker();
    }


    setGameInitData(data: any) {
        this.bankerId = data.bankerId;
    }

    State_decideBanker() {
        let banker = this.getGamberByUserId(this.bankerId);
        if (banker) {
            this.banker = this.getNextGamber(<DZGamberModel>banker);
        } else {
            let bankerIndex = GameUtil.random(this.gamberNum - 1);
            this.banker = this.gambers[bankerIndex];
        }
        this.bankerId = this.banker.userId;
        this.smallBlindBetGamber = this.getNextGamber(this.banker);
        this.bigBlindBetGamber = this.getNextGamber(this.smallBlindBetGamber);
        
        this.net.G_DecideBanker(this.bankerId, this.getGamberIds());

        this.beginTimer(GameConst.GameTime.DECIDE_BANKER, this.nextState.bind(this));
    }

    StateOver_decideBanker() {
        this.updateGameState(GameConst.GameState.BETTING);

        this.blintBetting(this.smallBlindBetGamber, this.baseScore / 2);
        this.blintBetting(this.bigBlindBetGamber, this.baseScore);
        this.turnGamber = this.getNextGamber(this.bigBlindBetGamber);
        this.State_betting(this.turnGamber);
    }

    getRaiseBetCost() {
        if (this.smallRound > 2) {
            return this.callNowCost + this.baseScore * 2;
        } else {
            return this.callNowCost + this.baseScore;
        }
    }

    State_betting(gamber?: DZGamberModel | undefined): void {
        this.turnGamber = gamber || this.getNextGamber(this.turnGamber);
        
        if (this.lastRaiseGamber == null) {
            this.lastRaiseGamber = this.turnGamber;
        }
        if (this.lastRaiseGamber == this.turnGamber) {
            this.smallRound += 1;
            this.raiseTime = 0;
            this.dealRound();
        }
        if (this.isGameCanOver(this.turnGamber)) {
            this.nextState();
            return;
        }

        let op = this.getOptionalOperate(this.turnGamber);
        this.net.G_TurnBetting(this.turnGamber.userId, op);

        if (this.waiveWhenTimeout) {
            this.beginTimer(GameConst.GameTime.BETTING, () => {
                this.C_Waive(this.turnGamber);
            });
        }
    }

    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, DZOperate.WAIVE)
    C_Waive(gamber: GamberModel) {
        this.clearStateTimer();
        gamber.eliminate = true;
        this.notifyOperate(gamber, DZOperate.WAIVE);
        this.nextState();
    }

    betting(gamber: DZGamberModel, op: DZOperate, value: number) {
        this.callNowCost = value;
        this.changeGamberScore(gamber, -value, true);
        this.changeFundPool(value);
        this.notifyOperate(gamber, op, value);
        this.nextState();
    }

    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, DZOperate.CALL)
    C_Call(gamber: DZGamberModel) {
        this.betting(gamber, DZOperate.CALL, this.callNowCost);
    }

    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, DZOperate.RAISE)
    C_Raise(gamber: DZGamberModel) {
        this.lastRaiseGamber = gamber;
        this.raiseTime += 1;
        this.betting(gamber, DZOperate.RAISE, this.getRaiseBetCost());
    }

    getOptionalOperate(gamber: GamberModel): number {
        let op = DZOperate.WAIVE | DZOperate.CALL;
        if (this.raiseTime < 3) {
            op |= DZOperate.RAISE;
        }
        return op;
    }

    isGameCanOver(gamber: DZGamberModel) {
        if (this.smallRound >= 4) {
            return true;
        }
        let leftNum = 0;
        for (let gamber of this.gambers) {
            if (gamber.eliminate) {
                continue;
            }
            leftNum += 1;
            if (leftNum >= 2) {
                return false;
            }
        }
        return true;
    }

    drawCommonHolds(amount: number = 0) {
        for (let i = 0; i < amount; ++i) {
            let card = this.cardMgr.drawCard();
            if (card != null) {
                this.commonHolds.push(card);
            }
        }
        this.net.G_CommonHolds(this.commonHolds);
    }

    dealRound() {
        if (this.smallRound == 1) {
            // 给玩家发两张手牌
            this.initHolds();
            this.G_InitHolds();
        } else if (this.smallRound == 2) {
            // 发3张公共牌
            this.drawCommonHolds(3);
        } else if (this.smallRound == 3 || this.smallRound == 4) {
            // 发1张公共牌
            this.drawCommonHolds(1);
        }
    }

    
    blintBetting(gamber: DZGamberModel, value: number) {
        this.callNowCost = value;
        this.changeGamberScore(gamber, -value, true);
        this.changeFundPool(value);
        this.notifyOperate(gamber, DZOperate.BLINT_BET, value);
    }

    settle() {
        let winner: DZGamberModel[] = [];
        let winValue = 0;

        let start = this.banker.seatIndex;
        let end = start + this.gamberNum;
        for (let i = start; i < end; ++i) {
            let index = i % this.gamberNum;
            let gamber = this.gambers[index];
            if (gamber.eliminate) {
                continue;
            }
            let value = DZCardPointMgr.calculate(this, gamber.holds);
            gamber.cardType = DZCardPointMgr.getCardType(this, gamber.holds);
            gamber.tryCards = DZCardPointMgr.getTryCards(this, gamber.holds);
            if (gamber.tryCards) {
                gamber.tryCards.sort((a, b) => {
                    return DZCardPointMgr.getCardPoint(a) - DZCardPointMgr.getCardPoint(b);
                });
            }
            if (winner == null || value > winValue) {
                winner = [gamber];
                winValue = value;
            } else if (value == winValue) {
                if (DZCardPointMgr.better(winner[0], gamber)) {
                    winner = [gamber];
                }
            }
        }

        let winnerScore = 0;
        for (let gamber of this.gambers) {
            winnerScore += gamber.scoreBetting;
        }
        let score = Math.floor(winnerScore / winner.length);
        let remain = winnerScore % winner.length;

        for (let i = 0; i < winner.length; ++i) {
            let gamber = winner[i];
            if (i == 0) {
                this.winnerId = gamber.userId;
                this.changeGamberScore(gamber, (score + remain));
            } else {
                this.changeGamberScore(gamber, score);
            }
        }
        this.changeFundPool(-this.fundPool);
    }

    reconnectOnBetting(userId: string, gamber: DZGamberModel) {
        this.net.G_FundPoolChange(this.fundPool, userId);
        for (let gamber of this.gambers) {
            this.net.G_GamberScoreChange(gamber.userId, 0, gamber.score, gamber.scoreBetting, userId);
        }
        super.reconnectOnBetting(userId, gamber);
    }

    getSettleExtraData(gamber: DZGamberModel) {
        return {
            tryCards: gamber.tryCards,
        }
    }

    getNextGamber(gamber: DZGamberModel) {
        let start = gamber.seatIndex + 1;
        let end = gamber.seatIndex + this.gamberNum;
        for (let i = start; i < end; ++i) {
            let index = i % this.gamberNum;
            if (this.gambers[index].eliminate) {
                continue;
            }
            return this.gambers[index];
        }
        return gamber;
    }

    getAllState() {
        return [
            GameConst.GameState.IDLE, 
            GameConst.GameState.DECIDE_BANKER, 
            GameConst.GameState.DRAW_CARD, 
            GameConst.GameState.BETTING, 
            GameConst.GameState.SHOW_CARD, 
            GameConst.GameState.SETTLE
        ];
    }
}