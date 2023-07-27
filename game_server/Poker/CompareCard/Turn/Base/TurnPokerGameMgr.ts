
import { ConditionFilter } from "../../../../../utils/ConditionFilter";
import GameUtil from "../../../../../utils/GameUtil";
import { ErrorCode } from "../../../../ErrorCode";
import GamberModel from "../../../../Game/GamberModel";
import GameMgr from "../../../../Game/GameMgr";
import { GameConst } from "../../../../GameConst";
import TurnOperate from "./TurnOperate";

export default class TurnPokerGameMgr extends GameMgr {

    bankerId: string;
    isTurnGame: boolean = true;

    initGame() {
        super.initGame();
        this.dealFundPool();
    }

    // 处理投底
    dealFundPool() {
        for (let gamber of this.gambers) {
            this.changeFundPool(this.baseScore);
            this.changeGamberScore(gamber, -this.baseScore);
        }
    }

    setGameInitData(data: any): void {
        this.bankerId = data.winnerId || data.bankerId;
    }

    StateOver_idle(...args: any) {
        this.updateGameState(GameConst.GameState.DECIDE_BANKER);
        this.State_decideBanker();
    }

    State_decideBanker(...args: any): void {        
        // 第一轮的庄家是随机的，后面的庄家都是上一轮的胜利者
        if (this.bankerId == null) {
            let bankerIndex = GameUtil.random(this.gamberNum - 1);
            this.banker = this.gambers[bankerIndex];
            this.bankerId = this.banker.userId;
            this.net.G_DecideBanker(this.bankerId, this.getGamberIds());
        } else {
            this.net.G_DecideBanker(this.bankerId, []);
        }
        this.nextState();
    }

    StateOver_betting(...args: any) {
        this.turnGamber = this.getNextLiveGamber(this.turnGamber);
        if (this.isGameCanOver(this.turnGamber)) {
            this.updateGameState(GameConst.GameState.SHOW_CARD);
            this.State_showCard();
        } else {
            this.State_betting(this.turnGamber);
        }
    }

    State_betting(gamber?: GamberModel | undefined): void {
        // this.turnGamber = this.getNextLiveGamber(this.turnGamber, gamber);
        // this.turnGamber.hasBetting = false;
        let op = this.getOptionalOperate(this.turnGamber);
        this.net.G_TurnBetting(this.turnGamber.userId, op);
    
        if (this.waiveWhenTimeout) {
            this.beginTimer(GameConst.GameTime.BETTING, this.doTimeoutOperate.bind(this));
        }
    }

    doTimeoutOperate() {
        this.C_Waive(this.turnGamber);
    }

    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, TurnOperate.WAIVE)
    C_Waive(gamber: GamberModel) {
        gamber.waive = true;
        this.notifyOperate(gamber, TurnOperate.WAIVE);        
        this.nextState();
    }

    getNextLiveGamber(lastTurnGamber: GamberModel, assignTurnGamber?: GamberModel) {
        if (assignTurnGamber) {
            this.onChangeTurnGamber(assignTurnGamber);
            return assignTurnGamber;
        }
        let start = lastTurnGamber.seatIndex + 1;
        let end = lastTurnGamber.seatIndex + this.gamberNum;
        for (let i = start; i < end; ++i) {
            let index = i % this.gamberNum;
            let gamber = this.gambers[index];
            this.onChangeTurnGamber(gamber);
            if (gamber.eliminate || gamber.waive) {
                continue;
            }
            return gamber;
        }
        return lastTurnGamber;
    }

    onChangeTurnGamber(gamber: GamberModel) {

    }


    getOptionalOperate(gamber: GamberModel): number {
        return TurnOperate.WAIVE;
    }

    isGameCanOver(gamber: GamberModel) {
        let live = false;
        for (let gamber of this.gambers) {
            if (gamber.eliminate || gamber.waive) {
                continue;
            }
            if (live) {
                return false;
            }
            live = true;
        }
        return true;
    }

    getShowCardExtData(gamber: GamberModel) {
        let data: any = { dead: gamber.eliminate || gamber.waive };
        let cardType = this.getCardType(gamber);
        if (cardType != null) {
            data.cardType = cardType;
        }
        return data;
    }

    reconnectOverIdle(userId: string): void {
        super.reconnectOverIdle(userId);
        this.net.G_FundPoolChange(this.fundPool, userId);
        for (let gamber of this.gambers) {
            this.net.G_GamberScoreChange(gamber.userId, 0, gamber.score, gamber.scoreBetting, userId);
        }
    }

    // reconnectOnBetting(userId: string, gamber: GamberModel) {
    //     this.net.G_FundPoolChange(this.fundPool, userId);
    //     for (let gamber of this.gambers) {
    //         this.net.G_GamberScoreChange(gamber.userId, 0, gamber.score, gamber.scoreBetting, userId);
    //     }
    //     super.reconnectOnBetting(userId, gamber);
    // }

    notifyOperate(gamber: GamberModel, operate: any, data: any = null, clearTimer: boolean = true) {
        clearTimer && this.clearStateTimer();
        super.notifyOperate(gamber, operate, data)
    }

    getCardType(gamber: GamberModel): string | number | null {
        return 0;
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