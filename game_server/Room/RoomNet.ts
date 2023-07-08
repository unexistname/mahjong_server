import { NetDefine } from "../../base_net/NetDefine";
import NetUtil from "../../base_net/NetUtil";
import UserModel from "../../common/UserModel";
import AllRoomMgr from "./AllRoomMgr";


export default class RoomNet {
    static G_GamberInfo(userId: string, user: UserModel) {
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_GamberInfo, user);
    }

    static G_ShowProp(userId: string, props: {}) {
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_ShowProp, props);
    }

    static G_UseProp(userId: string, userId2: string, prop: any) {
        let room = AllRoomMgr.ins.getRoomByUserId(userId);
        if (!room) {
            return;
        }
        let data = { userId: userId, userId2: userId2, prop: prop };
        NetUtil.roomBroadcast(room.roomId, NetDefine.WS_Resp.G_UseProp, data);
    }

    static G_UpdateGem(userId: string, gem: number) {
        let data = { userId: userId, gem: gem };
        NetUtil.userBroadcast(NetDefine.WS_Resp.G_UpdateGem, data, userId, true);
    }

    static G_TransferGem(userId: string, userId2: string, gem: number) {
        let data = { userId: userId, userId2: userId2, gem: gem };
        NetUtil.userBroadcast(NetDefine.WS_Resp.G_TransferGem, data, userId, true);
    }

    static G_ShowRecord(userId: string, records: any) {
        let data = { records: records };
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_ShowRecord, data);
    }

    static G_LeaveRoom(userId: string) {
        let data = { userId: userId };
        NetUtil.userBroadcast(NetDefine.WS_Resp.G_LeaveRoom, data, userId, true);
    }
}