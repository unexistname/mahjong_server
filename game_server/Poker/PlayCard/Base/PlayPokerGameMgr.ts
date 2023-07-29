import { ConditionFilter } from "../../../../utils/ConditionFilter";
import GameUtil from "../../../../utils/GameUtil";
import { ErrorCode } from "../../../ErrorCode";
import GamberModel from "../../../Game/GamberModel";
import GameMgr from "../../../Game/GameMgr";
import { GameConst } from "../../../GameConst";
import PlayPokerCardPointMgr, { CARD_TYPE } from "./PlayPokerCardPointMgr";
import PlayPokerNet from "./PlayPokerNet";
import PlayPokerOperate from "./PlayPokerOperate";

/**
 * 出牌类型的扑克游戏
 */
export default class PlayPokerGameMgr extends GameMgr {

    net: PlayPokerNet;
    lastPlayGamber: GamberModel | null;
    folds: number[] = [];
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

    State_betting(gamber?: GamberModel | undefined): void {
        this.turnGamber = gamber || this.getNextGamber(this.turnGamber);
        if (this.lastPlayGamber == this.turnGamber) {
            if (this.isEatPointMode) {
                setTimeout(() => {
                    if (this.lastPlayGamber == null) {
                        return;
                    }
                    this.lastPlayGamber.scoreBetting += this.fundPool;
                    if (this.isEatPointMode) {
                        this.net.G_EatPoint(this.lastPlayGamber.userId, this.fundPool, this.lastPlayGamber.scoreBetting);
                        this.fundPool = 0;
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
    C_PlayCard(gamber: GamberModel, cards: number[]) {
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
        this.cardMgr.sortCard(gamber.holds);
        this.folds = cards;
        this.lastPlayGamber = gamber;
        if (this.isEatPointMode) {
            this.fundPool += this.getCardPointMgr().getFoldPoint(this.folds);
        }
        this.net.G_Fold(gamber.userId, this.folds, cardType);
        this.notifyOperate(gamber, PlayPokerOperate.PLAY, cards);
        this.G_InitHolds();
        this.nextState();
    }

    refshBombBonus(gamber: GamberModel, cards: number[]) {
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, PlayPokerOperate.WAIVE)
    C_Waive(gamber: GamberModel) {
        this.notifyOperate(gamber, PlayPokerOperate.WAIVE);
        this.nextState();
    }
    
    notifyOperate(gamber: GamberModel, operate: any, data: any = {}) {
        this.clearStateTimer();
        super.notifyOperate(gamber, operate, data);
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
}