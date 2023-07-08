import AllRoomMgr from "../Room/AllRoomMgr";
import RoomConfModel from "../Room/RoomConfModel";
import GameMgr from "./GameMgr";
const db = require('../../utils/db');
const http = require('../../base_net/http');


export default class GameRecord {

    operateRecords: any[];
    settleRecords: any[];
    gameRecords: {};

    constructor() {
        this.operateRecords = [];
        this.settleRecords = [];
        this.gameRecords = [];
    }

    recordOperate(userId: string, operate: any, operateData: any) {
        this.operateRecords.push({
            userId: userId,
            operate: operate,
            value: operateData,
        });
    }

    // 记录每回合结算
    recordSettle(roomId: string, roomConf: RoomConfModel, settleData: any) {
        this.settleRecords.push(settleData);
        let userArr = [];
        let scoreArr = [];
        for (let userId in settleData.settles) {
            let settle = settleData.settles[userId];
            userArr.push(userId);
            scoreArr.push(settle.score);
        }
        db.insert_game_records(roomId, roomConf.gameName, settleData.endTime, 
                    settleData.round, userArr, scoreArr, this.operateRecords);
        this.operateRecords = [];
    }

    // 记录总结算
    recordTotalSettle(roomId: string, game: GameMgr, totalRounds: number, ...extraData: any[]) {
        let room = AllRoomMgr.ins.getRoom(roomId);
        if (room == null) {
            return;
        }
        let userRecords: any = {};
        for (let settleData of this.settleRecords) {
            for (let userId in settleData.settles) {
                let settleRecord = settleData.settles[userId];
                if (!userRecords[userId]) {
                    let user = room.getRoomUser(userId);
                    userRecords[userId] = {
                        userId: userId,
                        userName: user.userName,
                        avatarUrl: user.avatarUrl,
                        winTime: 0,
                        score: 0,
                        bankerTIme: 0,
                    };
                }
                let record = userRecords[userId];
                record.winTime += settleRecord.isWin ? 1 : 0;
                record.score += settleRecord.score;
                // record.bankerTime += settleRecord.isBanker ? 1 : 0;
            }
        }
        this.gameRecords = {
            roomId: roomId,
            ownerName: room.owner.userName,
            roomConf: room.roomConf.data,
            totalRounds: totalRounds,
            endTime: Date.now(),
            records: userRecords,
        };
        this.saveGameRoundData(roomId, game);
        return this.gameRecords
    }

    saveGameRoundData(roomId: string, game: GameMgr) {
        let room = AllRoomMgr.ins.getRoom(roomId);
        if (room == null) {
            return;
        }
        
        let roomConf = room.roomConf;
        let seats = [];
        for (let gamber of game.gambers) {
            let userName = room.gambers[gamber.userId].userName;
            seats.push({
                userId: gamber.userId,
                name: userName,
                score: gamber.score,
            });
        }

        let history = {
            roomId: room.roomId,
            type : roomConf.gameName,
            owner : room.owner.userId,
            index : room.round,
            time: room.createTime,
            conf: roomConf.data,
            maxGames: roomConf.roundAmount,
            url : http.getLocalIP(),
            seats:seats
        };
        db.store_history(history);
    }

    getTotalSettle() {
        let totalScore: {[key: string]: number} = {};
        let totalWin: {[key: string]: number} = {};
        let addOrSet = (arr: {[key: string]: number}, index: any, value: number) => {
            if (arr[index] == null) {
                arr[index] = value;
            } else {
                arr[index] += value;
            }
        }

        for (let record of this.settleRecords) {
            let userId = record.userId;
            addOrSet(totalScore, userId, record.score);
            addOrSet(totalWin, userId, record.isWin ? 1 : 0);
        }

        let settle: {[key: string]: {}} = {};
        for (let userId in totalScore) {
            settle[userId] = {
                userId: userId,
                score: totalScore[userId],
                winTime: totalWin[userId],
            }
        }
        return settle;
    }
}