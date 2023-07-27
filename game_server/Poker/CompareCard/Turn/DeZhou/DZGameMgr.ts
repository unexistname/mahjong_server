import DZGamberModel from "./DZGamberModel";
import { GameConst } from "../../../../GameConst";
import DZNet from "./DZNet";
import GamberModel from "../../../../Game/GamberModel";
import { ConditionFilter } from "../../../../../utils/ConditionFilter";
import GameUtil from "../../../../../utils/GameUtil";
import { ErrorCode } from "../../../../ErrorCode";
import DZOperate from "./DZOperate";
import DZCardPointMgr from "./DZCardPointMgr";
import TurnPokerGameMgr from "../Base/TurnPokerGameMgr";


export default class DZGameMgr extends TurnPokerGameMgr {
    gambers: DZGamberModel[];
    net: DZNet;
    banker: DZGamberModel;
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

    generateGamber() {
        return new DZGamberModel();
    }

    getBrightCardNum() {
        return 2;
    }

    getDarkCardNum() {
        return 0;
    }

    dealFundPool() {
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
            this.banker = <DZGamberModel>this.getNextGamber(banker);
        } else {
            let bankerIndex = GameUtil.random(this.gamberNum - 1);
            this.banker = this.gambers[bankerIndex];
        }
        this.bankerId = this.banker.userId;
        this.smallBlindBetGamber = <DZGamberModel>this.getNextGamber(this.banker);
        this.bigBlindBetGamber = <DZGamberModel>this.getNextGamber(this.smallBlindBetGamber);
        
        this.net.G_DecideBanker(this.bankerId, this.getGamberIds());

        this.beginTimer(GameConst.GameTime.DECIDE_BANKER, this.nextState.bind(this));
    }

    StateOver_decideBanker() {
        this.updateGameState(GameConst.GameState.BETTING);

        this.blintBetting(this.smallBlindBetGamber, this.baseScore / 2);
        this.blintBetting(this.bigBlindBetGamber, this.baseScore);
        this.turnGamber = <DZGamberModel>this.getNextGamber(this.bigBlindBetGamber);
        this.lastRaiseGamber = this.turnGamber;
        this.State_betting(this.turnGamber);
    }

    getRaiseBetCost() {
        if (this.smallRound > 2) {
            return this.callNowCost + this.baseScore * 2;
        } else {
            return this.callNowCost + this.baseScore;
        }
    }

    onChangeTurnGamber(gamber: GamberModel) {
        if (this.lastRaiseGamber == gamber) {
            this.smallRound += 1;
            this.raiseTime = 0;
            this.dealRound();
        }
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
        return this.smallRound >= 4 || super.isGameCanOver(gamber);
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
            if (gamber.waive) {
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

    getSettleExtraData(gamber: DZGamberModel) {
        return {
            tryCards: gamber.tryCards,
        }
    }
}