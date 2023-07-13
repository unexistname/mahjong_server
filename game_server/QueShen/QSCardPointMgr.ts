import { GameConst } from "../GameConst";
import MJGameMgr from "../Majhong/MJGameMgr";
import MJCardPointMgr from "../Majhong/MJCardPointMgr";
import MJGamberModel from "../Majhong/MJGamberModel";
import LogUtil from "../../utils/LogUtil";

const checkHu = require("../Majhong/checkHu");

export default class QSCardPointMgr extends MJCardPointMgr {

    static getHuPattern(game: MJGameMgr, gamber: MJGamberModel, targetCard: number) {
        if (targetCard != -1) {
            gamber.addCard(targetCard);
        }
        let huType = GameConst.HuType.NONE;
        if (this.isNormalHu(gamber, game.huns, targetCard)) {
            if (this.isQingYiSe(game, gamber)) {
                huType = GameConst.HuType.QING_YI_SE;
            } else if (this.isHunYiSe(game, gamber)) {
                huType = GameConst.HuType.HUN_YI_SE;
            } else if (this.isQueYiMen(game, gamber)) {
                huType = GameConst.HuType.QUE_YI_MEN;
            } else if (this.isBanBan(game, gamber)) {
                huType = GameConst.HuType.BAN_BAN;
            } else if (this.isPengPeng(game, gamber)) {
                huType = GameConst.HuType.PENG_PENG;
            } else if (this.isQiangGangHu(game, gamber)) {
                huType = GameConst.HuType.QIANG_GANG;
            } else if (this.isZiMo(game, gamber)) {
                huType = GameConst.HuType.ZI_MO;
            } else if (game.turnGamber == gamber) {
                huType = GameConst.HuType.HU;
            }
        } else if (this.isDuiDui(game, gamber)) {
            huType = GameConst.HuType.DUI_DUI;
        }
        if (targetCard != -1) {
            gamber.popCard();
        }
        return huType;
    }

    static getTingCard(game: MJGameMgr, gamber: MJGamberModel) {
        let map = checkHu.doCheckTing( gamber.holds, game.huns, game.banJiangs );	   //检查平胡
        if( map.length > 0 ) {
            map = map.concat(game.huns);
            return {
                tingMap: map,
                pattern: GameConst.HuType.HU
            }
        }
    }

    static getRuleData(game: MJGameMgr, gamber: MJGamberModel) {
        if (!gamber.ruleData) {
            let wind = this.correspondingWind(game, gamber.seatIndex);
            gamber.ruleData = checkHu.getHunDataInHu(gamber.holds, game.huns, wind, game.chuPai);
        }
        return gamber.ruleData;
    }
}