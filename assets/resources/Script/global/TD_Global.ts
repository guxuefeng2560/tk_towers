/**
 * 全局变量
 */

export default class Global {
    /** api Server */
    static apiUrl: string = "https://api.kaka.cn/api/v1";
    /** 资源服务器地址 */
    static resourceUrl: string = "https://media.kaka.cn";
    /** MP Server */
    static mpUrl: string = "https://calibra.kaka.cn/mp";
    /** h5地址 */
    static h5Url: string = "https://media.kaka.cn/v2";
    /** 战斗效果开关  */
    static gameEffectLimit: number = null;
    /** 战斗属性开关 */
    static gameAttrLimit: number = null;
    /** 时间限制开关 */
    static playLimit: number = null;
    /** 时间段控制 */
    static switchTime: any = null;
    /** 游戏提示中 */
    static playLimiting: boolean = null;

    /** 正在展示动画或剧情，无法触摸 */
    static playingAnimation: boolean = false;

    /** 是否第一次进入游戏 */
    static isFirstEnter: boolean = true;

    /** 是否第一次进入主界面 */
    static isFirstEnterMain: boolean = true;

    /** 正在播放的音频ID */
    static currentSFXId: number = -1;
    /** 正在播放的音频Clip */
    static currentSFXClip: cc.AudioClip = null;

    /** 支付中发起登录 */
    static underPayment: string = "";

    /** xtc 14-1.0.9 hw 13-1.0.6 xiaoxun 3-1.0.6 zhanxun 10-1.0.6 */
    /** 热更地址 */
    static packageUrl: string = "";
    /** 热更游戏外部版本号 */
    static updateGameVersion: string = "1.0.6";
    /** 热更游戏内部版本号 */
    static updateVersionCode: string = "1006";
    /** 游戏外部版本号 */
    static gameVersion: string = "1.0.6";
    /**
     * 该值与服务器协商，一致的则会走正式服  
     * 大于服务器值的则会走v2  
     * 大于线上版本就是v2  等于就是线上版本
     */
    static versionCode: string = "1006";
    /** 是否强制更新 */
    static needForceUpadte: string = "0";

    /** 小天才code */
    static codeXTC: string = "";
    /** 小天才openId */
    static openIdXTC: string = "";
    /** 设备唯一ID */
    static openId: string = "";
    /** 功能界面是否已打开 */
    static openedFesture: boolean = false;

    /** 战斗失败，指引升级 */
    static guideUpgradeHero: boolean = null;

    /** 是否处于加载场景 */
    static isLoadScene: boolean = null;
    static isMainScene: boolean = null;
    /** 是否处于战斗场景 */
    static isBattleScene: boolean = null;
    /** 是否已经开始战斗 */
    static isInBattle: boolean = null;
    /** 能否退出战斗 */
    static canQuitBattle: boolean = null;
    /** 防止网络请求失败导致无法退出 */
    static netError: boolean = null;

    /** 当前支付商户号 */
    static mchId: number = null;
    /** 是否开启家长代付 */
    static isHelpPay: boolean = null;

    /** 正在打开界面 */
    static openingUI: boolean = null;
    /** 正在切换场景 */
    static openingScene: boolean = null;
    /** 暂停答题 */
    static stopWordGame: boolean = null;
    /** 锁住list点击 */
    static clockList: boolean = null;

    /** 背景缩放比例 */
    static bgScale: number = 1;

    /** 不需要热更 */
    static notNeedHotUpdate: boolean = null;
    /** 需要热更 */
    static needHotUpdate: boolean = null;
    /** 游戏配置 */
    static gameConfigId: number = 0;

    /** 获胜次数 */
    static victoryNum: number = null;
    /** 展示的怪物 */
    static showMonsterId: number = null;

    /** 未点击过战士 */
    static redDotHero: boolean = true;

    /** 健康提示 */
    static healthTips: number = null;

    /** 好友守卫 */
    static friendHelp: number = null;

    /** 是否在跑monkey */
    static monkeyRun: boolean = null;
    /** 游戏时长，毫秒 */
    static gameTime: number = 1800000;
    /** 开始游戏时间戳 */
    static startGameTime: number = null;
    /** 剩余游戏时长, 秒 */
    static remainGameTime: number = null;

    /** 退出游戏 */
    static gameQuited: boolean = null;

    /** 游客模式 */
    static guestMode: boolean = null;
    /** 正在登录 */
    static isLogin: boolean = null;

    static outOfMemory: boolean = null;
    static outOfSpace: boolean = null;

    /**
     * 调试开关：结算时跳过服务器结算/检测，直接展示结算界面。
     * 默认关闭；仅用于本地联调/排查。
     */
    static skipSettlementServerCheck: boolean = true;

    /** 战报页使用的结算奖励缓存 */
    static reportRewardList: { item_id: number, item_num: number }[] = null;
    /** 战报页奖励中是否包含包裹 */
    static reportRewardBag: boolean = null;

    /** 因为进入游戏会切换游戏场景，需要记录之前选择地块，否者返回主场景无法顺利打开地图 */
    /** 之前点击的大地图 */
    static selectWorldMapId: number = null;
    /** 之前点击的小地图 */
    static selectAreaId: number = null;
    static worldMapInfo: any = null;
    static worldMapWords: any = null;
    /** 当前波次 */
    static battleWaves: number = 0;
    /** 当前是否是boss波 */
    static isBossWave: number = 0;
    /** 当前进入的任务 */
    static currentMainTaskId: number = 0;

    /** 游戏ID 1.dragonhero 2.yoyo 3.xianzong 4.xianzong  */
    static game_id: string = "resources";

    /** 游戏类型 1.钢甲小龙侠 2.郑和下西洋 3.魔幻仙踪 4.乐比悠悠 */
    static game_type: number = 3;
    /** 教材 1.人教版 2.暨南中文 3.hsk */
    static tech_book: number = 1;
    /** 年级 */
    static tech_grade: number = 1;
    /** test token */
    static test_token: string = "zoland8a0b923820dcc509a6f75tika";
    /** 当前选中用户 */
    static select_user_index: number = 0;

    static is_load_success: boolean = false;

    /** 当前选中的机甲shapeid */
    static selectShapeId: number = -1;

    /** 当前引导id */
    static currentGuideId: number = 0;
    /** 当前步骤id */
    static currentGuideStepId: number = 0;
    
    static BundleName: string = "TKEDU";

    static VersionCode: string = "v1.0.0.1";

    /** 是否iphonex */
    static isIphoneX: boolean = false;

    static screenMaxX: number = 0;


    // 资源服务器地址
    static ResourceUrl = "https://media.kaka.cn/chineseworld/teaching_material/debug/";

    static currentSFXid: number = -1;

    /** 适配偏移值 */
    static offsetX: number = 0;
}
