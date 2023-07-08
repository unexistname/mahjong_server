

export namespace NetDefine {
    
    export enum NetType {
        CONNECT = 0,
        HALL_SOCKET = 1,
        GAME_SOCKET = 2,
        HEART_BEAT = 3,
    }

    export enum WS_Req {

        C_EnterHall,
        C_LeaveHall,

        C_ShowCreateRoom,
        C_CreateRoom,
        C_EnterRoom,
        C_Ready,
        C_Rob,
        C_Dissolve,
        C_LeaveRoom,
        C_ShowRecord,
        C_BeginGame,
        C_GamberInfo,
        C_TransferGem,
        C_ContinueGame,
        C_OverSettle,
        C_Betting,
        C_PlayCard,
        C_ShowProp,
        C_UseProp,

        // 管理员特殊操作
        CA_ShowReplaceCard,
        CA_ReplaceCard,
        CA_ShowCard,

        // 钓蟹
        C_Eat,
        C_ShowTouch,
        C_Touch,
        C_Belt,
        C_Waive,
        C_BlindEat,
        C_ReverseBelt,
        C_NoBelt,
        C_RubCard,
        C_SeeCard,

        // 炸金花
        C_Call,
        C_Raise,
        C_Watch,
        C_Compare,
        C_ShowRaise,
        C_CompareSelect,

        // 十三水
        C_Combine,
        C_UseSpecial,

        // 麻将
        C_Chi,
        C_Peng,
        C_Gang,
        C_Guo,
        C_Hu,
        C_ZiMo,
        C_ChuPai,
    }

    export enum WS_Resp {
        G_Error,
        GA_ShowReplaceCard,
        GA_ReplaceCard,
        GA_Perspect,

        G_GamberInfo,
        G_ShowProp,
        G_UseProp,
        G_UpdateGem,
        G_TransferGem,

        G_EnterHall,
        G_LeaveHall,
        G_RoomAdd,
        G_RoomDel,
        G_MoneyChange,
        G_EnterRoom,
        G_CreateRoom,
        G_ShowCreateRoom,
        G_ShowDissolve,
        
        G_ShowRecord,
        G_RobBanker,
        G_Rob,
        G_Betting,
        
        G_UserState,
        G_GameState,
        G_LeaveRoom,
        G_AddGamber,
        G_AddWatcher,
        G_PushRoomInfo,
        G_UpdateRoomOperate,
        G_WatcherToGamber,
        G_Ready,
        G_FundPoolChange,
        G_GamberScoreChange,
        G_UpdatePermission,
        G_BeginGame,
        G_InitHolds,
        G_DecideBanker,
        G_TurnBetting,
        G_ShowCard,
        G_GameSettle,
        G_UpdateTimer,
        G_DoOperate,
        G_Dissolve,
        G_GameOver,
        G_TurnPlayCard,
        G_DecideWind,
        
        G_ShowTouch,
        G_RubCard,
        G_SeeCard,

        G_CommonHolds,
        G_Eliminate,
        G_Special,
        G_Combine,
        G_ShowRaise,
        G_CompareSelect,

        G_DrawCard,
        G_MJOperate,
        G_LeftCard,
        G_Hun,
        G_BaseHu,
        G_Fold,
        G_SyncHolds,

        G_FriendCard,
        G_Friend,
        G_SwapSeat,
    }

    export enum HTTP_Get {
        C_GetUserBaseInfo = "/getUserBaseInfo",
        C_GetServers = "/get_servers",
        C_GetAddress = "/get_address",
        C_GetVersion = "/get_version",
        
        C_GetWechatToken = "/wechat_auth",
        C_WechatLogin = "/login",
        C_GetGuestToken = "/guest",
        C_PasswordLogin = "/auth",
        C_GuestLogin = "/login",
        C_GetPhoneToken = "/phone_verify",
        C_PhoneLogin = "/phone_auth",
        C_Recharge = "/recharge_id",
        C_Pay = "/pay",
    }

    export enum HTTP_Post {
        CB_PayResult = "/pay_result",
    }
}