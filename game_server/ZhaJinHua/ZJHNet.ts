import { NetDefine } from "../../base_net/NetDefine";
import NetUtil from "../../base_net/NetUtil";
import GameNet from "../Game/GameNet";


export default class ZJHNet extends GameNet {

    G_Eliminate(userId: string) {
        let data = { userId: userId };
        NetUtil.roomBroadcast(this.roomId, NetDefine.WS_Resp.G_Eliminate, data);
    }

    G_CompareSelect(userId: string, cmpUserIds: string[]) {
        let data = { userId: userId, cmpUserIds: cmpUserIds };
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_CompareSelect, data);
    }

    G_SeeCard(userId: string, holds: number[], cardType: any) {
        let data = {
            userId: userId,
            holds: holds,
            cardType: cardType,
        };
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_SeeCard, data);
    }
}