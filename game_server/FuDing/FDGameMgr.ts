import { GameConst } from "../GameConst";
import FDCardMgr from "./FDCardMgr";
import FDCardPointMgr from "./FDCardPointMgr";
import FDGamberModel from "./FDGamberModel";
import MJGameMgr from "../Majhong/MJGameMgr";
import FDOperate from "./FDOperate";
import LogUtil from "../../utils/LogUtil";
import FDNet from "./FDNet";
import GameUtil from "../../utils/GameUtil";


export default class FDGameMgr extends MJGameMgr {

    turnGamber: FDGamberModel;
    gambers: FDGamberModel[];
    banker: FDGamberModel;

    net: FDNet;
    baseHu: number;


    State_drawCard() {
        this.baseHu = this.bankerTimes * this.baseScore;
        this.net.G_BaseHu(this.baseHu);
        super.State_drawCard();
    }

    updateTingMap(gamber: FDGamberModel) {
        let data = FDCardPointMgr.getTingCard(this, gamber);
        if (data) {
            gamber.tingMap = data.tingMap;
            gamber.pattern = data.pattern;
        } else {
            gamber.tingMap = [];
        }
    }

    getOpenHuGamber() {
        //进行听牌检查
        for (let gamber of this.gambers) {
            if (gamber == this.banker) {
                let card = gamber.popCard();
                this.updateTingMap(gamber);
                this.updateCanHu(gamber, card);
                gamber.addCard(card);
            } else {
                this.updateTingMap(gamber);
                this.updateCanHu(gamber, -1);
            }
        }
        
        for (let gamber of this.gambers) {
            if (gamber.canHu && gamber.pattern == GameConst.HuType.HUA_8) {
                continue;
            }
            // 补花
            if (this.tryPlugFlower(gamber) && gamber == this.banker) {
                let card = this.banker.popCard();
                this.updateTingMap(this.banker);
                this.updateCanHu(this.banker, card);
                this.banker.addCard(card);
            }
        }

        //能胡就直接胡
        for (let gamber of this.gambers) {
            if (gamber.canHu) {
                return gamber;
            }
        }

        //不能胡就看能不能暗杠
        if (this.hasOperations(this.banker)) {
            this.sendOperations(this.banker);
        }
    }

    updateCanHu(gamber: FDGamberModel, targetCard: number) {
        gamber.pattern = FDCardPointMgr.getHuPattern(this, gamber, targetCard);
        gamber.canHu = gamber.pattern != GameConst.HuType.NONE;
    }
    
    generateCardMgr() {
        return new FDCardMgr();
    }

    generateGamber() {
        return new FDGamberModel();
    }

    isMahjongCanPlay(pai: number) {
        if (this.isHun(pai)) {
            return false;
        }
        if (this.cardMgr.getLeftCardNum() <= 24) {
            if (FDCardPointMgr.isWordCard(pai)) {
                let cnt = 0;
                for (let gamber of this.gambers) {
                    for (let card of gamber.folds) {
                        if (card == pai) {
                            cnt++;
                        }
                    }
                    for (let penggang of gamber.penggangs) {
                        if (penggang[0] != "chi" && penggang[1] == pai) {
                            cnt++;
                        }
                    }
                }
                return cnt >= 3;
            }
        }
        return true;
    }
    
    hasYouJin(gamber: FDGamberModel): boolean {
        return FDCardPointMgr.hasYouJin(this, gamber);
    }

    doUserMoPai( gamber: FDGamberModel, isGangOrPlugFlower: boolean = false, canSendOperate: boolean = true) {
        let pai = super.doUserMoPai(gamber, isGangOrPlugFlower, canSendOperate);
        if (pai != null) {
            // 尝试补花
            this.plugFlower(gamber, pai);
        }
        return pai;
    }

    plugFlower(gamber: FDGamberModel, pai: number) {
        if (!FDCardPointMgr.isFDFlower(pai)) {
            return false;
        }
        if (!gamber.hasCard(pai)) {
            return false;
        }
        if (this.isHun(pai)) {
            // 花是赖子，就不补花
            return false;
        }
        LogUtil.debug("[补花前]", gamber.holds);
        gamber.discard(pai);
        gamber.flowers.push(pai);
        this.notifyOperate(gamber, FDOperate.BU_HUA, pai);
        this.cardMgr.sortCard(gamber.holds, this.huns);
    
        this.doUserMoPai(gamber, true, this.turnGamber == gamber);
        LogUtil.debug("[补花后]", gamber.holds);
        return true;
    }

    getWinTypes(gamber: FDGamberModel) {
        return FDCardPointMgr.getWinTypes(this, gamber);
    }

    tryPlugFlower(gamber: FDGamberModel) {
        let hasPlugFlower = false;
        for (let i = 33; i < 42; ++i) {
            if (this.plugFlower(gamber, i)) {
                hasPlugFlower = true;
                if (FDCardPointMgr.isBlank(i)) {
                    i--;
                }
            }
        }
        return hasPlugFlower;
    }

    settle() {
        FDCardPointMgr.calculateHu(this);
        FDCardPointMgr.calculateFan(this);
        for (let gamber of this.gambers) {
            gamber.totalHu = Math.floor((gamber.huNum + 9) / 10) * 10;
            for (var j = 0; j < gamber.fan; ++j) {
                gamber.totalHu *= 2;
            }
            if (gamber.totalHu > 800) {
                gamber.totalHu = 800;
                gamber.winTypes.push(GameConst.HuType.LAI_ZI);
            }
            LogUtil.debug("计算总胡数", gamber.huNum, gamber.fan, gamber.totalHu);
        }
        for (let gamber of this.gambers) {
            for (let otherGamber of this.gambers) {
                if (gamber == otherGamber || otherGamber.hued) {
                    continue;
                }
                let score = gamber.totalHu;
                if (this.banker == otherGamber || this.banker == gamber) {
                    score *= 2;
                }
                LogUtil.debug("计算分数", score, gamber.totalHu, gamber.userId);
                this.changeGamberScore(gamber, score);
                this.changeGamberScore(otherGamber, -score);
            }
        }
        for (let gamber of this.gambers) {
            if (gamber.hued) {
                this.winnerId = gamber.userId;
                break;
            }
        }
    }

    getSettleExtraData(gamber: FDGamberModel) {
        return GameUtil.mergeDict({
            fan:gamber.fan,
            hu:gamber.huNum,
            huTypes:gamber.huTypes,
            fanTypes:gamber.fanTypes,
        }, super.getSettleExtraData(gamber));
    }

    reconnectOverDecideBanker(userId: string) {
        super.reconnectOverDecideBanker(userId);
        this.net.G_BaseHu(this.baseHu);
    }
}