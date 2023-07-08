import NetUtil from "../base_net/NetUtil";
import { ErrorCode } from "../game_server/ErrorCode";
import LogUtil from "../utils/LogUtil";
import { NetDefine } from "../base_net/NetDefine";

const db = require('../utils/db');


export default class RechargeMgr {

    static recharges: { [ key: string ]: any};

    static getRecharge(rechargeId: string) {
        if (rechargeId) {
            return this.recharges[rechargeId];
        }
    }

    static isPriceCorrect(rechargeId: string, payMoney: number) {
        let recharge = this.getRecharge(rechargeId);
        if (recharge) {
            return Math.abs(recharge.cost - payMoney) < 1e-5;
        }
        return false;
    }

    static getAllRecharge() {
        return this.recharges;
    }

    static add_recharge(userId: string, rechargeId: string) {
        let recharge = this.getRecharge(rechargeId);
        if (recharge) {
            if (recharge.gain_type == 1) {
                this.add_gems(userId, recharge.gain_value);
            } else if (recharge.gain_type == 3) {
                this.add_coins(userId, recharge.gain_value);
            }
        } else {
            return ErrorCode.UNEXIST_SERIES;
        }
    }
    static add_gems(userId: string, gems: number) {
        db.add_gem({userId: userId, gem: gems}, (data: any) => {
            LogUtil.debug("更新钻石数目", userId);
            NetUtil.userBroadcast(NetDefine.WS_Resp.G_MoneyChange, {gems: data.gems}, userId, true);
        });
    }
    static add_coins(userId: string, coins: number) {
        db.cost_coins(userId, {area:"renheniuniu"}, -coins, (data: any) => {
            LogUtil.debug("更新金币数目", userId);
            NetUtil.userBroadcast(NetDefine.WS_Resp.G_MoneyChange, {coins: data.coins}, userId, true);
        });
    }
}