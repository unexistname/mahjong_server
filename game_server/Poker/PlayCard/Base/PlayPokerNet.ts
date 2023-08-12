import { NetDefine } from "../../../../base_net/NetDefine";
import GameNet from "../../../Game/GameNet";
import { PlayPokerFoldType } from "./PlayPokerFoldType";


export default class PlayPokerNet extends GameNet {

    G_EatPoint(userId: string, changePoint: number, finalPoint: number, pointCards: number[], syncUserId?: string) {
        let data = { userId: userId, changePoint: changePoint, finalPoint: finalPoint, pointCards: pointCards };
        this.send(NetDefine.WS_Resp.G_EatPoint, data, syncUserId);
    }

    G_FoldPointCard(point: number, cards: number[], syncUserId?: string) {
        let data = { point: point, cards: cards };
        this.send(NetDefine.WS_Resp.G_FoldPointCard, data, syncUserId);
    }

    G_PokerFold(userId: string, foldType: PlayPokerFoldType, folds?: number[], cardType?: number, syncUserId?: string) {
        let data = { userId: userId, foldType: foldType, folds: folds, cardType: cardType };
        this.send(NetDefine.WS_Resp.G_PokerFold, data, syncUserId);
    }

    G_TipCard(userId: string, cards: number[]) {
        let data = { userId: userId, cards: cards };
        this.send(NetDefine.WS_Resp.G_TipCard, data);
    }

    G_BombBonus(userId: string, bonus: number) {
        let data = { userId: userId, bonus: bonus };
        this.send(NetDefine.WS_Resp.G_BombBonus, data);
    }
}