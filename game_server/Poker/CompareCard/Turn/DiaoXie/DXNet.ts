
import { NetDefine } from "../../../../../base_net/NetDefine";
import GameNet from "../../../../Game/GameNet";
import NetUtil from "../../../../../base_net/NetUtil";

export default class DXNet extends GameNet {

    G_RubCard(userId: string, holds: number[]) {
        let data = {
            userId: userId,
            holds: holds,
        };
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_RubCard, data);
    }

    G_ShowTouch(userId: string, touchMin: number, touchMax: number) {
        let data = {
            touchMin: touchMin,
            touchMax: touchMax,
        }
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_ShowTouch, data);
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