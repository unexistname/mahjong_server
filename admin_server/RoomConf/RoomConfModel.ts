import RoomExtraConfModel from "./RoomExtraConfModel";


export default class RoomConfModel {
    roomConfId: number;
    gameName: string;
    gamberAmounts: number[];
    needEqualGamberAmount: boolean;
    payTypes: number[];
    costType: number[];
    costNum: number;
    roundAmounts: number[];
    isPrivate: boolean;
    baseScores: number[];
    extraConfs: RoomExtraConfModel[];
}