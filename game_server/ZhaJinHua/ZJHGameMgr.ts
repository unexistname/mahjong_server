
import { ConditionFilter } from "../../utils/ConditionFilter";
import GameUtil from "../../utils/GameUtil";
import { ErrorCode } from "../ErrorCode";
import GamberModel from "../Game/GamberModel";
import GameMgr from "../Game/GameMgr";
import { GameConst } from "../GameConst";
import ZJHCardMgr from "./ZJHCardMgr";
import ZJHCardPointMgr from "./ZJHCardPointMgr";
import ZJHGamberModel from "./ZJHGamberModel";
import ZJHNet from "./ZJHNet";
import ZJHOperate from "./ZJHOperate";
import ZJHOptionalOperate from "./ZJHOptionalOperate";

export default class ZJHGameMgr extends GameMgr {

    gambers: ZJHGamberModel[];
    turnGamber: ZJHGamberModel;
    bankerId: string;
    callNowCost: number;
    betTop: number;
    smallRound: number = 0;
    net: ZJHNet;

    generateCardMgr() {
        return new ZJHCardMgr();
    }

    generateGamber() {
        return new ZJHGamberModel();
    }

    getBrightCardNum() {
        return 0;
    }

    getDarkCardNum() {
        return 3;
    }

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
        this.callNowCost = this.baseScore;
        this.betTop = this.baseScore * 50;
        this.nextState();
    }

    State_betting(gamber?: ZJHGamberModel | undefined): void {
        this.turnGamber = gamber || <ZJHGamberModel>this.getNextGamber(this.turnGamber);
        if (this.turnGamber == this.banker) {
            this.smallRound += 1;
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

    getShowCardExtData(gamber: ZJHGamberModel) {
        return {
            cardType: ZJHCardPointMgr.getCardType(gamber.holds),
            dead: gamber.eliminate || gamber.waive,
        }
    }
    
    getOptionalOperate(gamber: ZJHGamberModel) {
        if (gamber.watchCardRound != null) { // 如果看了牌
            if (this.smallRound == 1) {
                return ZJHOptionalOperate.CALL_RAISE;
            } else {
                if (this.callNowCost >= this.betTop) {
                    return ZJHOptionalOperate.COMPARE;
                } else {
                    return ZJHOptionalOperate.CALL_RAISE_COMPARE;
                }
            }
        } else {
            if (this.smallRound == 1) {
                return ZJHOptionalOperate.CALL_RAISE_WATCH;
            } else {
                if (this.callNowCost >= this.betTop) {
                    return ZJHOptionalOperate.COMPARE_WATCH;
                } else {
                    return ZJHOptionalOperate.CALL_RAISE_COMPARE_WATCH;
                }
            }
        }
    }

    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, ZJHOperate.WAIVE)
    C_Waive(gamber: GamberModel) {
        this.clearStateTimer();
        (<ZJHGamberModel>gamber).waive = true;
        this.notifyOperate(gamber, ZJHOperate.WAIVE);        
        this.nextState();
    }

    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, ZJHOperate.CALL)
    C_Call(gamber: ZJHGamberModel) {
        let callNowCost = this.callNowCost;
        let betTop = this.betTop;
        if (gamber.watchCardRound != null) {
            callNowCost *= 2;
            betTop *= 2;
        }
        let value = Math.min(callNowCost, betTop);
        this.clearStateTimer();
        gamber.hasBetting = true;
        this.changeGamberScore(gamber, -value, true);
        this.changeFundPool(value);
        this.notifyOperate(gamber, ZJHOperate.CALL, value);
        this.nextState();
    }

    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, ZJHOperate.RAISE)
    C_ShowRaise(gamber: ZJHGamberModel) {
        let callNowCost = this.callNowCost;
        let betTop = this.betTop;
        if (gamber.watchCardRound != null) {
            callNowCost *= 2;
            betTop *= 2;
        }
        this.net.G_ShowRaise(gamber.userId, callNowCost, betTop);
    }

    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, ZJHOperate.RAISE)
    C_Raise(gamber: ZJHGamberModel, value: number) {
        let callNowCost = this.callNowCost;
        let betTop = this.betTop;
        if (gamber.watchCardRound != null) {
            callNowCost *= 2;
            betTop *= 2;
        }
        let minCost = Math.min(callNowCost, betTop);
        if (value > betTop || value < minCost) {            
            return ErrorCode.BETTING_SCORE_ERROR;
        }
        if (gamber.watchCardRound) {
            this.callNowCost = value >> 1;
        } else {
            this.callNowCost = value;
        }
        this.clearStateTimer();
        gamber.hasBetting = true;
        this.changeGamberScore(gamber, -value, true);
        this.changeFundPool(value);
        this.notifyOperate(gamber, ZJHOperate.RAISE, value);
        this.nextState();
    }

    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, ZJHOperate.WATCH)
    C_Watch(gamber: ZJHGamberModel) {
        gamber.watchCardRound = this.smallRound;
        let cardType = ZJHCardPointMgr.getCardType(gamber.holds);
        this.net.G_SeeCard(gamber.userId, gamber.holds, cardType);
        this.notifyOperate(gamber, ZJHOperate.WATCH);

        let op = this.getOptionalOperate(this.turnGamber);
        this.net.G_TurnBetting(this.turnGamber.userId, op);
    
        if (this.waiveWhenTimeout) {
            this.clearStateTimer();
            this.beginTimer(GameConst.GameTime.BETTING, () => {
                this.C_Waive(this.turnGamber);
            });
        }
    }

    eliminateGamber(gamber: ZJHGamberModel) {
        gamber.eliminate = true;
        this.net.G_Eliminate(gamber.userId);
    }

    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, ZJHOperate.COMPARE)
    C_Compare(gamber: ZJHGamberModel, cmpGamber: ZJHGamberModel) {
        if (cmpGamber.eliminate || cmpGamber.waive) {
            return ErrorCode.UNEXCEPT_OPERATE;
        }
        this.clearStateTimer();
        let result = ZJHCardPointMgr.compare(gamber.holds, cmpGamber.holds) > 0 ? 1 : 0;
        
        let value = gamber.watchCardRound ? this.callNowCost * 2 : this.callNowCost;
        gamber.hasBetting = true;

        let data = {userId: gamber.userId, cmpUserId:cmpGamber.userId, result:result};
        this.notifyOperate(gamber, ZJHOperate.COMPARE, data);
        
        this.beginTimer(GameConst.GameTime.COMPARE, () => {
            this.changeGamberScore(gamber, -value, true);
            this.changeFundPool(value);
            if (result == 1) {
                this.eliminateGamber(cmpGamber);
            } else {
                this.eliminateGamber(gamber);
            }
            this.nextState()
        });
    }

    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, ZJHOperate.COMPARE)
    C_CompareSelect(gamber: ZJHGamberModel) {
        let cmpUserIds = []
        for (let otherGamber of this.gambers) {
            if (gamber == otherGamber) {
                continue;
            }
            if (otherGamber.eliminate || otherGamber.waive) {
                continue;
            }
            cmpUserIds.push(otherGamber.userId);
        }
        this.net.G_CompareSelect(gamber.userId, cmpUserIds);
    }

    isGameCanOver(gamber: ZJHGamberModel) {
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

    reconnectOverDrawCard(userId: string) {
        let holds: { [key: string]: any[] } = {};
        for (let gamber of this.gambers) {
            holds[gamber.userId] = GameUtil.deepClone(gamber.holds);
            if (gamber.userId == userId && gamber.watchCardRound != null) {
                continue;
            }
            for (let i = gamber.holds.length - this.getDarkCardNum(); i < gamber.holds.length; ++i) {
                holds[gamber.userId][i] = -1;
            }
        }
        this.net.G_InitHolds(holds, userId);
    }

    settle() {
        let winner = null;
        let winValue = 0;
        let specialCardsGamber = null;

        for (let gamber of this.gambers) {
            if (gamber.eliminate || gamber.waive) {
                continue;
            }
            let value = ZJHCardPointMgr.calculate(gamber.holds);
            gamber.cardType = ZJHCardPointMgr.getCardType(gamber.holds);
            if (winner == null || value > winValue) {
                winner = gamber;
                winValue = value;
            }

            if (!specialCardsGamber && (ZJHCardPointMgr.isSpecialCard(gamber.holds))) {
                specialCardsGamber = gamber;
            }
        }
        
        if (winner) {
            if (specialCardsGamber != null && ZJHCardPointMgr.isLeopard(winner.holds)) {
                winner = specialCardsGamber;
            }

            // 定庄
            this.winnerId = winner.userId;
            this.changeGamberScore(winner, this.fundPool);
        }

        this.changeFundPool(-this.fundPool);
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