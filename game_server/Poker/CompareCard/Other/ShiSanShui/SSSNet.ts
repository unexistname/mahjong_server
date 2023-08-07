import { NetDefine } from "../../../../../base_net/NetDefine";
import NetUtil from "../../../../../base_net/NetUtil";
import GameNet from "../../../../Game/GameNet";


export default class SSSNet extends GameNet {
    G_Special(userId: string, cardType: number) {
        let data = { cardType: cardType };
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_Special, data);
    }

    G_Combine(userId: string, combineCards: number[][] | number[], cardType?: number) {
        let data = { userId: userId, combineCards: combineCards };
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_Combine, data);
    }

    G_OptionalCard(userId: string, data: any) {
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_OptionalCard, data);
    }
}