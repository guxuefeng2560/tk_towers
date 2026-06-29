/**
 * 资源路径管理
 */
export default class ResPathDefine {
    /** 网络转圈 */
    static readonly UINAME_LOADING_CONTROLLER = "prefab/ui/LoadingController";
    /** 冒泡提示 */
    static readonly UINAME_POP_INFO = "prefab/ui/TD_PopInfo";
    /** 弹出框 */
    static readonly UINAME_MESSAGE_DIALOG = "prefab/ui/MessageDialog";

    /** 官方支付 */
    static readonly UINAME_PAY_OFFICIAL = "prefab/ui/OfficialPayUI";
    /** 二维码支付 */
    static readonly UINAME_PAY = "prefab/ui/PayUI";
    /** 小天才支付 */
    static readonly UINAME_PAY_XTC = "prefab/ui/XTCPayUI";

    /** 账号找回 */
    static readonly UINAME_ACCOUNT_BACK = "prefab/ui/AccountBackUI";
    /** 个人信息 */
    static readonly UINAME_SELF_INFO = "prefab/ui/SelfInfoUI";
    /** 农场信息 */
static readonly UINAME_CLAN_UPGRADE = "prefab/ui/TD_ClanUpgradeUI";
    /** 农场经验升级 */
    static readonly UINAME_CLAN_UPGRADE_EXP = "prefab/ui/ClanExpUI";
    /** 战士列表 */
    static readonly UINAME_HERO_LIST = "prefab/ui/hero/TD_HeroListUI";
    /** 战士属性 */
    static readonly UINAME_HERO_ATTRIBUTE = "prefab/ui/HeroAttributeUI";
    /** 战士升级 */
    static readonly UINAME_HERO_UPGRADE = "prefab/ui/hero/TD_UpgradeAleartUI";
    /** 战士解锁 */
    static readonly UINAME_HERO_UNCLOCK = "prefab/ui/HeroUnclockUI";
    static readonly UINAME_UNLOCK_ALEART = "prefab/ui/hero/TD_UnlockAleartUI";
    static readonly UINAME_UNGRADE_ALEART = "prefab/ui/hero/TD_UpgradeAleartUI";
    /** 战士获取 */
    static readonly UINAME_HERO_GET = "prefab/ui/HeroGetUI";
    /** 材料合成 */
    static readonly UINAME_COMPOSITE = "prefab/ui/hero/TD_CompositeUI";
    /** 材料合成展示 */
    static readonly UINAME_COMPOSITE_RESULT = "prefab/ui/CompositeResultUI";
    /** 合成奖励界面 */
    static readonly UINAME_COMPOSITE_REWARD = "prefab/ui/common/TD_ComposeRewardUI";

    /** 魔法盒子 */
    static readonly UINAME_MAGIC_BOX = "prefab/ui/main/TD_MagicBox";

    /** 任务列表 */
    static readonly UINAME_QUEST_LIST = "prefab/ui/TD_QuestUI";
    /** 任务奖励 */
    static readonly UINAME_QUEST_REWARD = "prefab/ui/TD_QuestRewardUI";

    /** 邮件列表 */
    static readonly UINAME_MAIL_LIST = "prefab/ui/MailListUI";
    /** 邮件详情 */
    static readonly UINAME_MAIL_DETAIL = "prefab/ui/MailDetailUI";

    /** 拒绝交换二次确认 */
    static readonly UINAME_EXCHANGE_REFUSE = "prefab/ui/ExchangeRefuseUI";
    /** 选择交换材料 */
    static readonly UINAME_EXCHANGE = "prefab/ui/ExchangeUI";
    /** 选择交换材料后二次确认 */
    static readonly UINAME_EXCHANGE_CONFIRM = "prefab/ui/ExchangeConfirmUI";

    /** 赛季收成 */
    static readonly UINAME_SEASON = "prefab/ui/SeasonUI";
    /** 排行榜 */
    static readonly UINAME_RANKING = "prefab/ui/RankingUI";
    /** 排行奖励 */
    static readonly UINAME_RANKING_REWARD = "prefab/ui/RankingRewardUI";


    /** 好友列表 */
    static readonly UINAME_FRIEND_LIST = "prefab/ui/FriendListUI";
    /** 好友详情 */
    static readonly UINAME_FRIEND = "prefab/ui/FriendUI";
    /** 好友删除二次确认 */
    static readonly UINAME_FRIEND_DELETE = "prefab/ui/FriendDeleteUI";
    /** 好友搜索 */
    static readonly UINAME_FRIEND_SEARCH = "prefab/ui/FriendSearchUI";
    /** 好友搜索结果 */
    static readonly UINAME_FRIEND_SEARCH_RESULT = "prefab/ui/FriendSearchResultUI";
    /** 好友守卫二次确认 */
    static readonly UINAME_FRIEND_HELP = "prefab/ui/FriendHelpUI";

    /** 战士选择 */
    static readonly UINAME_HERO_CHOOSE = "prefab/ui/HeroChooseUI";
    /** 奖励 */
    static readonly UINAME_REWARD = "prefab/ui/RewardUI";
    /** 单词面板 */
    static readonly UINAME_WORD = "prefab/reader/TD_LearnMaterialAttack";
    /** 预习面板 */
    static readonly UINAME_PREVIEW_LESSON = "prefab/reader/PreviewLesson";

    /** 成绩单 */
    static readonly UINAME_QRCODE = "prefab/ui/QRCodeUI";

    /** 公众号 */
    static readonly UINAME_PAY_GUIDE = "prefab/ui/PayGuideUI";
    /** 体力引导 */
    static readonly UINAME_POWER_GUIDE = "prefab/ui/PowerGuideUI";

    /** 退出战斗确认 */
    static readonly UINAME_END_BATTLE = "prefab/ui/TD_EndBattleUI";
    /** 升级成功 */
    static readonly UINAME_UPGRADE_RESULT = "prefab/ui/UpgradeResultUI";
    /** 退出游戏确认 */
    static readonly UINAME_END_GAME = "prefab/ui/EndGameUI";
    /** 战斗信息 */
    static readonly UINAME_FIGHT_INFO = "prefab/ui/FightInfoUI";

    /** 强制退出游戏 */
    static readonly UINAME_END_GAME_FORCE = "prefab/ui/common/TD_ForceEndGameUI";
    /** 热更完成提示 */
    static readonly UINAME_HOT_UPDATE_TIPS = "prefab/ui/HotUpdateTipsUI";

    /** 战斗成绩单 */
    static readonly UINAME_BATTLE_RESULT = "prefab/ui/TD_BattleResult";

    /** 大厅结算和当场战斗学习记录 */
    static readonly UINAME_REPORT = "prefab/ui/TD_ReportUI";

    /** 协议 */
    static readonly UINAME_AGREEMENT = "prefab/ui/AgreementUI";

    /** 签到 */
    static readonly UINAME_SIGN_IN = "prefab/ui/SignInUI";

    /** 大地图 */
    static readonly UINAME_WORLD_MAP = "prefab/ui/map/TD_WorldMaps";

    /** 学习记录 */
    static readonly UINAME_LEARN_CODE = "prefab/ui/learnCode/TD_LearnCode";

    /** 新手引导 */
    static readonly UINAME_USER_GUIDE = "prefab/ui/guide/TD_UserGuide";

    /** 返回大厅提示 */
    static readonly UINAME_BACK_LOBBY = "prefab/ui/main/TD_BackToLobbyAlert";

    /** 图集 */
    static readonly ATLAS_PROP = "textures/icon/prop";
    static readonly ATLAS_PROP_BG_LIST = "textures/icon/prop_bg";
    static readonly ATLAS_AVATAR = "textures/icon/avatar";
    static readonly ATLAS_ICON_HERO_LIST = "textures/icon/hero";
    static readonly ATLAS_ICON_HERO_BG_LIST = "textures/icon/hero_bg";
    static readonly ATLAS_ICON_HERO_BG_CHOOSE_LIST = "textures/icon/hero_bg_ch";

    /** 通用buff */
    static readonly EFFECT_BUFF = "prefab/effect/BuffEffect";
    /** 子弹特效 */
    static readonly EFFECT_BULLET = "prefab/effect/BulletEffect";
    /** 受击提示 */
    static readonly EFFECT_ATTACK_TIP = "prefab/effect/TipEffect";
    /** 掉血提示 */
    static readonly EFFECT_ATTACK_TIP_HP = "prefab/effect/HpEffect";
    /** 手指 */
    static readonly EFFECT_FINGER = "prefab/effect/GuideFinger";
    /** 宝宝高兴 */
    static readonly EFFECT_BABY_HAPPY = "prefab/effect/HappyBaby";
    /** 宝宝哭泣 */
    static readonly EFFECT_BABY_CRY = "prefab/effect/CryBaby";
    /** 火焰特效 */
    static readonly Fire_Effect = "prefab/effect/fire";
}
