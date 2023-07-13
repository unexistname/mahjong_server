import BaseEncry from "../base_net/BaseEncry";


export default class GameEncry extends BaseEncry {

    static G_PushRoomInfo(msg: any) {
        msg.gameName = this.encode(msg.gameName);
        for (let gamberId in msg.gambers) {
            let gamber = msg.gambers[gamberId];
            gamber.userName = this.encode(gamber.userName);
        }
    }

    static G_GameSettle(msg: any) {
        for (let userId in msg.settles) {
            let data = msg.settles[userId];
            if (data.winTypes) {
                let winTypes = [];
                for (let winType of data.winTypes) {
                    winTypes.push(this.encode(winType));
                }
                data.winTypes = winTypes;
            }
        }
    }

    static G_GameOver(msg: any) {
        msg.ownerName = this.encode(msg.ownerName);
        let roomConf: any = {};
        for (let name in msg.roomConf) {
            let value = msg.roomConf[name];
            roomConf[this.encode(name)] = this.encode("" + value);
        }
        msg.roomConf = roomConf;
        for (let userId in msg.records) {
            let record = msg.records[userId];
            record.userName = this.encode(record.userName);
        }
    }

    static G_AddGamber(msg: any) {
        msg.userName = this.encode(msg.userName);
    }

    static G_AddWatcher(msg: any) {
        msg.userName = this.encode(msg.userName);
    }

    static G_WatcherToGamber(msg: any) {
        msg.userName = this.encode(msg.userName);
    }

}