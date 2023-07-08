import { NetDefine } from "../../base_net/NetDefine";
import NetUtil from "../../base_net/NetUtil";
import GameNet from "../Game/GameNet";


export default class FDDZNet extends GameNet {
    G_FriendCard(card: number, syncUserId?: string) {
        let data = { card: card };
        this.send(NetDefine.WS_Resp.G_FriendCard, data, syncUserId);
    }

    G_Friend(userId: string, friendUserId: string, syncUserId?: string) {
        let data = { userId: userId, friendUserId: friendUserId };
        this.send(NetDefine.WS_Resp.G_Friend, data, syncUserId);
    }
}