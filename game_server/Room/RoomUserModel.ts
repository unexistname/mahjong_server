import UserModel from "../../common/UserModel";


export default class RoomUserModel {
    userId: string;
    userName: string;
    sex: number;
    avatarUrl: string;

    isReady: boolean;
    isWatch: boolean;
    seatIndex: number;

    constructor(user: UserModel) {
        this.userId = user.userId;
        this.userName = user.userName;
        this.sex = user.sex;
        this.avatarUrl = user.avatarUrl;
    }
}