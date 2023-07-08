import { NetDefine } from "../../base_net/NetDefine";
import NetUtil from "../../base_net/NetUtil";
import MJNet from "../Majhong/MJNet";


export default class FDNet extends MJNet {
    
    G_BaseHu(baseHu: number) {
        let data = { baseHu: baseHu };
        NetUtil.roomBroadcast(this.roomId, NetDefine.WS_Resp.G_BaseHu, data)
    }
}