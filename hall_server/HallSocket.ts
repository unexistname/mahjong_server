import AllUserMgr from "../common/AllUserMgr";
import BaseSocket from "../base_net/BaseSocket";
import NetUtil from "../base_net/NetUtil";
import AllRoomMgr from "../game_server/Room/AllRoomMgr";
import { NetDefine } from "../base_net/NetDefine";
import GameUtil from "../utils/GameUtil";
import HallEncry from "./HallEncry";
import HallDto from "./HallDto";
import RecordMgr from "../game_server/Record/RecordMgr";


export default class HallSocket extends BaseSocket {

    static C_ShowCreateRoom(ws: any, msg: any) {
        let roomConfs = HallDto.getAllMetaConfDto();
        this.send(ws, NetDefine.WS_Resp.G_ShowCreateRoom, roomConfs);
    }

    static C_CreateRoom(ws: any, msg: any) {
        let code = AllRoomMgr.ins.C_CreateRoom(ws.userId, msg);
        if (GameUtil.isSuccessCode(code)) {
            let data = HallDto.getRoomDto(ws.userId);
            this.send(ws, NetDefine.WS_Resp.G_EnterRoom, data);
        }
        return code;
    }

    static C_EnterRoom(ws: any, msg: any) {
        let code = AllRoomMgr.ins.C_EnterRoom(ws.userId, msg.roomId);
        if (GameUtil.isSuccessCode(code)) {
            let data = HallDto.getRoomDto(ws.userId);
            this.send(ws, NetDefine.WS_Resp.G_EnterRoom, data);
        }
        return code;
    }

    static C_EnterHall(ws: any, msg: any) {
        let rooms = AllRoomMgr.ins.getAllPublicRoom();
        AllUserMgr.ins.enterHall(ws.userId);
        // TODO: 转为DTO
        this.send(ws, NetDefine.WS_Resp.G_EnterHall, rooms);
    }

    static C_LeaveHall(ws: any, msg: any) {
        AllUserMgr.ins.leaveHall(ws.userId);
        this.send(ws, NetDefine.WS_Resp.G_LeaveHall);
    }

    static C_ShowRecord(ws: any, msg: any) {
        RecordMgr.ins.C_ShowRecord(ws.userId);
    }

    static broadcast(cmd: NetDefine.WS_Resp, msg: any = {}) {
        let userIds = AllUserMgr.ins.getHallUserIds();
        for (let userId of userIds) {
            let ws = NetUtil.getSocketByUserId(userId);
            this.send(ws, cmd, msg);
        }
    }

    static getNetType() {
        return NetDefine.NetType.GAME_SOCKET;
    }

    static getEncryTool() {
        return HallEncry;
    }
}