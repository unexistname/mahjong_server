import NetUtil from "../base_net/NetUtil";
import { ErrorCode } from "../game_server/ErrorCode";
import LogUtil from "../utils/LogUtil";
import { NetDefine } from "../base_net/NetDefine";
import RoomNet from "../game_server/Room/RoomNet";

const db = require('../utils/db');


export default class RechargeMgr {

    private static _ins: RechargeMgr;

    static get ins() {
        if (this._ins == null) {
            this._ins = new RechargeMgr();
        }
        return this._ins;
    }

    recharges: { [ key: string ]: any};

    getRecharge(rechargeId: string) {
        if (rechargeId) {
            return this.recharges[rechargeId];
        }
    }

    loadAllSeries() {
        db.get_all_series((datas: any) => {
            this.recharges = {};
            for (let data of datas) {
                this.recharges[data.id] = {
                    rechageId: data.id,
                    price: data.presentPrice,
                    propId: data.propId,
                    propAmount: data.propAmount,
                    seriesDesc: data.seriesName,
                    seriesName: data.seriesName,
                }
            }
        });
    }

    isPriceCorrect(rechargeId: string, payMoney: number) {
        let recharge = this.getRecharge(rechargeId);
        if (recharge) {
            return Math.abs(recharge.price - payMoney) < 1e-5;
        }
        return false;
    }

    getAllRecharge() {
        return this.recharges;
    }

    add_recharge(userId: string, rechargeId: string) {
        let recharge = this.getRecharge(rechargeId);
        if (recharge) {
            if (recharge.propId == 1) {
                this.add_gems(userId, recharge.propAmount);
            } else if (recharge.propId == 3) {
                this.add_coins(userId, recharge.propAmount);
            }
        } else {
            return ErrorCode.UNEXIST_SERIES;
        }
    }
    
    add_gems(userId: string, gems: number) {
        db.add_gem({userId: userId, gem: gems}, (data: any) => {
            LogUtil.debug("更新钻石数目", userId);
            NetUtil.userBroadcast(NetDefine.WS_Resp.G_MoneyChange, {gems: data.gems}, userId, true);
        });
    }
    add_coins(userId: string, coins: number) {
        db.cost_coins(userId, {area:"renheniuniu"}, -coins, (data: any) => {
            LogUtil.debug("更新金币数目", userId);
            NetUtil.userBroadcast(NetDefine.WS_Resp.G_MoneyChange, {coins: data.coins}, userId, true);
        });
    }
}