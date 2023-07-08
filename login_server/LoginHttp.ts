import BaseHttp from "../base_net/BaseHttp";
import AllUserMgr from "../common/AllUserMgr";
import { GlobalConst } from "../common/GlobalConst";
import { ErrorCode } from "../game_server/ErrorCode";
import GameUtil from "../utils/GameUtil";
import LogUtil from "../utils/LogUtil";
const crypto = require('../utils/crypto');
const config = require('../common/config');
const http = require('../base_net/http');
const db = require('../utils/db');
const AliyunSmsUtil = require('./AliyunSmsUtil');

export default class LoginHttp extends BaseHttp {

    static _token_verify_config: { [key : string]: any };

    static phone_verify_codes: { [key : string]: any } = {};

    static get config_servers() {
        return config.servers.login_hall.servers;
    }

    static get token_verify_config() {
        if (this._token_verify_config == null) {
            this._token_verify_config = {};
            let sers = config.servers.center_login.servers;
            for(let i=0;i<sers.length;i++){
                let key = sers[i].index;
                let token = sers[i].token;
                this._token_verify_config[key] = token;
            }
        }
        return this._token_verify_config;
    }

    static token_verify(key: string, token: string) {
        if(this.token_verify_config[key] === token){
            return true;
        }
        return false;
    }

    static get_access_token(code: string, os: string, callback: Function){
        // @ts-ignore
        let info = GlobalConst.wxInfo[os];
        if(info == null){
            callback(false,null);
            return;
        }
        let data = {
            appid:info.appid,
            secret:info.secret,
            code:code,
            grant_type:"authorization_code"
        };
        http.get("https://api.weixin.qq.com/sns/oauth2/access_token", data, callback, true);
    }
    
    static get_state_info(access_token: string, openid: string, callback: Function){
        let data = {
            access_token: access_token,
            openid: openid
        };
        http.get("https://api.weixin.qq.com/sns/userinfo", data, callback, true);
    }

    static C_GetGuestToken(res: any, msg: any, req: any) {
        let account = msg.account.indexOf("guest_") == 0 ? msg.account : "guest_" + msg.account;
        let sign = crypto.hmac(account + req.ip);
        let area = msg.area;
        let data = {
            account:account,
            sign:sign
        }
        AllUserMgr.ins.createUser({account:account,area:area}, (ret: any) => {
            if(!ret) {
                this.sendError(res, ErrorCode.USER_CREATE_ERRPR);
            } else {
                this.send(res, data);
            }
        });
    }

    static C_PasswordLogin(res: any, msg: any, req: any) {
        let account = msg.account;
        let password = msg.password;
        let index = msg.index;
        let token = msg.token;``
        if(!this.token_verify(index, token)) {
            this.sendError(res, ErrorCode.LOGIN_VERIFY_FAIL);
            return;
        }
        db.is_user_exist(account, (ret: any) => {
            if(!ret){
                this.sendError(res, ErrorCode.UNEXIST_ACCOUNT);
                return;
            }    
            AllUserMgr.ins.loadUserByPassword(account, password, (errcode: ErrorCode, info: any) => {
                if (!GameUtil.isSuccessCode(errcode)) {
                    this.sendError(res, errcode);
                } else if (info.isBlack) {
                    this.sendError(res, ErrorCode.YOU_ARE_BLACK);
                } else {
                    let number = this.config_servers.length || 0;
                    let index2 = Math.floor(Math.random() * number);
                    let data = GameUtil.mergeDict({ server: this.config_servers[index2] }, info);
                    this.send(res, data);
                }
            });
        });
    }
    
    static C_GetWechatToken(res: any, msg: any, req: any) {
        let code = msg.code;
        let os = msg.os;
        if(code == null || code == "" || os == null || os == ""){
            this.sendError(res, ErrorCode.WECHAT_LOGIN_ARGUMENT_ERROR);
            return;
        }
        let area = msg.area;
        this.get_access_token(code, os, (suc: boolean, data: any) => {
            if (!suc || !data.access_token || !data.openid) {
                LogUtil.error("微信登录失败", data);
                this.sendError(res, ErrorCode.WECHAT_AUTHORIZE_FAIL);
                return;
            }
            LogUtil.debug("微信登录成功", data);
            let access_token = data.access_token;
            let openid = data.openid;
            this.get_state_info(access_token, openid, (suc2: boolean, wechatUser: any) => {
                if(!suc2){
                    LogUtil.debug("微信获取用户信息失败", wechatUser);
                    this.sendError(res, ErrorCode.WECHAT_USERINFO_FAIL);
                    return;
                }
                LogUtil.debug("微信获取用户信息成功", wechatUser);
                let openid = wechatUser.openid;
                let nickname = wechatUser.nickname;
                let sex = wechatUser.sex;
                let headimgurl = wechatUser.headimgurl;
                let account = "wx_" + openid;
                AllUserMgr.ins.createUser({account:account,userName:nickname,sex:sex,headImg:headimgurl,area:area}, (ret: any) => {
                    if(!ret){
                        LogUtil.debug("用户创建失败", data);
                        this.sendError(res, ErrorCode.USER_CREATE_ERRPR);
                    } else {
                        let data = {
                            account:account,
                            sign:crypto.hmac(account + req.ip),
                        };
                        LogUtil.debug("发送微信数据", data);
                        this.send(res, data);
                    }
                });
            });
        });
    }

    static C_GuestLogin(res: any, msg: any, req: any) {
        this.C_WechatLogin(res, msg, req);
    }
    
    static C_WechatLogin(res: any, msg: any, req: any) {
        let index = msg.index;
        let token = msg.token;
        let account =  msg.account;
        let sign = msg.sign;

        if(!this.token_verify(index, token)){
            this.sendError(res, ErrorCode.LOGIN_VERIFY_FAIL);
            return;
        }
        AllUserMgr.ins.loadUserByAccount(account, (errcode: ErrorCode, info: any) => {
            if (!GameUtil.isSuccessCode(errcode)) {
                this.sendError(res, errcode);
            } else if (info.isBlack) {
                this.sendError(res, ErrorCode.YOU_ARE_BLACK);
            } else {
                let data = GameUtil.mergeDict({ server: this.config_servers }, info);
                this.send(res, data);
            }
        });
    }

    static add_phone_verify(key: string, verifyCode: string) {
        this.phone_verify_codes[key] = verifyCode;
        setTimeout(() => {
            delete this.phone_verify_codes[key];
        }, 5*60*1000);
    }
    static phone_verify(key: string, verifyCode: string) {
        return this.phone_verify_codes[key] == verifyCode;
    }

    static C_GetPhoneToken(res: any, query: any, req: any) {
        var account = "user_" + query.account;
        var verifyCode = GameUtil.getRandomNumbers(6);
        var sign = crypto.hmac(account + req.ip);
        var area = query.area;
        var data = {
            account:account,
            sign:sign
        }
        
        this.add_phone_verify(account, verifyCode);
        var smsData = {code:verifyCode, phone:query.account};
        AliyunSmsUtil.sendMessage(smsData, (err: any, msg: any) => {
            if (err) {
                LogUtil.error("发送短信出错", err);
                this.sendError(res, ErrorCode.SEND_SMS_ERROR);
            } else {
                AllUserMgr.ins.createUser({account:account,area:area}, (ret: any) => {
                    if(!ret){
                        this.sendError(res, ErrorCode.USER_CREATE_ERRPR);
                    } else {
                        this.send(res, data);
                    }
                });
            }
        })
    }
    static C_PhoneLogin(res: any, msg: any, req: any) {
        var account = "user_" + msg.account;
        var verifyCode = msg.verifyCode;
        let index = msg.index;
        let token = msg.token;

        if (!this.phone_verify(account, verifyCode)) {
            this.sendError(res, ErrorCode.SMS_CODE_ERROR);
            return;
        }
        if(!this.token_verify(index,token)){
            this.sendError(res, ErrorCode.LOGIN_VERIFY_FAIL);
            return;
        }
        db.is_user_exist(account,(ret: any)=>{
            if(!ret){
                this.sendError(res, ErrorCode.UNEXIST_USER);
                return;
            }

            AllUserMgr.ins.loadUserByAccount(account, (errcode: ErrorCode, info: any) => {
                if (!GameUtil.isSuccessCode(errcode)) {
                    this.sendError(res, errcode);
                } else if (info.isBlack) {
                    this.sendError(res, ErrorCode.YOU_ARE_BLACK);
                } else {
                    let data = GameUtil.mergeDict({ server: this.config_servers }, info);
                    this.send(res, data);
                }
            });
            
        });
    }
}