import RoomNet from "../Room/RoomNet";
const db = require('../../utils/db');


export default class RecordMgr {
    private static _ins: RecordMgr;

    static get ins() {
        if (!this._ins) {
            this._ins = new RecordMgr();
        }
        return this._ins;
    }

    C_ShowRecord(userId: string) {
        db.get_user_record({ userId: userId, limit: 30 }, (records: any) => {
            RoomNet.G_ShowRecord(userId, records);
        })
    }
}