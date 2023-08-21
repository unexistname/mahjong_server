import { ConditionFilter } from "../../../../utils/ConditionFilter";
import GameUtil from "../../../../utils/GameUtil";
import { ErrorCode } from "../../../ErrorCode";
import GamberModel from "../../../Game/GamberModel";
import GameMgr from "../../../Game/GameMgr";
import { GameConst } from "../../../GameConst";
import PlayPokerCardPointMgr, { CARD_TYPE } from "./PlayPokerCardPointMgr";
import { PlayPokerFoldType } from "./PlayPokerFoldType";
import PlayPokerGamberModel from "./PlayPokerGamberModel";
import PlayPokerNet from "./PlayPokerNet";
import PlayPokerOperate from "./PlayPokerOperate";

/**
 * 出牌类型的扑克游戏
 */
export default class PlayPokerGameMgr extends GameMgr {

    net: PlayPokerNet;
    banker: PlayPokerGamberModel;
    turnGamber: PlayPokerGamberModel;
    gambers: PlayPokerGamberModel[];
    lastPlayGamber: PlayPokerGamberModel | null;
    folds: number[] = [];
    foldPointCards: number[] = [];
    sortCard: boolean = true;

    isHaveBombBonus: boolean = false;
    isEatPointMode: boolean = false;

    StateOver_idle(...args: any): void {
        this.updateGameState(GameConst.GameState.DECIDE_BANKER);
        this.State_decideBanker();
    }

    StateOver_drawCard(...args: any): void {
        if (this.banker == null) {
            let index = GameUtil.random(this.gamberNum - 1);
            this.banker = this.gambers[index];
        }

        this.net.G_DecideBanker(this.banker.userId, []);

        this.updateGameState(GameConst.GameState.BETTING);
        this.State_betting(this.banker);
    }

    State_betting(gamber?: PlayPokerGamberModel | undefined): void {
        this.turnGamber = gamber || <PlayPokerGamberModel>this.getNextGamber(this.turnGamber);
        if (this.lastPlayGamber == this.turnGamber) {
            for (let gamber of this.gambers) {
                gamber.folds = [];
                gamber.foldType = PlayPokerFoldType.NONE
                this.net.G_PokerFold(gamber.userId, gamber.foldType);
            }
            if (this.isEatPointMode) {
                setTimeout(() => {
                    if (this.lastPlayGamber == null) {
                        return;
                    }
                    this.lastPlayGamber.scorePoint += this.fundPool;
                    if (this.isEatPointMode) {
                        this.lastPlayGamber.pointCards = GameUtil.mergeList(this.lastPlayGamber.pointCards, this.foldPointCards);
                        this.net.G_EatPoint(this.lastPlayGamber.userId, this.fundPool, this.lastPlayGamber.scorePoint, this.lastPlayGamber.pointCards);
                        this.fundPool = 0;
                        this.foldPointCards = [];
                        this.net.G_FoldPointCard(0, []);
                    }
                    this.lastPlayGamber = null;
                    this.turnPlayCard();
                }, 2000);
            } else {
                this.lastPlayGamber = null;
                this.turnPlayCard();
            }
        } else {
            this.turnPlayCard();
        }
    }

    turnPlayCard() {
        if (this.turnGamber.holds.length <= 0) {
            this.nextState();
            return;
        }
        let op = this.getOptionalOperate(this.turnGamber);
        this.net.G_TurnBetting(this.turnGamber.userId, op);

        if (this.waiveWhenTimeout) {
            this.beginTimer(GameConst.GameTime.BETTING, () => {
                this.doTimeoutOperate();
            });
        }
    }

    doTimeoutOperate() {
        if (this.lastPlayGamber == null) {
            this.C_PlayCard(this.turnGamber, [this.turnGamber.holds[this.turnGamber.holds.length - 1]]);
        } else {
            this.C_Waive(this.turnGamber);
        }
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.YOU_DONT_HAVE_CARDS)
    C_PlayCard(gamber: PlayPokerGamberModel, indexs: number[]) {
        let cards = gamber.getHoldsByIndexs(indexs);
        let cardType = this.getCardPointMgr().getCardType(cards);
        if (cardType == CARD_TYPE.NONE) {
            return ErrorCode.CARD_TYPE_ERROR;
        }
        if (this.lastPlayGamber != null) {
            if (cardType != CARD_TYPE.BOMB) {
                if (cardType != this.lastPlayGamber.cardType) {
                    return ErrorCode.CARD_TYPE_DIFFERENT;
                }
                if (cards.length != this.folds.length) {
                    return ErrorCode.CARD_TYPE_DIFFERENT;
                }
            }
            if (!this.getCardPointMgr().isBetter(this.folds, cards)) {
                return ErrorCode.YOU_CARD_IS_SMALL;
            }
        }
        if (this.isHaveBombBonus && cardType == CARD_TYPE.BOMB) {
            this.refshBombBonus(gamber, cards);
        }
        gamber.discards(cards);
        gamber.cardType = cardType;
        gamber.folds = cards;
        gamber.foldType = PlayPokerFoldType.PLAY;
        this.folds = cards;
        this.lastPlayGamber = gamber;
        if (this.isEatPointMode) {
            this.fundPool += this.getCardPointMgr().getFoldPoint(this.folds);
            this.foldPointCards = GameUtil.mergeList(this.foldPointCards, this.getCardPointMgr().getFoldPointCard(this.folds));
            this.net.G_FoldPointCard(this.fundPool, this.foldPointCards);
        }
        this.net.G_PokerFold(gamber.userId, gamber.foldType, this.folds, cardType);
        this.notifyOperate(gamber, PlayPokerOperate.PLAY, cards);
        this.G_InitHolds();
        this.nextState();
    }
    
    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, PlayPokerOperate.TIP)
    C_TipCard(gamber: PlayPokerGamberModel, indexs: number[]) {
        let tipCard;
        let cards = gamber.getHoldsByIndexs(indexs);
        if (this.folds && this.folds.length > 0) {
            if (cards && cards.length > 0 && this.getCardPointMgr().isBetter(this.folds, cards)) {
                tipCard = this.getCardPointMgr().getTipHold(cards, gamber.holds);
            }
            if (!tipCard) {
                tipCard = this.getCardPointMgr().getTipHold(this.folds, gamber.holds) || [];
            }
            this.net.G_TipCard(gamber.userId, tipCard);
        } else {
            let legalTypes = this.getCardPointMgr().getLegalCardTypes();
            let tipType = this.getCardPointMgr().getCardType(cards);
            let index = 0;
            if (tipType == CARD_TYPE.NONE) {
                tipType = CARD_TYPE.SINGLE;
                index = legalTypes.indexOf(tipType);
            } else {
                let index = legalTypes.indexOf(tipType);
                index = (index + 1) % legalTypes.length;
                tipType = legalTypes[index];
            }
            let tipCard;
            do {
                tipCard = this.getCardPointMgr().findCardByType(gamber.holds, tipType);
                index = (index + 1) % legalTypes.length;
                tipType = legalTypes[index];
            } while (!tipCard);
            this.net.G_TipCard(gamber.userId, tipCard);
        }
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.YOU_DONT_HAVE_CARDS)
    C_ArrangeCard(gamber: PlayPokerGamberModel, indexs: number[]) {
        let cards = [];
        indexs.sort((a, b) => b - a);
        for (let index of indexs) {
            cards.push(gamber.holds[index]);
            gamber.holds.splice(index, 1);
        }
        gamber.holds = cards.concat(gamber.holds);
        this.G_InitHolds(gamber.userId);
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    C_SortCard(gamber: PlayPokerGamberModel) {
        gamber.holds = this.getCardPointMgr().sortCard(gamber.holds);
        this.G_InitHolds(gamber.userId);
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    C_RestoreCard(gamber: PlayPokerGamberModel) {
        this.cardMgr.sortCard(gamber.holds);
        this.G_InitHolds(gamber.userId);
    }

    refshBombBonus(gamber: GamberModel, cards: number[]) {
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, PlayPokerOperate.WAIVE)
    C_Waive(gamber: PlayPokerGamberModel) {
        gamber.foldType = PlayPokerFoldType.WAIVE;
        this.net.G_PokerFold(gamber.userId, gamber.foldType);
        this.notifyOperate(gamber, PlayPokerOperate.WAIVE);
        this.nextState();
    }
    
    notifyOperate(gamber: GamberModel, operate: any, data: any = {}) {
        this.clearStateTimer();
        super.notifyOperate(gamber, operate, data);
    }

    reconnectOverDrawCard(userId: string) {
        super.reconnectOverDrawCard(userId);
        if (this.isEatPointMode) {
            for (let gamber of this.gambers) {
                this.net.G_EatPoint(gamber.userId, 0, gamber.scorePoint, gamber.pointCards, userId);
            }
            this.net.G_FoldPointCard(this.fundPool, this.foldPointCards, userId);
        }
        for (let gamber of this.gambers) {
            this.net.G_PokerFold(gamber.userId, gamber.foldType, gamber.folds, gamber.cardType, userId);
        }
    }

    reconnectOnBetting(userId: string, gamber?: GamberModel | undefined): void {
        super.reconnectOnBetting(userId, gamber);
        let op = this.getOptionalOperate(this.turnGamber);
        this.net.G_TurnBetting(this.turnGamber.userId, op, userId);
    }

    getOptionalOperate(gamber: GamberModel) {
        if (this.lastPlayGamber == null) {
            return PlayPokerOperate.PLAY;
        } else {
            return PlayPokerOperate.PLAY | PlayPokerOperate.WAIVE;
        }
    }

    isGameCanOver(gamber: GamberModel): boolean {
        for (let gamber of this.gambers) {
            if (gamber.holds.length == 0) {
                return true;
            }
        }
        return false;
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

    getCardPointMgr() {
        return PlayPokerCardPointMgr;
    }

    generateGamber(): GamberModel {
        return new PlayPokerGamberModel();
    }
}