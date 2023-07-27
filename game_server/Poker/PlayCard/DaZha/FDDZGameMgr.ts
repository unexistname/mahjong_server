import GameUtil from "../../../../utils/GameUtil";
import CardMgr from "../../../Game/CardMgr";
import GamberModel from "../../../Game/GamberModel";
import { GameConst } from "../../../GameConst";
import FDDZCardMgr from "./FDDZCardMgr";
import FDDZCardPointMgr from "./FDDZCardPointMgr";
import FDDZNet from "./FDDZNet";
import PlayPokerGameMgr from "../Base/PlayPokerGameMgr";


export default class FDDZGameMgr extends PlayPokerGameMgr {

    bankerFriend: GamberModel;
    friendCard: number;
    net:  FDDZNet;
    lastPlayGamber: GamberModel | null;
    folds: number[] = [];
    fundPool: number = 0;
    winner: GamberModel;
    sortCard: boolean = true;
    isEatPointMode: boolean = true;

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
        let score = this.baseScore;
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

    refshBombBonus(gamber: GamberModel, cards: number[]) {
        let score = this.getCardPointMgr().getBonusFactor(cards) * this.baseScore;
        if (score > 0) {
            for (let otherGamber of this.gambers) {
                if (otherGamber == gamber) {
                    continue;
                }
                this.changeGamberScore(otherGamber, -score);
                this.changeGamberScore(gamber, score);
            }
        }
    }

    reconnectOverDrawCard(userId: string) {
        this.net.G_FriendCard(this.friendCard, userId);
        this.net.G_Friend(this.banker.userId, this.bankerFriend.userId, userId);
        super.reconnectOverDrawCard(userId);
    }
    
    getCardPointMgr() {
        return FDDZCardPointMgr;
    }

    getBrightCardNum(): number {
        return 27;
    }

    generateCardMgr(): CardMgr {
        return new FDDZCardMgr();
    }
}