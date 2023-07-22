import { IncomingMessage } from "http";
import LogUtil from "../utils/LogUtil";
import { NetDefine } from "../base_net/NetDefine";
import HallSocket from "./HallSocket";
import NetUtil from "../base_net/NetUtil";
import HallHttp from "./HallHttp";
import BaseServer from "../base_net/BaseServer";


export default class HallServer extends BaseServer {

    getPort() {
        return 8003;
    }

    onHttpMessage(req: any, res: any, path: any, query: any) {
        HallHttp.onMessage(req, res, path, query);;
    }

    onWSMessage(ws: any, req: IncomingMessage, message: any) {
        if(message.cmd == NetDefine.NetType.CONNECT) {
            ws.userId = message.userId;
            ws.netType = NetDefine.NetType.HALL_SOCKET;
            LogUtil.debug("[HallServer] " + ws.userId + " online");
            NetUtil.bind(ws.userId, ws);
            // let room = AllRoomMgr.ins.getRoomByUserId(ws.userId);
            // if (room) {
            //     LogUtil.debug(`${ws.userId} 进入了房间 ${room.roomId}`);
            //     let msg = { roomId: room.roomId }
            //     HallSocket.C_EnterRoom(ws, msg);
            // }
            HallSocket.onMessage(ws, NetDefine.WS_Req.C_ShowCreateRoom, {});
        } else {
            HallSocket.onMessage(ws, message.cmd, message.msg);
        }
    }

    onWSClose(ws: any, code: number, reason: any) {
        if (ws.userId != null) {
            let userId = ws.userId;
            NetUtil.clear(userId);
            LogUtil.debug(`[HallServer] ${ws.userId} offline ${reason}`);
        }
        if(code != 1000) {
            // LogUtil.debug("[HallServer]: code != 1000 || ws.userId == null", code);
            return;
        }
        // LogUtil.debug("ws.userId",ws.userId,code, reason);
    }
}