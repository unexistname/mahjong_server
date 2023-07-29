import BaseSocket from "../base_net/BaseSocket";
import { NetDefine } from "../base_net/NetDefine";
import AllUserMgr from "../common/AllUserMgr";
import PropMgr from "../common/PropMgr";
import FDDZGameMgr from "./Poker/PlayCard/DaZha/FDDZGameMgr";
import DZGamberModel from "./Poker/CompareCard/Turn/DeZhou/DZGamberModel";
import DZGameMgr from "./Poker/CompareCard/Turn/DeZhou/DZGameMgr";
import DXGameMgr from "./Poker/CompareCard/Turn/DiaoXie/DXGameMgr";
import { ErrorCode } from "./ErrorCode";
import GamberModel from "./Game/GamberModel";
import GameMgr from "./Game/GameMgr";
import GameEncry from "./GameEncry";
import MJGamberModel from "./Majhong/Base/MJGamberModel";
import MJGameMgr from "./Majhong/Base/MJGameMgr";
import NNGameMgr from "./Poker/CompareCard/Bet/NiuNiu/NNGameMgr";
import PDKGameMgr from "./Poker/PlayCard/PaoDeKuai/PDKGameMgr";
import AllRoomMgr from "./Room/AllRoomMgr";
import RoomNet from "./Room/RoomNet";
import SSSGamberModel from "./Poker/CompareCard/Other/ShiSanShui/SSSGamberModel";
import SSSGameMgr from "./Poker/CompareCard/Other/ShiSanShui/SSSGameMgr";
import ZJHGamberModel from "./Poker/CompareCard/Turn/ZhaJinHua/ZJHGamberModel";
import ZJHGameMgr from "./Poker/CompareCard/Turn/ZhaJinHua/ZJHGameMgr";


export default class GameSocket extends BaseSocket {

    static C_Ready(ws: any, msg: any) {
        return AllRoomMgr.ins.C_Ready(ws.userId, msg.ready);
    }

    static C_BeginGame(ws: any, msg: any) {
        return AllRoomMgr.ins.C_BeginGame(ws.userId);
    }

    static C_DissolveVote(ws: any, msg: any) {
        return AllRoomMgr.ins.C_DissolveVote(ws.userId, msg.vote);
    }

    static C_Emoji(ws: any, msg: any) {
        return AllRoomMgr.ins.C_Emoji(ws.userId, msg);
    }

    static C_QuickChat(ws: any, msg: any) {
        return AllRoomMgr.ins.C_QuickChat(ws.userId, msg);
    }

    static C_Chat(ws: any, msg: any) {
        return AllRoomMgr.ins.C_Chat(ws.userId, msg);
    }

    static C_Voice(ws: any, msg: any) {
        return AllRoomMgr.ins.C_Voice(ws.userId, msg);
    }

    static C_ShowWatchers(ws: any, msg: any) {
        return AllRoomMgr.ins.C_ShowWatchers(ws.userId);
    }

    static C_Rob(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as NNGameMgr).C_Rob(gamber, msg.score);
        });
    }

    static C_Betting(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as NNGameMgr).C_Betting(gamber, msg.score);
        });
    }

    static C_ShowRaise(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as ZJHGameMgr).C_ShowRaise(<ZJHGamberModel>gamber);
        });
    }

    static C_CompareSelect(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as ZJHGameMgr).C_CompareSelect(<ZJHGamberModel>gamber);
        });
    }

    static C_Dissolve(ws: any, msg: any) {
        return AllRoomMgr.ins.C_Dissolve(ws.userId);
    }

    static C_LeaveRoom(ws: any, msg: any) {
        return AllRoomMgr.ins.C_LeaveRoom(ws.userId);
    }

    static C_WatcherToGamber(ws: any, msg: any) {
        return AllRoomMgr.ins.C_WatcherToGamber(ws.userId);
    }

    static CA_ShowReplaceCard(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return game.CA_ShowReplaceCard(gamber);
        });
    }

    static CA_ReplaceCard(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return game.CA_ReplaceCard(gamber, msg.myCard, msg.heapCard);
        });
    }

    static CA_Perspect(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return game.CA_Perspect(gamber);
        });
    }

    static doOperate(ws: any, msg: any, callback: Function) {
        let room = AllRoomMgr.ins.getRoomByUserId(ws.userId);
        if (room == null) {
            return ErrorCode.ROOM_IS_UNEXIST;
        } else if (room.game == null) {
            return ErrorCode.GAME_NOT_BEGIN;
        } else {
            let gamber = room.game.getGamberByUserId(ws.userId);
            if (gamber == null) {
                return ErrorCode.UNKOWN_GAMBER; 
            }
            return callback && callback(room.game, gamber);
        }
    }

    static C_GamberInfo(ws: any, msg: any) {
        let user = AllUserMgr.ins.getUser(msg.userId);
        if (!user) {
            return ErrorCode.UNEXIST_USER;
        }
        return RoomNet.G_GamberInfo(ws.userId, user);
    }

    static C_ShowProp(ws: any, msg: any) {
        return PropMgr.ins.C_ShowProp(ws.userId);
    }

    static C_UseProp(ws: any, msg: any) {
        return PropMgr.ins.C_UseProp(ws.userId, msg.userId, msg.propId);
    }

    static C_TransferGem(ws: any, msg: any) {
        return AllUserMgr.ins.C_TransferGem(ws.userId, msg.userId, msg.gemNum);
    }

    static C_Eat(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as DXGameMgr).C_Eat(gamber);
        });
    }

    static C_ShowTouch(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as DXGameMgr).C_ShowTouch(gamber);
        });
    }

    static C_Touch(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as DXGameMgr).C_Touch(gamber, msg.betting);
        });
    }

    static C_Belt(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as DXGameMgr).C_Belt(gamber);
        });
    }

    static C_Waive(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as DXGameMgr).C_Waive(gamber);
        });
    }

    static C_BlindEat(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as DXGameMgr).C_BlindEat(gamber);
        });
    }

    static C_ReverseBelt(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as DXGameMgr).C_ReverseBelt(gamber);
        });
    }

    static C_NoBelt(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as DXGameMgr).C_NoBelt(gamber);
        });
    }

    static C_RubCard(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as DXGameMgr).C_RubCard(gamber);
        });
    }

    static C_SeeCard(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as DXGameMgr).C_SeeCard(gamber);
        });
    }

    static C_OverSettle(ws: any, msg: any) {
        let room = AllRoomMgr.ins.getRoomByUserId(ws.userId);
        if (room == null) {
            return ErrorCode.ROOM_IS_UNEXIST;
        }
        room.C_OverSettle(ws.userId);
    }

    static C_Call(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            if (game instanceof DZGameMgr) {
                return (game as DZGameMgr).C_Call(<DZGamberModel>gamber);
            } else {
                return (game as ZJHGameMgr).C_Call(<ZJHGamberModel>gamber);
            }
        });
    }

    static C_Raise(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            if (game instanceof DZGameMgr) {
                return (game as DZGameMgr).C_Raise(<DZGamberModel>gamber);
            } else {
                return (game as ZJHGameMgr).C_Raise(<ZJHGamberModel>gamber, msg.score);
            }
        });
    }

    static C_Watch(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as ZJHGameMgr).C_Watch(<ZJHGamberModel>gamber);
        });
    }

    static C_Compare(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            let cmpUserId = msg.cmpUserId;
            let cmpGamber = game.getGamberByUserId(cmpUserId);
            if (cmpGamber == null) {
                return ErrorCode.UNKOWN_GAMBER; 
            }
            return (game as ZJHGameMgr).C_Compare(<ZJHGamberModel>gamber, <ZJHGamberModel>cmpGamber);
        });
    }

    static C_Combine(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as SSSGameMgr).C_Combine(<SSSGamberModel>gamber, msg.cards);
        });
    }

    static C_UseSpecial(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as SSSGameMgr).C_UseSpecial(<SSSGamberModel>gamber, msg.cardType);
        });
    }

    static C_Chi(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as MJGameMgr).C_Chi(<MJGamberModel>gamber, msg.index);
        });
    }

    static C_PlayCard(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            if (game instanceof FDDZGameMgr) {
                return (game as FDDZGameMgr).C_PlayCard(gamber, msg.cards);
            } else {
                return (game as PDKGameMgr).C_PlayCard(gamber, msg.cards);
            }
        });
    }

    static C_Peng(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as MJGameMgr).C_Peng(<MJGamberModel>gamber);
        });
    }

    static C_Gang(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as MJGameMgr).C_Gang(<MJGamberModel>gamber, msg.pai);
        });
    }

    static C_Hu(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as MJGameMgr).C_Hu(<MJGamberModel>gamber);
        });
    }

    static C_ZiMo(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as MJGameMgr).C_Hu(<MJGamberModel>gamber);
        });
    }

    static C_ChuPai(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as MJGameMgr).C_ChuPai(<MJGamberModel>gamber, msg.pai);
        });
    }

    static C_Guo(ws: any, msg: any) {
        return this.doOperate(ws, msg, (game: GameMgr, gamber: GamberModel) => {
            return (game as MJGameMgr).C_Guo(<MJGamberModel>gamber);
        });
    }

    static getNetType() {
        return NetDefine.NetType.GAME_SOCKET;
    }

    static getEncryTool() {
        return GameEncry;
    }
}