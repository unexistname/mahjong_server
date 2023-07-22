
export namespace GameConst {

    export enum RoomState {
        IDLE,
        PLAY,
    }

    export enum GameType {
        DIAO_XIE = "钓蟹",
        NIU_NIU = "牛牛",
        SANG_GONG = "三公",
        SHI_SANG_SHUI = "十三水",
        ZHA_JIN_HUA = "炸金花",
        DE_ZHOU = "德州扑克",
        FU_DING = "福鼎麻将",
        DA_ZHA = "福鼎打炸",
        QUE_SHENG = "广州雀神麻将",
        PAO_DE_KUAI = "跑得快",
    }

    export enum GameState {
        IDLE,
        ROB_BANKER,
        DECIDE_BANKER,
        DRAW_CARD,
        BETTING,
        SHOW_CARD,
        SETTLE,
    }

    export class GameTime {
        static COMPARE = 2;
        static DRAW_CARD = 2;
        static ROB_BANKER = 10;
        static DECIDE_BANKER = 5;
        static BETTING = 15;
        static SHOW_CARD = 5;
        static MJ_OPERATE = 10;
        static DISSOLVE_VOTE = 30;
    }

    export class RoomTime {
        static OFFLINE = 120;
    }

    export enum HuType {
        NONE = "",
        HU = "胡",
        ZI_MO = "自摸",
        HUN_3 = "三金倒",
        HUA_8 = "八花",
        DUI_DUI = "对对胡",
        PING_HU = "平胡",
        QING_YI_SE = "清一色",
        HUN_YI_SE = "混一色",
        TIAN_HU = "天胡",
        DI_HU = "地胡",
        XI_4 = "大四喜",
        LAI_ZI = "辣子",
        QUE_YI_MEN = "缺一门",
        BAN_BAN = "板板胡",
        PENG_PENG = "碰碰胡",
        QIANG_GANG = "抢杠胡",
    }

    export enum PayType {
        OWNER = "房主付",
        AA = "AA付",
    }

    export enum CostType {
        GEM = 1,
        COIN = 3,
    }
}