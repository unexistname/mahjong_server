import { ErrorCode } from "../game_server/ErrorCode";
import RoomNet from "../game_server/Room/RoomNet";
import AllUserMgr from "./AllUserMgr";

const db = require('../utils/db');
const http = require('../base_net/http');

export default class PropMgr {

    private static _ins: PropMgr;

    static get ins() {
        if (this._ins == null) {
            this._ins = new PropMgr();
        }
        return this._ins;
    }

    props: { [key: string]: any };

    loadAllProp() {
        db.get_all_prop((datas: any) => {
            this.props = {};
            for (let data of datas) {
                if (!data.imageUrl.startsWith("http")) {
                    data.imageUrl = "http://" + http.getLocalIP() + ":8899" + data.imageUrl;
                }
                this.props[data.id] = data;
            }
        });
    }

    C_UseProp(userId: string, userId2: string, propId: string) {
        let user = AllUserMgr.ins.getUser(userId);
        if (!user) {
            return ErrorCode.UNEXIST_USER;
        }
        let prop = this.props[propId];
        if (prop.costPropId == 1) {
            if (user.gem < prop.costAmount) {
                return ErrorCode.GEM_NOT_ENOUGH;
            }
        }
        RoomNet.G_UseProp(userId, userId2, prop);
    }

    C_ShowProp(userId: string) {
        RoomNet.G_ShowProp(userId, this.props);
    }

    getAllProp() {
        return this.props;
    }
}