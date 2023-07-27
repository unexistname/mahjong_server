import { NetDefine } from "../../../../../base_net/NetDefine";
import NetUtil from "../../../../../base_net/NetUtil";
import GameNet from "../../../../Game/GameNet";


export default class DZNet extends GameNet {

    G_CommonHolds(commonHolds: number[]) {
        let data = {commonHolds: commonHolds};
        NetUtil.roomBroadcast(this.roomId, NetDefine.WS_Resp.G_CommonHolds, data);
    }
}