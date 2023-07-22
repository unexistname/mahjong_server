import { ConditionFilter } from "../../utils/ConditionFilter";
import GameUtil from "../../utils/GameUtil";
import { ErrorCode } from "../ErrorCode";
import CardMgr from "../Game/CardMgr";
import GamberModel from "../Game/GamberModel";
import GameMgr from "../Game/GameMgr";
import { GameConst } from "../GameConst";
import { PokerCardDecor } from "../Poker/PokerCardDecor";
import PokerCardPointMgr from "../Poker/PokerCardPointMgr";
import PDKCardMgr from "./PDKCardMgr";
import PDKCardPointMgr, { CARD_TYPE } from "./PDKCardPointMgr";
import PDKOperate from "./PDKOperate";


export default class PDKGameMgr extends GameMgr {

    lastPlayGamber: GamberModel | null;
    folds: number[] = [];
    fundPool: number;
    sortCard: boolean = true;

    StateOver_idle(...args: any): void {
        this.updateGameState(GameConst.GameState.DRAW_CARD);
        this.State_drawCard();
    }

    StateOver_drawCard(...args: any): void {
        let bankerCard = PokerCardPointMgr.getCard(PokerCardDecor.SPADE, 3);
        for (let gamber of this.gambers) {
            if (gamber.hasCard(bankerCard)) {
                this.banker = gamber;
                break;
            }
        }
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
            this.lastPlayGamber = null;
        }
        let op = this.getOptionalOperate(this.turnGamber);
        this.net.G_TurnBetting(this.turnGamber.userId, op);

        if (this.waiveWhenTimeout) {
            this.beginTimer(GameConst.GameTime.BETTING, () => {
                if (this.lastPlayGamber == null) {
                    this.C_PlayCard(this.turnGamber, [this.turnGamber.holds[0]]);
                } else {
                    let cards = PDKCardPointMgr.getHardEatHold(this.folds, this.turnGamber.holds);
                    if (cards && cards.length > 0) {
                        this.C_PlayCard(this.turnGamber, cards);
                    } else {
                        this.C_Waive(this.turnGamber);
                    }
                }
            });
        }
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.YOU_DONT_HAVE_CARDS)
    C_PlayCard(gamber: GamberModel, cards: number[]) {
        let cardType = PDKCardPointMgr.getCardType(cards);
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
            if (!PDKCardPointMgr.isBetter(this.folds, cards)) {
                return ErrorCode.YOU_CARD_IS_SMALL;
            }
        }
        gamber.discards(cards);
        gamber.cardType = cardType;
        this.cardMgr.sortCard(gamber.holds);
        this.folds = cards;
        this.lastPlayGamber = gamber;
        this.net.G_Fold(gamber.userId, this.folds, cardType);
        this.notifyOperate(gamber, PDKOperate.PLAY, cards);
        this.G_InitHolds();
        this.nextState();
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, PDKOperate.WAIVE)
    C_Waive(gamber: GamberModel) {
        this.notifyOperate(gamber, PDKOperate.WAIVE);
        this.nextState();
    }

    getOptionalOperate(gamber: GamberModel) {
        let op = 0;
        if (this.lastPlayGamber != null) {
            let cards = PDKCardPointMgr.getHardEatHold(this.folds, gamber.holds);
            if (cards && cards.length > 0) {
                op |= PDKOperate.PLAY;
            } else {
                op |= PDKOperate.WAIVE;
            }
        } else {
            op |= PDKOperate.PLAY;
        }
        return op;
    }

    isGameCanOver(gamber: GamberModel): boolean {
        for (let gamber of this.gambers) {
            if (gamber.holds.length == 0) {
                return true;
            }
        }
        return false;
    }

    settle(): void {
        let winner = null;
        let winScore = 0;
        for (let gamber of this.gambers) {
            if (gamber.holds.length == 0) {
                winner = gamber;
            } else {
                let score = gamber.holds.length;
                if (gamber.holds.length == this.getBrightCardNum()) {
                    score = 30;
                }
                winScore += score;
                this.changeGamberScore(gamber, -score);
            }
        }
        if (winner) {
            this.changeGamberScore(winner, winScore);
        }
    }

    generateCardMgr(): CardMgr {
        return new PDKCardMgr();
    }

    getBrightCardNum(): number {
        return 16;
    }
}