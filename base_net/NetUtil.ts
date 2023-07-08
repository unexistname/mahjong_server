import { NetDefine } from "./NetDefine";
import AllRoomMgr from "../game_server/Room/AllRoomMgr";
import GameSocket from "../game_server/GameSocket";
import HallSocket from "../hall_server/HallSocket";
import LogUtil from "../utils/LogUtil";
import GameUtil from "../utils/GameUtil";

const WebSocket = require('ws');
const socket = require('./socket');


export default class NetUtil {    

    static sockets: { [key: string]: WebSocket } = {};

    static bind(userId: string, ws: WebSocket) {
        this.sockets[userId] = ws;
    }

    static clear(userId: string) {
        delete this.sockets[userId];
    }

    static getSocketByUserId(userId: string) {
        return this.sockets[userId];
    }

    static disconnect(userId: string) {
        let ws = this.sockets[userId];
        ws && ws.close();
        this.clear(userId);
    }

    static userBroadcast(cmd: NetDefine.WS_Resp, data: any, senderId: string, includSender: boolean = false) {
        let room = AllRoomMgr.ins.getRoomByUserId(senderId);
        if(room == null){
            if (includSender) {
                this.sendMsg(senderId, cmd, data);
            }
            LogUtil.error("[广播房间不存在]", senderId);
            return;
        }
        LogUtil.debug("[广播房间内用户列表]", room.getRoomUserIds(), senderId)
        for (let userId of room.getRoomUserIds()) {
            if (!includSender && userId == senderId) {
                continue;
            }
            this.sendMsg(userId, cmd, data);
        }
    }

    static roomBroadcast(roomId: string, cmd: NetDefine.WS_Resp, data?: any) {
        let room = AllRoomMgr.ins.getRoom(roomId);
        if(room == null){
            return;
        }
        for (let userId of room.getRoomUserIds()) {
            this.sendMsg(userId, cmd, data);
        }
    }

    static sendMsg(userId: string, cmd: NetDefine.WS_Resp, data: any = {}) {
        let ws = this.sockets[userId];
        if(ws != null && ws.readyState == 1) {
            // @ts-ignore
            let netType = ws.netType;
            let encodeData = GameUtil.deepClone(data);
            this.encodeMsg(netType, cmd, encodeData);
            LogUtil.debug("[服务端发送指令]", NetDefine.WS_Resp[cmd], userId, JSON.stringify(data));
            socket.send(ws, netType, {cmd: cmd, result: encodeData});
        }
    }

    static encodeMsg(netType: NetDefine.NetType, cmd: NetDefine.WS_Resp, data: any) {
        switch (netType) {
            case NetDefine.NetType.HALL_SOCKET:
                HallSocket.getEncryTool().encryMsg(cmd, data);;
            case NetDefine.NetType.GAME_SOCKET:
                GameSocket.getEncryTool().encryMsg(cmd, data);;
        }
        
    }
}