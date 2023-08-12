import { ConditionFilter } from "../../../../../utils/ConditionFilter";
import { ErrorCode } from "../../../../ErrorCode";
import GamberModel from "../../../../Game/GamberModel";
import { GameConst } from "../../../../GameConst";
import TurnPokerGameMgr from "../Base/TurnPokerGameMgr";
import DXCardMgr from "./DXCardMgr";
import DXCardPointMgr from "./DXCardPointMgr";
import DXGamberModel from "./DXGamberModel";
import DXNet from "./DXNet";
import DXOperate from "./DXOperate";
import DXOptionalOperate from "./DXOptionalOperate";

export default class DXGameMgr extends TurnPokerGameMgr {
    gambers: DXGamberModel[];
    net: DXNet;

    beltNowCost: number = 0;
    bankerOnlyEat: boolean;
    eatNoRub: boolean = true;
    rubCards: { [key: string]: boolean } = {};

    get isBlintEatMode() {
        return this.roomConf.getValue("头家闷吃");
    }

    get isReverseBeltMode() {
        return this.roomConf.getValue("头家反带");
    }

    saveGameLeftData(data: any = {}) {
        data.fundPool = this.fundPool;
        super.saveGameLeftData(data);
    }

    setGameInitData(data: any): void {
        this.fundPool = data.fundPool;
    }

    doTimeoutOperate() {
        if (this.getOptionalOperate(this.turnGamber) & DXOperate.NO_BELT) {
            this.C_NoBelt(this.turnGamber);
        } else {
            this.C_Waive(this.turnGamber);
        }
    }

    C_RubCard(gamber: GamberModel) {
        if (!this.rubCards[gamber.userId]) {
            if (this.banker == gamber && this.turnGamber == gamber) {
                this.eatNoRub =  false;
            }
            this.rubCards[gamber.userId] = true;
            this.net.G_RubCard(gamber.userId, gamber.holds);
            if (this.turnGamber == gamber) {
                let op = this.getOptionalOperate(this.turnGamber);
                this.net.G_TurnBetting(this.turnGamber.userId, op);
            }
        } else {
            return ErrorCode.UNEXCEPT_OPERATE;
        }
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    C_SeeCard(gamber: GamberModel) {
        if (!this.rubCards[gamber.userId]) {
            if (this.banker == gamber && this.turnGamber == gamber) {
                this.eatNoRub =  false;
            }
            this.rubCards[gamber.userId] = true;
            let cardType = this.getCardType(gamber);
            this.net.G_SeeCard(gamber.userId, gamber.holds, cardType);
            if (this.turnGamber == gamber) {
                let op = this.getOptionalOperate(this.turnGamber);
                this.net.G_TurnBetting(this.turnGamber.userId, op);
            }
        } else {
            return ErrorCode.UNEXCEPT_OPERATE;
        }
    }

    betting(gamber: DXGamberModel, operate: DXOperate, scoreBetting: number) {
        if (operate == DXOperate.REVERSE_BELT || operate == DXOperate.NO_BELT) {
            gamber.scoreReverse = scoreBetting;
        } else {
            gamber.scoreBetting = scoreBetting;
        }
        gamber.hasBetting = true;
        gamber.scoreBettings.push(scoreBetting);
        this.beltNowCost += scoreBetting;

        this.net.G_GamberScoreChange(gamber.userId, -scoreBetting, gamber.score, gamber.scoreBetting);
        this.notifyOperate(gamber, operate, scoreBetting);
        this.nextState();
    }

    otherAllWaive(gamber: GamberModel) {
        for (let otherGamber of this.gambers) {
            if (gamber == otherGamber) {
                continue;
            }
            if (!otherGamber.waive) {
                return false;
            }
        }
        return true;
    }

    isGameCanOver(turnGamber: GamberModel) {
        if (this.getNextGamber(turnGamber) == this.banker) {
            if (this.otherAllWaive(turnGamber)) {
                return true;
            }
        }

        if (this.isReverseBeltMode) {
            // 反带模式下
            // 1. 除了头家，其他全弃，再轮到头家就结束
            // 2. 头家弃牌，轮到最后一家就结束
            // 3. 头家第二次操作完毕，结束
            if (turnGamber == this.banker) {
                if (this.otherAllWaive(this.banker)) {
                    return true;
                }
            }
            if (turnGamber != this.banker && turnGamber.scoreBettings.length >= 1) {
                return true;
            }
            return false;
        } else {
            // 正常模式下
            // 1. 除了最后一家，其他全弃，轮到最后一家就结束
            // 2. 最后一家操作完毕，结束
            if (turnGamber.scoreBettings.length >= 1) {
                return true;
            }
            return false;
        }
    }

    settle() {
        let winner = null;
        let mayBeLose = false;      // 这个是为了处理庄家手牌和闲家手牌一样是最大，然后庄家第二次选择不带的情况
        let totalLoseScore = 0;
        let winnerScore = 0;
        let start = this.banker.seatIndex;
        for (let i = start; i < start + this.gamberNum; ++i) {
            let index = i % this.gamberNum;
            let gamber = this.gambers[index];
            let value = gamber.cardValue = DXCardPointMgr.calculate(gamber.holds);

            if (gamber.waive) {
                continue;
            }
            if (winner == null || value > winner.cardValue) {
                winner = gamber;
                mayBeLose = false;
                if (!winner.hasBetting) {
                    gamber.scoreBetting = this.fundPool;
                }
            } else if (value == winner.cardValue) {
                mayBeLose = true;
            }
            totalLoseScore += gamber.scoreBetting + gamber.scoreReverse;
        }
        if (winner == null) {
            return;
        }
        if (winner != this.banker || !winner.scoreReverse) {
            mayBeLose = false;
        }
        if (mayBeLose) {
            winnerScore = winner.scoreBetting;
        } else {
            winnerScore = winner.scoreBetting + winner.scoreReverse;
        }

        if (winnerScore >= this.fundPool) {
            // 计算赔底
            let start = this.banker.seatIndex;
            let end = start + this.gamberNum;
            let canEqual = !DXCardPointMgr.isZero(this.getCardType(winner));
            for (let i = start; i < end; ++i) {
                let index = i % this.gamberNum;
                let gamber = this.gambers[index];
                if (gamber == winner) {
                    if (!(this.isReverseBeltMode && winner == this.banker && winner.scoreReverse)) {
                        canEqual = false;
                    }
                    continue;
                }
                if (!gamber.waive) {
                    continue;
                }
                if (gamber.cardValue > winner.cardValue) {
                    gamber.compensate = winnerScore;
                } else if (gamber.cardValue == winner.cardValue && canEqual) {
                    gamber.compensate = winnerScore;
                }
            }
        }

        totalLoseScore -= winnerScore;
        if (totalLoseScore < winnerScore) {
            winnerScore = Math.min(winnerScore, this.fundPool + totalLoseScore);
        }
        this.changeFundPool(totalLoseScore - winnerScore);
        
        for (let gamber of this.gambers) {
            if (gamber.waive) {
                continue;
            }
            if (winner != gamber) {
                this.changeGamberScore(gamber, -(gamber.scoreBetting + gamber.scoreReverse));
            } else {
                let score = winnerScore;
                if (mayBeLose) {
                    score -= winner.scoreReverse;
                }
                this.changeGamberScore(winner, score);
            }
        }

        for (let king of this.gambers) {
            // 皇帝对奖励
            if (king.cardValue == 1000) {
                let kingScore = this.baseScore * this.gamberNum;
                for (let gamber of this.gambers) {
                    if (king == gamber) {
                        this.changeGamberScore(king, kingScore * (this.gamberNum - 1));
                    } else {
                        this.changeGamberScore(gamber, -kingScore);
                    }
                }
            }
        }
    }

    isRoundOver() {
        for (let gamber of this.gambers) {
            if (gamber.compensate) {
                return false;
            }
        }
        return this.fundPool == 0;
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, DXOperate.TOUCH)
    C_ShowTouch(gamber: GamberModel) {
        this.net.G_ShowTouch(gamber.userId, this.baseScore, this.fundPool - this.baseScore);
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, DXOperate.TOUCH)
    C_Touch(gamber: GamberModel, scoreBetting: number) {
        if (scoreBetting > this.fundPool - this.baseScore || scoreBetting < this.baseScore) {
            return ErrorCode.BETTING_SCORE_ERROR;
        }
        this.betting(<DXGamberModel>gamber, DXOperate.TOUCH, scoreBetting);
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, DXOperate.EAT)
    C_Eat(gamber: GamberModel) {
        this.betting(<DXGamberModel>gamber, DXOperate.EAT, this.fundPool);
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, DXOperate.BLIND_EAT)
    C_BlindEat(gamber: GamberModel) {
        this.betting(<DXGamberModel>gamber, DXOperate.BLIND_EAT, this.fundPool);
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, DXOperate.BELT)
    C_Belt(gamber: GamberModel) {
        this.betting(<DXGamberModel>gamber, DXOperate.BELT, this.beltNowCost);
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, DXOperate.REVERSE_BELT)
    C_ReverseBelt(gamber: GamberModel) {
        this.betting(<DXGamberModel>gamber, DXOperate.REVERSE_BELT, this.beltNowCost);
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, DXOperate.NO_BELT)
    C_NoBelt(gamber: GamberModel) {
        this.betting(<DXGamberModel>gamber, DXOperate.NO_BELT, 0);
    }

    getOptionalOperate(gamber: GamberModel) {
        if (this.isReverseBeltMode && gamber == this.banker && gamber.scoreBetting > 0) {
            return DXOptionalOperate.REVERSE_BELT;
        }
        if (this.isBlintEatMode) {
            if (this.bankerOnlyEat) {
                if (this.banker == gamber) {
                    return DXOptionalOperate.BLIND_EAT;
                } else {
                    if (this.beltNowCost == this.fundPool) {
                        return DXOptionalOperate.EAT_WAIVE;
                    } else {
                        return DXOptionalOperate.EAT_BELT;
                    }
                }
            } else {
                if (this.eatNoRub) {
                    if (this.banker == gamber) {
                        return DXOptionalOperate.BLIND_EAT_TOUCH;
                    } else {
                        if (this.beltNowCost == this.fundPool) {
                            return DXOptionalOperate.EAT_WAIVE;
                        } else {
                            return DXOptionalOperate.EAT_BELT;
                        }
                    }
                } else {
                    if (this.banker == gamber) {
                        return DXOptionalOperate.EAT_TOUCH;
                    } else {
                        if (this.beltNowCost == this.fundPool) {
                            return DXOptionalOperate.EAT_TOUCH;
                        } else {
                            return DXOptionalOperate.EAT_TOUCH_BELT;
                        }
                    }
                }
            }
        } else {
            if (this.banker == gamber) {
                return DXOptionalOperate.EAT_TOUCH;
            } else {
                if (this.beltNowCost == this.fundPool) {
                    return DXOptionalOperate.EAT_TOUCH;
                } else {
                    return DXOptionalOperate.EAT_TOUCH_BELT;
                }
            }
        }
    }

    // 处理赔底
    dealCompensate() {
        for (let gamber of this.gambers) {
            if (gamber.compensate <= 0) continue;
            this.changeFundPool(gamber.compensate);
            this.changeGamberScore(gamber, -gamber.compensate);
            gamber.compensate = 0;
        }
    }

    // 处理投底
    dealFundPool() {
        this.dealCompensate();
        this.bankerOnlyEat = this.fundPool == 0;
        
        if (this.fundPool < this.gamberNum * this.baseScore) {
            for (let gamber of this.gambers) {
                this.changeFundPool(this.baseScore);
                this.changeGamberScore(gamber, -this.baseScore);
            }
        }

        this.beltNowCost = this.fundPool;
    }

    reconnectOnBetting(userId: string, gamber?: DXGamberModel) {
        if (gamber && this.rubCards[userId]) {
            let cardType = this.getCardType(gamber);
            this.net.G_SeeCard(gamber.userId, gamber.holds, cardType);
        }
        super.reconnectOnBetting(userId, gamber);
    }

    canPlayHalfway() {
        return this.isRoundOver();
    }

    getCardType(gamber: GamberModel) {
        return DXCardPointMgr.getCardType(gamber.holds);
    }

    generateCardMgr() {
        return new DXCardMgr();
    }

    generateGamber() {
        return new DXGamberModel();
    }

    getBrightCardNum() {
        return 1;
    }

    getDarkCardNum() {
        return 1;
    }
}