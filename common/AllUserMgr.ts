'use strict';

import UserModel from "./UserModel";
import NetUtil from "../base_net/NetUtil";
import AllRoomMgr from "../game_server/Room/AllRoomMgr";
import { ErrorCode } from "../game_server/ErrorCode";
import RoomNet from "../game_server/Room/RoomNet";
import { GameConst } from "../game_server/GameConst";
import LogUtil from "../utils/LogUtil";

const crypto = require('../utils/crypto');
const db = require('../utils/db');

export default class AllUserMgr {

    private static _ins: AllUserMgr;

    static get ins() {
        if (this._ins == null) {
            this._ins = new AllUserMgr();
        }
        return this._ins;
    }

    hallUserIds: string[] = [];
    users: { [key: string]: UserModel} = {};
    // hallUsers: { [key: string]: UserModel} = {};
    // gameUsers: { [key: string]: UserModel} = {};

    // get users() {
    //     return GameUtil.mergeDict(this.hallUsers, this.gameUsers);
    // }

    online(userId: string) {
        let room = AllRoomMgr.ins.getRoomByUserId(userId);
        if (room != null) {
            room.enterRoom(this.getUser(userId));
            room.reconnect(userId);
        } else {
            LogUtil.error("用户不在房间中，连接失败", userId);
        }
    }

    getUser(userId: string) {
        // await this.loadUser(userId);
        return this.users[userId];
    }

    getOnlineUsers() {
        let onlineUsers = [];
        for (let userId in this.users) {
            if (NetUtil.getSocketByUserId(userId)) {
                onlineUsers.push(this.getUser(userId));
            }
        }
        return onlineUsers;
    }

    getOnlineUserAmount() {
        let amount = 0;
        for (let userId in this.users) {
            if (NetUtil.getSocketByUserId(userId)) {
                amount += 1;
            }
        }
        return amount;
    }

    getOnlineUserIds() {
        let userIds = [];
        for (let userId in this.users) {
            if (NetUtil.getSocketByUserId(userId)) {
                userIds.push(userId);
            }
        }
        return userIds;
    }

    offline(userId: string) {
        let room = AllRoomMgr.ins.getRoomByUserId(userId);
        if (room != null) {
            room.offlineUser(userId);
        }
    }

    isOnline(userId: string) {
        return NetUtil.sockets[userId] != null;
    }

    async loadUser(userId: string) {
        if (!this.users[userId]) {
            await db.get_user_base_info(userId, (userDao: any) => {
                if (userDao == null) {
                    return;
                }
                let user = new UserModel(userDao);
                this.users[userId] = user;
                db.get_user_wins_rate(userId, (winRate: number) => {
                    user.winRate = winRate;
                });
            })
        }
    }

    loadUserByPassword(account: string, password: string, callback?: Function) {
        db.get_userInfo2(account, password, (userDao: any) => {
            if(userDao == null){
                callback && callback(ErrorCode.PASSWORD_ERROR);
                return;
            }
            let user = new UserModel(userDao);
            this.users[user.userId] = user;
            db.get_user_wins_rate(user.userId, (winRate: number) => {
                user.winRate = winRate;
                callback && callback(ErrorCode.SUCCESS, this.getUserDto(userDao));
            });
        });
    }

    loadUserByAccount(account: string, callback?: Function) {
        db.get_userInfo(account, (userDao: any) => {
            if(userDao == null){
                callback && callback(ErrorCode.PASSWORD_ERROR);
                return;
            }
            let user = new UserModel(userDao);
            this.users[user.userId] = user;
            userDao.userName = crypto.toBase64(user.userName);
            db.get_user_wins_rate(user.userId, (winRate: number) => {
                user.winRate = winRate;
                callback && callback(ErrorCode.SUCCESS, this.getUserDto(userDao));
            });
        });
    }

    getUserDto(userDao: any) {
        let userDto: { [key: string]: any } = {};
        userDto.userId = userDao.userId;
        userDto.account = userDao.account;
        userDto.userId = userDao.userId;
        userDto.userName = userDao.userName;
        userDto.sex = userDao.sex;
        userDto.headImg = userDao.headImg;
        userDto.gems = userDao.gems;
        userDto.coins = userDao.coins;
        userDto.ip = userDao.ip;
        let room = AllRoomMgr.ins.getRoomByUserId(userDao.userId);
        if (room) {
            userDto.reconnectRoomId = room.roomId;
        }
        return userDto;
    }

    enterHall(userId: string) {
        this.hallUserIds.push(userId);
    }

    leaveHall(userId: string) {
        let index = this.hallUserIds.indexOf(userId);
        if (index >= 0) {
            this.hallUserIds.splice(index, 1);
        }
    }

    getHallUserIds() {
        return this.hallUserIds;
    }

    createUser(info: any, callback: Function) {
        db.is_user_exist(info.account, (ret: any) => {
            if(!ret){
                info.coins = 0;
                info.gems = 100;
                info.roomCard = 0;
                db.create_user(info, (ret: any) => {
                    callback(ret);
                });
            }
            else{
                delete info.area;
                db.update_user_info(info, (ret: any) => {
                    callback(ret);
                });
            }
        });
    }

    C_TransferGem(userId: string, userId2: string, gem: number) {
        let user = this.users[userId];
        let user2 = this.users[userId2];
        if (gem <= 0) {
            return ErrorCode.GEM_AMOUNT_ERROR;
        }
        if (user.gem < gem) {
            return ErrorCode.GEM_NOT_ENOUGH;
        }
        
        db.add_gem({ userId: userId, gem: -gem }, (data: any) => {
            db.add_gem({ userId: userId2, gem: gem }, (data: any) => {
                user.gem -= gem;
                user2.gem += gem;
                RoomNet.G_UpdateGem(userId, user.gem);
                RoomNet.G_UpdateGem(userId2, user2.gem);
                RoomNet.G_TransferGem(userId, userId2, gem);
            });
        });
    }

    costGem(userId: string, gem: number) {
        let user = this.users[userId];
        if (gem <= 0) {
            return ErrorCode.GEM_AMOUNT_ERROR;
        }
        if (user.gem < gem) {
            return ErrorCode.GEM_NOT_ENOUGH;
        }
        db.add_gem({ userId: userId, gem: -gem }, (data: any) => {
            user.gem -= gem;
            RoomNet.G_UpdateGem(userId, user.gem);
        });
    }

    canCostCurrency(userId: string, costType: GameConst.CostType, costAmount: number) {
        let user = this.users[userId];
        if (costType == GameConst.CostType.GEM) {
            if (costAmount < 0) {
                return ErrorCode.GEM_AMOUNT_ERROR;
            } else if (user.gem < costAmount) {
                return ErrorCode.GEM_NOT_ENOUGH;
            }
        } else if (costType == GameConst.CostType.COIN) {

        }
        return ErrorCode.SUCCESS;
    }

    costCurrency(userId: string, costType: GameConst.CostType, costAmount: number) {
        if (costType == GameConst.CostType.GEM) {
            return this.costGem(userId, costAmount);
        } else if (costType == GameConst.CostType.COIN) {

        }
    }
}