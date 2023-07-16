import AllUserMgr from "../../common/AllUserMgr";
import HallSocket from "../../hall_server/HallSocket";
import { ConditionFilter } from "../../utils/ConditionFilter";
import GameUtil from "../../utils/GameUtil";
import { NetDefine } from "../../base_net/NetDefine";
import NetUtil from "../../base_net/NetUtil";
import { ErrorCode } from "../ErrorCode";
import RoomConfModel from "./RoomConfModel";
import RoomMgr from "./RoomMgr";
import RoomNet from "./RoomNet";


export default class AllRoomMgr {

    private static _ins: AllRoomMgr;

    static get ins() {
        if (this._ins == null) {
            this._ins = new AllRoomMgr();
        }
        return this._ins;
    }

    rooms: {[key: string]: RoomMgr} = {};

    userRooms: { [key: string]: string } = {};

    addRoom(room: RoomMgr) {
        this.rooms[room.roomId] = room;
        console.log("创建房间", this.rooms, room.roomId);
        HallSocket.broadcast(NetDefine.WS_Resp.G_RoomAdd, room);
    }

    delRoom(roomId: string) {
        let room = this.rooms[roomId];
        for (let userId of room.getRoomUserIds()) {
            RoomNet.G_LeaveRoom(userId);
            // NetUtil.disconnect(userId);
            NetUtil.clear(userId);
            delete this.userRooms[userId];
        }
        delete this.rooms[roomId];
        HallSocket.broadcast(NetDefine.WS_Resp.G_RoomDel, roomId);
    }
    
    generateRoomId() {
        return GameUtil.getRandomNumbers(6);
    }

    getRoom(roomId: string) {
        if (roomId != null) {
            return this.rooms[roomId];
        }
    }

    @ConditionFilter(ErrorCode.ROOM_IS_UNEXIST)
    C_Dissolve(userId: string) {
        let roomId = this.userRooms[userId];
        let room = this.rooms[roomId];
        let code = room.dissolve(userId);
        if (GameUtil.isSuccessCode(code)) {
            this.delRoom(roomId);
        } else {
            return code;
        }
    }

    getRoomByUserId(userId: string) {
        let room = this.getRoom(this.userRooms[userId]);
        if (room && room.isRoomUser(userId)) {
            return room;
        }
    }

    getAllPublicRoom() {
        let publicRooms = [];
        for (let roomId in this.rooms) {
            let room = this.rooms[roomId];
            if (!room.isPrivate()) {
                publicRooms.push(room);
            }
        }
        return publicRooms;
    }

    @ConditionFilter(ErrorCode.ROOM_IS_UNEXIST)
    C_BeginGame(userId: string) {
        let room = this.getRoomByUserId(userId);
        return room && room.beginGame(userId);
    }

    @ConditionFilter(ErrorCode.ROOM_IS_UNEXIST)
    C_Ready(userId: string, isReady: boolean) {
        let room = this.getRoomByUserId(userId);
        room && room.updateReady(userId, isReady);
    }

    C_CreateRoom(userId: string, roomDto: any) {
        let roomId = this.generateRoomId();
        let user = AllUserMgr.ins.getUser(userId);
        let roomConf = new RoomConfModel(roomDto);
        let room = new RoomMgr(roomId, roomConf, user);
        this.addRoom(room);
        this.userRooms[userId] = roomId;
    }

    C_LeaveRoom(userId: string) {
        let room = this.getRoomByUserId(userId);
        if (room) {
            return room.C_LeaveRoom(userId);
        } else {
            RoomNet.G_LeaveRoom(userId);
        }
    }

    @ConditionFilter(ErrorCode.ROOM_IS_UNEXIST)
    C_EnterRoom(userId: string, roomId: string) {
        let room = this.rooms[roomId];
        if (room.getRoomUser(userId) != null) {
            return ErrorCode.SUCCESS;
        }
        
        if (room.isRoomFull() && !room.canJoinHalfway()) {
            return ErrorCode.ROOM_IS_FULL;
        }

        let user = AllUserMgr.ins.getUser(userId);
        room.addUser(user);
        this.userRooms[userId] = roomId;
    }

    @ConditionFilter(ErrorCode.ROOM_IS_UNEXIST)
    C_Chat(userId: string, data: any) {
        let room = this.getRoomByUserId(userId);
        return room && room.C_Chat(userId, data);
    }

    @ConditionFilter(ErrorCode.ROOM_IS_UNEXIST)
    C_QuickChat(userId: string, data: any) {
        let room = this.getRoomByUserId(userId);
        return room && room.C_QuickChat(userId, data);
    }

    @ConditionFilter(ErrorCode.ROOM_IS_UNEXIST)
    C_Emoji(userId: string, data: any) {
        let room = this.getRoomByUserId(userId);
        return room && room.C_Emoji(userId, data);
    }

    @ConditionFilter(ErrorCode.ROOM_IS_UNEXIST)
    C_Voice(userId: string, data: any) {
        let room = this.getRoomByUserId(userId);
        return room && room.C_Voice(userId, data);
    }
}