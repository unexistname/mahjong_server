import LocationModel from "./LocationModel";

export default class UserModel {

    account: string;
    userId: string;
    userName: string;
    avatarUrl: string;
    sex: number;
    gem: number;
    coin: number;
    winRate: number;

    ip: string;
    isBlack: boolean;
    location: LocationModel;
    online: boolean;

    constructor(data: any = {}) {
        this.account = data.account ? data.account : "";
        this.userId = data.userId ? data.userId : "";
        this.userName = data.userName ? data.userName : "";
        this.avatarUrl = data.headImg ? data.headImg : "";
        this.gem = data.gems ? data.gems : 0;
        this.coin = data.coins ? data.coins : 0;
        this.ip = data.ip ? data.ip : "";
        this.isBlack = data.isBlack ? data.isBlack : false;
        this.online = true;
    }
}