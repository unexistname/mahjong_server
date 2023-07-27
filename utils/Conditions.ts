import { ErrorCode } from "../game_server/ErrorCode";
import RoomMgr from "../game_server/Room/RoomMgr";
import { GameConst } from "../game_server/GameConst";
import GameMgr from "../game_server/Game/GameMgr";
import GamberModel from "../game_server/Game/GamberModel";
import AllRoomMgr from "../game_server/Room/AllRoomMgr";
import MJGameMgr from "../game_server/Majhong/Base/MJGameMgr";
import MJGamberModel from "../game_server/Majhong/Base/MJGamberModel";
import GameUtil from "./GameUtil";
import SSSGameMgr from "../game_server/Poker/CompareCard/Other/ShiSanShui/SSSGameMgr";
import SSSCardPointMgr from "../game_server/Poker/CompareCard/Other/ShiSanShui/SSSCardPointMgr";

let conditions: any = {};

conditions[ErrorCode.ROOM_IS_BEGIN] = (room: RoomMgr) => {
    if (room.roomState != GameConst.RoomState.IDLE) {
        return ErrorCode.ROOM_IS_BEGIN;
    }
}

conditions[ErrorCode.YOU_ARE_NOT_OWNER] = (room: RoomMgr, userId: string) => {
    if (room.owner.userId != userId) {
        return ErrorCode.YOU_ARE_NOT_OWNER;
    }
}

conditions[ErrorCode.HAVE_GAMBER_NO_READY] = (room: RoomMgr) => {
    for (let gamberId in room.gambers) {
        if (!room.gambers[gamberId].isReady) {
            return ErrorCode.HAVE_GAMBER_NO_READY;
        }
    }
}

conditions[ErrorCode.NOT_YOUR_TURN] = (game: GameMgr, gamber: GamberModel) => {
    if (game.turnGamber.userId != gamber.userId) {
        return ErrorCode.NOT_YOUR_TURN;
    }
}

// conditions[ErrorCode.UNKOWN_GAMBER] = (game: GameMgr, userId: string) => {
//     let gamber = game.getGamberByUserId(userId);
//     if (gamber == null) {
//         return ErrorCode.UNKOWN_GAMBER;
//     }
// }

conditions[ErrorCode.UNEXCEPT_OPERATE] = (game: GameMgr, legalOperate: number, gamber: GamberModel) => {
    let optionalOperate: number = game.getOptionalOperate(gamber);
    if ((optionalOperate & legalOperate) == 0) {
        return ErrorCode.UNEXCEPT_OPERATE;
    }
}

conditions[ErrorCode.GAME_STATE_ERROR] = (game: GameMgr, targetState: GameConst.GameState) => {
    if (game.gameState != targetState) {
        return ErrorCode.GAME_STATE_ERROR;
    }
}

conditions[ErrorCode.ROOM_IS_UNEXIST] = (allRoomMgr: any, userId: string, roomId: string) => {
    if (typeof roomId == "string" && AllRoomMgr.ins.getRoom(roomId)) {
        return ErrorCode.SUCCESS;
    }
    if (AllRoomMgr.ins.getRoomByUserId(userId)) {
        return ErrorCode.SUCCESS;
    }
    return ErrorCode.ROOM_IS_UNEXIST;
}

conditions[ErrorCode.YOU_ALREADY_HU] = (game: MJGameMgr, gamber: MJGamberModel) => {
    if (gamber.hued) {
        return ErrorCode.YOU_ALREADY_HU;
    }
}

conditions[ErrorCode.YOU_NEED_GUO_FIRST] = (game: MJGameMgr, gamber: MJGamberModel) => {
    if (game.hasOperations(gamber)) {
        return ErrorCode.YOU_NEED_GUO_FIRST;
    }
}

conditions[ErrorCode.YOU_CANT_CHU_PAI] = (game: MJGameMgr, gamber: MJGamberModel) => {
    if (!gamber.canChuPai) {
        return ErrorCode.YOU_CANT_CHU_PAI;
    }
}

conditions[ErrorCode.YOU_DONT_HAVE_CARD] = (game: MJGameMgr, gamber: MJGamberModel, pai: number) => {
    if (!gamber.countMap[pai]) {
        return ErrorCode.YOU_DONT_HAVE_CARD;
    }
}

conditions[ErrorCode.THIS_CARD_CANT_PLAY] = (game: MJGameMgr, gamber: MJGamberModel, pai: number) => {
    if (!game.isMahjongCanPlay(pai)) {
        return ErrorCode.THIS_CARD_CANT_PLAY;
    }
}

conditions[ErrorCode.THIS_IS_YOUR_CARD] = (game: MJGameMgr, gamber: MJGamberModel, pai: number) => {
    if (game.turnGamber == gamber) {
        return ErrorCode.THIS_IS_YOUR_CARD;
    }
}

conditions[ErrorCode.YOU_DONT_HAVE_CARDS] = (game: GameMgr, gamber: GamberModel, cards: number[]) => {
    let holds = GameUtil.deepClone(gamber.holds);
    for (let card of cards) {
        let index = holds.indexOf(card);
        if (index < 0) {
            return ErrorCode.YOU_DONT_HAVE_CARDS;
        } else {
            holds.splice(index, 1);
        }
    }
}

conditions[ErrorCode.COMBINE_CARD_ERROR] = (game: SSSGameMgr, gamber: MJGamberModel, cards: number[][]) => {
    let limit = [3, 5, 5];
    if (cards.length != 3) {
        return ErrorCode.COMBINE_CARD_ERROR;
    }
    for (let i = 0; i < cards.length; ++i) {
        if (cards[i].length != limit[i]) {
            return ErrorCode.COMBINE_CARD_ERROR;
        }
    }
}

conditions[ErrorCode.CANT_POUR_WATER] = (game: SSSGameMgr, gamber: MJGamberModel, cards: number[][]) => {
    if (SSSCardPointMgr.isPourWater(cards)) {
        return ErrorCode.CANT_POUR_WATER;
    }
}

conditions[ErrorCode.WAIVE_OR_ELIMINATE] = (game: GameMgr, gamber: GamberModel) => {
    if (gamber.eliminate || gamber.waive) {
        return ErrorCode.WAIVE_OR_ELIMINATE;
    }
}

conditions[ErrorCode.YOU_ALREADY_OPERATE] = (game: GameMgr, gamber: GamberModel) => {
    if (gamber.hasBetting) {
        return ErrorCode.YOU_ALREADY_OPERATE;
    }
}


export let Conditions = conditions;