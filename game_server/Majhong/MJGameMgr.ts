import { ConditionFilter } from "../../utils/ConditionFilter";
import GameUtil from "../../utils/GameUtil";
import LogUtil from "../../utils/LogUtil";
import TimerTask from "../../utils/TimerTask";
import { ErrorCode } from "../ErrorCode";
import FDCardPointMgr from "../FuDing/FDCardPointMgr";
import CardMgr from "../Game/CardMgr";
import GamberModel from "../Game/GamberModel";
import GameMgr from "../Game/GameMgr";
import { GameConst } from "../GameConst";
import MJCardMgr from "./MJCardMgr";
import MJCardPointMgr from "./MJCardPointMgr";
import MJGamberModel from "./MJGamberModel";
import MJNet from "./MJNet";
import MJOperate from "./MJOperate";


export default class MJGameMgr extends GameMgr {
    turnGamber: MJGamberModel;
    gambers: MJGamberModel[];
    cardMgr: MJCardMgr;
    wind: number;
    banker: MJGamberModel;
    canChi: boolean = true;
    hun: number = -1;
    net: MJNet;
    huns: number[] = [];
    foldNum: number;
    chuPai: number;
    bankerId: string;
    bankerTimes: number;
    lastBeGangGamber: MJGamberModel;
    lastGangGamber: any;
    qiangGangContext: any;
    operateWant: { [ key: string ]: any };
    chuPaiTask: TimerTask;
    operateTask: {[ key: string ]: TimerTask};

    guoshoupeng: { [key: string]: any } = {};
    sortCard: boolean = true;
    banJiangs: number[] = [];

    generateHun() {
        let hun = this.cardMgr.drawCard(true);
        if (hun == null) {
            return;
        }
        this.hun = hun;
        this.huns = [hun];
        if (MJCardPointMgr.isFlowerCard(hun)) {
            this.huns = MJCardPointMgr.getSameColorFlower(hun);
        }
        this.net.G_Hun(hun, this.huns);
    }

    State_decideBanker() {
        this.wind = GameUtil.random(this.gamberNum - 1);
        this.net.G_DecideWind(this.gambers[this.wind].userId);
        
        if (this.bankerId == null) {
            let index = GameUtil.random(this.gamberNum - 1);
            this.banker = this.gambers[index];
            this.bankerId = this.banker.userId;
            this.bankerTimes = 1;
        } else {
            for (let gamber of this.gambers) {
                if (gamber.userId == this.bankerId) {
                    this.banker = gamber;
                    break;
                }
            }
        }
        this.generateHun();
        
        this.net.G_DecideBanker(this.bankerId, this.getGamberIds());
        this.nextState();
    }

    setGameInitData(data: any) {
        this.bankerId = data.winnerId || data.bankerId;
        if (data.winnerId && data.winnerId == data.bankerId) {
            this.bankerTimes = data.bankerTimes + 1;
        } else {
            this.bankerTimes = 1;
        }
    }

    initGame(): void {
        super.initGame();
        this.chuPaiTask = new TimerTask();
        this.operateWant = {};
        this.operateTask = {};
        for (let gamber of this.gambers) {
            this.operateTask[gamber.userId] = new TimerTask();
        }
    }

    StateOver_idle() {
        this.updateGameState(GameConst.GameState.DECIDE_BANKER);
        this.State_decideBanker();
    }

    isGameCanOver(gamber: MJGamberModel) {
        for (let gamber of this.gambers) {
            if (gamber.hued) {
                return true;
            }
        }
        return !this.cardMgr.canDrawCard();
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
            if (gamber.canHu) {
                return gamber;
            }
        }

        //不能胡就看能不能暗杠
        if (this.hasOperations(this.banker)) {
            this.sendOperations(this.banker);
        }
    }

    getBrightCardNum() {
        return 16;
    }

    getDarkCardNum() {
        return 0;
    }
    
    isHun(pai: number | string) {
        let card = typeof pai == "string" ? Number(pai) : pai;
        return this.huns.indexOf(card) >= 0;
    }

    saveGameLeftData(data: any = {}) {
        data.bankerId = this.bankerId;
        data.winnerId = this.winnerId;
        data.bankerTimes = this.bankerTimes;
        super.saveGameLeftData(data);
    }

    StateOver_drawCard() {
        this.updateGameState(GameConst.GameState.BETTING);
        this.turnGamber = this.banker;
        let gamber = this.getOpenHuGamber();
        if (gamber) {
            this.C_Hu(gamber);
        } else {
            this.State_betting(this.banker);
        }
    }

    getBankerAdditionalCard() {
        return 1;
    }

    clearGamberOption(gamber: MJGamberModel) {
        gamber.canChi = false;
        gamber.chiPai = [];
        gamber.canPeng = false;
        gamber.canGang = false;
        gamber.gangPai = [];
        gamber.canHu = false;
        gamber.lastFangGangSeat = -1;
    }

    isMahjongCanPlay(pai: number) {
        return true;
    }

    turnPlayCard(pai?: number) {
        let userId = this.turnGamber.userId;
        this.turnGamber.canChuPai = true;
        this.net.G_TurnPlayCard(userId);
        
        if (this.waiveWhenTimeout) {
            this.chuPaiTask.beginTask(() => {
                if (pai == null || !this.isMahjongCanPlay(pai)) {
                    let holds = this.turnGamber.holds;
                    for (let i = holds.length - 1; i >= 0; --i) {
                        let pai = holds[i];
                        if (this.isMahjongCanPlay(pai)) {
                            break;
                        }
                    }
                }
                if (pai != null) {
                    this.C_ChuPai(this.turnGamber, pai);
                }
            }, GameConst.GameTime.BETTING);
        }
    }

    @ConditionFilter(ErrorCode.NOT_YOUR_TURN)
    @ConditionFilter(ErrorCode.YOU_ALREADY_HU)
    @ConditionFilter(ErrorCode.YOU_CANT_CHU_PAI)
    @ConditionFilter(ErrorCode.YOU_NEED_GUO_FIRST)
    @ConditionFilter(ErrorCode.YOU_DONT_HAVE_CARD)
    @ConditionFilter(ErrorCode.THIS_CARD_CANT_PLAY)
    C_ChuPai(gamber: MJGamberModel, pai: number) {
        this.chuPaiTask.clearTask();

        gamber.canChuPai = false;
        this.foldNum++;
        gamber.discard(pai);
        this.cardMgr.sortCard(gamber.holds, this.huns);
        this.lastGangGamber = null;
        this.chuPai = pai;
        this.updateTingMap(gamber);
        this.notifyOperate(gamber, MJOperate.CHU_PAI, pai);
        this.updateOtherOperations(gamber, pai)
        if (!this.otherHasOperate(gamber)) {
            this.notifyFold(gamber, pai);
            this.nextState();
            // this.chuPai = -1;
            // this.getNextGamber();
            // this.doUserMoPai();
        }
    }

    @ConditionFilter(ErrorCode.THIS_IS_YOUR_CARD)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, MJOperate.CHI)
    @ConditionFilter(ErrorCode.YOU_ALREADY_HU)
    C_Chi(gamber: MJGamberModel, index: number) {
        let userId = gamber.userId;
        for (let otherGamber of this.gambers) {
            if (otherGamber != gamber) {
                if (otherGamber.canHu || otherGamber.canGang || otherGamber.canPeng) {
                    this.operateWant[userId] = {op: "chi", index: index};
                    return;
                }
            }
        }
        
        let chipai = null;
        for (let chiPai of gamber.chiPai) {
            if (chiPai.index == index) {
                chipai = chiPai;
            }
        }
        if(chipai == null || chipai.pai != this.chuPai) {
            return ErrorCode.UNKNOWN_ERROR;
        }
        for (let pai of chipai.chi) {
            if (pai != chipai.pai && !gamber.countMap[pai]) {
                return ErrorCode.YOU_DONT_HAVE_CARD;
            }
        }

        this.operateTask[userId].clearTask();
        this.clearAllOptions();
        for (let pai of chipai.chi) {
            if (pai != chipai.pai) {
                gamber.discard(pai);
            }
        }

        gamber.penggangs.push(["chi",chipai]);
        // let data = {userId:userId, chipai:chipai};
        this.notifyOperate(gamber, MJOperate.CHI, chipai);

        this.nextState(gamber);
        // this.chuPai = -1;        
        // this.getNextGamber(gamber);
        // this.turnPlayCard();
    }

    @ConditionFilter(ErrorCode.THIS_IS_YOUR_CARD)
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, MJOperate.PENG)
    @ConditionFilter(ErrorCode.YOU_ALREADY_HU)
    C_Peng(gamber: MJGamberModel) {
        let userId = gamber.userId;
        for (let otherGamber of this.gambers) {
            if (otherGamber != gamber) {
                if (otherGamber.canHu) {
                    this.operateWant[userId] = {op: "peng"};
                    return;
                }
            }
        }
        let pai = this.chuPai;
        if (!FDCardPointMgr.canPeng(this, gamber, pai)) {
            return ErrorCode.UNEXCEPT_OPERATE;
        }
        this.operateTask[userId].clearTask();
        this.clearAllOptions();
        delete this.guoshoupeng[userId];	//移除过手碰限制
        //进行碰牌处理
        //扣掉手上的牌
        //从此人牌中扣除
        for (let i = 0; i < 2; ++i) {
            gamber.discard(pai);
        }
        gamber.penggangs.push(["peng",pai]);
        // let data = {userId:userId, pai:pai};
        this.notifyOperate(gamber, MJOperate.PENG, pai);
        this.net.G_SyncHolds(gamber.userId, gamber.holds);

        this.nextState(gamber);
        // this.chuPai = -1;
        // this.getNextGamber(gamber);
        // this.turnPlayCard();
    }

    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, MJOperate.GANG)
    @ConditionFilter(ErrorCode.YOU_ALREADY_HU)
    C_Gang(gamber: MJGamberModel, pai: number) {
        let userId = gamber.userId;
        if (gamber.gangPai.indexOf(pai) < 0) {
            return ErrorCode.YOU_DONT_HAVE_CARD;
        }
        for (let otherGamber of this.gambers) {
            if (otherGamber != gamber) {
                if (otherGamber.canHu) {
                    this.operateWant[userId] = {op: "gang", pai: pai};
                    return;
                }
            }
        }

        let numOfCnt = gamber.countMap[pai];
        let gangtype = ""
        //弯杠 去掉碰牌
        if(numOfCnt == 1) {
            gangtype = "wangang"
        } else if(numOfCnt == 3) {
            gangtype = "diangang"
        } else if(numOfCnt == 4) {
            gangtype = "angang";
        } else {
            return ErrorCode.UNKNOWN_ERROR;
        }
        
        this.operateTask[userId].clearTask();
        this.clearAllOptions();
        delete this.guoshoupeng[userId];	//移除过手碰限制

        gamber.canChuPai = false;

        let data = {pai:pai, gangtype:gangtype};
        this.notifyOperate(gamber, MJOperate.HAN_GANG, data);

	    //如果是弯杠，则需要检查是否可以抢杠胡
        if(numOfCnt == 1 && this.checkCanQiangGang(gamber, pai)) {
            this.operateWant[userId] = {op: "gang", pai: pai};
            return;
        }

        this.doGang(gamber, gangtype, numOfCnt, pai);
    }

    doGang(gamber: MJGamberModel, gangtype: string, numOfCnt: number, pai: number){
        if (gamber.countMap[pai] != numOfCnt) {
            return ErrorCode.YOU_DONT_HAVE_CARD;
        }
        
        //记录下玩家的杠牌
        if (gangtype == "angang"){
            gamber.penggangs.push(["angang",pai]);
        } else if (gangtype == "diangang"){
            gamber.penggangs.push(["diangang",pai]);
        } else if (gangtype == "wangang"){
            for (let penggang of gamber.penggangs) {
                if (penggang[0] == "peng" && penggang[1] == pai) {
                    penggang[0] = "wangang";
                    break;
                }
            }
        }
        //进行碰牌处理
        //扣掉手上的牌
        //从此人牌中扣除
        for(let i = 0; i < numOfCnt; ++i){
            gamber.discard(pai);
        }
        this.updateTingMap(gamber);

        
        let data = {pai:pai, gangtype:gangtype};
        this.notifyOperate(gamber, MJOperate.GANG, data);
    
        let lastFangGangSeat = this.turnGamber.seatIndex;

        //变成自己的轮子
        this.nextState(gamber, true);
        // this.getNextGamber(gamber);
        // //再次摸牌
        // this.doUserMoPai(true);
    
        //只能放在这里。因为过手就会清除杠牌标记
        gamber.lastFangGangSeat = lastFangGangSeat;
    }

    
    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, MJOperate.GUO)
    C_Guo(gamber: MJGamberModel) {
        let userId = gamber.userId;
        this.operateTask[userId].clearTask();
        this.clearAllOptions();
        
        if( this.chuPai != -1) {
            if(this.guoshoupeng[ userId ] == null) {
                this.guoshoupeng[ userId ] = {};
            }
            this.guoshoupeng[ userId ][this.chuPai] = 1;
        }
        //这里还要处理过胡的情况
        if(this.chuPai >= 0 && gamber.canHu){
            gamber.guoHuTime ++;
        }
        this.lastGangGamber = gamber;

        this.notifyOperate(gamber, MJOperate.GUO);
	    //如果是玩家自己的轮子，不是接牌，则不需要额外操作
        if (this.chuPai == -1 && this.turnGamber == gamber) {
            return;
        }

        //如果还有人可以操作，则等待
        if (this.otherHasOperate(gamber)) {
            return;
        }

        //如果是已打出的牌，则需要通知。
        if(this.chuPai >= 0) {
            // var uid = game.gameSeats[game.turn].userId;
            // clientMgr.broadcastInRoom(socket.resp.guo_notify,{userId:uid,pai:game.chuPai},seatData.userId,true);
            // recordGameAction(game,socket.resp.guo_notify,{userId:uid,pai:game.chuPai});
            this.notifyFold(gamber, this.chuPai);
            this.chuPai = -1;
        }

        if (this.qiangGangContext && this.qiangGangContext.isValid) {
            this.doGang(this.qiangGangContext.gangGamber, "wangang", 1, this.qiangGangContext.pai);
        } else {
            this.nextState();
            // this.getNextGamber();
            // this.doUserMoPai();
        }
    }

    notifyFold(gamber: MJGamberModel, pai: number) {
        gamber.folds.push(pai);
        this.net.G_Fold(gamber.userId, pai);
    }

    getHuCard() {
        if( this.qiangGangContext != null ) {
            return this.qiangGangContext.pai;
        } else if(this.chuPai == -1) {
            return -1;
        } else {
            return this.chuPai;
        }
    }

    getWinTypes(gamber: MJGamberModel) {
        return MJCardPointMgr.getWinTypes(this, gamber);
    }

    @ConditionFilter(ErrorCode.UNEXCEPT_OPERATE, MJOperate.HU | MJOperate.ZI_MO)
    C_Hu(gamber: MJGamberModel) {
        for (let otherGamber of this.gambers) {
            if (otherGamber != gamber) {
                if (otherGamber.canHu) {
                    this.operateWant[gamber.userId] = {op: "hu"};
                    return
                }
            }
        }
    
        //标记为和牌
        gamber.hued = true;

        if (MJCardPointMgr.isQiangGangHu(this, gamber)) {
            this.qiangGangContext.isValid = false;
            gamber.addCard(this.chuPai);
        } else if (this.chuPai != -1) {
            gamber.addCard(this.chuPai);
        }
        gamber.winTypes = this.getWinTypes(gamber);
    
        this.clearAllOptions(gamber);
    
        //通知前端，有人和牌了
        let isZiMo = MJCardPointMgr.hasWinType(gamber, GameConst.HuType.ZI_MO);
        let cmd = isZiMo ? MJOperate.ZI_MO : MJOperate.HU;
        let data = {userId:gamber.userId, hupai:this.getHuCard()};
        this.notifyOperate(gamber, cmd, data);

        this.nextState();
    };
    
    updateOtherOperations(gamber: MJGamberModel, pai: number) {
        for (let otherGamber of this.gambers) {
            //玩家自己不检查
            if(gamber == otherGamber){
                continue;
            }
            //已经和牌的不再检查
            if(otherGamber.hued){
                continue;
            }
            if ( (otherGamber.seatIndex - gamber.seatIndex + this.gamberNum) % this.gamberNum == 1 ) {
                this.updateChi(otherGamber, pai);
            }
            if( this.guoshoupeng[ otherGamber.userId ] == null || this.guoshoupeng[ otherGamber.userId ][pai] == null) {
                //当前用户未被限制，才能碰
                this.updatePeng(otherGamber, pai);
            }
            this.updateDingGang(otherGamber, pai);
            this.updateCanHu(otherGamber, pai);
            if (this.hasOperations(otherGamber)) {
                this.sendOperations(otherGamber, pai);
            }
        }
    }

    otherHasOperate(gamber: MJGamberModel) {
        for (let otherGamber of this.gambers) {
            if(gamber == otherGamber){
                continue;
            }
            if (this.hasOperations(otherGamber)) {
                return true;
            }
        }
        return false;
    }

    getOptionalOperate(gamber: MJGamberModel) {
        let op = 0;
        if (gamber.canChi) {
            op |= MJOperate.CHI;
        }
        if (gamber.canPeng) {
            op |= MJOperate.PENG;
        }
        if (gamber.canGang) {
            op |= MJOperate.GANG;
        }
        if (gamber.canHu && !this.hasYouJin(gamber)) {
            if (this.turnGamber == gamber) {
                op |= MJOperate.ZI_MO;
            } else {
                op |= MJOperate.HU;
            }
        }
        if (op) {
            op |= MJOperate.GUO;
        }
        if (gamber.canChuPai) {
            op |= MJOperate.CHU_PAI;
        }
        return op;
    }

    notifyOperate(gamber: MJGamberModel, operate: any, data: any = {}) {
        gamber.operates.push({operate: operate, value: data});
        if (operate == MJOperate.GUO) {
            this.net.G_DoOperate(gamber.userId, operate, data, gamber.userId);
        } else {
            this.net.G_DoOperate(gamber.userId, operate, data);
        }
        this.net.G_SyncHolds(gamber.userId, gamber.holds);
        LogUtil.debug("G_DoOperate", gamber.userId, operate, data, gamber.holds);
        this.recordMgr.recordOperate(gamber.userId, operate, data);
    }

    State_betting(gamber?: MJGamberModel, isGang: boolean = false) {
        this.turnGamber = gamber || this.getNextGamber(this.turnGamber);

        this.chuPai = -1;
        if (!gamber || isGang) {
            this.doUserMoPai(this.turnGamber, isGang);
        }
        this.turnPlayCard();
    }
    
    doUserMoPai( gamber: MJGamberModel, isGang: boolean = false, canSendOperate: boolean = true) {
        this.chuPai = -1;
        gamber.lastFangGangSeat = -1;
        let userId = gamber.userId;

        let pai = this.cardMgr.drawCard(isGang);
        if (pai == null) {
            this.nextState();
            return;
        }
        gamber.addCard(pai);
        if (this.turnGamber != gamber) {
            this.cardMgr.sortCard(gamber.holds);
        }
        this.net.G_DrawCard(userId, pai);
        this.net.G_SyncHolds(gamber.userId, gamber.holds, this.turnGamber == gamber);

        this.notifyLeftCard();
        //移除过手碰
        if(this.guoshoupeng[userId]){
            delete this.guoshoupeng[userId];
        }
    
        //广播通知玩家出牌方
        // if (canSendOperate) {
        //     this.turnPlayCard(pai);
        // }
        
        //检查是否可以暗杠或者胡
        //检查胡，直杠，弯杠
        this.updateGang(gamber);
    
        //检查看是否可以和
        this.updateCanHu(gamber, pai);
    
        //通知玩家做对应操作
        if (canSendOperate) {
            this.sendOperations(gamber, this.chuPai);
        }
        return pai;
    }

    updateGang(gamber: MJGamberModel, pai?: number) {
        gamber.canGang = false;
        gamber.gangPai = [];
        this.updateAnGang(gamber);
        this.updateWanGang(gamber);
        if (pai != null) {
            this.updateDingGang(gamber, pai);
        }
    }

    updateChi(gamber: MJGamberModel, pai: number) {
        let chiPai = MJCardPointMgr.getChiCard(this, gamber, pai);
        if (chiPai && chiPai.length > 0) {
            gamber.canChi = true;
            gamber.chiPai = gamber.chiPai.concat(chiPai);
        }
    }

    updatePeng(gamber: MJGamberModel, pai: number) {
        if (MJCardPointMgr.canPeng(this, gamber, pai)) {
            gamber.canPeng = true;
        }
    }

    updateAnGang(gamber: MJGamberModel) {
        let gangPai = MJCardPointMgr.getAnGangCards(this, gamber);
        gamber.gangPai = gamber.gangPai.concat(gangPai);
        if (gamber.gangPai.length > 0) {
            gamber.canGang = true;
        }
    }

    updateWanGang(gamber: MJGamberModel) {
        let gangPai = MJCardPointMgr.getWangGangCards(this, gamber);
        gamber.gangPai = gamber.gangPai.concat(gangPai);
        if (gamber.gangPai.length > 0) {
            gamber.canGang = true;
        }
    }

    updateDingGang(gamber: MJGamberModel, pai: number) {
        let gangPai = MJCardPointMgr.getDianGangCards(this, gamber, pai);
        gamber.gangPai = gamber.gangPai.concat(gangPai);
        if (gamber.gangPai.length > 0) {
            gamber.canGang = true;
        }
    }

    updateTingMap(gamber: MJGamberModel) {
        let data = MJCardPointMgr.getTingCard(this, gamber);
        if (data) {
            gamber.tingMap = data.tingMap;
            gamber.pattern = data.pattern;
        } else {
            gamber.tingMap = [];
        }
    }

    clearAllOptions(gamber?: MJGamberModel) {
        if (gamber) {
            this.clearGamberOption(gamber);
        } else {
            this.qiangGangContext = null;
            for (let gamber of this.gambers) {
                this.clearGamberOption(gamber);
            }
        }
    }

    getNextGamber(gamber: MJGamberModel) {
        let start = this.gambers.indexOf(gamber) + 1;
        let end = start + this.gamberNum - 1;
        for (let i = start; i < end; ++i) {
            let index = i % this.gamberNum;
            if (!this.gambers[index].hued) {
                return this.gambers[index];
            }
        }
        return gamber;
    }

    checkCanQiangGang(gangGamber: MJGamberModel, pai: number){
        let canQiangGang = false;
        for (let gamber of this.gambers) {
            if (gamber == gangGamber || gamber.hued) {
                continue;
            }
            this.updateCanHu(gamber, pai);
            if (gamber.canHu) {
                this.sendOperations(gamber, pai);
                canQiangGang = true;
            }
        }
        if (canQiangGang) {
            this.qiangGangContext = {
                turnGamber: this.turnGamber,
                gangGamber: gangGamber,
                pai: pai,
                isValid: true,
            }
        } else {
            this.qiangGangContext = null;
        }
        return canQiangGang;
    }

    State_showCard() {
        let data: any = {};
        for (let gamber of this.gambers) {
            data[gamber.userId] = {
                userId: gamber.userId,
                holds: gamber.holds,
                penggangs: gamber.penggangs,
            };
        }
        this.net.G_ShowCard(data);
        this.nextState();
    }

    hasYouJin(gamber: MJGamberModel) {
        return false;
    }

    settle() {

    }

    State_settle(forceOver: boolean = false) {
        for (let gamber of this.gambers) {
            this.operateTask[gamber.userId].clearTask();
        }
        super.State_settle(forceOver);
    }

    getSettleExtraData(gamber: MJGamberModel) {
        let direction = (gamber.seatIndex - this.wind + this.gamberNum) % this.gamberNum;
        return {
            penggangs: gamber.penggangs,
            flowers: gamber.flowers,
            hued: gamber.hued,
            laizi: this.huns,
            direction: direction,
            winTypes: gamber.winTypes,
            huCard: this.chuPai < 0 ? gamber.holds[gamber.holds.length-1] : this.chuPai,
        };
    }
    
    hasOperations(gamber: MJGamberModel){
        if(gamber.canGang || gamber.canPeng || gamber.canChi || (gamber.canHu && !this.hasYouJin(gamber))){
            return true;
        }
        return false;
    }
    
    sendOperations(gamber: MJGamberModel, pai: number = -1) {
        if(this.hasOperations(gamber)){
            if(pai == -1){
                pai = gamber.holds[gamber.holds.length - 1];
            }
            
            let data: any = {pai:pai};
            // if(gamber.canHu && !this.hasYouJin(gamber)) {
            //     data.hu = true;
            // }
            // if(gamber.canGang) {
            //     data.gang = true;
            //     data.gangpai = gamber.gangPai;
            // }
            // if(gamber.canPeng) {
            //     data.peng = true;
            // }
            // if(gamber.canChi) {
            //     data.chi = true;
            //     data.chipai = gamber.chiPai;
            // }
            data.chiPai = gamber.chiPai;
            data.gangPai = gamber.gangPai;
            data.optionalOperate = this.getOptionalOperate(gamber);

            //如果可以有操作，则进行操作
            data.userId = gamber.userId;
            data.time = GameConst.GameTime.MJ_OPERATE;
            this.net.G_MJOperate(data);
            // logger.game_log(gamber.userId, socket.resp.game_action, "有操作", data);
            // clientMgr.sendMsg(gamber.userId,socket.resp.game_action,data);

            let userId = gamber.userId;
            this.operateWant[userId] = {op: "guo"};
            this.operateTask[userId].beginTask(() => {
                let op = this.operateWant[userId] ? this.operateWant[userId].op : "guo";
                if (op == "hu") {
                    this.C_Hu(gamber);
                } else if (op == "gang") {
                    let pai = this.operateWant[userId].pai;
                    this.C_Gang(gamber, pai);
                } else if (op == "peng") {
                    this.C_Peng(gamber);
                } else if (op == "chi") {
                    let index = this.operateWant[userId].index;
                    this.C_Chi(gamber, index);
                } else {
                    this.C_Guo(gamber);
                }
                this.operateWant[userId] = null;
            }, GameConst.GameTime.MJ_OPERATE);
        }
    }

    updateCanHu(gamber: MJGamberModel, targetCard: number) {
        gamber.pattern = MJCardPointMgr.getHuPattern(this, gamber, targetCard);
        gamber.canHu = gamber.pattern != GameConst.HuType.NONE;
    }

    reconnectOverDecideBanker(userId: string) {
        this.net.G_Hun(this.hun, this.huns, userId);
        this.net.G_DecideWind(this.gambers[this.wind].userId, userId);
        this.net.G_DecideBanker(this.bankerId, [], userId);
    }

    reconnectOnBetting(userId: string, gamber: GamberModel): void {
        for (let record of this.recordMgr.operateRecords) {
            this.net.G_DoOperate(record.userId, record.operate, record.value, userId);
        }
        for (let tmpGamber of this.gambers) {
            for (let pai of tmpGamber.folds) {
                this.net.G_Fold(tmpGamber.userId, pai, null, gamber.userId);
            }
            this.net.G_SyncCombines(tmpGamber.userId, tmpGamber.penggangs, gamber.userId);
        }
        this.net.G_TurnPlayCard(this.turnGamber.userId, userId);
        this.net.G_SyncHolds(gamber.userId, gamber.holds, this.turnGamber == gamber);
        if (this.hasOperations(<MJGamberModel>gamber)) {
            this.sendOperations(<MJGamberModel>gamber, this.chuPai);
        }
    }

    getAllState() {
        return [GameConst.GameState.IDLE, GameConst.GameState.DECIDE_BANKER, GameConst.GameState.DRAW_CARD, GameConst.GameState.BETTING, GameConst.GameState.SHOW_CARD, GameConst.GameState.SETTLE];
    }

    generateCardMgr(): CardMgr {
        return new MJCardMgr();
    }

    generateGamber(): GamberModel {
        return new MJGamberModel();
    }
}