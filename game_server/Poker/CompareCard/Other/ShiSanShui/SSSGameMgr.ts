import { ConditionFilter } from "../../../../../utils/ConditionFilter";
import { ErrorCode } from "../../../../ErrorCode";
import CardMgr from "../../../../Game/CardMgr";
import GamberModel from "../../../../Game/GamberModel";
import GameMgr from "../../../../Game/GameMgr";
import { GameConst } from "../../../../GameConst";
import SSSCardMgr from "./SSSCardMgr";
import SSSCardPointMgr from "./SSSCardPointMgr";
import SSSGamberModel from "./SSSGamberModel";
import SSSNet from "./SSSNet";


export default class SSSGameMgr extends GameMgr {

    net: SSSNet;
    gambers: SSSGamberModel[];

    StateOver_idle() {
        this.updateGameState(GameConst.GameState.DRAW_CARD);
        this.State_drawCard();
    }

    StateOver_drawCard() {
        super.StateOver_drawCard();
        for (let gamber of this.gambers) {
            gamber.tipCards = SSSCardPointMgr.getTipCard(gamber.holds);
            this.net.G_OptionalCard(gamber.userId, gamber.tipCards);
        }
    }

    State_betting(gamber?: GamberModel) {
        this.net.G_Betting([]);
        this.nextState();
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    C_UseSpecial(gamber: SSSGamberModel, cardType: number) {
        if (SSSCardPointMgr.getSpecialCardType(gamber.holds) != cardType || cardType <= 0) {
            return ErrorCode.UNEXCEPT_OPERATE;
        }

        gamber.hasBetting = true;
        gamber.useSpecialCard = true;
        gamber.combineCards = SSSCardPointMgr.getSortSpecialCard(gamber.holds, cardType);
       
        this.net.G_Combine(gamber.userId, gamber.combineCards, cardType);
        this.nextState();
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.COMBINE_CARD_ERROR)
    @ConditionFilter(ErrorCode.CANT_POUR_WATER)
    C_Combine(gamber: SSSGamberModel, cards: number[][]) {
        gamber.hasBetting = true;
        gamber.useSpecialCard = false;
        gamber.combineCards = cards;

        this.net.G_Combine(gamber.userId, gamber.combineCards);
        this.nextState();
    }

    isGameCanOver(gamber: GamberModel) {
        for (let gamber of this.gambers) {
            if (!gamber.hasBetting) {
                return false;
            }
        }
        return true;
    }

    StateOver_betting(...args: any) {
        if (this.isGameCanOver(this.turnGamber)) {
            this.updateGameState(GameConst.GameState.SHOW_CARD);
            this.State_showCard();
        }
    }

    StateOver_showCard(...args: any) {
        this.beginTimer(GameConst.GameTime.SSS_SHOW_CARD, () => {
            this.updateGameState(GameConst.GameState.SETTLE);
            this.State_settle(...args);
        });
    }

    settle() {
        let baseScore = this.baseScore;
        var kill: number[][] = [];
        // 先普通比牌

        let addKill = (s: number, t: number, score: number) => {
            if (!kill[s]) {
                kill[s] = [];
            }
            kill[s][t] = score;
        }

        for (let i = 0; i < this.gamberNum; ++i) {
            let gamber = this.gambers[i];
            if (gamber.useSpecialCard) {
                continue;
            }
            var win1 = 0;
            var win2 = 0;
            var winPoint = 0;
            for (let j = i + 1; j < this.gamberNum; ++j) {
                let gamber2 = this.gambers[j];
                if (gamber2.useSpecialCard) {
                    continue;
                }
                
                for (var k = 0; k < 3; ++k) {
                    // @ts-ignore
                    var value1 = SSSCardPointMgr.getCommonSpecialValue(gamber.combineCards[k]);
                    // @ts-ignore
                    var value2 = SSSCardPointMgr.getCommonSpecialValue(gamber2.combineCards[k]);
                    if (value1 > value2) {
                        // @ts-ignore
                        var point = SSSCardPointMgr.getCommonMultiple(k, gamber.combineCards[k]) * baseScore;
                        this.changeGamberScore(gamber, point);
                        this.changeGamberScore(gamber2, -point);
                        // gamber.score += point;
                        // gamber2.score -= point;
                        win1++;
                        winPoint += point;
                    } else if (value1 < value2) {
                        // @ts-ignore
                        var point = SSSCardPointMgr.getCommonMultiple(k, gamber2.combineCards[k]) * baseScore;
                        this.changeGamberScore(gamber, -point);
                        this.changeGamberScore(gamber2, point);
                        // gamber2.score += point;
                        // gamber.score -= point;
                        win2++;
                        winPoint += point;
                    }
                }
                
                // 打枪翻倍
                if (win1 == 0 && win2 > 0) {    // 被打枪或者碾过
                    gamber2.shoot.push(gamber.userId);
                    this.changeGamberScore(gamber, -winPoint);
                    this.changeGamberScore(gamber2, winPoint);
                    // gamber2.score += winPoint;
                    // gamber.score -= winPoint;
                    addKill(j, i, winPoint * 2);
                }
                if (win2 == 0 && win1 > 0) {
                    gamber.shoot.push(gamber2.userId);
                    this.changeGamberScore(gamber, winPoint);
                    this.changeGamberScore(gamber2, -winPoint);
                    // gamber.score += winPoint;
                    // gamber2.score -= winPoint;
                    addKill(i, j, winPoint * 2);
                }
            }
        }

        // 再特殊比牌
        for (let i = 0; i < this.gamberNum; ++i) {
            let gamber = this.gambers[i];
            if (!gamber.useSpecialCard) continue;

            var point = SSSCardPointMgr.getSpecialMultiple(gamber.holds) * baseScore;
            for (let j = i + 1; j < this.gamberNum; ++j) {
                let gamber2 = this.gambers[j];

                if (gamber2.useSpecialCard) {
                    var result = SSSCardPointMgr.compareSpecialCard(gamber.holds, gamber2.holds);
                    if (result > 0) {
                        this.changeGamberScore(gamber, point);
                        this.changeGamberScore(gamber2, -point);
                        // gamber.score += point;
                        // gamber2.score -= point;
                        addKill(i, j, point);
                    } else if (result < 0) {
                        var point2 = SSSCardPointMgr.getSpecialMultiple(gamber2.holds) * baseScore;
                        this.changeGamberScore(gamber, -point2);
                        this.changeGamberScore(gamber2, point2);
                        // gamber2.score += point2;
                        // gamber.score -= point;
                        addKill(j, i, point);
                    }
                } else {
                    this.changeGamberScore(gamber, point);
                    this.changeGamberScore(gamber2, -point);
                    // gamber.score += point;
                    // gamber2.score -= point;
                    addKill(i, j, point);
                }
            }
        }

        // 计算通杀
        for (let i = 0; i < this.gamberNum; ++i) {
            let hasKill = true;
            for (let j = 0; j < this.gamberNum; ++j) {
                if (i == j) continue;
                if (!kill[i] || !kill[i][j]) {
                    hasKill = false;
                }
            }
            if (hasKill) {
                let gamber = this.gambers[i];
                for (let j = 0; j < this.gamberNum; ++j) {
                    if (i == j) continue;
                    let gamber2 = this.gambers[j];
                    this.changeGamberScore(gamber, kill[i][j]);
                    this.changeGamberScore(gamber2, -kill[i][j]);
                    // gamber.score += kill[i][j];
                    // gamber2.score -= kill[i][j];
                }
            }
        }
    }

    reconnectOverDrawCard(userId: string): void {
        super.reconnectOverDrawCard(userId);
        let gamber = <SSSGamberModel>this.getGamberByUserId(userId);
        gamber && this.net.G_OptionalCard(userId, gamber.tipCards);
    }

    reconnectOnBetting(userId: string, gamber?: SSSGamberModel | undefined): void {
        super.reconnectOnBetting(userId, gamber);
        if (gamber && gamber.hasBetting) {
            this.net.G_Combine(userId, gamber.combineCards)
        }
    }

    getShowCardExtData(gamber: SSSGamberModel) {
        if (gamber.useSpecialCard) {
            gamber.cardType = SSSCardPointMgr.getSpecialCardType(gamber.holds);
        } else {
            gamber.cardType = [];
            for (let j = 0; j < 3; j++) {
                // @ts-ignore
                gamber.cardType.push(SSSCardPointMgr.getCommonCardType(gamber.combineCards[j]));
            }
        }
        return {
            combineCards: gamber.combineCards,
            useSpecialCard: gamber.useSpecialCard,
            cardType: gamber.cardType,
            shoot: gamber.shoot,
            dead: false,
        }
    }

    getSettleExtraData(gamber: SSSGamberModel) {
        return {
            combineCards: gamber.combineCards,
        }
    }

    getAllState(): GameConst.GameState[] {
        return [
                GameConst.GameState.IDLE,
                GameConst.GameState.DRAW_CARD,
                GameConst.GameState.BETTING,
                GameConst.GameState.SHOW_CARD,
                GameConst.GameState.SETTLE,
            ]
    }

    generateCardMgr(): CardMgr {
        return new SSSCardMgr(this.gamberNum);
    }

    generateGamber() {
        return new SSSGamberModel();
    }

    getBrightCardNum(): number {
        return 13;
    }
}