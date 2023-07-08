import { IncomingMessage } from "http";
import LogUtil from "../utils/LogUtil";
import { NetDefine } from "../base_net/NetDefine";
import AllRoomMgr from "./Room/AllRoomMgr";
import AllUserMgr from "../common/AllUserMgr";
import NetUtil from "../base_net/NetUtil";
import GameSocket from "./GameSocket";
import BaseServer from "../base_net/BaseServer";
import RoomMetaConfMgr from "./Room/RoomMetaConfMgr";
import PropMgr from "../common/PropMgr";
import RoomNet from "./Room/RoomNet";


export default class GameServer extends BaseServer {

    initServer(): void {
        super.initServer();
        RoomMetaConfMgr.ins.loadAllMetaConf();
        PropMgr.ins.loadAllProp();
    }

    getPort() {
        return 9001;
    }

    onWSMessage(ws: any, req: IncomingMessage, message: any) {
        let ip = req.connection.remoteAddress;
        if(message.cmd == NetDefine.NetType.CONNECT) {
            ws.userId = message.userId;
            ws.netType = NetDefine.NetType.GAME_SOCKET;

            console.log("[GameServer] " + ws.userId + " online");

            let room = AllRoomMgr.ins.getRoomByUserId(ws.userId);
            if (room == null) {
                RoomNet.G_LeaveRoom(ws.userId);
                LogUtil.debug(`[GameServer] ${ws.userId} not in room`);
                // ws.close();
                return;
            }

            ws.ip = ip;
            NetUtil.bind(ws.userId, ws);;
            AllUserMgr.ins.online(ws.userId);
        } else {
            GameSocket.onMessage(ws, message.cmd, message.msg);
        }
    }

    onWSClose(ws: any, code: number, reason: any) {
        if (ws.userId != null) {
            let userId = ws.userId;
            NetUtil.clear(userId);
            AllUserMgr.ins.offline(userId);
            LogUtil.debug(`[GameServer] ${ws.userId} offline ${reason}`);
        }
        if(code != 1000) {
            // LogUtil.debug("gameServer: code != 1000 || ws.userId == null", code);
            return;
        }
        // LogUtil.debug("ws.userId",ws.userId,code, reason);
    }

}