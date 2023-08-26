import { NetDefine } from "../../../base_net/NetDefine";
import NetUtil from "../../../base_net/NetUtil";
import GameUtil from "../../../utils/GameUtil";
import GameNet from "../../Game/GameNet";
import MJOperate from "./MJOperate";


export default class MJNet extends GameNet {
    G_MJOperate(data: any) {
        let userId = data.userId;
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_MJOperate, data);
    }

    G_DrawCard(userId: string, pai: number) {
        let data = {userId: userId, pai: pai};
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_DrawCard, data);
        data.pai = -1;
        NetUtil.userBroadcast(NetDefine.WS_Resp.G_DrawCard, data, userId, false);
    }

    G_TurnPlayCard(userId: string, syncUserId?: string) {
        let data = { userId: userId };
        this.send(NetDefine.WS_Resp.G_TurnPlayCard, data, syncUserId);
    }

    G_Hun(hun: number, huns: number[], syncUserId?: string) {
        let data = { hun: hun, huns: huns };
        this.send(NetDefine.WS_Resp.G_Hun, data, syncUserId);
    }

    G_SyncCombines(userId: string, penggangs: number[], syncUserId?: string) {
        let penggangsBak = GameUtil.deepClone(penggangs);
        for (let penggang of penggangsBak) {
            if (penggang[0] == "angang") {
                penggang[1] = -1;
            }
        }
        let data = { userId: userId, penggangs: penggangsBak };
        this.send(NetDefine.WS_Resp.G_SyncCombines, data, syncUserId);
    }

    G_SyncHolds(userId: string, holds: number[], isDrawCard: boolean = false) {
        let data: any = {userId: userId, holds: holds};
        if (isDrawCard) {
            let clientHolds = GameUtil.deepClone(holds);
            let draw = clientHolds.splice(clientHolds.length - 1, 1)[0];
            data.holds = clientHolds;
            data.draw = draw;
        }
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_SyncHolds, data);
        let hideHolds = [];
        for (let hold of data.holds) {
            hideHolds.push(-1);
        }
        data.holds = hideHolds;
        if (isDrawCard) {
            data.draw = -1;
        }
        NetUtil.userBroadcast(NetDefine.WS_Resp.G_SyncHolds, data, userId, false);
    }

    G_DoOperate(userId: string, operate: any, value?: any, syncUserId?: string) {
        let data = {
            userId: userId,
            operate: operate,
        }
        if (value != null) {
            data = GameUtil.mergeDict(data, {value: value});
        }
        if (operate == MJOperate.GANG && value && value.gangtype == "angang") {
            this.send(NetDefine.WS_Resp.G_DoOperate, data, userId);
            let dataOther = GameUtil.deepClone(data);
            dataOther.value.pai = -1;
            if (!syncUserId) {
                NetUtil.userBroadcast(NetDefine.WS_Resp.G_DoOperate, data, userId, false);
            }
        } else if (operate == MJOperate.GUO) {
            this.send(NetDefine.WS_Resp.G_DoOperate, data, userId);
        } else {
            this.send(NetDefine.WS_Resp.G_DoOperate, data, syncUserId);
        }
    }
}