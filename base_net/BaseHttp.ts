import { ErrorCode, ErrorMsg } from "../game_server/ErrorCode";
import GameUtil from "../utils/GameUtil";
import LogUtil from "../utils/LogUtil";
import { NetDefine } from "./NetDefine";
import { GlobalConst } from "../common/GlobalConst";

const http = require('../base_net/http');


export default class BaseHttp {
    
    static onMessage(req: any, res: any, cmd: NetDefine.HTTP_Get | NetDefine.HTTP_Post, msg: any) {
        let isPost = false;
        let funcName = GameUtil.getEnumKeyByEnumValue(NetDefine.HTTP_Get, cmd);
        if (!funcName) {
            funcName = GameUtil.getEnumKeyByEnumValue(NetDefine.HTTP_Post, cmd);
            if (!funcName) {
                return;
            }
            isPost = true;
        }
        LogUtil.debug("[Http Request]:", funcName);
        if (this.hasOwnProperty(funcName)) {
            let funcMeta = <Function>Reflect.getOwnPropertyDescriptor(this, funcName);
            //@ts-ignore
            let func = funcMeta.value;
            if (isPost) {
                this.dealPostFunc(req, (data: any) => {
                    let code = func.call(this, res, data, req);
                    LogUtil.debug("[Http Post result]:", code);
                    if (!GameUtil.isSuccessCode(code)) {
                        this.sendError(res, code);
                    }
                });
            } else {
                let code = func.call(this, res, msg, req);
                LogUtil.debug("[Http Get result]:", code);
                if (!GameUtil.isSuccessCode(code)) {
                    this.sendError(res, code);
                }
            }
        } else {
            LogUtil.warn(`[${this.constructor.name} onMessage] unknown cmd: ${cmd}, msg: ${msg}, func: ${funcName}`);
        }
    }

    static dealPostFunc(req: any, callback: Function) {
        let buffer = "";
        req.on("data", (chunk: any) => {
            buffer += chunk;
        });
        req.on("end", () => {
            try {
                let postData = JSON.parse(buffer);
                callback(postData);
            } catch (e: any) {
                LogUtil.error(`[Deal Post Func Fail] ${e.message}`);
            }
        })
    }

    static sendError(res: any, errorCode: ErrorCode, data?: any) {
        LogUtil.error("错误码:", errorCode, "错误信息:", ErrorMsg[errorCode]);
        http.send(res, errorCode, data || { showType:  GlobalConst.ShowType.TIPS});
    }

    static send(res: any, data: any = {}) {
        http.send(res, ErrorCode.SUCCESS, data);
    }
}