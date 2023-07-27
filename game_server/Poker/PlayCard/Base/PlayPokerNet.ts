import { NetDefine } from "../../../../base_net/NetDefine";
import GameNet from "../../../Game/GameNet";


export default class PlayPokerNet extends GameNet {

    G_EatPoint(userId: string, changePoint: number, finalPoint: number, syncUserId?: string) {
        let data = { userId: userId, changePoint: changePoint, finalPoint: finalPoint };
        this.send(NetDefine.WS_Resp.G_EatPoint, data, syncUserId);
    }
}