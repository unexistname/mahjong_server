import RoomConfModel from "./RoomConfModel";

export default class RoomModel {
    roomId: string;
    roomState: GameConst.RoomState;
    roomConf: RoomConfModel;
    owner: string;
}
