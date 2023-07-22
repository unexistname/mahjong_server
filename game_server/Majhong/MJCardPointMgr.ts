import { GameConst } from "../GameConst";
import MJGamberModel from "./MJGamberModel";
import MJGameMgr from "./MJGameMgr";

const checkHu = require("../Majhong/checkHu");

export default class MJCardPointMgr {

    static getMJType(pai: number) {
        return checkHu.getMJType(pai);
    }
    
    static isFlowerCard(pai: number) {
        return this.getMJType(pai) == 4;
    }

    static isWordCard(pai: number) {
        return this.getMJType(pai) == 3;
    }

    static isBlank(pai: number) {
        return pai == 33;
    }

    static getSameColorFlower(card: number) {
        if (card >= 34 && card <= 37) {
            return [34, 35, 36, 37];
        } else {
            return [38, 39, 40, 41];
        }
    }
    static getHuPattern(game: MJGameMgr, gamber: MJGamberModel, targetCard: number): GameConst.HuType {
        return this.isNormalHu(gamber, game.huns, targetCard)
                || GameConst.HuType.NONE;
    }

    static isNormalHu(gamber: MJGamberModel, huns: number[], targetCard: number) {
        for (let card of gamber.tingMap) {
            if (card == targetCard) {
                return GameConst.HuType.HU;
            }
        }
        if (gamber.tingMap.length > 0 && huns.indexOf(targetCard) >= 0) {
            return GameConst.HuType.HU;
        }
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
    //检查用户牌组是否是清一色
    static isQingYiSe(game: MJGameMgr, gamber: MJGamberModel ) {
        let _type;
        for (let hold of gamber.holds) {
            if (game.isHun(hold)) {
                continue;
            }
            let type = this.getMJType( hold );
            if (_type == null) {
                _type = type;
            } else if( _type !=  type) {
                return false;
            }
        }
        for (let penggang of gamber.penggangs) {
            if(typeof penggang[1] == "number"){
                if( _type != this.getMJType( penggang[1] ) ) {
                    return false;
                }
            }
            else if(typeof penggang[1] == "object"){
                if( _type != this.getMJType( penggang[1].pai ) ) {
                    return false;
                }
            }
        }
        return true;
    }

    static getRuleData(game: MJGameMgr, gamber: MJGamberModel) {
        if (!gamber.ruleData) {
            let wind = this.correspondingWind(game, gamber.seatIndex);
            gamber.ruleData = checkHu.getHunDataInHu(gamber.holds, game.huns, wind, game.chuPai);
        }
        return gamber.ruleData;
    }
    
    static isPinghu(game: MJGameMgr, gamber: MJGamberModel) {
        if (gamber.penggangs.length > 0) {
            return false;
        }
        // for (let penggang of gamber.penggangs) {
        //     if (penggang[0] == "chi") {
        //         return false;
        //     }
        // }
        if (gamber.flowers.length > 0) {
            return false;
        }
        let rule: any = this.getRuleData(game, gamber);
        if (rule && rule.minPengNum == 0) {
            return true;
        }
        return false;
    }

    static isGangHu(game: MJGameMgr, gamber: MJGamberModel) {
        return game.turnGamber.lastFangGangSeat != null;
    }

    static isQiangGangHu(game: MJGameMgr, gamber: MJGamberModel) {
        return game.qiangGangContext != null;
    }

    static hasWinType(gamber: MJGamberModel, ...types: GameConst.HuType[]) {
        for (let winType of gamber.winTypes) {
            if (types.indexOf(winType) >= 0) {
                return true;
            }
        }
        return false;
    }

    static isDianGangHu(game: MJGameMgr, gamber: MJGamberModel) {
        return this.isGangHu(game, gamber) && !this.isQiangGangHu(game, gamber);
    }

    static isZiMo(game: MJGameMgr, gamber: MJGamberModel) {
        if (game.chuPai != -1) {
            return false;
        }
        if (this.isQiangGangHu(game, gamber)) {
            return false;
        }
        return true;
    }

    static getAnGangCards(game: MJGameMgr, gamber: MJGamberModel) {
        let gangPai: number[] = [];
        for (let card in gamber.countMap) {
            let pai = Number(card);
            if (gamber.countMap[pai] == 4 && !game.isHun(pai)) {
                gangPai.push(pai);
            }
        }
        return gangPai;
    }

    static getWangGangCards(game: MJGameMgr, gamber: MJGamberModel) {
        //从碰过的牌中选
        let gangPai: number[] = [];
        for (let penggang of gamber.penggangs) {
            if (penggang[0] != "peng") {
                continue;
            }
            let card = penggang[1];
            if(gamber.countMap[card] == 1){
                gangPai.push(card);
            }
        }
        return gangPai;
    }

    static getDianGangCards(game: MJGameMgr, gamber: MJGamberModel, targetPai: number) {
        //检查玩家手上的牌
        if (!game.isHun(targetPai)) {
            if (gamber.countMap[targetPai] && gamber.countMap[targetPai] >= 3) {
                return [targetPai];
            }
        }
        return [];        
    }

    static canPeng(game: MJGameMgr, gamber: MJGamberModel, targetPai: number) {
        if (!game.isHun(targetPai)) {
            if (gamber.countMap[targetPai] && gamber.countMap[targetPai] >= 2) {
                return true;
            }
        }
        return false;
    }

    static getChiCard(game: MJGameMgr, gamber: MJGamberModel, targetPai: number) {
        if(!game.canChi) return;
        let type = this.getMJType(targetPai);
        if (type > 2) return;
        let countMap = gamber.countMap;
        if (game.isHun(targetPai)) {
            return ;
        }
        let chiPai: any[] = [];
        if(countMap[targetPai-2] > 0 && countMap[targetPai-1] > 0 && this.getMJType(targetPai-2) == type && this.getMJType(targetPai-1) == type){
            if (!game.isHun(targetPai-1) && !game.isHun(targetPai-2)) {
                chiPai.push({index:1,chi:[targetPai-2,targetPai-1,targetPai],pai:targetPai});
            }
        }
        if(countMap[targetPai-1] > 0 && countMap[targetPai+1] > 0 && this.getMJType(targetPai-1) == type && this.getMJType(targetPai+1) == type){
            if (!game.isHun(targetPai-1) && !game.isHun(targetPai+1)) {
                chiPai.push({index:2,chi:[targetPai-1,targetPai,targetPai+1],pai:targetPai});
            }
        }
        if(countMap[targetPai+1] > 0 && countMap[targetPai+2] > 0 && this.getMJType(targetPai+1) == type && this.getMJType(targetPai+2) == type){
            if (!game.isHun(targetPai+1) && !game.isHun(targetPai+2)) {
                chiPai.push({index:3,chi:[targetPai,targetPai+1,targetPai+2],pai:targetPai});
            }
        }
        return chiPai;
    }

    static getWinTypes(game: MJGameMgr, gamber: MJGamberModel) {
        let winTypes = [];
        if (this.isZiMo(game, gamber )) {
            winTypes.push(GameConst.HuType.ZI_MO);
        }
        if (this.isQingYiSe(game, gamber )) {
            winTypes.push(GameConst.HuType.QING_YI_SE);
        }
        if (this.isPinghu(game, gamber )) {
            winTypes.push(GameConst.HuType.PING_HU);
        }
        if (this.isHunYiSe(game, gamber )) {
            winTypes.push(GameConst.HuType.HUN_YI_SE);
        }
        if (this.isDuiDui(game, gamber )) {
            winTypes.push(GameConst.HuType.DUI_DUI);
        }
        if (this.is4Xi(game, gamber )) {
            winTypes.push(GameConst.HuType.XI_4);
        }
        if (this.isTianHu(game, gamber )) {
            winTypes.push(GameConst.HuType.TIAN_HU);
        }
        if (this.isDiHu(game, gamber )) {
            winTypes.push(GameConst.HuType.DI_HU);
        }
        return winTypes;
    }

    //检查用户牌组是否是混一色
    static isHunYiSe( game: MJGameMgr, gamber: MJGamberModel ) {
        const holds = gamber.holds;
        let _type;
        let hasZi = false;
        for (let hold of gamber.holds) {
            let type = this.getMJType( hold );
            if (type > 2) {
                hasZi = true;
                continue;
            }
            if (game.isHun(hold)) {
                continue;
            }
            if (_type == null) {
                _type = type;
            } else if ( _type !=  type) {
                return false;
            }
        }
        for (let penggang of gamber.penggangs) {
            let type;
            if(typeof penggang[1] == "number"){
                type = this.getMJType( penggang[1] );
            } else {
                type = this.getMJType( penggang[1].pai );
            }
            if (type > 2) {
                hasZi = true;
                continue;
            }
            if (_type == null) {
                _type = type;
            } else if ( _type !=  type) {
                return false;
            }
        }
        return _type != null && hasZi;
    }

    //检查用户牌组是否是对对胡
    static isDuiDui( game: MJGameMgr, gamber: MJGamberModel ) {
        if (gamber.penggangs.length > 0) {
            return false;
        }
        
        let hunCnt = 0, needHunCnt = 0;
        for (let pai in gamber.countMap) {
            let cardNum = gamber.countMap[pai];
            if (game.isHun(pai)) {
                hunCnt += cardNum;
            } else {
                if (cardNum > 2) {
                    return false;
                } else {
                    needHunCnt += 2 - cardNum;
                }
            }
        }
        return hunCnt >= needHunCnt;
    }

    static isBanBan( game: MJGameMgr, gamber: MJGamberModel ) {
        for (let pai in gamber.countMap) {
            if (game.banJiangs.indexOf(Number(pai)) >= 0) {
                return false;
            }
        }
        return true;
    }

    static isPengPeng( game: MJGameMgr, gamber: MJGamberModel ) {
        for (let penggang of gamber.penggangs) {
            if (penggang[0] != "peng") {
                return false;
            }
        }
        let hasCnt2 = false;
        for (let pai in gamber.countMap) {
            let cardNum = gamber.countMap[pai];
            if (cardNum == 3) {
                continue;
            } else if (cardNum == 2) {
                if (hasCnt2) {
                    return false;
                } else {
                    hasCnt2 = true;
                }
            } else {
                return false;
            }
        }
        return true;
    }

    static isQueYiMen(game: MJGameMgr, gamber: MJGamberModel) {
        let types: { [key: number] : boolean} = {};
        for (let pai in gamber.countMap) {
            let cardType = this.getMJType(Number(pai));
            types[cardType] = true;
        }
        let cnt = 0;
        for (let i =  0; i < 3; ++i) {
            if (types[i]) {
                cnt++;
            }
        }
        return cnt == 2;
    }

    static is4Xi( game: MJGameMgr, gamber: MJGamberModel ) {
        let xi: any = {};
        for (let penggang of gamber.penggangs) {
            if (penggang[0] == "chi") continue;
            let pai = penggang[1];
            if (pai >= 27 && pai <= 30) {
                xi[pai] = true;
            }
        }
        for (let j = 27; j <= 30; ++j) {
            if (!gamber.countMap[j] && !xi[j]) {
                return false;
            }
        }
        return true;
    }

    static isTianHu( game: MJGameMgr, gamber: MJGamberModel ) {
        return game.foldNum == 0 && game.banker == gamber;
    }

    static isDiHu( game: MJGameMgr, gamber: MJGamberModel ) {
        return game.foldNum == 1 && game.banker != gamber;
    }

    static correspondingWind(game: MJGameMgr, index: number) {
        return ((index - game.wind + game.gamberNum) % game.gamberNum) + 27;
    }
    
    static correspondingRedFlower(game: MJGameMgr, index: number) {
        return ((index - game.wind + game.gamberNum) % game.gamberNum) + 34;
    }
    
    static correspondingBlackFlower(game: MJGameMgr, index: number) {
        return ((index - game.wind + game.gamberNum) % game.gamberNum) + 38;
    }
}