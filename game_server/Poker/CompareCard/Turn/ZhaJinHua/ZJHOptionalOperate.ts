import ZJHOperate from "./ZJHOperate";


export default class ZJHOptionalOperate {
    static CALL_RAISE = ZJHOperate.CALL | ZJHOperate.RAISE | ZJHOperate.WAIVE;
    static COMPARE = ZJHOperate.COMPARE | ZJHOperate.WAIVE;
    static CALL_RAISE_COMPARE = ZJHOperate.CALL | ZJHOperate.RAISE | ZJHOperate.COMPARE | ZJHOperate.WAIVE;
    static CALL_RAISE_WATCH = ZJHOperate.CALL | ZJHOperate.RAISE | ZJHOperate.WATCH | ZJHOperate.WAIVE;
    static COMPARE_WATCH = ZJHOperate.COMPARE | ZJHOperate.WATCH | ZJHOperate.WAIVE;
    static CALL_RAISE_COMPARE_WATCH = ZJHOperate.CALL | ZJHOperate.RAISE | ZJHOperate.COMPARE | ZJHOperate.WATCH | ZJHOperate.WAIVE;
}