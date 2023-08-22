import GamberModel from "./GamberModel";
import RoomConfModel from "../Room/RoomConfModel";
import GameNet from "./GameNet";
import CardMgr from "./CardMgr";
import { GameConst } from "../GameConst";
import GameRecord from "./GameRecord";
import RoomMgr from "../Room/RoomMgr";
import GameUtil from "../../utils/GameUtil";
import LogUtil from "../../utils/LogUtil";
import { ConditionFilter } from "../../utils/ConditionFilter";
import { ErrorCode } from "../ErrorCode";
const db = require("../../utils/db");


export default class GameMgr {
    round: number;
    cardMgr: CardMgr;
    banker: GamberModel;
    turnGamber: GamberModel;
    roomConf: RoomConfModel;
    gambers: GamberModel[];
    net: GameNet;
    room: RoomMgr;
    gameState: GameConst.GameState;
    recordMgr: GameRecord;
    winnerId: string | null;
    fundPool: number = 0;

    sortCard: boolean = false;
    huns: number[] = [];

    stateTimer: any;
    stateTime: number;
    timerCB: Function | null;
    forceOver: boolean;
    
    get waiveWhenTimeout() {
        return this.roomConf.getValue("超时弃牌");
    }
    
    get baseScore() {
        return this.roomConf.baseScore;
    }

    constructor(room: RoomMgr, net: GameNet) {
        this.room = room;
        this.roomConf = room.roomConf;
        this.net = net;
    }

    get gamberNum(): number {
        return this.gambers.length;
    }

    setGameInitData(data: any) {

    }

    saveGameLeftData(data: any) {
        data.record = this.recordMgr;
        this.room.gameLeftData = data;
    }

    generateCardMgr() {
        return new CardMgr();
    }

    generateGamber() {
        return new GamberModel();
    }

    getBrightCardNum() {
        return 5;
    }

    getDarkCardNum() {
        return 0;
    }

    getBankerAdditionalCard() {
        return 0;
    }
    
    beginGame(gambers: GamberModel[]) {
        let room = this.room;
        if (room.gameLeftData) {
            this.setGameInitData(room.gameLeftData);
            this.recordMgr = room.gameLeftData.record;
        }

        this.round = this.room.round;
        this.recordMgr = this.recordMgr || new GameRecord();
        this.gambers = [];
        for (let i = 0; i < gambers.length; ++i) {
            if (gambers[i].isNew) {
                let gamber = this.generateGamber();
                gamber.reset();
                gamber.isNew = false;
                gamber.userId = gambers[i].userId;
                gamber.seatIndex = gambers[i].seatIndex;
                this.gambers.push(gamber);
            } else {
                this.gambers.push(gambers[i]);
                gambers[i].reset();
            }
        }
        this.gambers.sort((a: GamberModel, b: GamberModel) => {
            return a.seatIndex - b.seatIndex;
        });
        this.gameState = GameConst.GameState.IDLE;
        this.cardMgr = this.generateCardMgr();

        this.initGame();
        this.updatePermissions();
        this.nextState();
    }

    nextState(...args: any[]) {
        switch(this.gameState) {
            case GameConst.GameState.IDLE:
                this.StateOver_idle(...args);
                break;
            case GameConst.GameState.ROB_BANKER:
                this.StateOver_robBanker(...args);
                break;
            case GameConst.GameState.DECIDE_BANKER:
                this.StateOver_decideBanker(...args);
                break;
            case GameConst.GameState.DRAW_CARD:
                this.StateOver_drawCard(...args);
                break;
            case GameConst.GameState.BETTING:
                this.StateOver_betting(...args);
                break;
            case GameConst.GameState.SHOW_CARD:
                this.StateOver_showCard(...args);
                break;
            case GameConst.GameState.SETTLE:
                this.StateOver_settle(...args);
                break;
        }
    }

    StateOver_idle(...args: any) {
        this.updateGameState(GameConst.GameState.ROB_BANKER);
        this.State_robBanker();
    }

    State_robBanker() {
        this.updateGameState(GameConst.GameState.ROB_BANKER);
        this.net.G_RobBanker(this.getRobBankerValues());
        this.beginTimer(GameConst.GameTime.ROB_BANKER, () => {
            this.nextState();
        });
    }

    getRobBankerValues() {
        return [1];
    }

    StateOver_robBanker(...args: any) {
        this.updateGameState(GameConst.GameState.DECIDE_BANKER);
        this.State_decideBanker();
    }

    State_decideBanker(...args: any) {
        let maxRobScore = 0;
        let robBankerGambers: string[] = [];
        for (let gamber of this.gambers) {
            if (gamber.scoreRobBanker == null) {
                continue;
            }
            if (gamber.scoreRobBanker > maxRobScore) {
                robBankerGambers = [gamber.userId];
                maxRobScore = gamber.scoreRobBanker;
            } else if (gamber.scoreRobBanker == maxRobScore) {
                robBankerGambers.push(gamber.userId);
            }
        }
        if (robBankerGambers.length == 0) {
            robBankerGambers = this.getGamberIds();
        }
        let index = GameUtil.random(robBankerGambers.length - 1);
        let userId = robBankerGambers[index];

        for (let gamber of this.gambers) {
            if (gamber.userId == userId) {
                this.banker = gamber;
                break;
            }
        }

        this.net.G_DecideBanker(this.banker.userId, robBankerGambers);
        this.nextState();
    }

    StateOver_decideBanker(...args: any) {
        this.beginTimer(GameConst.GameTime.DECIDE_BANKER, () => {
            this.updateGameState(GameConst.GameState.DRAW_CARD);
            this.State_drawCard(...args);
        });
    }

    State_drawCard(...args: any) {
        this.initHolds();
        this.G_InitHolds();
        this.notifyLeftCard();
        this.nextState();
    }

    StateOver_drawCard(...args: any) {
        this.updateGameState(GameConst.GameState.BETTING);
        this.State_betting(this.banker);
    }

    State_betting(gamber?: GamberModel) {
        this.turnGamber = gamber || this.getNextGamber(this.turnGamber);
        this.nextState();
    }

    StateOver_betting(...args: any) {
        if (this.isGameCanOver(this.turnGamber)) {
            this.updateGameState(GameConst.GameState.SHOW_CARD);
            this.State_showCard();
        } else {
            this.State_betting(...args);
        }
    }

    State_showCard() {
        this.net.G_ShowCard(this.getShowCardData());
        this.nextState();
    }

    getShowCardData() {
        let data: any = {};
        for (let gamber of this.gambers) {
            let ext = this.getShowCardExtData(gamber);
            data[gamber.userId] = GameUtil.mergeDict({
                userId: gamber.userId,
                holds: gamber.holds,
            }, ext);
        }
        return data;
    }

    getShowCardExtData(gamber: GamberModel) {
        return {
            cardType: 0,
            dead: false,
        }
    }

    StateOver_showCard(...args: any) {
        this.beginTimer(GameConst.GameTime.SHOW_CARD, () => {
            this.updateGameState(GameConst.GameState.SETTLE);
            this.State_settle(...args);
        });
    }

    settle() {

    }

    getSettleExtraData(gamber: GamberModel) {
        return {};
    }

    State_settle(forceOver: boolean = false) {
        this.winnerId = null;
        if (!forceOver) {
            this.settle();
        }
        this.forceOver = forceOver;
        let data = this.getSettleData(forceOver);
        this.recordMgr.recordSettle(this.room.roomId, this.roomConf, data);
        this.net.G_GameSettle(data);
        this.nextState();
    }

    getSettleData(forceOver: boolean = false) {
        let data: any = {
            round: this.round,
            forceOver: forceOver,
            settles: {},
            endTime: Date.now(),
        }
        for (let gamber of this.gambers) {
            let score = gamber.score - gamber.scoreBegin;
            if (forceOver) {
                score = 0;
            }
            let userId = gamber.userId;
            let isWin = score >= 0;
            let extData = this.getSettleExtraData(gamber);
            data.settles[gamber.userId] = {
                userId: gamber.userId,
                holds: gamber.holds,
                score: score,
                isWin: isWin,
                isBanker: this.banker ? this.banker.userId == gamber.userId : false,
                operates: gamber.operates,
            };
            data.settles[userId] = GameUtil.mergeDict(data.settles[userId], extData);
        }
        return data;
    }

    StateOver_settle(...args: any) {
        // this.updateGameState(GameConst.GameState.IDLE);
        this.saveGameLeftData({});
        this.room.gameOver();
    }

    isGameCanOver(gamber: GamberModel) {
        return true;
    }

    initGame() {
        this.net.G_BeginGame(this.round);

        for (let gamber of this.gambers) {
            gamber.scoreBegin = gamber.score;
        }
    }

    initHolds() {
        this.cardMgr.shuffle();
        for (let gamber of this.gambers) {
            let cardNum = this.getBrightCardNum() + this.getDarkCardNum();
            for (let i = 0; i < cardNum; ++i) {
                let card = this.cardMgr.drawCard();
                card != null && gamber.addCard(card);
            }
            this.sortCard && this.cardMgr.sortCard(gamber.holds, this.huns);
        }
        for (let i = 0; i < this.getBankerAdditionalCard(); ++i) {
            let card = this.cardMgr.drawCard();
            card != null && this.banker.addCard(card);
        }
        for (let gamber of this.gambers) {
            LogUtil.debug("cards: ", gamber.userId, gamber.holds);
        }
    }

    swapGamberSeat(seatIndex: number, anotherSeatIndex: number) {
        this.gambers[seatIndex].seatIndex = anotherSeatIndex;
        this.gambers[anotherSeatIndex].seatIndex = seatIndex;
        GameUtil.swap(this.gambers, seatIndex, anotherSeatIndex);
    }

    @ConditionFilter(ErrorCode.GAME_STATE_ERROR, GameConst.GameState.ROB_BANKER)
    C_Rob(gamber: GamberModel, value: number) {
        if (gamber.scoreRobBanker != null) {
            return ErrorCode.YOU_ALREADY_ROB_BANKER;
        }
        gamber.scoreRobBanker = value;
        this.net.G_Rob(gamber.userId, value);

        for (let gamber of this.gambers) {
            if (gamber.scoreRobBanker == null) {
                return;
            }
        }
        this.clearStateTimer();
        this.nextState();
    }

    G_InitHolds(syncUserId?: string) {
        let holds: { [key: string]: any[] } = {};
        for (let gamber of this.gambers) {
            holds[gamber.userId] = GameUtil.deepClone(gamber.holds);
            for (let i = gamber.holds.length - this.getDarkCardNum(); i < gamber.holds.length; ++i) {
                holds[gamber.userId][i] = -1;
            }
        }
        this.net.G_InitHolds(holds, syncUserId);
    }

    notifyLeftCard() {
        let cardNum = this.cardMgr.getLeftCardNum();
        this.net.G_LeftCard(cardNum);
    }

    getOptionalOperate(gamber: GamberModel) {
        return 0;
    }

    getGamberByUserId(userId: string) {
        for (let gamber of this.gambers) {
            if (gamber.userId == userId) {
                return gamber;
            }
        }
    }

    changeGamberScore(gamber: GamberModel, changeScore: number, isBetting: boolean = false) {
        gamber.score += changeScore;
        if (isBetting) {
            gamber.scoreBetting -= changeScore;
            gamber.scoreBettings.push(-changeScore);
        }
        this.net.G_GamberScoreChange(gamber.userId, changeScore, gamber.score, gamber.scoreBetting);
    }
    
    CA_ShowReplaceCard(gamber: GamberModel) {
        this.doPermissionTask(gamber.userId, () => {
            this.net.GA_ShowReplaceCard(gamber.userId, gamber.holds, this.cardMgr.getLeftCards());
        });
    }
    
    CA_ReplaceCard(gamber: GamberModel, hold: number, targetCard: number) {
        this.doPermissionTask(gamber.userId, () => {
            let holdIndex = gamber.holds.indexOf(hold);
            let heapIndex = this.cardMgr.getCardIndexInHeap(targetCard);
            if (holdIndex < 0 || heapIndex < 0) {
                return;
            }
            let card = gamber.holds[holdIndex];
            gamber.holds[holdIndex] = this.cardMgr.cardHeap[heapIndex];
            this.cardMgr.cardHeap[heapIndex] = card;
            this.net.GA_ReplaceCard(gamber.userId, gamber.holds, this.cardMgr.getLeftCards());
        });
    }

    CA_Perspect(gamber: GamberModel) {
        this.doPermissionTask(gamber.userId, () => {
            let allHolds: { [ key: string ] : number[] } = {};
            for (let gamber of this.gambers) {
                allHolds[gamber.userId] = gamber.holds;
            }
            this.net.GA_Perspect(gamber.userId, allHolds);
        });
    }

    doPermissionTask(userId: string, callback: Function) {
        db.niuniu_permission(userId, (times: number) => {
            if (times > 0) {
                callback && callback();
            }
        });
    }

    updatePermissions() {
        for (let gamber of this.gambers) {
            db.niuniu_permission(gamber.userId, (times: number) => {
                if (times > 0) {
                    this.net.G_UpdatePermission(gamber.userId);
                }
            });
        }
    }

    getGamberIds() {
        let userIds = [];
        for (let gamber of this.gambers) {
            userIds.push(gamber.userId);
        }
        return userIds;
    }

    getNextGamber(gamber: GamberModel) {
        let index = (1 + gamber.seatIndex) % this.gamberNum;
        return this.gambers[index];
    }

    update() {
        this.stateTime -= 1;
        this.net.G_UpdateTimer(this.stateTime);
        if (this.stateTime <= 0) {
            this.clearStateTimer();
            let cb = this.timerCB;
            this.timerCB = null;
            cb && cb();
        }
    }

    beginTimer(time: number, callback: Function) {
        this.clearStateTimer();
        this.stateTime = time + 1;
        this.timerCB = callback;
        this.stateTimer = setInterval(this.update.bind(this), 1000);
        this.update();
    }

    clearStateTimer() {
        if (this.stateTimer) {
            clearInterval(this.stateTimer);
            this.stateTimer = null;
        }
    }

    notifyOperate(gamber: GamberModel, operate: any, data: any = null) {
        gamber.operates.push({operate: operate, value: data});
        this.net.G_DoOperate(gamber.userId, operate, data);
        this.recordMgr.recordOperate(gamber.userId, operate, data);
    }

    changeFundPool(changeScore: number) {
        this.fundPool += changeScore;
        this.net.G_FundPoolChange(this.fundPool);
    }

    isRoundOver() {
        return true;
    }

    reconnect(userId: string) {
        let gamber = this.getGamberByUserId(userId);
        this.updateGameState(this.gameState);
        for (let state of this.getAllState()) {
            LogUtil.debug("开始重连", userId, state)
            if (this.gameState == state) {
                this.reconnectOnState(state, userId, gamber);
                return;
            } else {
                this.reconnectOverState(state, userId, gamber);
            }
        }
    }

    reconnectOnState(state: GameConst.GameState, userId: string, gamber?: GamberModel) {
        switch(state) {
            case GameConst.GameState.IDLE:
                break;
            case GameConst.GameState.ROB_BANKER:
                this.net.G_RobBanker(this.getRobBankerValues(), userId);
                break;
            case GameConst.GameState.DECIDE_BANKER:
                this.reconnectOnDecideBanker(userId);
                break;
            case GameConst.GameState.DRAW_CARD:
                this.G_InitHolds(userId);
                break;
            case GameConst.GameState.BETTING:
                this.reconnectOnBetting(userId, gamber);
                break;
            case GameConst.GameState.SHOW_CARD:
                this.net.G_ShowCard(this.getShowCardData(), userId);
                break;
            case GameConst.GameState.SETTLE:
                let data = this.getSettleData(this.forceOver);
                data.isReady = this.room.isReady(userId);
                this.net.G_GameSettle(data, userId);
                break;
        }
    }

    reconnectOverState(state: GameConst.GameState, userId: string, gamber?: GamberModel) {
        switch(state) {
            case GameConst.GameState.IDLE:
                this.reconnectOverIdle(userId);
                break;
            case GameConst.GameState.ROB_BANKER:
                break;
            case GameConst.GameState.DECIDE_BANKER:
                this.reconnectOverDecideBanker(userId);
                break;
            case GameConst.GameState.DRAW_CARD:
                this.reconnectOverDrawCard(userId);
                break;
            case GameConst.GameState.BETTING:
                break;
            case GameConst.GameState.SHOW_CARD:
                break;
            case GameConst.GameState.SETTLE:
                break;
        }
    }

    reconnectOverIdle(userId: string) {
        this.net.G_BeginGame(this.round, userId);
    }

    reconnectOnDecideBanker(userId: string) {
        if (this.banker) {
            this.net.G_DecideBanker(this.banker.userId, [], userId);
        }
    }

    reconnectOverDecideBanker(userId: string) {
        if (this.banker) {
            this.net.G_DecideBanker(this.banker.userId, [], userId);
        }
    }

    reconnectOverDrawCard(userId: string) {
        this.G_InitHolds(userId);
    }

    getAllState() {
        return [
            GameConst.GameState.IDLE, 
            GameConst.GameState.ROB_BANKER, 
            GameConst.GameState.DECIDE_BANKER, 
            GameConst.GameState.DRAW_CARD, 
            GameConst.GameState.BETTING, 
            GameConst.GameState.SHOW_CARD, 
            GameConst.GameState.SETTLE
        ];
    }

    reconnectOnBetting(userId: string, gamber?: GamberModel) {
        for (let record of this.recordMgr.operateRecords) {
            this.net.G_DoOperate(record.userId, record.operate, record.value, userId);
        }
    }

    updateGameState(state: GameConst.GameState) {
        this.gameState = state;
        this.net.G_GameState(state);
    }

    canPlayHalfway() {
        return true;
    }

    getLeftCardNum() {
        return this.cardMgr.getLeftCardNum();
    }

    destroy() {
        for (let gamber of this.gambers) {
            this.net.G_GamberScoreChange(gamber.userId, 0, 0, 0);
        }
        this.net.G_FundPoolChange(0);
        this.clearStateTimer();
    }
}