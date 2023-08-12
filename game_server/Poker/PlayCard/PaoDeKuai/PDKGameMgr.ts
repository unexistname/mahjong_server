import GameUtil from "../../../../utils/GameUtil";
import CardMgr from "../../../Game/CardMgr";
import GamberModel from "../../../Game/GamberModel";
import { GameConst } from "../../../GameConst";
import { PokerCardDecor } from "../../Base/PokerCardDecor";
import PokerCardPointMgr from "../../Base/PokerCardPointMgr";
import PlayPokerGameMgr from "../Base/PlayPokerGameMgr";
import PlayPokerOperate from "../Base/PlayPokerOperate";
import PDKCardMgr from "./PDKCardMgr";
import PDKCardPointMgr from "./PDKCardPointMgr";


export default class PDKGameMgr extends PlayPokerGameMgr {

    folds: number[] = [];
    sortCard: boolean = true;

    saveGameLeftData(data: any = {}) {
        data.winnerId = this.winnerId;
        super.saveGameLeftData(data);
    }

    setGameInitData(data: any) {
        this.winnerId = data.winnerId;        
    }

    StateOver_idle(...args: any): void {
        this.updateGameState(GameConst.GameState.DRAW_CARD);
        this.State_drawCard();
    }

    StateOver_drawCard(...args: any): void {
        if (this.winnerId) {
            for (let gamber of this.gambers) {
                if (gamber.userId == this.winnerId) {
                    this.banker = gamber;
                    return;
                }
            }
        }
        if (this.banker == null) {
            let bankerCard = PokerCardPointMgr.getCard(PokerCardDecor.SPADE, 3);
            for (let gamber of this.gambers) {
                if (gamber.hasCard(bankerCard)) {
                    this.banker = gamber;
                    break;
                }
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

    doTimeoutOperate() {
        if (this.lastPlayGamber == null) {
            this.C_PlayCard(this.turnGamber, [this.turnGamber.holds[this.turnGamber.holds.length - 1]]);
        } else {
            let cards = this.getCardPointMgr().getTipHold(this.folds, this.turnGamber.holds);
            if (cards && cards.length > 0) {
                this.C_PlayCard(this.turnGamber, cards);
            } else {
                this.C_Waive(this.turnGamber);
            }
        }
    }

    getOptionalOperate(gamber: GamberModel) {
        let op = 0;
        if (this.lastPlayGamber != null) {
            let cards = this.getCardPointMgr().getTipHold(this.folds, gamber.holds);
            if (cards && cards.length > 0) {
                op |= PlayPokerOperate.PLAY;
            } else {
                op |= PlayPokerOperate.WAIVE;
            }
        } else {
            op |= PlayPokerOperate.PLAY;
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
            this.winnerId = winner.userId;
        }
    }

    getCardPointMgr() {
        return PDKCardPointMgr;
    }

    generateCardMgr(): CardMgr {
        return new PDKCardMgr(this.gamberNum);
    }

    getBrightCardNum(): number {
        return this.gamberNum == 4 ? 13 : 16;
    }
}