import GameUtil from "../../../../utils/GameUtil";
import CardMgr from "../../../Game/CardMgr";
import GamberModel from "../../../Game/GamberModel";
import { GameConst } from "../../../GameConst";
import FDDZCardMgr from "./FDDZCardMgr";
import FDDZCardPointMgr from "./FDDZCardPointMgr";
import FDDZNet from "./FDDZNet";
import PlayPokerGameMgr from "../Base/PlayPokerGameMgr";
import PlayPokerGamberModel from "../Base/PlayPokerGamberModel";


export default class FDDZGameMgr extends PlayPokerGameMgr {

    bankerFriend: PlayPokerGamberModel;
    friendCard: number;
    net:  FDDZNet;
    folds: number[] = [];
    winner: PlayPokerGamberModel;
    sortCard: boolean = true;
    isEatPointMode: boolean = true;
    isHaveBombBonus: boolean = true;

    State_decideBanker() {
        const cardHeap = this.cardMgr.cardHeap;
        let index = GameUtil.random(cardHeap.length - 1);
        this.friendCard = cardHeap[index];
        this.net.G_FriendCard(this.friendCard);
        this.nextState();
    }

    StateOver_drawCard(...args: any): void {
        for (let gamber of this.gambers) {  
            if (gamber.hasCard(this.friendCard)) {
                if (this.banker == null) {
                    this.banker = gamber;
                } else {
                    this.bankerFriend = gamber;
                }
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
        this.net.G_DecideBanker(this.banker.userId, this.getGamberIds());
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

    getFriend(gamber: PlayPokerGamberModel) {
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
        let friend = this.getFriend(this.winner);
        this.winner.scorePoint += this.fundPool;
        let lostNum = 0;
        let loseEatPoint = 0;
        let eatPoint = friend.scorePoint + this.winner.scorePoint;
        for (let gamber of this.gambers) {
            if (gamber.holds.length > 0) {
                if (gamber != friend) {
                    // gamber.scorePoint = 0;
                    eatPoint += gamber.scorePoint;
                    // this.winner.scorePoint += gamber.scorePoint;// + FDDZCardPointMgr.getFoldPoint(gamber.holds);
                }
            }
            if (gamber != friend && gamber != this.winner) {
                if (gamber.holds.length <= 0) {
                    loseEatPoint += gamber.scorePoint;
                } else {
                    lostNum += 1;
                }
            }
        }
        let winnerScore = 0;
        if (eatPoint >= 200 || lostNum >= 2) {
            winnerScore = 2;
        } else if (eatPoint >= 100) {
            winnerScore = 1;
        }
        let loseScore = 0;
        if (loseEatPoint >= 200) {
            loseScore = 2;
        } else if (loseEatPoint > 100) {
            loseScore = 1;
        }

        let score = winnerScore - loseScore;
        for (let gamber of this.gambers) {
            let finalScore = gamber.scoreBonus;
            if (gamber == this.winner || friend == gamber) {
                finalScore += score;
            } else {
                finalScore -= score;
            }
            this.changeGamberScore(gamber, finalScore, false);
        }
    }

    getSettleExtraData(gamber: PlayPokerGamberModel) {
        return {
            point: gamber.scorePoint,
            bonus: gamber.scoreBonus,
        }
    }

    isFriend(gamber: GamberModel, gamber2: GamberModel) {
        if (gamber == this.banker || gamber2 == this.banker) {
            return gamber == this.bankerFriend || gamber2 == this.bankerFriend;
        } else {
            return gamber != this.bankerFriend && gamber2 != this.bankerFriend;
        }
    }

    refshBombBonus(gamber: PlayPokerGamberModel, cards: number[]) {
        let score = this.getCardPointMgr().getBonusFactor(cards);// * this.baseScore;
        if (score > 0) {
            for (let otherGamber of this.gambers) {
                if (otherGamber != gamber) {
                    otherGamber.scoreBonus -= score;
                    gamber.scoreBonus += score;
                    this.net.G_BombBonus(otherGamber.userId, otherGamber.scoreBonus);
                }
            }
            this.net.G_BombBonus(gamber.userId, gamber.scoreBonus);
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