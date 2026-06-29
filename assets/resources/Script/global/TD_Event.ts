/**
 * 全局事件
 */

/** 模块初始化完毕 */
export const EVENT_INIT_END = "init_end";
/** 切换到主场景 */
export const EVENT_LOAD_MAIN_SCENE = "load_main_scene";
/** 请求权限 */
export const EVENT_REQUEST_PERMISSIONS = "request_all_permissions";
/** 获得权限 */
export const EVENT_AFTER_PERMISSIONS = "after_permissions";

/** 好友守卫 */
export const EVENT_HELP_FRIEND = "help_friend";
/** 开始结算 */
export const EVENT_SETTLEMENT = "start_settlement";

/** 刷新玩家信息 */
export const EVENT_UPDATE_SELF_INFO = "update_self_info";
/** 刷新用户等级 */
export const EVENT_UPDATE_CLAN_LEVEL = "update_clan_level";
/** 刷新战士列表 */
export const EVENT_UPDATE_HERO_LIST = "update_hero_list";
/** 机甲升级成功 */
export const EVENT_UPGRADE_HERO_SUCCESS = "upgrade_hero_success";
/** 刷新战士属性 */
export const EVENT_UPDATE_HERO_ATTRIBUTE = "update_hero_attribute";
/** 刷新邮件列表 */
export const EVENT_UPDATE_MAIL_LIST = "update_mail_list";
/** 刷新好友列表 */
export const EVENT_UPDATE_FRIEND_LIST = "update_friend_list";
/** 刷新任务列表 */
export const EVENT_UPDATE_TASK_LIST = "update_task_list";


/** 关闭邮件详情界面 */
export const EVENT_CLOSE_UI_MAIL_DETAIL = "close_ui_mail_detail";

/** 展示反伤 */
export const EVENT_FIGHT_THORNS = "fight_thorns";

/** 群体攻击特效 */
export const EVENT_FIGHT_AOE = "fight_aoe";

/**
 * 货币数据事件
 */
export const enum PlayerCurrencyEvent {
    /** 货币改变通知，参数为（t:CurrencyType(货币类型), off:number(改变量), total:number(改变后的值)) */
    OnChange = "PlayerCurrencyEvent_Change",
}

/** 战斗事件 */
export const enum FightEvent {
    /** 怪物创建完成 */
    CreateMonsters = "CreateMonsters",
    /** 出站英雄选择完成 */
    SelectHeros = "SelectHeros",
    /** 插入预习 */
    PreviewLesson = "PreviewLesson",
    /** 攻击英雄选择完成 */
    SelectFight = "SelectFight",
    /** 攻击目标选择完成 */
    SelectTarget = "SelectTarget",
    /** 单词选择完成 */
    SelectWord = "SelectWord",
    /** 乱斗开始 */
    MeleeStart = "MeleeStart",
    /** 乱斗单词选择完成 */
    MeleeSelectWord = "MeleeSelectWord",
    /** 乱斗单词用完了 */
    MeleeWordEmpty = "MeleeWordEmpty"
}

/** 战斗场景处理 */
export const enum FightNtfEvent {
    /** 创建怪物 */
    OnCreateMonsters = "OnCreateMonsters",
    /** 选择出战英雄 */
    OnSelectHeros = "OnSelectHeros",
    /** 预习课程 */
    OnPreviewLesson = "OnPreviewLesson",
    /** 选择攻击英雄 */
    OnSelectFight = "OnSelectFight",
    /** 选择攻击目标 */
    OnSelectTarget = "OnSelectTarget",
    /** 生成下一个单词 */
    OnCreateWord = "OnCreateWord",
    /** 单词选择结果 */
    OnSelectWord = "OnSelectWord",
    /** 单词选择超时 */
    OnSelectTimeout = "OnSelectTimeout",
    /** 选择攻击怪物 */
    OnSelectMonster = "OnSelectMonster",
    /** 怪物攻击结果 */
    OnMonsterFight = "OnMonsterFight",
    /** 游戏结束 */
    OnGameEnd = "OnGameEnd",
    /** 乱斗开始 */
    OnMeleeStart = "OnMeleeStart",
    /** 生成下一个乱斗单词 */
    OnMeleeCreateWord = "OnMeleeCreateWord",
    /** 乱斗单词选择结果 */
    OnMeleeSelectWord = "OnMeleeSelectWord",
    /** 乱斗结果 */
    OnMeleeEnd = "OnMeleeEnd",

    /** 回合结束（通常在怪物攻击完成后，准备进入下一轮选择） */
    OnRoundEnd = "OnRoundEnd",
}

/** 查询订单支付状态 */
export const EVENT_QUERY_PAYMENT = "query_payment";

/** 账号找回状态 */
export const EVENT_FIND_ACCOUNT = "find_account";
