
export enum ErrorCode {
    SUCCESS,
    UNKNOWN_ERROR,
    ROOM_IS_BEGIN,
    GAME_NOT_BEGIN,
    YOU_ARE_NOT_OWNER,
    HAVE_GAMBER_NO_READY,
    NO_CARD_CAN_DRAW,
    NOT_YOUR_TURN,
    UNKOWN_GAMBER,
    UNEXCEPT_OPERATE,
    BETTING_SCORE_ERROR,
    CANT_KICK_WHEN_PLAY,
    ROOM_IS_UNEXIST,
    ROOM_IS_FULL,
    UNEXIST_USER,
    GAMBER_NOT_ENOUGH,
    YOU_ALREADY_HU,
    YOU_NEED_GUO_FIRST,
    YOU_CANT_CHU_PAI,
    THIS_CARD_CANT_PLAY,
    YOU_DONT_HAVE_CARD,
    THIS_IS_YOUR_CARD,
    GAME_STATE_ERROR,
    YOU_ALREADY_ROB_BANKER,
    CANT_POUR_WATER,
    YOU_DONT_HAVE_CARDS,
    CARD_TYPE_ERROR,
    CARD_TYPE_DIFFERENT,
    YOU_CARD_IS_SMALL,
    COMBINE_CARD_ERROR,
    
    OWNER_MONEY_NOT_ENOUGH,
    GAMBER_MONEY_NOT_ENOUGH,
    GEM_AMOUNT_ERROR,
    GEM_NOT_ENOUGH,
    UNEXIST_SERIES,
    EMPTY_PREPAY_ID,
    MERCHANT_CERTIFICATE_SERIAL_NUMBER_INCORRECT,
    SIGN_VERIFY_FAIL,
    REQUEST_HEADER_ERROR,
    UNEXIST_ORDER,
    ORDER_ALREADY_PURCHASE,
    ORDER_PRICE_ERROR,
    ORDER_TRADE_FAIL,
    
    USER_CREATE_ERRPR,
    UNEXIST_ACCOUNT,
    LOGIN_VERIFY_FAIL,
    PASSWORD_ERROR,
    YOU_ARE_BLACK,
    WECHAT_AUTHORIZE_FAIL,
    WECHAT_USERINFO_FAIL,
    WECHAT_LOGIN_ARGUMENT_ERROR,
    SEND_SMS_ERROR,
    SMS_CODE_ERROR,

    REQUEST_SERVER_ARGUMENT_ERROR,
    REQUEST_SERVER_ADDRESS_ERROR,

    JSON_PARSE_ERROR,
    HTTP_REQUEST_TIMEOUT,
    HTTP_REQUEST_ERROR,
}

let errorMsg: any = {};
errorMsg[ErrorCode.SUCCESS] = "";
errorMsg[ErrorCode.UNKNOWN_ERROR] = "未知错误";
errorMsg[ErrorCode.ROOM_IS_BEGIN] = "房间已开始游戏";
errorMsg[ErrorCode.YOU_ARE_NOT_OWNER] = "你不是房主";
errorMsg[ErrorCode.HAVE_GAMBER_NO_READY] = "有玩家未准备";
errorMsg[ErrorCode.NO_CARD_CAN_DRAW] = "没有牌可以抽了";
errorMsg[ErrorCode.NOT_YOUR_TURN] = "不是你的回合";
errorMsg[ErrorCode.UNKOWN_GAMBER] = "玩家不存在";
errorMsg[ErrorCode.UNEXCEPT_OPERATE] = "操作不正确";
errorMsg[ErrorCode.BETTING_SCORE_ERROR] = "下注金额不正确";
errorMsg[ErrorCode.CANT_KICK_WHEN_PLAY] = "正在游戏中，无法踢人";
errorMsg[ErrorCode.ROOM_IS_UNEXIST] = "房间不存在";
errorMsg[ErrorCode.ROOM_IS_FULL] = "房间已满";
errorMsg[ErrorCode.UNEXIST_USER] = "用户不存在";
errorMsg[ErrorCode.GAMBER_NOT_ENOUGH] = "人数不足";
errorMsg[ErrorCode.GAME_NOT_BEGIN] = "游戏未开始";
errorMsg[ErrorCode.YOU_ALREADY_HU] = "你已经胡过了";
errorMsg[ErrorCode.YOU_NEED_GUO_FIRST] = "你需要先过牌";
errorMsg[ErrorCode.YOU_CANT_CHU_PAI] = "你现在不能出牌";
errorMsg[ErrorCode.THIS_CARD_CANT_PLAY] = "这张牌现在不能打";
errorMsg[ErrorCode.YOU_DONT_HAVE_CARD] = "你没有这张牌";
errorMsg[ErrorCode.THIS_IS_YOUR_CARD] = "这个牌是你出的，你不能这么操作";
errorMsg[ErrorCode.GAME_STATE_ERROR] = "当前的游戏阶段不支持此操作";
errorMsg[ErrorCode.YOU_ALREADY_ROB_BANKER] = "你已经抢过庄了";
errorMsg[ErrorCode.CANT_POUR_WATER] = "不能倒水";
errorMsg[ErrorCode.YOU_DONT_HAVE_CARDS] = "你没有这张牌";
errorMsg[ErrorCode.CARD_TYPE_ERROR] = "牌型有误";
errorMsg[ErrorCode.CARD_TYPE_DIFFERENT] = "牌型不对";
errorMsg[ErrorCode.YOU_CARD_IS_SMALL] = "你的牌太小了";
errorMsg[ErrorCode.COMBINE_CARD_ERROR] = "组牌有误";

errorMsg[ErrorCode.OWNER_MONEY_NOT_ENOUGH] = "房主房费不足";
errorMsg[ErrorCode.GAMBER_MONEY_NOT_ENOUGH] = "有玩家无法支付房费";
errorMsg[ErrorCode.GEM_AMOUNT_ERROR] = "钻石数量有误";
errorMsg[ErrorCode.GEM_NOT_ENOUGH] = "钻石不足";
errorMsg[ErrorCode.UNEXIST_SERIES] = "套餐不存在";
errorMsg[ErrorCode.EMPTY_PREPAY_ID] = "微信订单创建失败";
errorMsg[ErrorCode.MERCHANT_CERTIFICATE_SERIAL_NUMBER_INCORRECT] = "商户证书序列号不正确";
errorMsg[ErrorCode.SIGN_VERIFY_FAIL] = "签名验证失败";
errorMsg[ErrorCode.REQUEST_HEADER_ERROR] = "请求头数据不正确";
errorMsg[ErrorCode.UNEXIST_ORDER] = "订单不存在";
errorMsg[ErrorCode.ORDER_ALREADY_PURCHASE] = "订单已支付";
errorMsg[ErrorCode.ORDER_PRICE_ERROR] = "订单金额不正确";
errorMsg[ErrorCode.ORDER_TRADE_FAIL] = "订单交易失败";

errorMsg[ErrorCode.USER_CREATE_ERRPR] = "用户创建失败";
errorMsg[ErrorCode.UNEXIST_ACCOUNT] = "账户不存在";
errorMsg[ErrorCode.LOGIN_VERIFY_FAIL] = "登录验证不通过";
errorMsg[ErrorCode.PASSWORD_ERROR] = "密码错误";
errorMsg[ErrorCode.YOU_ARE_BLACK] = "你是黑名单用户";
errorMsg[ErrorCode.WECHAT_AUTHORIZE_FAIL] = "获取微信验证失败";
errorMsg[ErrorCode.WECHAT_USERINFO_FAIL] = "微信获取用户信息失败";
errorMsg[ErrorCode.WECHAT_LOGIN_ARGUMENT_ERROR] = "微信登陆缺少参数";
errorMsg[ErrorCode.SEND_SMS_ERROR] = "发送短信出错";
errorMsg[ErrorCode.SMS_CODE_ERROR] = "验证码错误";

errorMsg[ErrorCode.REQUEST_SERVER_ARGUMENT_ERROR] = "请求服务器信息时参数错误";
errorMsg[ErrorCode.REQUEST_SERVER_ADDRESS_ERROR] = "获取服务器地址失败";

errorMsg[ErrorCode.JSON_PARSE_ERROR] = "数据解析出错";
errorMsg[ErrorCode.HTTP_REQUEST_TIMEOUT] = "连接服务器超时";
errorMsg[ErrorCode.HTTP_REQUEST_ERROR] = "请求服务器出错";

export let ErrorMsg = errorMsg;