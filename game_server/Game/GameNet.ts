
import GameUtil from "../../utils/GameUtil";
import { NetDefine } from "../../base_net/NetDefine";
import NetUtil from "../../base_net/NetUtil";
import RoomMgr from "../Room/RoomMgr";
import RoomUserModel from "../Room/RoomUserModel";
import { GameConst } from "../GameConst";
import AllRoomMgr from "../Room/AllRoomMgr";

export default class GameNet {

    roomId: string;

    constructor(roomId: string) {
        this.roomId = roomId;
    }

    send(cmd: NetDefine.WS_Resp, data: any, syncUserId?: string) {
        if (syncUserId) {
            data.isSync = true;
            NetUtil.sendMsg(syncUserId, cmd, data);
        } else {
            NetUtil.roomBroadcast(this.roomId, cmd, data);
        }
    }

    G_ShowDissolve(userId: string) {
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_ShowDissolve);
    }

    GA_ShowReplaceCard(userId: string, holds: number[], heap: number[]) {
        let data = { holds: holds, heaps: heap };
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.GA_ShowReplaceCard, data);
    }

    GA_ReplaceCard(userId: string, holds: number[], heap: number[]) {
        let data = { holds: holds, heaps: heap };
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.GA_ReplaceCard, data);
    }

    GA_Perspect(userId: string, data: any) {
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.GA_Perspect, data);
    }

    G_UpdatePermission(userId: string) {
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_UpdatePermission);
    }

    G_BeginGame(round: number, syncUserId?: string) {
        let data = { round: round }
        this.send(NetDefine.WS_Resp.G_BeginGame, data, syncUserId);
    }

    G_InitHolds(holds: { [key: string]: any[] }, syncUserId?: string) {
        let clientHolds: { [key: string]: any[] } = {};
        for (let userId in holds) {
            clientHolds[userId] = [];
            for (let hold of holds[userId]) {
                clientHolds[userId].push(-1);
            }
        }
        let room = AllRoomMgr.ins.getRoom(this.roomId);
        let hasSend = false;
        if (room) {
            for (let userId of room.getRoomUserIds()) {
                if (syncUserId && userId != syncUserId) {
                    continue;
                }
                hasSend = true;

                let oldHold = clientHolds[userId];
                if (oldHold) {
                    clientHolds[userId] = holds[userId];
                    NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_InitHolds, clientHolds);
                    clientHolds[userId] = oldHold;
                } else {
                    NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_InitHolds, clientHolds);
                }
            }
        }
        if (syncUserId && !hasSend) {
            NetUtil.sendMsg(syncUserId, NetDefine.WS_Resp.G_InitHolds, clientHolds);
        }
    }

    G_Fold(userId: string, pai: number | number[], cardType?: any, syncUserId?: string) {
        let data = {userId: userId, pai: pai, cardType: cardType};
        this.send(NetDefine.WS_Resp.G_Fold, data, syncUserId);
    }

    G_FundPoolChange(fundPool: number, syncUserId?: string) {
        let data = {fundPool: fundPool};
        this.send(NetDefine.WS_Resp.G_FundPoolChange, data, syncUserId);
    }

    G_ShowCard(data: any, syncUserId?: string) {
        this.send(NetDefine.WS_Resp.G_ShowCard, data, syncUserId);
    }

    G_DecideWind(data: any, syncUserId?: string) {
        this.send(NetDefine.WS_Resp.G_DecideWind, data, syncUserId);
    }

    G_DecideBanker(bankerId: string, userIdArr: string[], syncUserId?: string) {
        let data = {
            bankerId: bankerId,
            userIdArr: [],
            decideBankerTime: GameConst.GameTime.DECIDE_BANKER,
        }
        this.send(NetDefine.WS_Resp.G_DecideBanker, data, syncUserId);
    }

    G_GameSettle(data: any, syncUserId?: string) {
        this.send(NetDefine.WS_Resp.G_GameSettle, data, syncUserId);
    }

    G_TurnBetting(turnUserId: string, optionalOperate: number, syncUserId?: string) {
        let data = {
            turnUserId: turnUserId,
            optionalOperate: optionalOperate,
            bettingTime: GameConst.GameTime.BETTING,
        }
        this.send(NetDefine.WS_Resp.G_TurnBetting, data, syncUserId);
    }

    G_DoOperate(userId: string, operate: any, value?: number, syncUserId?: string) {
        let data = {
            userId: userId,
            operate: operate,
        }
        if (value != null) {
            data = GameUtil.mergeDict(data, {value: value});
        }
        this.send(NetDefine.WS_Resp.G_DoOperate, data, syncUserId);
    }

    G_UpdateTimer(time: number) {
        let data = {
            time: time
        }
        NetUtil.roomBroadcast(this.roomId, NetDefine.WS_Resp.G_UpdateTimer, data);
    }

    G_ShowDissolveVote() {
        NetUtil.roomBroadcast(this.roomId, NetDefine.WS_Resp.G_ShowDissolveVote, {});
    }

    G_DissolveVote(userId: string, vote: boolean, syncUserId?: string) {
        let data = { userId: userId, vote: vote };
        this.send(NetDefine.WS_Resp.G_DissolveVote, data, syncUserId);
    }
    
    G_Ready(userId: string, isReady: boolean) {
        let data = {
            userId: userId,
            isReady: isReady,
        }
        NetUtil.roomBroadcast(this.roomId, NetDefine.WS_Resp.G_Ready, data);
    }

    G_SwapSeat(userId: string, userSeatIndex: number, anotherUserId: string, anotherSeatIndex: number) {
        let data = {
            userId: userId,
            userSeatIndex: userSeatIndex,
            anotherUserId: anotherUserId,
            anotherSeatIndex: anotherSeatIndex,
        }
        NetUtil.roomBroadcast(this.roomId, NetDefine.WS_Resp.G_SwapSeat, data);
    }

    G_AddGamber(user: RoomUserModel) {
        NetUtil.roomBroadcast(this.roomId, NetDefine.WS_Resp.G_AddGamber, user);
    }

    G_AddWatcher(user: RoomUserModel) {
        // let data = {
        //     userId: user.userId,
        //     userName: user.userName,
        //     sex: user.sex,
        //     avatarUrl: user.avatarUrl,
        //     seatIndex: user.seatIndex,
        // }
        NetUtil.roomBroadcast(this.roomId, NetDefine.WS_Resp.G_AddWatcher, user);
    }

    G_WatcherToGamber(user: RoomUserModel) {
        let data = {
            userId: user.userId,
            userName: user.userName,
            sex: user.sex,
            avatarUrl: user.avatarUrl,
            seatIndex: user.seatIndex,
        }
        NetUtil.roomBroadcast(this.roomId, NetDefine.WS_Resp.G_WatcherToGamber, data);
    }

    G_PushRoomInfo(room: RoomMgr, userId: string) {
        let data = {
            gameName: room.roomConf.gameName,
            gambers: room.gambers,
            ownerId: room.owner.userId,
            roomId: room.roomId,
            round: room.round,
            roundAmount: room.roomConf.roundAmount,
            gamberAmount: room.roomConf.gamberAmount,
        }
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_PushRoomInfo, data);
    }

    G_UpdateRoomOperate(room: RoomMgr, userId: string) {
        let data = {
            canReady: room.canReady(userId),
            canBegin: room.canBegin(userId),
            canDissolve: room.canDissolve(userId),
            canWatch: room.canWatch(),
            canJoin: room.canJoin(userId),
        }
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_UpdateRoomOperate, data);
    }

    G_LeaveRoom(userId: string) {
        let data = {userId: userId};
        NetUtil.roomBroadcast(this.roomId, NetDefine.WS_Resp.G_LeaveRoom, data);
    }

    G_UserState(userId: string, online: boolean, syncUserId?: string) {
        let data = {
            userId: userId,
            online: online,
        }
        if (syncUserId) {
            NetUtil.sendMsg(syncUserId, NetDefine.WS_Resp.G_UserState, data);
        } else {
            NetUtil.userBroadcast(NetDefine.WS_Resp.G_UserState, data, userId);
        }
    }

    G_GameState(state: any, syncUserId?: string) {
        let data = { gameState: state };
        this.send(NetDefine.WS_Resp.G_GameState, data, syncUserId);
    }

    G_DissolveResult(result: boolean) {
        let data = { result: result };
        NetUtil.roomBroadcast(this.roomId, NetDefine.WS_Resp.G_DissolveResult, data);
    }

    G_Dissolve() {
        NetUtil.roomBroadcast(this.roomId, NetDefine.WS_Resp.G_Dissolve);
    }

    G_GameOver(userId: string, data: any) {
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_GameOver, data);
    }

    G_LeftCard(cardNum: number, syncUserId?: string) {
        let data = { left: cardNum };
        this.send(NetDefine.WS_Resp.G_LeftCard, data, syncUserId);
    }
    
    G_GamberScoreChange(userId: string, changeScore: number, finalScore: number, bettingScore: number, syncUserId?: string) {
        let data = {
            userId: userId,
            changeScore: changeScore,
            finalScore: finalScore,
            bettingScore: bettingScore,
        }
        this.send(NetDefine.WS_Resp.G_GamberScoreChange, data, syncUserId);
    }

    G_RobBanker(values: number[], syncUserId?: string) {
        let data = { values: values };
        this.send(NetDefine.WS_Resp.G_RobBanker, data, syncUserId);
    }

    G_Rob(userId: string, value: number, syncUserId?: string) {
        let data = {
            userId: userId,
            robScore: value,
        }
        this.send(NetDefine.WS_Resp.G_Rob, data, syncUserId);
    }

    G_Betting(values: number[], syncUserId?: string) {
        let data = { values: values };
        this.send(NetDefine.WS_Resp.G_Betting, data, syncUserId);
    }

    G_ShowRaise(userId: string, bettingMin: number, bettingMax: number) {
        let data = { userId: userId, bettingMin: bettingMin, bettingMax: bettingMax };
        NetUtil.sendMsg(userId, NetDefine.WS_Resp.G_ShowRaise, data);
    }

    G_Chat(data: any) {
        this.send(NetDefine.WS_Resp.G_Chat, data, data.receiveUserId);
    }

    G_QuickChat(data: any) {
        this.send(NetDefine.WS_Resp.G_QuickChat, data, data.receiveUserId);
    }

    G_Emoji(data: any) {
        this.send(NetDefine.WS_Resp.G_Emoji, data, data.receiveUserId);
    }

    G_Voice(data: any) {
        this.send(NetDefine.WS_Resp.G_Voice, data, data.receiveUserId);
    }
}