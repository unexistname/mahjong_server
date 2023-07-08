import AllRoomMgr from "../game_server/Room/AllRoomMgr";
import RoomMetaConfMgr from "../game_server/Room/RoomMetaConfMgr";
import GameUtil from "../utils/GameUtil";

const config = require('../common/config');


export default class HallDto {
    
    static getGameUrl() {
        let config_servers = config.servers.hall_game.servers;
        return config_servers.url;
    }

    static getAllMetaConfDto() {
        let confs = [];
        let metaConfs = RoomMetaConfMgr.ins.getAllMetaConf();
        for (let gameName in metaConfs) {
            let metaConf = metaConfs[gameName];
            let commonConfs = [];
            let ruleConfs = [];
            for (let commonConf of metaConf.commonConfs) {
                if (commonConf.show) {
                    commonConfs.push({
                        name: commonConf.name,
                        values:  GameUtil.deepClone(commonConf.values),
                    })
                }
            }
            for (let ruleConf of metaConf.ruleConfs) {
                if (ruleConf.show) {
                    ruleConfs.push(ruleConf.name);
                }
            }
            let dto = {
                gameName: gameName,
                costType: metaConf.costType,
                costNum: metaConf.costNum,
                commonConfs: commonConfs,
                ruleConfs: ruleConfs,
            }
            confs.push(dto);
        }
        return confs;
    }
    
    static getRoomDto(userId: string) {
        let room = AllRoomMgr.ins.getRoomByUserId(userId);
        if (room) {
            let data = room.roomConf.data;
            let roomConf = [];
            for (let name in data) {
                roomConf.push({
                    name: name,
                    value: data[name],
                })
            }
            return {
                url: this.getGameUrl(),
                roomId: room.roomId,
                gameName: room.roomConf.gameName,
                roomConf: roomConf,
            }
        }
    }
}