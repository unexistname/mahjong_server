import AllUserMgr from "../../common/AllUserMgr";
import UserModel from "../../common/UserModel";
import { ConditionFilter } from "../../utils/ConditionFilter";
import GameUtil from "../../utils/GameUtil";
import TimerTask from "../../utils/TimerTask";
import FDDZGameMgr from "../DaZha/FDDZGameMgr";
import FDDZNet from "../DaZha/FDDZNet";
import DZGameMgr from "../DeZhou/DZGameMgr";
import DZNet from "../DeZhou/DZNet";
import DXGameMgr from "../DiaoXie/DXGameMgr";
import DXNet from "../DiaoXie/DXNet";
import { ErrorCode } from "../ErrorCode";
import FDGameMgr from "../FuDing/FDGameMgr";
import FDNet from "../FuDing/FDNet";
import GamberModel from "../Game/GamberModel";
import GameMgr from "../Game/GameMgr";
import GameNet from "../Game/GameNet";
import { GameConst } from "../GameConst";
import MJNet from "../Majhong/MJNet";
import NNGameMgr from "../NiuNiu/NNGameMgr";
import PDKGameMgr from "../PaoDeKuai/PDKGameMgr";
import QSGameMgr from "../QueShen/QSGameMgr";
import SGGameMgr from "../SanGong/SGGameMgr";
import SSSGameMgr from "../ShiSanShui/SSSGameMgr";
import SSSNet from "../ShiSanShui/SSSNet";
import ZJHGameMgr from "../ZhaJinHua/ZJHGameMgr";
import ZJHNet from "../ZhaJinHua/ZJHNet";
import AllRoomMgr from "./AllRoomMgr";
import RoomConfModel from "./RoomConfModel";
import RoomUserModel from "./RoomUserModel";


export default class RoomMgr {
    roomId: string;
    roomState: GameConst.RoomState;
    roomConf: RoomConfModel;
    owner: RoomUserModel;
    gambers: { [key: string]: RoomUserModel };
    watchers: { [key: string]: RoomUserModel };
    game?: GameMgr;
    net: GameNet;
    round: number;
    seats: { [key: number]: string };
    kickUserList: string[];
    offlineUsers: { [key: string]: number };
    offlineTimeoutUserList: string[];
    offlineTimer: any;
    dissolveVotes: { [key: string]: boolean };
    dissolveVoteTimer: TimerTask;

    gameLeftData: any;
    record: any;
    createTime: number;

    constructor(roomId: string, roomConf: RoomConfModel, owner: UserModel) {
        this.roomId = roomId;
        this.roomConf = roomConf;
        this.seats = {};
        this.gambers = {};
        this.watchers = {};
        this.dissolveVotes = {};
        this.kickUserList = [];
        this.offlineUsers = {};
        this.offlineTimeoutUserList = [];
        this.roomState = GameConst.RoomState.IDLE;
        this.net = new GameNet(roomId);
        this.round = 0;
        this.createTime = Date.now();
        this.dissolveVoteTimer = new TimerTask();
        this.owner = this.addUser(owner);
    }

    addUser(user: UserModel) {
        if (this.isRoomUser(user.userId)) {
            return this.getRoomUser(user.userId);
        }
        if (this.isOnlyWatch()) {
            return this.addWatcher(user);
        } else {
            return this.addGamber(user);
        }
    }

    isRoomFull() {
        return this.getGamberAmount() >= this.roomConf.gamberAmount;
    }

    isOnlyWatch() {
        if (this.isRoomFull()) {
            return true;
        } else if (this.roomState == GameConst.RoomState.PLAY) {
            return true;
        }
        return false;
    }

    isPrivate() {
        return this.roomConf.isPrivate;
    }

    getRoomUserIds() {
        return GameUtil.mergeList(Object.keys(this.gambers), Object.keys(this.watchers));
    }

    addGamber(user: UserModel) {
        let gamber = new RoomUserModel(user);
        gamber.isReady = false;
        gamber.isWatch = false;
        gamber.seatIndex = this.getEnableSeatIndex();
        this.seats[gamber.seatIndex] = user.userId;
        this.gambers[user.userId] = gamber;
        this.net.G_AddGamber(gamber);
        return gamber;
    }

    swapGamberSeat(userId: string, anotherUserId: string) {
        let gamber = this.gambers[userId];
        let anotherGamber = this.gambers[anotherUserId];
        let tmpSeatIndex = gamber.seatIndex;
        gamber.seatIndex = anotherGamber.seatIndex;
        anotherGamber.seatIndex = tmpSeatIndex;
        this.seats[gamber.seatIndex] = userId;
        this.seats[anotherGamber.seatIndex] = anotherUserId;
        this.net.G_SwapSeat(userId, gamber.seatIndex, anotherUserId, anotherGamber.seatIndex);

        if (this.game) {
            this.game.swapGamberSeat(gamber.seatIndex, anotherGamber.seatIndex);
        }
    }

    addWatcher(user: UserModel) {
        let watcher = new RoomUserModel(user);
        watcher.isWatch = true;
        watcher.isReady = false;
        this.watchers[user.userId] = watcher;
        // this.net.G_AddWatcher(watcher);
        return watcher;
    }

    getEnableSeatIndex() {
        let gamberNum = Object.keys(this.gambers).length;
        for (let i = 0; i < gamberNum; ++i) {
            if (!this.seats[i]) {
                return i;
            }
        }
        return gamberNum;
    }

    getGamberAmount() {
        return Object.keys(this.gambers).length;
    }

    updateReady(userId: string, isReady: boolean) {
        let gamber = this.gambers[userId];
        if (gamber) {
            gamber.isReady = isReady;
            this.net.G_Ready(gamber.userId, isReady);
            this.net.G_UpdateRoomOperate(this, userId);
            if (this.game) {
                this.beginGame(this.owner.userId);
            }
        } else if (isReady && !this.isRoomFull() && this.canJoinHalfway()) {
            let watcher = this.watchers[userId];
            if (watcher) {
                
                watcher.seatIndex = this.getEnableSeatIndex();
                this.seats[watcher.seatIndex] = userId;
                this.gambers[userId] = watcher;

                delete this.watchers[userId];
                this.net.G_WatcherToGamber(watcher);
                this.net.G_Ready(watcher.userId, isReady);
            }
        }
    }

    @ConditionFilter(ErrorCode.ROOM_IS_BEGIN)
    @ConditionFilter(ErrorCode.HAVE_GAMBER_NO_READY)
    @ConditionFilter(ErrorCode.YOU_ARE_NOT_OWNER)
    beginGame(userId: string) {
        if (this.getGamberAmount() < this.getMinBeginGameGamberAmount()) {
            return ErrorCode.GAMBER_NOT_ENOUGH;
        }
        if (!this.game || this.game.isRoundOver()) {
            let code = this.payCost();
            if (!GameUtil.isSuccessCode(code)) {
                return code;
            }
        }
        this.roomState = GameConst.RoomState.PLAY;
        this.updateRound();
        let gambers = this.getGambers();

        this.game = this.generateGame();
        this.game.beginGame(gambers);
    }

    C_DissolveVote(userId: string, vote: boolean) {
        if (this.dissolveVotes[userId] != null) {
            return;
        }
        this.dissolveVotes[userId] = vote;
        this.net.G_DissolveVote(userId, vote);

        if (this.getGamberAmount() == Object.keys(this.dissolveVotes).length) {
            this.dissolveVoteTimer.doTask();
        }
    }

    endDissolveVote() {
        let total = 0, agree = 0;
        for (let useId in this.dissolveVotes) {
            total += 1;
            if (this.dissolveVotes[useId]) {
                agree += 1;
            }
        }
        this.dissolveVotes = {};
        let isDissolve = agree * 2 >= total;
        this.net.G_DissolveResult(isDissolve);
        if (isDissolve) {
            this.dissolve();
        }
    }

    beginDissolveVote(userId: string) {
        this.net.G_ShowDissolveVote();
        this.dissolveVoteTimer.beginTask(
            this.endDissolveVote.bind(this), 
            GameConst.GameTime.DISSOLVE_VOTE);
        this.C_DissolveVote(userId, true);
    }

    @ConditionFilter(ErrorCode.ROOM_IS_UNEXIST)
    C_Dissolve(userId: string) {
        if (this.isBegin()) {
            this.beginDissolveVote(userId);
        } else {
            if (this.owner.userId == userId) {
                this.dissolve();
            } else {
                return ErrorCode.YOU_ARE_NOT_OWNER;
            }
        }
    }

    @ConditionFilter(ErrorCode.ROOM_IS_UNEXIST)
    C_LeaveRoom(userId: string) {
        if (this.isBegin()) {
            this.beginDissolveVote(userId);
        } else {
            this.leaveRoom(userId);
        }
    }

    getMinBeginGameGamberAmount() {
        return this.roomConf.needEqualGamberAmount ? this.roomConf.gamberAmount : 2;
    }

    payCost() {
        if (this.roomConf.payType == GameConst.PayType.OWNER) {
            let amount = this.getGamberAmount();
            let price = this.roomConf.costNum;
            let sum = price * amount;
            let code = AllUserMgr.ins.canCostCurrency(this.owner.userId, this.roomConf.costType, sum);
            if (GameUtil.isSuccessCode(code)) {
                AllUserMgr.ins.costCurrency(this.owner.userId, this.roomConf.costType, sum);
            } else {
                return ErrorCode.OWNER_MONEY_NOT_ENOUGH;
            }
        } else if (this.roomConf.payType == GameConst.PayType.AA) {
            let price = this.roomConf.costNum;
            for (let gamberId in this.gambers) {
                let code = AllUserMgr.ins.canCostCurrency(gamberId, this.roomConf.costType, price);
                if (!GameUtil.isSuccessCode(code)) {
                    return ErrorCode.GAMBER_MONEY_NOT_ENOUGH;
                }
            }
            for (let gamberId in this.gambers) {
                AllUserMgr.ins.costCurrency(gamberId, this.roomConf.costType, price);
            }
        }
    }

    enterRoom(user: UserModel) {
        if (user) {
            this.net.G_PushRoomInfo(this, user.userId);
            this.net.G_UpdateRoomOperate(this, user.userId);
            for (let userId in this.gambers) {
                if (!AllUserMgr.ins.isOnline(userId)) {
                    this.net.G_UserState(userId, false, user.userId);
                }
            }
            if (Object.keys(this.dissolveVotes).length > 0) {
                this.net.G_ShowDissolveVote();
                for (let userId in this.dissolveVotes) {
                    this.net.G_DissolveVote(userId, this.dissolveVotes[userId], userId);
                }
            }
        }
    }

    updateRound() {
        if (!this.game || this.game.isRoundOver()) {
            this.round++;
        }
    }

    gameOver() {
        for (let userId in this.gambers) {
            let gamber = this.gambers[userId];
            gamber.isReady = false;
            this.net.G_Ready(userId, false);
            this.net.G_UpdateRoomOperate(this, gamber.userId);
        }
        this.roomState = GameConst.RoomState.IDLE;

        if (this.game) {
            if (this.round == this.roomConf.roundAmount && this.game.isRoundOver()) {
                this.roomOver();
            }
        }
    }

    canReady(userId: string) {
        if (!this.isRoomGamber(userId)) {
            return false;
        }
        let gamber = this.gambers[userId];
        if (gamber.isReady || gamber.isWatch) {
            return false;
        }
        return true;
    }

    canBegin(userId: string) {
        return !this.isBegin()
                 && userId == this.owner.userId
                 && this.owner.isReady;
    }

    canDissolve(userId: string) {
        return !this.isPlaying() && userId == this.owner.userId;
    }

    canWatch() {
        return this.roomConf.canWatch;
    }

    isPlaying() {
        return this.game != null;// && this.game.gameState != GameConst.GameState.IDLE;
        // return this.roomState == GameConst.RoomState.PLAY;
    }

    isBegin() {
        return this.roomState == GameConst.RoomState.PLAY;
    }

    roomOver() {
        this.roomState = GameConst.RoomState.IDLE;
        if (this.game) {
            this.record = this.game.recordMgr.recordTotalSettle(this.roomId, this.game, this.round);
            this.gameLeftData = null;
            this.game.destroy();
        }
        for (let userId of this.kickUserList) {
            if (this.canLeaveNow(userId)) {
                this.leaveRoom(userId);
            }
        }
        this.round = 0;
        delete this.game;
    }

    C_OverSettle(userId: string) {
        if (this.isPlaying()) {
            this.updateReady(userId, true);
        } else {
            this.net.G_GameOver(userId, GameUtil.deepClone(this.record));
        }
    }

    canJoinHalfway() {
        return this.roomConf.canJoinHalfway;
    }

    getGambers() {
        let gambers: GamberModel[] = [];
        let gamberIds = Object.keys(this.gambers);
        if (this.game) {
            for (let gamber of this.game.gambers) {
                let index = gamberIds.indexOf(gamber.userId);
                if (index >= 0) {
                    gamberIds.splice(index, 1);
                    gambers.push(gamber);
                }
            }
        }
        for (let userId of gamberIds) {
            let roomGamber = this.gambers[userId];
            if (this.game) {
                if (roomGamber.isWatch && !this.game.canPlayHalfway()) {
                    continue;
                } else {
                    roomGamber.isWatch = false;
                }
            }
            let gamber = new GamberModel();
            gamber.userId = userId;
            gamber.seatIndex = roomGamber.seatIndex;
            gambers.push(gamber);
        }
        return gambers;
    }

    generateGame() {
        switch(this.roomConf.gameType) {
            case GameConst.GameType.DIAO_XIE:
                return new DXGameMgr(this, new DXNet(this.roomId));
            case GameConst.GameType.FU_DING:
                return new FDGameMgr(this, new FDNet(this.roomId));
            case GameConst.GameType.DE_ZHOU:
                return new DZGameMgr(this, new DZNet(this.roomId));
            case GameConst.GameType.ZHA_JIN_HUA:
                return new ZJHGameMgr(this, new ZJHNet(this.roomId));
            case GameConst.GameType.NIU_NIU:
                return new NNGameMgr(this, new GameNet(this.roomId));
            case GameConst.GameType.SHI_SANG_SHUI:
                return new SSSGameMgr(this, new SSSNet(this.roomId));
            case GameConst.GameType.PAO_DE_KUAI:
                return new PDKGameMgr(this, new GameNet(this.roomId));
            case GameConst.GameType.QUE_SHENG:
                return new QSGameMgr(this, new MJNet(this.roomId));
            case GameConst.GameType.SANG_GONG:
                return new SGGameMgr(this, new GameNet(this.roomId));
            case GameConst.GameType.DA_ZHA:
                return new FDDZGameMgr(this, new FDDZNet(this.roomId));
            default:
                return new GameMgr(this, this.net);
        }
    }

    isRoomUser(userId: string) {
        return this.getRoomUser(userId) != null;
    }

    isRoomGamber(userId: string) {
        return this.gambers[userId] != null;
    }

    getRoomUser(userId: string) {
        return this.gambers[userId] || this.watchers[userId];
    }

    reconnect(userId: string) {
        let index = this.offlineTimeoutUserList.indexOf(userId);
        if (index > 0) {
            delete this.offlineTimeoutUserList[index];
            let kickindex = this.kickUserList.indexOf(userId);
            if (kickindex >= 0) {
                delete this.kickUserList[kickindex];
            }
        }
        if (this.offlineUsers[userId]) {
            delete this.offlineUsers[userId];
        }
        this.net.G_UserState(userId, true);
        if (this.game) {
            this.game.reconnect(userId);
        }
    }

    @ConditionFilter(ErrorCode.YOU_ARE_NOT_OWNER)
    kickUser(userId: string, kickUserId: string) {
        if (this.gambers[kickUserId] == null) {
            return ErrorCode.UNKOWN_GAMBER;
        }
        if (this.canLeaveNow(kickUserId)) {
            this.leaveRoom(kickUserId);
        } else {
            return ErrorCode.CANT_KICK_WHEN_PLAY;
        }
    }

    canLeaveNow(userId: string) {
        if (!this.isBegin()) {
            return true;
        }
        if (this.watchers[userId]) {
            return true;
        }
        if (this.gambers[userId] && this.gambers[userId].isWatch) {
            return true;
        }
        return false;
    }

    leaveRoom(userId: string) {
        this.net.G_LeaveRoom(userId);
        if (this.isRoomGamber(userId)) {
            delete this.gambers[userId];
        } else {
            delete this.watchers[userId];
        }
    }

    updateOffline() {
        for (let userId in this.offlineUsers) {
            this.offlineUsers[userId]--;
            if (this.offlineUsers[userId] <= 0) {
                this.offlineTimeoutUserList.push(userId);
                delete this.offlineUsers[userId];
                if (userId != this.owner.userId) {
                    if (this.canLeaveNow(userId)) {
                        this.leaveRoom(userId);
                    } else {
                        this.kickUserList.push(userId);
                    }
                }
            }
        }
        if (Object.keys(this.offlineUsers).length <= 0) {
            clearInterval(this.offlineTimer);
            this.offlineTimer = null;
        }
    }

    addOfflineUser(userId: string) {
        this.net.G_UserState(userId, false);
        this.offlineUsers[userId] = GameConst.RoomTime.OFFLINE;
        if (this.offlineTimer == null) {
            this.offlineTimer = setInterval(this.updateOffline.bind(this), 1000);
        }
    }

    offlineUser(userId: string) {
        if (!this.isRoomUser(userId)) {
            return ErrorCode.UNKOWN_GAMBER;
        }
        // if (this.canLeaveNow(userId)) {
        //     this.leaveRoom(userId);
        // } else {
            this.addOfflineUser(userId);
        // }
    }

    dissolve() {
        this.net.G_Dissolve();
        AllRoomMgr.ins.delRoom(this.roomId);
    }

    C_Chat(userId: string, data: any) {
        data.userId = userId;
        this.net.G_Chat(data);
    }

    C_QuickChat(userId: string, data: any) {
        data.userId = userId;
        this.net.G_QuickChat(data);
    }

    C_Emoji(userId: string, data: any) {
        data.userId = userId;
        this.net.G_Emoji(data);
    }

    C_Voice(userId: string, data: any) {
        data.userId = userId;
        this.net.G_Voice(data);
    }
}