import DXOperate from "./DXOperate";

export default class DXOptionalOperate {
    static EAT_TOUCH_BELT = DXOperate.EAT | DXOperate.TOUCH | DXOperate.BELT | DXOperate.WAIVE;
    static EAT_TOUCH = DXOperate.EAT | DXOperate.TOUCH | DXOperate.WAIVE;
    static BLIND_EAT_TOUCH = DXOperate.BLIND_EAT | DXOperate.TOUCH | DXOperate.WAIVE;
    static EAT = DXOperate.BLIND_EAT | DXOperate.WAIVE;
    static BELT = DXOperate.BELT | DXOperate.WAIVE;
    static EAT_BELT = DXOperate.EAT | DXOperate.BELT | DXOperate.WAIVE;
    static REVERSE_BELT = DXOperate.REVERSE_BELT | DXOperate.NO_BELT;
}