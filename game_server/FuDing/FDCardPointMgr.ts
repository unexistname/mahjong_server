import { GameConst } from "../GameConst";
import FDGamberModel from "./FDGamberModel";
import MJGameMgr from "../Majhong/MJGameMgr";
import MJCardPointMgr from "../Majhong/MJCardPointMgr";
import MJGamberModel from "../Majhong/MJGamberModel";
import FDGameMgr from "./FDGameMgr";
import LogUtil from "../../utils/LogUtil";

const checkHu = require("../Majhong/checkHu");

export default class FDCardPointMgr extends MJCardPointMgr {

    static isFDFlower(pai: number) {
        return this.isFlowerCard(pai) || this.isBlank(pai);
    }

    static getHuPattern(game: MJGameMgr, gamber: FDGamberModel, targetCard: number) {
        return this.is3HunPattern(gamber, game.huns, targetCard, game.foldNum)
                || this.is8HuaPattern(gamber, game.huns, targetCard)
                || super.getHuPattern(game, gamber, targetCard);
    }

    static is3HunPattern(gamber: FDGamberModel, huns: number[], targetCard: number, foldNum: number) {
        if (foldNum == 0) {
            let hunNum = 0;
            for (let hun of huns) {
                hunNum += gamber.countMap[hun];
            }
            if (huns.indexOf(targetCard) >= 0) {
                hunNum += 1;
            }
            // 三金倒
            if(hunNum >= 3) {
                return GameConst.HuType.HUN_3;
            }
        }
    }

    static is8HuaPattern(gamber: FDGamberModel, huns: number[], targetCard: number) {
        let hunNum = 0;
        for (let hun of huns) {
            hunNum += gamber.countMap[hun];
        }
        let huaNum = FDCardPointMgr.isFlowerCard(targetCard) ? 1 : 0;
        for (let flower of gamber.flowers) {
            if (FDCardPointMgr.isFlowerCard(flower)) {
                huaNum++;
            }
        }
        if (huaNum + hunNum >= 8) {
            return GameConst.HuType.HUA_8;
        }
    }

    static hasYouJin( game: MJGameMgr, gamber: MJGamberModel ) {
        return game.chuPai != -1 && checkHu.checkYoujin(gamber.holds, game.huns);
    }

    static getTingCard(game: MJGameMgr, gamber: FDGamberModel) {
        let map = checkHu.check8Hua( gamber.holds, game.huns );  //检查8花
        if( map.length > 0 ) {
            map = map.concat(game.huns);
            return {
                tingMap: map,
                pattern: GameConst.HuType.HUA_8
            }
        }
        return super.getTingCard(game, gamber);
    }

    static is3Hun(game: MJGameMgr, gamber: MJGamberModel) {
        return gamber.hued && gamber.pattern == GameConst.HuType.HUN_3;
    }

    static is8Hua(game: MJGameMgr, gamber: MJGamberModel) {
        return gamber.hued && gamber.pattern == GameConst.HuType.HUA_8;
    }

    //检查用户牌组是否是对对胡
    static isDuiDui( game: MJGameMgr, gamber: MJGamberModel ) {
        for (let penggang of gamber.penggangs) {
            if(typeof penggang[1] == "object"){
                return false;
            }
        }
        let rule = this.getRuleData(game, gamber);
        if (rule && rule.maxPengNum + gamber.penggangs.length < 5) {
            return false;
        }
        return true;
    }

    static getWinTypes(game: FDGameMgr, gamber: FDGamberModel) {
        let winTypes = super.getWinTypes(game, gamber);
        if (this.is3Hun(game, gamber )) {
            winTypes.push(GameConst.HuType.HUN_3);
        }
        if (this.is8Hua(game, gamber )) {
            winTypes.push(GameConst.HuType.HUA_8);
        }
        return winTypes;
    }

    static clearOtherHu(game: FDGameMgr, winner: FDGamberModel) {
        for (let gamber of game.gambers) {
            if (gamber == winner) {
                continue;
            }
            gamber.huNum = 0;
            gamber.fan = 0;
        }
    }

    static calculateHu(game: FDGameMgr) {
        let is2To8 = function(pai: number | string) {
            pai = Number(pai);
            if (pai > 0 && pai < 8) return true;
            if (pai > 9 && pai < 17) return true;
            if (pai > 18 && pai < 26) return true;
            return false;
        }
    
        for (let gamber of game.gambers) {
            gamber.huTypes = [];
    
            if (gamber.hued) {
                if (this.hasWinType(gamber, GameConst.HuType.TIAN_HU, GameConst.HuType.DI_HU)) {
                    gamber.huNum = 800;
                    this.clearOtherHu(game, gamber);
                    return;
                } else if (this.hasWinType(gamber, GameConst.HuType.HUN_3, GameConst.HuType.HUA_8)) {
                    gamber.huNum = 800;
                    if (game.foldNum == 0) {
                        this.clearOtherHu(game, gamber);
                        return;
                    }
                    continue;
                } else if (this.hasWinType(gamber, GameConst.HuType.QING_YI_SE, GameConst.HuType.XI_4)) {
                    gamber.huNum = 800;
                    continue;
                } else if (this.hasWinType(gamber, GameConst.HuType.PING_HU)) {
                    gamber.huNum = 100;
                    continue;
                }
            }
    
            let hu = 0;
            for (let penggang of gamber.penggangs) {
                if (penggang[0] == "chi") continue;
                let type = penggang[0];
                let pai = penggang[1];
                if (type == "peng") {
                    if (is2To8(pai)) {
                        hu += 2;
                        gamber.huTypes.push({type:pai, hu:2});
                    } else {
                        hu += 4;
                        gamber.huTypes.push({type:pai, hu:4});
                    }
                } else if (type == "wangang" || type == "diangang") {
                    if (is2To8(pai)) {
                        hu += 8;
                        gamber.huTypes.push({type:pai, hu:8});
                    } else {
                        hu += 16;
                        gamber.huTypes.push({type:pai, hu:16});
                    }
                } else if (type == "angang") {
                    if (is2To8(pai)) {
                        hu += 16;
                        gamber.huTypes.push({type:pai, hu:16});
                    } else {
                        hu += 32;
                        gamber.huTypes.push({type:pai, hu:32});
                    }
                }
            }
            // 一个花算4胡
            hu += gamber.flowers.length * 4;
            if (gamber.flowers.length > 0) {
                let blank = 0, flower = 0;
                for (let pai of gamber.flowers) {
                    if (this.isBlank(pai)) {
                        blank++;
                    } else {
                        flower++;
                    }
                }
                if (blank > 0) {
                    gamber.huTypes.push({type:33, hu:blank * 4});
                }
                if (flower > 0) {
                    gamber.huTypes.push({type:"hua", hu:flower * 4});
                }
            }
            let hunCnt = 0;
            for (let hun in game.huns) {
                if (gamber.countMap[hun]) {
                    hunCnt += gamber.countMap[hun];
                }
            }
            let za = [];
            if (gamber.hued) {
                var rule = this.getRuleData(game, gamber);
                hunCnt -= rule.minHunCount;
                LogUtil.debug("胡牌类型", gamber.holds, rule.pengMinHun, game.chuPai);
                for (let pai of rule.pengMinHun) {
                    if (game.chuPai == pai) {
                        if (is2To8(pai)) {
                            hu += 2;
                            gamber.huTypes.push({type:pai, hu:2});
                        } else {
                            hu += 4;
                            gamber.huTypes.push({type:pai, hu:4});
                        }
                    } else {
                        if (is2To8(pai)) {
                            hu += 4;
                            gamber.huTypes.push({type:pai, hu:4});
                        } else {
                            hu += 8;
                            gamber.huTypes.push({type:pai, hu:8});
                        }
                    }
                }
                hu += 20 * game.bankerTimes;
                gamber.huTypes.push({type:"di", hu: 20 * game.bankerTimes});
            } else {
                for (let j in gamber.countMap) {
                    if (gamber.countMap[j] && gamber.countMap[j] >= 3) {
                        if (is2To8(j)) {
                            hu += 4;
                            gamber.huTypes.push({type:j, hu:4});
                        } else {
                            hu += 8;
                            gamber.huTypes.push({type:j, hu:8});
                        }
                    }
                }
            }
            for (let j = 0; j < 33; ++j) {
                if (is2To8(j)) continue;
                if (gamber.hued && rule.pengMinHun.indexOf(j) >= 0) continue;
                if (gamber.countMap[j] && gamber.countMap[j] >= 1 && gamber.countMap[j] < 3) {
                    za.push({need:3 - gamber.countMap[j], pai:j});
                }
            }
            za.sort((a, b) => { return a.need - b.need; });
            for (let j = 0; j < za.length; ++j) {
                if (za[j].need <= hunCnt) {
                    hu += 8;
                    hunCnt -= za[j].need;
                    gamber.huTypes.push({type:Number(za[j].pai), hu:8});
                }
            }
            if (! gamber.hued) {
                // 非胡牌者，一个金算4胡
                if (hunCnt > 0) {
                    hu += 4 * hunCnt;
                    gamber.huTypes.push({type:"jin", hu:4 * hunCnt});
                }
            }
            
            LogUtil.debug("胡数计算", gamber.userId, gamber.holds, gamber.penggangs, gamber.flowers, gamber.huTypes);
            gamber.huNum = hu;
        }
    }

    static calculateFan(game: FDGameMgr) {   // 计算翻数（台数
        for (let gamber of game.gambers) {
            if (gamber.hued) {
                if (this.hasWinType(gamber, GameConst.HuType.TIAN_HU, GameConst.HuType.DI_HU)) {
                    return;
                } else if (this.hasWinType(gamber, GameConst.HuType.HUN_3, GameConst.HuType.HUA_8) && game.foldNum == 0) {
                    return;
                }
            }
        }
        for (let gamber of game.gambers) {
            let sitPos = gamber.seatIndex;
            let fan = 0;
            let blank = false;
            gamber.fanTypes = [];

            if (this.hasWinType(gamber, GameConst.HuType.PING_HU)
                || this.hasWinType(gamber, GameConst.HuType.XI_4)
                || this.hasWinType(gamber, GameConst.HuType.QING_YI_SE)) {
                continue;
            }
    
            let hunCnt = 0;
            for (let hun of game.huns) {
                if (gamber.countMap[hun]) {
                    hunCnt += gamber.countMap[hun]; // 1个金1翻
                }
            }
            if (hunCnt > 0) {
                fan += hunCnt;
                gamber.fanTypes.push({type:"jin", fan:hunCnt});
            }
    
            // 白板，2个算1翻，然后每多1个算1翻
            for (let flower of gamber.flowers) {
                if (this.isBlank(flower)) {
                    if (blank) {
                        fan++;
                        gamber.fanTypes.push({type:flower, fan:1});
                    }
                    blank = true;
                }
            }
    
            for (let penggang of gamber.penggangs) {
                if (penggang[0] == "chi") continue;
                let pai = penggang[1];
                if ((pai >= 31 && pai < 33) || pai == this.correspondingWind(game, gamber.seatIndex)) {
                    fan++;
                    gamber.fanTypes.push({type:pai, fan:1});
                }
            }
    
            if (gamber.hued) {
                if (this.hasWinType(gamber, GameConst.HuType.ZI_MO)) {
                    fan++;
                    gamber.fanTypes.push({type:"zimo", fan:1});
                }
                if (this.hasWinType(gamber, GameConst.HuType.HUN_YI_SE)) {
                    fan++;
                    gamber.fanTypes.push({type:"hunyise", fan:1});
                }
                if (this.hasWinType(gamber, GameConst.HuType.DUI_DUI)) {
                    fan++;
                    gamber.fanTypes.push({type:"duiduihu", fan:1});
                }
    
                // 三个及以上 中、发都算1翻
                let rule = this.getRuleData(game, gamber);
                for (let pai of rule.pengMinHun) {
                    if ((pai >= 31 && pai < 33) || pai == this.correspondingWind(game, sitPos)) {
                        fan++;
                        gamber.fanTypes.push({type:pai, fan:1});
                    }
                }
            
            } else {
                let za = [];
                for (let j = 27; j < 33; ++j) {
                    if ((j >= 31 && j < 33) || j == this.correspondingWind(game, sitPos)) {
                        if (gamber.countMap[j]) {
                            za.push({need:Math.max(3 - gamber.countMap[j], 0), pai:j});
                        }
                    }
                }
                za.sort((a, b) => { return a.need - b.need; });
                for (let j = 0; j < za.length; ++j) {
                    if (za[j].need <= hunCnt) {
                        fan++;
                        hunCnt -= za[j].need;
                        gamber.fanTypes.push({type:za[j].pai, fan:1});
                    }
                }
            }
    
            let myRedFlower = this.correspondingRedFlower(game, sitPos);
            let myBlackFlower = this.correspondingBlackFlower(game, sitPos);
            let redCnt = 0;
            let blackCnt = 0;
            // 计算花的翻数
            for (let flower of gamber.flowers) {
                if (myRedFlower == flower) {
                    fan++;
                    gamber.fanTypes.push({type:flower, fan:1});
                } else if (myBlackFlower == flower) {
                    fan++;
                    gamber.fanTypes.push({type:flower, fan:1});
                }
                if (flower >= 34 && flower < 38) {
                    redCnt++;
                } else if (flower >= 38 && flower < 42) {
                    blackCnt++;
                }
            }
            if (gamber.countMap[myRedFlower]) {
                fan++;
                gamber.fanTypes.push({type:myRedFlower, fan:1});
            }
            if (gamber.countMap[myBlackFlower]) {
                fan++;
                gamber.fanTypes.push({type:myBlackFlower, fan:1});
            }
            
            if (redCnt >= 4) {
                fan++;
                gamber.fanTypes.push({type:"red", fan:1});
            }
            if (blackCnt >= 4) {
                fan++;
                gamber.fanTypes.push({type:"black", fan:1});
            }
    
            gamber.fan = fan;
            LogUtil.debug("台数计算", gamber.userId, gamber.holds, gamber.penggangs, gamber.flowers, gamber.fanTypes);
        }
    }
}