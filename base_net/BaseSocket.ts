import GameUtil from "../utils/GameUtil";
import LogUtil from "../utils/LogUtil";
import BaseEncry from "./BaseEncry";
import { NetDefine } from "./NetDefine";

const socket = require('../base_net/socket');

export default class BaseSocket {

    static onMessage(ws: any, cmd: NetDefine.WS_Req, msg: any) {
        if (ws.userId == null) {
            return;
        }
        let funcName = NetDefine.WS_Req[cmd];
        if (this.hasOwnProperty(funcName)) {
            this.getEncryTool().decryMsg(cmd, msg);
            let funcMeta = <Function>Reflect.getOwnPropertyDescriptor(this, funcName);
            //@ts-ignore
            let func = funcMeta.value;
            LogUtil.debug(`[${this.constructor.name} onMessage] cmd: ${funcName}, user: ${ws.userId}, msg: ${JSON.stringify(msg)}` );
            let code = func.call(this, ws, msg);
            if (!GameUtil.isSuccessCode(code)) {
                this.sendError(ws, code);
            }
        } else {
            LogUtil.warn(`[${this.constructor.name} onMessage] unknown cmd: ${cmd}, msg: ${msg}`);
        }
    }

    static sendError(ws: any, errorCode: any) {
        this.send(ws, NetDefine.WS_Resp.G_Error, errorCode);
    }

    static send(ws: any, cmd: NetDefine.WS_Resp, msg: any = {}) {
        this.getEncryTool().encryMsg(cmd, msg);
        let data = { cmd: cmd, result: msg };
        socket.send(ws, this.getNetType(), data);
    }

    static isHeartBeatCmd(cmd: any) {
        return cmd == "ping";
    }

    static isConnectCmd(cmd: any) {
        return cmd == "connect";
    }

    static heartBeat(ws: any) {
        socket.send(ws, NetDefine.NetType.HEART_BEAT, "pong");
    }

    static getNetType() {
        return NetDefine.NetType.GAME_SOCKET;
    }

    static getEncryTool() {
        return BaseEncry;
    }
}