import TurnOperate from "../Base/TurnOperate";


export default class ZJHOperate extends TurnOperate {
    static CALL = 1 << 1;
    static RAISE = 1 << 2;
    static WATCH = 1 << 3;
    static COMPARE = 1 << 4;
}