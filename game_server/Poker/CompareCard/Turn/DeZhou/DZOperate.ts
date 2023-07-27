import TurnOperate from "../Base/TurnOperate";


export default class DZOperate extends TurnOperate {
    static CALL = 1 << 1;
    static RAISE = 1 << 2;
    static BLINT_BET = 1 << 3;
}