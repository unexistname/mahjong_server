import TurnOperate from "../Base/TurnOperate";


export default class DXOperate extends TurnOperate {
    static EAT = 1 << 1;
    static TOUCH = 1 << 2;
    static BELT = 1 << 3;
    static BLIND_EAT = 1 << 4;
    static REVERSE_BELT = 1 << 5;
    static NO_BELT = 1 << 6;
}