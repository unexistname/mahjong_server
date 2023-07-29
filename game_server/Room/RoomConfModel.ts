import { GameConst } from "../GameConst";
import RoomMetaConfMgr from "./RoomMetaConfMgr";


export default class RoomConfModel {
    gameName: string;    
    costType: number;
    costNum: number;

    data: { [key: string]: any } = {};

    constructor(roomDto: any) {
        this.gameName = roomDto.gameName;
        let metaConf = RoomMetaConfMgr.ins.getConf(this.gameName);
        this.costType = metaConf.costType;
        this.costNum = metaConf.costNum;
        this.data = metaConf.getPartDefaultConf();
        for (let subData of roomDto.roomConf) {
            let name: string = subData.name;
            let value: any = subData.value;
            this.data[name] = value;
        }
    }

    private _gamberAmount: number;
    get gamberAmount() {
        if (this._gamberAmount == null) {
            this._gamberAmount = Number(this.getValue("人数").replace(/[^0-9]/ig, ''));
        }
        return this._gamberAmount;
    }

    private _needEqualGamberAmount: boolean;
    get needEqualGamberAmount() {
        if (this._needEqualGamberAmount == null) {
            this._needEqualGamberAmount = this.getValue("人数").indexOf("最多") < 0;
        }
        return this._needEqualGamberAmount;
    }

    get payType() {
        return this.getValue("付费");
    }

    get isPrivate() {
        return this.getValue("私密");
    }

    get canJoinHalfway() {
        return this.getValue("允许中途加入");
    }

    get baseScore() {
        return Number(this.getValue("底分"));
    }

    get roundAmount() {
        return this.getValue("局数");
    }

    get canWatch() {
        return this.getValue("允许观战");
    }

    get waiveWhenTimeout() {
        return this.getValue("超时弃牌");
    }

    getValue(name: string) {
        return this.data[name];
    }

    get gameType(): GameConst.GameType {
        return <GameConst.GameType>this.gameName;
    }
}