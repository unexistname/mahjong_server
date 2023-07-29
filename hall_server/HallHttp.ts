import AllUserMgr from "../common/AllUserMgr";
import BaseHttp from "../base_net/BaseHttp";
import RechargeMgr from "../common/RechargeMgr";
import { ErrorCode, ErrorMsg } from "../game_server/ErrorCode";
import GameUtil from "../utils/GameUtil";
import LogUtil from "../utils/LogUtil";

const wx_tool = require('../utils/wx_tool');
const db = require('../utils/db');


export default class HallHttp extends BaseHttp {

    static async C_GetUserBaseInfo(res: any, msg: any) {
        let user = await AllUserMgr.ins.getUser(msg.userId);
        let data = {
            userName: user.userName,
            sex: user.sex,
            headImg: user.avatarUrl
        };
        this.send(res, data);
    }

    static C_ShowRecharge(res: any, msg: any) {
        this.send(res, RechargeMgr.ins.getAllRecharge());
    }

    static C_Pay(res: any, msg: any) {
        LogUtil.debug(`[HallHttp C_Pay] data= ${msg}`);

        let rechargeId = msg.rechargeId;
        let recharge = RechargeMgr.ins.getRecharge(rechargeId);
        if (recharge == null) {
            this.sendError(res, ErrorCode.UNEXIST_SERIES);
            return;
        }
        let money = recharge.price * 100;
        let orderCreateTime = Date.now();
        let description = recharge.desc || "";

        let orderData = {
            userId: msg.userId, 
            rechargeId: rechargeId,
            createTime: orderCreateTime
        };
        db.insert_order(orderData, (orderId: string) => {
            let payData = wx_tool.getWXRequestOrderData(msg.userId, orderId, rechargeId, description, money);
            wx_tool.getPrepayId(payData, (prepay_id: string) => {
                if (prepay_id) {
                    this.send(res, wx_tool.getWXOrderData(prepay_id, orderCreateTime));
                } else {
                    this.sendError(res, ErrorCode.EMPTY_PREPAY_ID);
                }
            });
        });
    }

    static CB_PayResult(res: any, postData: any, req: any) {
        let headers = req.headers;
        let payOver = (code: ErrorCode, orderData: any) => {
            let data = {};
            if (!GameUtil.isSuccessCode(code)) {
                data = {
                    "code": "FAIL",
                    "message": ErrorMsg[code],
                }
                LogUtil.error("支付有误: ", code);
                LogUtil.warn("请求头:", headers);
                LogUtil.warn("请求体:", postData);
            }
            LogUtil.debug("订单数据: ", orderData);
            res.send(JSON.stringify(data));
        }

        wx_tool.verifyPayNotify(headers, postData, function(code: ErrorCode, orderData: any) {
            if (!GameUtil.isSuccessCode(code)) {
                payOver(code, orderData);
                return;
            }
            if (orderData.trade_state != "SUCCESS") {
                payOver(ErrorCode.ORDER_TRADE_FAIL, orderData);
                return;
            }

            let attach = JSON.parse(orderData.attach);
            let userId = attach.userId;
            let orderId = attach.orderId;
            let rechargeId = attach.rechargeId;
            let payTime = new Date(orderData.success_time).getTime();
            let payMoney = (Number(orderData.amount.total) / 100.0);
            db.get_order(orderId, (order: any) => {
                if (order == null) {
                    code = ErrorCode.UNEXIST_ORDER;
                } else if (order.state == 1) {
                    code = ErrorCode.ORDER_ALREADY_PURCHASE;
                } else if (!RechargeMgr.ins.isPriceCorrect(rechargeId, payMoney)) {
                    code = ErrorCode.ORDER_PRICE_ERROR;
                } else {
                    let orderDBData = {
                        userId: userId,
                        orderId: orderId,
                        rechargeId: rechargeId,
                        payTime: payTime,
                        payMoney: payMoney.toFixed(2),
                        state: 1,
                    }
                    db.update_order(orderDBData, function() {
                        RechargeMgr.ins.add_recharge(userId, rechargeId);
                    });
                }
                payOver(code, orderData);
            })
        });
    }
}