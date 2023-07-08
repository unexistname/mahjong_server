import { NetDefine } from "./NetDefine";


const crypto = require('../utils/crypto');

export default class BaseEncry {
    
    static decryMsg(cmd: NetDefine.WS_Req, msg: any) {
        let funcName = NetDefine.WS_Req[cmd];
        this.dealMsg(funcName, msg);
    }

    static encryMsg(cmd: NetDefine.WS_Resp, msg: any) {
        let funcName = NetDefine.WS_Resp[cmd];
        this.dealMsg(funcName, msg);
    }

    static encode(data: any) {
        return crypto.toBase64(data);
    }

    static decode(data: any) {
        return crypto.fromBase64(data);
    }

    static dealMsg(funcName: string, msg: any) {
        if (this.hasOwnProperty(funcName)) {
            let funcMeta = <Function>Reflect.getOwnPropertyDescriptor(this, funcName);
            //@ts-ignore
            let func = funcMeta.value;
            msg = func.call(this, msg);
        }
        return msg;
    }
}