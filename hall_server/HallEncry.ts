import BaseEncry from "../base_net/BaseEncry";

export default class HallEncry extends BaseEncry {

    static C_CreateRoom(msg: any) {
        msg.gameName = this.decode(msg.gameName);
        for (let conf of msg.roomConf) {
            conf.name = this.decode(conf.name);
            conf.value = this.decode(conf.value);
            if (conf.value == "true" || conf.value == "false") {
                conf.value = conf.value == "true";
            } else if (!isNaN(Number(conf.value))) {
                conf.value = Number(conf.value);
            }
        }
    }

    static G_ShowCreateRoom(msg: any) {
        for (let roomConf of msg) {
            roomConf.gameName = this.encode(roomConf.gameName);
            for (let commonConf of roomConf.commonConfs) {
                commonConf.name = this.encode(commonConf.name);
                for (let i in commonConf.values) {
                    commonConf.values[i] = this.encode(commonConf.values[i]);
                }
            }
            for (let i in roomConf.ruleConfs) {
                roomConf.ruleConfs[i] = this.encode(roomConf.ruleConfs[i]);
            }
        }
    }

    static G_EnterRoom(msg: any) {
        msg.gameName = this.encode(msg.gameName);
        for (let conf of msg.roomConf) {
            conf.name = this.encode(conf.name);
            conf.value = this.encode(conf.value.toString());
        }
    }

    static G_ShowRecord(msg: any) {
        for (let record of msg.records) {
            record.gameName = this.encode(record.gameName);
            if (record.roomConf) {
                record.roomConf = this.encode(record.roomConf);
            }
            for (let user of record.users) {
                if (user.userName) {
                    user.userName = this.encode(user.userName);
                }
            }
        }
    }
}