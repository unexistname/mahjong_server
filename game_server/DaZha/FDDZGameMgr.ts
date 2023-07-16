import { ConditionFilter } from "../../utils/ConditionFilter";
import GameUtil from "../../utils/GameUtil";
import { ErrorCode } from "../ErrorCode";
import CardMgr from "../Game/CardMgr";
import GamberModel from "../Game/GamberModel";
import GameMgr from "../Game/GameMgr";
import PlayCardOperate from "../Game/PlayCardOperate";
import { GameConst } from "../GameConst";
import FDDZCardMgr from "./FDDZCardMgr";
import FDDZCardPointMgr, { CARD_TYPE } from "./FDDZCardPointMgr";
import FDDZNet from "./FDDZNet";


export default class FDDZGameMgr extends GameMgr {

    bankerFriend: GamberModel;
    friendCard: number;
    net:  FDDZNet;
    lastPlayGamber: GamberModel | null;
    folds: number[] = [];
    fundPool: number = 0;
    winner: GamberModel;
    sortCard: boolean = true;

    StateOver_idle(...args: any): void {
        this.updateGameState(GameConst.GameState.DECIDE_BANKER);
        this.State_decideBanker();
    }

    State_decideBanker() {
        let bankerIndex = GameUtil.random(this.gamberNum - 1);
        this.banker = this.gambers[bankerIndex];
        const cardHeap = this.cardMgr.cardHeap;
        let index = GameUtil.random(cardHeap.length - 1);
        this.friendCard = cardHeap[index];
        this.net.G_FriendCard(this.friendCard);
        this.net.G_DecideBanker(this.banker.userId, this.getGamberIds());
        this.nextState();
    }

    StateOver_drawCard(...args: any): void {
        for (let gamber of this.gambers) {  
            if (gamber == this.banker) {
                continue;
            }
            if (gamber.hasCard(this.friendCard)) {
                this.bankerFriend = gamber;
                break;
            }
        }
        if (this.bankerFriend == null) {
            let friendIndex = (this.banker.seatIndex + 2) % this.gamberNum;
            this.bankerFriend = this.gambers[friendIndex];
        }
        if (Math.abs(this.bankerFriend.seatIndex - this.banker.seatIndex) != 2) {
            let oppositeSeatIndex = (this.banker.seatIndex + 2) % this.gamberNum;
            let oppositeGamber = this.gambers[oppositeSeatIndex];
            this.room.swapGamberSeat(this.bankerFriend.userId, oppositeGamber.userId);
        }
        this.net.G_Friend(this.banker.userId, this.bankerFriend.userId);
        this.updateGameState(GameConst.GameState.BETTING);

        this.State_betting(this.banker);
    }

    State_betting(gamber?: GamberModel) {
        this.turnGamber = gamber || this.getNextGamber(this.turnGamber);
        if (this.lastPlayGamber == this.turnGamber) {
            setTimeout(() => {
                if (this.lastPlayGamber == null) {
                    return;
                }
                this.lastPlayGamber.scoreBetting += this.fundPool;
                this.net.G_EatPoint(this.lastPlayGamber.userId, this.fundPool, this.lastPlayGamber.scoreBetting);
                this.fundPool = 0;
                this.lastPlayGamber = null;
                this.betting();
            }, 2000);
        } else {
            this.betting();
        }
    }

    betting() {
        if (this.turnGamber.holds.length <= 0) {
            this.nextState();
            return;
        }
        let op = this.getOptionalOperate(this.turnGamber);
        this.net.G_TurnBetting(this.turnGamber.userId, op);
        if (this.waiveWhenTimeout) {
            this.beginTimer(GameConst.GameTime.BETTING, () => {
                if (this.lastPlayGamber == null) {
                    this.C_PlayCard(this.turnGamber, [this.turnGamber.holds[this.turnGamber.holds.length - 1]]);
                } else {
                    this.C_Waive(this.turnGamber);
                }
            });
        }
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.YOU_DONT_HAVE_CARDS)
    C_PlayCard(gamber: GamberModel, cards: number[]) {
        let cardType = FDDZCardPointMgr.getCardType(cards);
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
            if (!FDDZCardPointMgr.isBetter(this.folds, cards)) {
                return ErrorCode.YOU_CARD_IS_SMALL;
            }
        }
        if (cardType == CARD_TYPE.BOMB) {
            let score = FDDZCardPointMgr.getBonusFactor(cards) * this.roomConf.baseScore;
            if (score > 0) {
                for (let otherGamber of this.gambers) {
                    if (otherGamber == gamber) {
                        continue;
                    }
                    otherGamber.score -= score;
                    gamber.score += score;
                }
            }
        }
        gamber.discards(cards);
        gamber.cardType = cardType;
        this.cardMgr.sortCard(gamber.holds);
        this.folds = cards;
        this.fundPool += FDDZCardPointMgr.getFoldPoint(cards);
        this.lastPlayGamber = gamber;
        this.net.G_Fold(gamber.userId, this.folds, cardType);
        this.notifyOperate(gamber, PlayCardOperate.PLAY, cards);
        this.G_InitHolds();
        this.nextState();
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.BETTING)
    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, PlayCardOperate.WAIVE)
    C_Waive(gamber: GamberModel) {
        this.notifyOperate(gamber, PlayCardOperate.WAIVE);
        this.nextState();
    }

    getNextGamber(gamber: GamberModel) {
        let start = gamber.seatIndex + 1;
        let end = gamber.seatIndex + this.gamberNum;
        for (let i = start; i < end; ++i) {
            let index = i % this.gamberNum;
            if (this.gambers[index] == this.lastPlayGamber || this.gambers[index].holds.length > 0) {
                return this.gambers[index];
            }
        }
        return gamber;
    }

    isGameCanOver(gamber: GamberModel): boolean {
        let over = [];
        for (let gamber of this.gambers) {
            if (gamber.holds.length == 0) {
                over.push(gamber);
            }
        }
        if (over.length == 3) {
             return true;
        } else if (over.length == 2) {
            return this.isFriend(over[0], over[1]);
        }
        if (over.length == 1 && this.winner == null) {
            this.winner = over[0];
        }
        return false;
    }

    getFriend(gamber: GamberModel) {
        for (let otherGamber of this.gambers) {
            if (otherGamber == gamber) {
                continue;
            }
            if (this.isFriend(otherGamber, gamber)) {
                return otherGamber;
            }
        }
        return gamber;
    }

    settle(): void {
        this.winner.scoreBetting += this.fundPool;
        for (let gamber of this.gambers) {
            if (gamber.holds.length > 0) {
                this.winner.scoreBetting += FDDZCardPointMgr.getFoldPoint(gamber.holds);
            }
        }
        let friend = this.getFriend(this.winner);
        let betting = friend.scoreBetting + this.winner.scoreBetting;
        let score = this.roomConf.baseScore;
        if (betting >= 200) {
            score *= 2;
        } else if (betting < 100) {
            score *= -1;
        }
        this.changeGamberScore(this.winner, score, false);
        this.changeGamberScore(friend, score, false);
        for (let gamber of this.gambers) {
            if (gamber == this.winner || friend == gamber) {
                continue;
            }
            this.changeGamberScore(gamber, -score, false);
        }
    }

    getSettleExtraData(gamber: GamberModel) {
        return {
            point: gamber.scoreBetting,
        }
    }

    isFriend(gamber: GamberModel, gamber2: GamberModel) {
        if (gamber == this.banker || gamber2 == this.banker) {
            return gamber == this.bankerFriend || gamber2 == this.bankerFriend;
        } else {
            return gamber != this.bankerFriend && gamber2 != this.bankerFriend;
        }
    }

    reconnectOnBetting(userId: string, gamber: GamberModel) {
        super.reconnectOnBetting(userId, gamber);
    }

    reconnectOverDrawCard(userId: string) {
        this.net.G_FriendCard(this.friendCard, userId);
        this.net.G_Friend(this.banker.userId, this.bankerFriend.userId, userId);
        super.reconnectOverDrawCard(userId);
    }
    
    notifyOperate(gamber: GamberModel, operate: any, data: any = {}) {
        this.clearStateTimer();
        super.notifyOperate(gamber, operate, data);
    }

    getOptionalOperate(gamber: GamberModel) {
        if (this.lastPlayGamber == null) {
            return PlayCardOperate.PLAY;
        } else {
            return PlayCardOperate.PLAY | PlayCardOperate.WAIVE;
        }
    }

    getAllState() {
        return [GameConst.GameState.IDLE, GameConst.GameState.DECIDE_BANKER, GameConst.GameState.DRAW_CARD, GameConst.GameState.BETTING, GameConst.GameState.SHOW_CARD, GameConst.GameState.SETTLE];
    }

    getBrightCardNum(): number {
        return 27;
    }

    generateCardMgr(): CardMgr {
        return new FDDZCardMgr();
    }
}