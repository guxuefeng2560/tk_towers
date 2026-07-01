/**
 * 全局常量
 */

export enum VipState {
    /** 普通用户 */
    Normal,
    /** 付费用户 */
    VIP
}

/** 音频ID */
export const enum AudioID {
    None,
    /** 点击 */
    AudioID_Btn_Click = 1,
    /** 炸弹 */
    AudioID_Boom = 2,
    /** 敌人死亡 */
    AudioID_enemy_ide = 3,
    /** 敌人攻击 */
    AudioID_enemy_attack = 4,
    /** 英雄攻击 */
    AudioID_hero_attack = 5,
    /** 车辆行驶 */
    AudioID_car_move = 6,
    /** UI弹出收起 */
    AudioID_ui_open = 7,
    /** 战车升级 */
    AudioID_car_upgrade = 8,
    /** 题目收到错题集 */
    AudioID_error_code = 9,
    /** 木刺大招 */
    AudioID_sting = 10,
    /** 巢穴被摧毁 */
    AudioID_nest_destroy = 11,
    /** 敌人飞刀 */
    AudioID_fly_knife = 12,

    /** 战斗背景音乐 */
    AudioID_BGM_BATTLE = 98,
    /** 预备阶段背景音乐 */
    AudioID_BGM_PREPARE= 99,
    /** BOSS阶段背景音乐 */
    AudioID_BGM_BOSS= 100,
}

export class Constants {
    /** 如果为true,表示强制使用本地起的服务器 */
    static readonly FORCE_API_URL_USE_LOCAL = true;
    /** 强制使用的服务器地址 */
    // static readonly LOCAL_API_URL = "http://116.62.143.233:8080/api/v1"
    // 景辉本地
    // LOCAL_API_URL = "http://172.16.79.65:8080/api";
    // v1服务器
    static readonly LOCAL_API_URL =  "http://api.zolandtika.com/api/v1"

    //################################ 打包要修改的参数 ################################
    //################# 注意！！！打包还需要在原生工程中修改以下内容 #################
    //################# 平台号，原生版本号，应用图标（华为要求圆形）
    /** bugfix 后面要加/v3 */
    static readonly APP_CONFIG_URL = "https://api.kaka.cn/api";
    /**
     * release v2正式服 灰度服  
     * debug v1测试服  
     * bugfix v3  
     */
    static readonly REQUEST_MODE = "release"; // bugfix，需要在 APP_CONFIG_URL 后加/v3
    /** 游戏请求版本号 */
    static readonly headerVersionCode = "1000";
    /** 游戏版本号 */
    static readonly headerVersionName = "1.0.0";
    //################################ 打包要修改的参数 ################################

    /** 用于硬件登录注册 本地/官方/华为/展讯local 小天才xtc */
    static PLATFORM = "local";
    /** 登录渠道，0本地 1小天才 2官方/华为/展讯*/
    static loginChannelType = 0;
    /**
     * 渠道ID，服务端用于区分渠道
     * 小天才 0
     * 华为 1020178657361209022
     * 展讯 1364867489397251616
     * 360 180165654264238080
     * 阿玛丁 1239382994209222656
     * 小寻 1245981353552392238
     * 三G同创 1245981353552392192
     */
    static CHANNEL = "0";
    /** 渠道代号 xtc hw zhanxun */
    static CHANNEL_CODE = "xtc";
    /** 渠道缩写xtc huawei zhanxun 360 */
    static CHANNEL_CODE_EX = "xtc";
    /** 是否强制官方支付 */
    static OFFICIAL_PAY = false;
    /** 游客类型 */
    static GUEST_TYPE = 1;

    // 登录的本地的错误码 //////////////////////////////////////////
    // 微信获取系统信息错误
    static readonly LOGIN_ERROR_WX_GETSYSERROR = 789001;
    // 无法获取微信code
    static readonly LOGIN_ERROR_WX_GETCODEERROR = 789002;
    // 微信login失败
    static readonly LOGIN_ERROR_WX_LOGINERROR = 789003;
    // 我们MP服务器请求codesession失败
    static readonly LOGIN_ERROR_MP_SESSIONCHECKERROR = 789004;
    // MP服务器注册账号失败
    static readonly LOGIN_ERROR_MP_REGISTERERROR = 789005;
    // 验证次数过多
    static readonly LOGIN_ERROR_VERFIYMULTITIMES = 789006;
    // 点击按钮回调的参数为空
    static readonly LOGIN_ERROR_BTN_CALLBACK_RESNULL_ERROR = 789007;
    //////////////////////////////////////////////////////////// 

    /**
     * 包名
     * 小天才保卫农场 com.tika.game.defendfarm
     * 小天才大作战 com.baiqu.fight.englishfight
     */
    static readonly APPKEY = "com.tika.game.defendfarm";
    /**
     * 登录签名
     * 小天才保卫农场/华为 KHsPjfhIdmXo4CThrxovBbhB9XsH69KZ
     * 小天才大作战 FcafFQJg1iCPxmZULWeffAQnXZH921
     */
    static readonly SING_KEY = "KHsPjfhIdmXo4CThrxovBbhB9XsH69KZ";
    /** 游戏代号 */
    static readonly GAME_CODE = "defendfarm";

    /** 加载场景 */
    static readonly SCENE_LOADING = "Entry";
    /** 主场景 */
    static readonly SCENE_MAIN = "TowerDefenseScene";
    /** 战斗场景 */
    static readonly SCENE_BATTLE = "TD_BattleScene";

    /** 埋点数据上传时机 */
    static readonly BURIED_POINTS_NUM = 10;
    /** 游戏提示时间 */
    static readonly COUNTDOWN_TIME = 600;

    /** 支付成功回调地址 */
    static readonly RETURN_URL = "https://media.kaka.cn/defendfarm/callback_pay_success";
    /** 支付失败回调地址 */
    static readonly ERROR_URL = "https://media.kaka.cn/defendfarm/callback_pay_watchfailed";
}
