
import { NetBaseReq, NetBaseRespNtf } from "../tools/net/TD_Message";
import { NetMsgCodeDefine } from "./TD_NetMsgCodeDefine";

/**
 * HTTP协议管理
 */
export namespace FarmBundle {

    /** 获取游戏版本 */
    export class ReqAppVersion extends NetBaseReq {
        app_id: string;
        device_id: string;
        os_version_code: string;
        app_version_code: string;
        channel_abbr: string;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.AppVersion;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespAppVersion extends NetBaseRespNtf {
        update_url: string;
        update_comment: string;
        version: string;
        version_code: number;
        force_update: number; // 0无需强更 1必须强更

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.AppVersion;
        }
        deserialize(msg: string): NetBaseRespNtf {
            throw new Error("Method not implemented.");
        }
        deserializeFromObj(msg: object): NetBaseRespNtf {
            this.update_url = msg["update_url"];
            this.update_comment = msg["update_comment"];
            this.version = msg["version"];
            this.version_code = msg["version_code"];
            this.force_update = msg["force_update"];
            return this;
        }
    }

    /** 获取配置 */
    export class ReqAppConfig extends NetBaseReq {
        app_id: string;
        device_id: string;
        os_version_code: string;
        app_version_code: string;
        request_server: string;
        channel_abbr: string;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.AppConfig;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespAppConfig extends NetBaseRespNtf {
        api_url_base: string;
        resource_url_base: string;
        mp_url_base: string;
        h5_url_base: string;
        upkeep: number;
        /** 0游戏提示可直接关闭 1游戏提示需要计时结束才能关闭 */
        play_limit: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.AppConfig;
        }
        deserialize(msg: string): NetBaseRespNtf {
            throw new Error("Method not implemented.");
        }
        deserializeFromObj(msg: object): NetBaseRespNtf {
            this.api_url_base = this.replaceHttpToHttps(msg["api_url_base"]);
            this.resource_url_base = this.replaceHttpToHttps(msg["resource_url_base"]);
            this.mp_url_base = this.replaceHttpToHttps(msg["mp_url_base"]);
            this.h5_url_base = this.replaceHttpToHttps(msg["h5_url_base"]);
            this.upkeep = msg["upkeep"];
            this.play_limit = msg["play_limit"];
            return this;
        }

        private replaceHttpToHttps(url: string): string {
            return url.replace("http://", "https://")
        }
    }

    /** 校验token */
    export class ReqVerifyToken extends NetBaseReq {
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.VerifyToken;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespVerifyToken extends NetBaseRespNtf {
        err: number;
        message: string;
        create_time: string;
        id: string;
        profile_image_url: string;
        userInfo: any;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.VerifyToken;
        }
        deserialize(msg: string): NetBaseRespNtf {
            throw new Error("Method not implemented.");
        }
        deserializeFromObj(msg: object): NetBaseRespNtf {
            this.create_time = msg["create_time"]
            this.id = msg["id"]
            this.profile_image_url = msg["profile_image_url"]
            this.err = msg["err"]
            this.message = msg["message"]
            this.userInfo = msg["userInfo"];
            return this;
        }
    }

    /** 获取用户信息 */
    export class ReqUserHome extends NetBaseReq {
        channel_code: string;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.UserInfo;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespUserHome extends NetBaseRespNtf {
        user_info: UserInfo;
        config: GameConfig;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.UserInfo;
        }
        deserialize(msg: string): NetBaseRespNtf {
            throw new Error("Method not implemented.");
        }
        deserializeFromObj(msg: object): NetBaseRespNtf {
            this.user_info = msg["user_info"];
            this.config = msg["config"];
            return this;
        }
    }

    /** 玩家数据 */
    export interface UserInfo {
        /** 用户id，踢卡学号 */
        user_id: number;
        /** 用户中心id */
        ucid: number;
        /** 昵称 */
        nick_name: string;
        /** 渠道id */
        channel_id: string;
        /** 渠道代码 */
        channel_code: string;
        /** 能量点 */
        coin: number;
        /** 金 */
        part1: number;
        /** 木 */
        part2: number;
        /** 水 */
        part3: number;
        /** 火 */
        part4: number;
        /** 土 */
        part5: number;
        /** 积分 */
        integral: number;
        /** 乱斗券 */
        melee_ticket: number;
        /** 用户等级 */
        level: number;
        /** 称号id，0表示无称号 */
        user_title_id: number;
        /** 赛季进度 */
        season_progress: number;
        /** 头像id */
        avatar_id: number;
        /** 微信绑定id */
        bind_id: number;
        /** vip身份状态:0临时用户，1月卡 2半年 3年卡 4三年 5联合小程序三年 99普通用户（已绑定账号且试用vip过期且未付费的用户）199 试用(绑定微信获得一定时间的试用vip) */
        vip_type: number;
        /** vip开始时间 */
        vip_start: number;
        /** vip结束时间 */
        vip_end: number;
        /** 赛季拥有的宝宝总数量 */
        baby_num: number;
        /** 前几次胜利进度 */
        win_progress: number;
        /** 番茄能量 */
        tomato_energy: number;
        /** 当前体力 */
        curEnergy: number;
        /** 有无好友 */
        hasFriends: boolean;
        /** 今日是否领取登录奖励 0未领取 1已领取 */
        is_login_rewards: number;
        /** 今日是否签到 0未签到 1已签到 */
        is_sign_in: number;
        /** 连续签到天数 */
        consecutive_days: number;
    }

    /** 游戏配置 */
    export interface GameConfig {
        /** 提醒用户卡点 [0]代表当前农场卡点（体验vip失效）等级 */
        free_points: number[];
        /** 赛季总天数 */
        total_season: number;
        /** 排名奖励，[1000,500,200,100] ,[0]第一名奖励的积分数量，名次按顺序连续排 */
        ranking_awards: number[];
        /** 审核中1 审核通过0（作废） */
        review: number;
        /** 小程序开关 1打开 0关闭 */
        applet: number;
        /** 限玩时段，[0]开始时间[1]结束时间[2]每天可玩时长 */
        limit_play_time: number[];
        /** 批量开关 1开启 0关闭 [0]战斗效果[1]战斗属性[2]时间限制 */
        switches: number[];
        /** 时间段，控制战斗效果和战斗属性 */
        limit_switch_time: ISwitchTime[];
    }

    /** 时间段数据 */
    export interface ISwitchTime {
        start: number;
        end: number;
    }

    /** 修改性别 */
    export class ReqChangeGender extends NetBaseReq {
        gender: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.ChangeGender;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    /** 修改昵称 */
    export class ReqUpdateNickName extends NetBaseReq {
        nick_name: string;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.UpdateNickName;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    /** 任务列表 */
    export class ReqTaskList extends NetBaseReq {
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.TaskList;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespTaskList extends NetBaseRespNtf {
        /** 每日任务列表 */
        dayTasks: IQuestData[];
        /** 赛季任务列表 */
        seasonTasks: IQuestData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.TaskList;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.dayTasks = msg["dayTasks"];
            this.seasonTasks = msg["seasonTasks"];
            return this;
        }
    }

    /** 任务数据 */
    export interface IQuestData {
        /** 任务序列id(领取奖励时传) */
        id: number;
        /** 任务id */
        task_id: number;
        /** 任务状态 0未完成 1已完成未领取 2已领取 */
        status: number;
        /** 已完成任务次数 */
        finished_count: number;
        /** 完成任务的总次数 */
        need_count: number;
    }

    /** 任务奖励 */
    export class ReqGetTaskAward extends NetBaseReq {
        /** 任务类型 1每日 2赛季 */
        ttype: number;
        /** 任务序列id */
        id: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.GetTaskAward;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespGetTaskAward extends NetBaseRespNtf {
        /** 道具列表 */
        list: IPropData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.GetTaskAward;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.list = msg["list"];
            return this;
        }
    }

    /** 邮件列表 */
    export class ReqMailList extends NetBaseReq {
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.MailList;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespMailList extends NetBaseRespNtf {
        list: IMailData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.MailList;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.list = msg["list"];
            return this;
        }
    }

    /** 邮件数据 */
    export interface IMailData {
        /** 邮件id */
        id: number;
        /** 邮件类型（查看配置表） */
        mtype: number;
        /** 邮件状态 0未打开 1已打开 2已打开附件未领取 3附件已领取 */
        status: number;
        /** 发送者头像id */
        avatar_id: number;
        /** 发送者uid */
        sender_id: number;
        /** 发送者名字 */
        sender_name: string;
    }

    /** 邮件详情 */
    export class ReqMailListDetail extends NetBaseReq {
        /** 邮件id */
        mail_id: number;
        /** 邮件type类型 */
        mtype: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.MailListDetail;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespMailListDetail extends NetBaseRespNtf {
        /** 具体数据 根据邮箱类型mtype不同，返回的dat数据有所不同 */
        detail: any;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.MailListDetail;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.detail = msg["detail"];
            return this;
        }
    }

    /** 邮件详情数据-系统公告 */
    export interface IMailAnnounceData {
        /** 标题 */
        title: string;
        /** 内容 */
        content: string;
        /** 图片链接 */
        img_url: string;
        /** 语音链接 */
        audio_url: string;
    }

    /** 邮件详情数据-好友请求/同意/拒绝 */
    export interface IMailFriendData {
        /** 用户id */
        user_id: number;
        /** 头像id */
        avatar_id: number;
        /** 名字 */
        name: string;
    }

    /** 邮件详情数据-交换请求/拒绝 */
    export interface IMailExchangeData {
        /** 用户id */
        user_id: number;
        /** 名字 */
        name: string;
        /** 道具id */
        item_id: number;
    }

    /** 邮件详情数据-交换同意 */
    export interface IMailExchangeAgreeData {
        /** 用户id */
        user_id: number;
        /** 名字 */
        name: string;
        /** 我的道具id */
        my_item_id: number;
        /** 朋友道具id */
        friend_item_id: number;
    }

    /** 邮件详情数据-赛季奖励 */
    export interface IMailSeasonRewardsData {
        /** 宝宝数量 */
        baby_num: number;
        /** 道具数组 */
        items: IPropData[];
    }

    /** 邮件详情数据-赛季排名奖励 */
    export interface IMailSeasonRankRewardsData {
        /** 排名 */
        ranking: number;
        /** 道具数组 */
        items: IPropData[];
    }

    /** 邮件详情数据-每日草莓宝宝结算 */
    export interface IMailDailySettlementData {
        /** 被破坏的宝宝数量 */
        baby_num: number;
    }

    /** 邮件详情数据-充值赠送 */
    export interface IMailTopUpGiftsData {
        /** vip周期，月 */
        // month: number;
        /** 道具数组 */
        items: IPropData[];
    }

    /** 邮件详情数据-维护奖励 */
    export interface IMailMaintenanceRewardsData {
        /** 标题 */
        title: string;
        /** 内容 */
        content: string;
        /** 道具数组 */
        items: IPropData[];
    }

    /** 道具数据 */
    export interface IPropData {
        /** 道具id */
        item_id: number;
        /** 道具数量 */
        item_num: number;
    }

    /** 邮件奖励 */
    export class ReqGetMailAward extends NetBaseReq {
        /** 邮件id */
        mail_id: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.GetMailAward;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    /** 好友操作 */
    export class ReqOptionFriend extends NetBaseReq {
        /** 操作类型 0申请加好友 1同意好友请求 2拒绝好友请求 3删除好友 */
        otype: number;
        /** 对方好友id */
        friend_id: number;
        /** 邮箱id otype=0时 mail_id=0 */
        mail_id: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.OptionFriend;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    /** 材料交换 */
    export class ReqExchange extends NetBaseReq {
        /** 操作类型 0材料请求 1同意交换 2拒绝交换 */
        etype: number;
        /** 对方好友id */
        friend_id: number;
        /** 材料id */
        item_id: number;
        /** 材料数量 目前默认是1，写死 */
        item_num: number;
        /** 邮箱id etype=0时 mail_id=0 */
        mail_id: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.Exchange;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    /** 赛季收成 */
    export class ReqSeasonHarvest extends NetBaseReq {
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.SeasonHarvest;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespSeasonHarvest extends NetBaseRespNtf {
        /** 赛季名称 */
        season_name: string;
        /** 基础收成 */
        base_harvest: number;
        /** 被破坏 */
        destroyed: number;
        /** 当前排行，如果未上榜 ranking=0 */
        ranking: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.SeasonHarvest;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.season_name = msg["season_name"];
            this.base_harvest = msg["base_harvest"];
            this.destroyed = msg["destroyed"];
            this.ranking = msg["ranking"];
            return this;
        }
    }

    /** 排行榜 */
    export class ReqRankingList extends NetBaseReq {
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.RankingList;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespRankingList extends NetBaseRespNtf {
        /** 排行列表(已排好) */
        list: IRankingData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.RankingList;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.list = msg["list"];
            return this;
        }
    }

    /** 排行数据 */
    export interface IRankingData {
        /** 用户id */
        user_id: number;
        /** 用户名 */
        user_name: string;
        /** 农场等级 */
        level: number;
        /** 当前排行 */
        ranking: number;
        /** 宝宝数量 */
        total_num: number;
    }

    /** 好友列表 */
    export class ReqFriendList extends NetBaseReq {
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.FriendList;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespFriendList extends NetBaseRespNtf {
        list: IFriendData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.FriendList;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.list = msg["list"];
            return this;
        }
    }

    /** 推荐好友列表 */
    export class ReqRecommendFriendList extends NetBaseReq {
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.RecommendFriendList;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespRecommendFriendList extends NetBaseRespNtf {
        list: IFriendData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.RecommendFriendList;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.list = msg["list"];
            return this;
        }
    }

    /** 好友数据 */
    export interface IFriendData {
        /** 好友id */
        user_id: number;
        /** 头像id */
        avatar_id: number;
        /** 名字 */
        user_name: string;
        /** 称号 */
        title_id: number;
        /** 农场等级 */
        level: number;
        /** 是否交换中 1代表交换中 0可以交换 */
        exchanging: number;
    }

    /** 搜索好友 */
    export class ReqSearchFriend extends NetBaseReq {
        /** 好友踢卡号 */
        user_id: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.SearchFriend;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespSearchFriend extends NetBaseRespNtf {
        /** 好友id */
        user_id: number;
        /** 头像id */
        avatar_id: number;
        /** 名字 */
        user_name: string;
        /** 称号 */
        title_id: number;
        /** 农场等级 */
        level: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.SearchFriend;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.user_id = msg["user_id"];
            this.avatar_id = msg["avatar_id"];
            this.user_name = msg["user_name"];
            this.title_id = msg["title_id"];
            this.level = msg["level"];
            return this;
        }
    }

    /** 搜索好友 */
    export class ReqFriendDetail extends NetBaseReq {
        /** 好友踢卡号 */
        user_id: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.FriendDetail;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespFriendDetail extends NetBaseRespNtf {
        /** 守卫次数 0代表不能守卫 */
        defend_count: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.FriendDetail;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.defend_count = msg["defend_count"];
            return this;
        }
    }

    /** 获取支付方式列表 */
    export class ReqAvailableList extends NetBaseReq {
        platform: string;
        app_key: string;
        channel_id: string;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.QueryAvailableList;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    /** 支付方式，数组形式，查看 AvailableList */
    export class RespAvailableList extends NetBaseRespNtf {
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.QueryAvailableList;
        }
        deserialize(msg: string): NetBaseRespNtf {
            throw new Error("Method not implemented.");
        }
        deserializeFromObj(msg: object): NetBaseRespNtf {
            return this;
        }
    }

    /** 获取价格列表 */
    export class ReqWatchVips extends NetBaseReq {
        /** 渠道代号 */
        channel_code: string;
        /** 游戏代号 */
        game_code: string;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.WatchVips;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    /** 价格列表，数组形式，查看 VipList */
    export class RespWatchVips extends NetBaseRespNtf {
        type_data: VipList[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.WatchVips;
        }
        deserialize(msg: string): NetBaseRespNtf {
            throw new Error("Method not implemented.");
        }
        deserializeFromObj(msg: object): NetBaseRespNtf {
            this.type_data = msg["type_data"];
            return this;
        }
    }

    /** 生成订单 */
    export class ReqCreateOrder extends NetBaseReq {
        /** 订单类型id */
        order_type: number;
        /** 渠道代号 */
        channel_code: string;
        /** 游戏代号 */
        game_code: string;
        /** 是否到达卡点 */
        id_stuck: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.CreateOrder;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespCreateOrder extends NetBaseRespNtf {
        /** 订单号 */
        order_sn: string;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.CreateOrder;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.order_sn = msg["order_sn"];
            return this;
        }
    }

    /** 生成支付订单 */
    export class ReqCreatePayment extends NetBaseReq {
        /** 对应创建订单，固定 */
        type: number = 1;
        /** 1微信支付 4小天才 5小天才代付 */
        pay_by: number = 1;
        /** 商户号id，固定 */
        mch_id: number = 4288;
        /** 0其他 2小天才代付 */
        mode: number = 0;
        /** 0自由系统支付 1备付金系统 固定0*/
        flow_type: number = 0;
        /** pad类型,这个是新增的 2大作战渠道 3统一支付渠道 */
        sub_type: number = 3;
        /** 商品订单号 */
        order_id: string = "";
        /** 金额，现在随便写 */
        amount: number = 1;
        /** 1对应Android */
        device_id: number = 1;
        /** 设备号  可以自己获取 也可以写死 */
        user_identity: string = "b66nXa2WOQZcNQD5ijny";
        /** 签名 现在随便写 */
        sign: string = "2ef67abc98";
        /** 支付成功回调 */
        return_url: string = "";
        /** 支付失败回调 */
        error_url: string = "";

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.CreatePayment;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespCreatePayment extends NetBaseRespNtf {
        preparePay: IPreparePay;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.CreatePayment;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.preparePay = msg["preparePay"];
            return this;
        }
    }

    /** 查询订单支付结果 */
    export class ReqQueryPayment extends NetBaseReq {
        /** 订单号 */
        payment_id: string;
        /** 签名 */
        sign: string;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.QueryPayment;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespQueryPayment extends NetBaseRespNtf {
        /** 订单状态 0成功 */
        pay_status: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.QueryPayment;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.pay_status = msg["pay_status"];
            return this;
        }
    }

    /** 升级 */
    export class ReqUpgrade extends NetBaseReq {
        mat_id: number;
        warrior_id: number;
        game_type: number;

        /** 兼容旧调用方保留 */
        utype?: number;
        /** 兼容旧调用方保留 */
        id?: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.Upgrade;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    /** 解锁 */
    export class ReqUnclock extends NetBaseReq {
        mat_id: number;
        warrior_id: number;
        game_type: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.Unclock;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    /** 出战 */
    export class ReqGoWar extends NetBaseReq {
        /** 战士id */
        role_id: number;
        /** 形态id */
        shape_id: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.GoWar;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    /** 合成 */
    export class ReqSynthesis extends NetBaseReq {
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.Synthesis;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespSynthesis extends NetBaseRespNtf {
        /** 一键合成的数量（没有可合成的返回0） */
        num: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.Synthesis;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.num = msg["num"];
            return this;
        }
    }

    /** 角色列表 */
    export class ReqRoleList extends NetBaseReq {
        mat_id: number;
        game_type: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.RoleList;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export interface IRoleAttrData {
        attr_type: string;
        attr_value: string;
    }

    export interface IWarriorData {
        warrior_id?: number;
        unlock_status?: number;
        root_id: number; //模板id 1002，1003的模板id是1001
        role_level: number;
        curr_shape_id: number;
    }

    export class RespRoleList extends NetBaseRespNtf {
        /** 当前水晶数量 */
        crystal_num: number;
        /** 机甲列表 */
        warrior_list: IWarriorData[];
        /** 兼容旧角色结构 */
        list: IWarriorData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.RoleList;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            if (Array.isArray(msg)) {
                this.crystal_num = 0;
                this.warrior_list = [];
                this.list = msg as unknown as IWarriorData[];
                return this;
            }

            this.crystal_num = msg["crystal_num"];
            this.warrior_list = msg["warrior_list"] || [];

            if (Array.isArray(msg["list"])) {
                this.list = msg["list"];
                return this;
            }

            this.list = this.warrior_list
                .filter((item) => item && item.unlock_status === 1)
                .map((item) => ({
                    warrior_id: item.warrior_id,
                    unlock_status: item.unlock_status,
                    root_id: item.root_id,
                    role_level: item.role_level,
                    curr_shape_id: item.warrior_id,
                }));
            return this;
        }
    }

    /** 单词列表 */
    export class ReqWordList extends NetBaseReq {
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.WordList;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespWordList extends NetBaseRespNtf {
        /** 单词id数组 如果返回单词数量>5就从里面随机5个作为作战单词 */
        words: number[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.WordList;
        }
        deserialize(msg: string): NetBaseRespNtf {
            throw new Error("Method not implemented.");
        }
        deserializeFromObj(msg: object): NetBaseRespNtf {
            this.words = msg["words"];
            return this;
        }
    }

    /** 战斗结算 */
    export class ReqSettlement extends NetBaseReq {
        /** 作战区分 1自己作战 2帮好友守护农场 */
        ftype: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.Settlement;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespSettlement extends NetBaseRespNtf {
        /** 掉落列表 */
        list: IPropData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.Settlement;
        }
        deserialize(msg: string): NetBaseRespNtf {
            throw new Error("Method not implemented.");
        }
        deserializeFromObj(msg: object): NetBaseRespNtf {
            this.list = msg["list"];
            return this;
        }
    }

    /** 包裹奖励 */
    export class ReqPackageAward extends NetBaseReq {
        /** 点击次数 */
        num: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.PackageAward;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespPackageAward extends NetBaseRespNtf {
        /** 掉落列表 （len=0 无奖励） */
        list: IPropData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.PackageAward;
        }
        deserialize(msg: string): NetBaseRespNtf {
            throw new Error("Method not implemented.");
        }
        deserializeFromObj(msg: object): NetBaseRespNtf {
            this.list = msg["list"];
            return this;
        }
    }

    /** 当前体力 */
    export class ReqGetEnergy extends NetBaseReq {
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.GetEnergy;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespGetEnergy extends NetBaseRespNtf {
        /** 用户当前体力 1/5(分子) */
        curr_energy: number;
        /** 用户体力上限值 1/5(分母) */
        max_energy: number;
        /** 当前服务器时间戳 （秒） */
        curr_time: number;
        /** 体力回复倒计时结束服务器时间戳 （秒） 默认0 curr_energy=0 && end_time==0 表示今日已无法在回复体力了 */
        end_time: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.GetEnergy;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.curr_energy = msg["curr_energy"];
            this.max_energy = msg["max_energy"];
            this.curr_time = msg["curr_time"];
            this.end_time = msg["end_time"];
            return this;
        }
    }

    /** 消耗体力 */
    export class ReqConsumeEnergy extends NetBaseReq {
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.ConsumeEnergy;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    /** 使用道具 */
    export class ReqUseProps extends NetBaseReq {
        /** 使用道具的id （目前可使用的道具只有决斗卡:id=9, 可以写死） */
        id: number;
        /** 数量 默认传1，目前可以写死 */
        num: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.UseProps;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    /**
     * 游戏数据上传
     */
    export class ReqUploadLearn extends NetBaseReq {
        /** 作战区分 1自己作战 2帮好友守护农场 */
        ftype: number;
        /** ftype=1 friend_id=0 ftype=2 friend_id=朋友user_id */
        friend_id: number;
        /** 总答对数 （包含乱斗） */
        total_right: number;
        /** 总答错数 （包含乱斗） */
        total_wrong: number;
        /** 总超时数 （包含乱斗） */
        total_time_out: number;
        /** 总点击数 （包含乱斗） */
        total_click: number;
        /** 战斗结果 0 失败 1 胜利 */
        result: number;
        /** 胜利传角色剩余数量 失败传敌人剩余数量 */
        rest_num: number;
        /** 乱斗用时(秒) */
        melee_time: number;
        /** 回合数 */
        round_num: number;
        /** 学习细节 */
        learn_detail: ILearnDetailItem[];
        /** 游戏开始时间，秒 */
        start_time: number;
        /** 游戏结束时间，秒 */
        end_time: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.UploadLearn;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    /** 当前农场经验值 */
    export class ReqStudyRecords extends NetBaseReq {
        mat_id: number;
        deadline: string;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.StudyRecords;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export interface StudyRecordWordItem {
        word_id: string;
        word: string;
        word_en: string;
        completed: boolean;
    }

    export interface StudyRecordItem {
        date: string;
        records: StudyRecordWordItem[];
    }

    export class RespStudyRecords extends NetBaseRespNtf {
        mat_id: string;
        mat_name: string;
        mat_image: string;
        words_completed_num: number;
        words_total_num: number;
        study_records: StudyRecordItem[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.StudyRecords;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.mat_id = msg["mat_id"];
            this.mat_name = msg["mat_name"];
            this.mat_image = msg["mat_image"];
            this.words_completed_num = msg["words_completed_num"] || 0;
            this.words_total_num = msg["words_total_num"] || 0;
            this.study_records = (msg["study_records"] || []).map((item) => {
                return {
                    date: item["date"] || "",
                    records: (item["records"] || []).map((record) => {
                        return {
                            word_id: record["word_id"] || "0",
                            word: record["word"] || "",
                            word_en: record["word_en"] || "",
                            completed: !!record["completed"],
                        } as StudyRecordWordItem;
                    }),
                } as StudyRecordItem;
            });
            return this;
        }
    }

    export class ReqGetExp extends NetBaseReq {
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.GetExp;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespGetExp extends NetBaseRespNtf {
        /** 用户当前农场等级的经验值 1/5(分子)cure_exp=max_exp代表可以升级 */
        curr_exp: number;
        /** 用户当前农场等级升级需要的最大经验值 1/5(分母) */
        max_exp: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.GetExp;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.curr_exp = msg["curr_exp"];
            this.max_exp = msg["max_exp"];
            return this;
        }
    }

    /** 战斗信息 */
    export class ReqFightInfo extends NetBaseReq {
        /** 日期，格式：yyyy-mm-dd */
        day: string;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.FightInfo;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespFightInfo extends NetBaseRespNtf {
        /** 胜利次数 */
        winCount: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.FightInfo;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.winCount = msg["winCount"];
            return this;
        }
    }

    /** 登录/签到奖励 */
    export class ReqGetLoginAward extends NetBaseReq {
        /** 奖励类型 1登录 2连续签到 */
        ltype: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.GetLoginAward;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespGetLoginAward extends NetBaseRespNtf {
        /** 道具列表 */
        list: IPropData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.GetLoginAward;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.list = msg["list"];
            return this;
        }
    }

    /** 学习数据 */
    export interface ILearnDetailItem {
        /** 单词id */
        word_id: number;
        /** 阶段 0 普通 1 乱斗 */
        stage: number;
        /** 单词操作（1对2错3超时） */
        status: number;
    }

    /** 支付方式列表 */
    export interface AvailableList {
        /** 平台 */
        platform: string;
        /** 展示类型 */
        type: string;
        /** 名称 */
        name: string;
        /** 场景，pay pay_ext(家长代付) wechat */
        scene: string;
        /** 商品号id，4288小天才内置支付 1588微信支付 */
        mch_id: string;
    }

    /** 价格列表 */
    export interface VipList {
        /** 订单类型id */
        id: number;
        /** 名称 */
        name: string;
        /** 价格 */
        price: number;
        /** 折扣价 */
        discount: number;
        /** h5图片地址 */
        h5url: string;
        /** 表端图片地址 */
        url: string;
    }

    /** 支付订单 */
    export interface IPreparePay {
        amount: number;
        code: number;
        description: string;
        order_no: string;
        out_order_no: string;
        pay_url: string;
        status: number;
        token_id: string;
        type: number;
        metadata: IPreparePayMeta;
    }

    /** 支付订单meta */
    export interface IPreparePayMeta {
        nick_name: string;
        openid: string;
        title: string;
        product_name: string;
    }

    /** 地图数据列表 */
    export class ReqWorldInfo extends NetBaseReq {
        mat_id: number;
        game_type: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.WorldInfo;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespWorldInfo extends NetBaseRespNtf {
        /** 地图数据队列 */
        mat_id: number;
        region_list: WorldRegionHomeInfoData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.WorldInfo;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.mat_id = msg["mat_id"];
            this.region_list = msg["region_list"] || [];
            return this;
        }
    }

    export class ReqWorldItems extends NetBaseReq {
        mat_id: number;
        game_type: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.WorldItems;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespUnclock extends NetBaseRespNtf {
        warrior_id: number;
        crystal_num: number;
        warrior_card_num: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.Unclock;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.warrior_id = msg["warrior_id"];
            this.crystal_num = msg["crystal_num"];
            this.warrior_card_num = msg["warrior_card_num"];
            return this;
        }
    }

    export class RespUpgrade extends NetBaseRespNtf {
        warrior_id: number;
        enhance_level: number;
        crystal_num: number;
        warrior_card_num: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.Upgrade;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.warrior_id = msg["warrior_id"];
            this.enhance_level = msg["enhance_level"];
            this.crystal_num = msg["crystal_num"];
            this.warrior_card_num = msg["warrior_card_num"];
            return this;
        }
    }

    export class RespWorldItems extends NetBaseRespNtf {
        mat_id: number;
        region_list: WorldRegionItemsInfoData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.WorldItems;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.mat_id = msg["mat_id"];
            this.region_list = msg["region_list"] || [];
            return this;
        }
    }

    /** 地图数据 */
    export interface WorldRegionInfoData {
        /** 当前任务波次 */
        region_no: number;
        /** 总计波次 */
        unlock_status: number;
        /** 任务完成次数 */
        finish_status: number;
        /** 教材 */
        task_progress_text: string;
        /** 已完成任务次数 */
        medal_status: number;
        /** 最后学习时间 */
        event_desc: string;
    }
    export interface WorldRegionHomeInfoData {
        region_num: number;
        unlock_status: number;
        finish_task_num: number;
        task_total_num: number;
        medal_id: number;
        medal_status: number;
        event_desc: string;
        plot_list: WorldPlotHomeInfoData[];
    }

    export interface WorldPlotHomeInfoData {
        plot_num: number;
        plot_name: string;
    }

    export interface WorldRegionItemsInfoData {
        region_num: number;
        plot_list: WorldPlotItemsInfoData[];
    }

    export interface WorldPlotItemsInfoData {
        plot_num: number;
        fixed_new_item_list: WorldPlotWordHomeInfoData[];
    }

    export interface WorldPlotWordHomeInfoData {
        item_id: number;
        item_name: string;
    }

    export class ReqBaseOverview extends NetBaseReq {
        mat_id: number;
        game_type: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.BaseOverview;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespBaseOverview extends NetBaseRespNtf {
        base_level: number;
        base_exp: number;
        enemy_num: number;
        warrior_count: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.BaseOverview;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.base_level = msg["base_level"];
            this.base_exp = msg["base_exp"];
            this.enemy_num = msg["enemy_num"];
            this.warrior_count = msg["warrior_count"];
            return this;
        }
    }

    export class ReqPlotInfo extends NetBaseReq {
        mat_id: number;
        region_num: number;
        plot_num: number;
        game_type: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.PlotInfo;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespPlotInfo extends NetBaseRespNtf {
        task_list: PlotTaskInfoData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.PlotInfo;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.task_list = msg["task_list"] || [];
            return this;
        }
    }

    export interface PlotTaskInfoData {
        task_id: number;
        task_name: string;
        task_status: number;
        left_enemy_wave_num: number;
        enemy_wave_total_num: number;
        boss_wave_num: number;
        guard_times: number;
        learned_word_num: number;
        word_total_num: number;
        last_study_time: number;
        can_battle: number;
        can_replay: number;
    }

    // ==================== 新 GameX 协议 DTO ====================
    /** 基地数据 */
    export interface BaseInfo {
        /** 基地等级 */
        level: number;
        /** 当前经验 */
        current_exp: number;
        /** 升级经验 */
        level_up_exp: number;
        /** 剩余体力 */
        energy: number;
        /** 最大体力 */
        max_energy: number;
    }

    /** 基地信息 */
    export class ReqBaseInfo extends NetBaseReq {
        mat_id: number;
        game_type: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.BaseInfo;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespBaseInfo extends NetBaseRespNtf {
        base_info: any;
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.BaseInfo;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.base_info = {};
            this.base_info.level = msg["level"] || 0;
            this.base_info.current_exp = msg["current_exp"] || 0;
            this.base_info.level_up_exp = msg["level_up_exp"] || 0;
            this.base_info.energy = msg["energy"] || 0;
            this.base_info.max_energy = msg["max_energy"] || 0;
            return this;
        }
    }

    /** 背包信息 */
    export class ReqInventory extends NetBaseReq {
        mat_id: number;
        game_type: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.Inventory;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespInventory extends NetBaseRespNtf {
        crystal: number;
        super_cards: SuperCardData[];
        warrior_cards: WarriorCardData[];
        magic_box: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.Inventory;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.crystal = msg["crystal"] || 0;
            this.super_cards = msg["super_cards"] || [];
            this.warrior_cards = msg["warrior_cards"] || [];
            this.magic_box = msg["magic_box"] || 0;
            return this;
        }
    }

    export interface SuperCardData {
        item_id: number;
        quantity: number;
    }

    export interface WarriorCardData {
        item_id: number;
        quantity: number;
    }

    /** 战士列表 */
    export class ReqWarriorList extends NetBaseReq {
        mat_id: number;
        game_type: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.WarriorList;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespWarriorList extends NetBaseRespNtf {
        warriors: WarriorData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.WarriorList;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.warriors = msg["warriors"] || [];
            return this;
        }
    }

    export interface WarriorData {
        warrior_id: number;
        warrior_type: number;
        status: number;
        level: number;
    }

    /** 解锁战士 */
    export class ReqUnlockWarrior extends NetBaseReq {
        mat_id: number;
        game_type: number;
        warrior_type: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.UnlockWarrior;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespUnlockWarrior extends NetBaseRespNtf {
        success: boolean;
        message: string;
        warrior_type: number;
        warrior_id: number;
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.UnlockWarrior;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.success = msg["success"] || false;
            this.message = msg["message"] || "";
            this.warrior_type = msg["warrior_type"] || 0;
            this.warrior_id = msg["warrior_id"] || 0;
            return this;
        }
    }

    /** 升级战士 */
    export class ReqUpgradeWarrior extends NetBaseReq {
        mat_id: number;
        game_type: number;
        warrior_id: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.UpgradeWarrior;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespUpgradeWarrior extends NetBaseRespNtf {
        success: boolean;
        message: string;
        new_level: number;
        warrior_id: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.UpgradeWarrior;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.success = msg["success"] || false;
            this.message = msg["message"] || "";
            this.new_level = msg["new_level"] || 0;
            this.warrior_id = msg["warrior_id"] || 0;
            return this;
        }
    }

    /** 卡片合成 */
    export class ReqSynthesizeCard extends NetBaseReq {
        mat_id: number;
        game_type: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.SynthesizeCard;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespSynthesizeCard extends NetBaseRespNtf {
        success: boolean;
        message: string;
        rewards: RewardData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.SynthesizeCard;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.success = msg["success"] || false;
            this.rewards = msg["rewards"] || [];
            this.message = msg["message"] || "";
            return this;
        }
    }

    export interface RewardData {
        item_id: number;
        quantity: number;
    }

    /** 每日任务 */
    export class ReqGetDailyTasks extends NetBaseReq {
        mat_id: number;
        game_type: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.GetDailyTasks;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespGetDailyTasks extends NetBaseRespNtf {
        tasks: DailyTaskData[];
        total_stars: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.GetDailyTasks;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.tasks = msg["tasks"] || [];
            this.total_stars = msg["total_stars"] || 0;
            return this;
        }
    }

    export interface DailyTaskData {
        task_id: number;
        name: string;
        description: string;
        current_progress: number;
        target_progress: number;
        is_completed: number;
    }

    /** 领取星星奖励 */
    export class ReqClaimStarReward extends NetBaseReq {
        mat_id: number;
        game_type: number;
        task_id: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.ClaimStarReward;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespClaimStarReward extends NetBaseRespNtf {
        success: boolean;
        message: string;
        task_id: number;
        rewards: IPropData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.ClaimStarReward;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.success = msg["success"] || false;
            this.message = msg["message"] || "";
            this.task_id = msg["task_id"] || 0;
            this.rewards = msg["rewards"] || [];
            return this;
        }
    }

    /** 开启魔盒 */
    export class ReqOpenBox extends NetBaseReq {
        mat_id: number;
        game_type: number;
        count: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.OpenBox;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespOpenBox extends NetBaseRespNtf {
        rewards: RewardData[];
        success: boolean;
        message: string;
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.OpenBox;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.rewards = msg["rewards"] || [];
            this.success = msg["success"] || false;
            this.message = msg["message"] || "";
            return this;
        }
    }

    /** 学习记录 */
    export class ReqLearningRecords extends NetBaseReq {
        mat_id: number;
        game_type: number;
        timestamp: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.LearningRecords;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespLearningRecords extends NetBaseRespNtf {
        records: LearningRecordData[];
        words_control_num: number;
        words_total_num: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.LearningRecords;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.words_control_num = msg["words_control_num"] || 0;
            this.words_total_num = msg["words_total_num"] || 0;
            this.records = msg["records"] || [];
            return this;
        }
    }

    export interface LearningRecordData {
        date: string;
        words: LearningWordData[];
    }

    export interface LearningWordData {
        word_id: number;
        chinese: string;
        english: string;
        is_correct: boolean;
        learn_time: number;
    }

    /** 新手引导 */
    export interface TutorialProgressData {
        step: number;
    }

    export class ReqGetTutorialProgress extends NetBaseReq {
        game_type: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.GetTutorialProgress;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespGetTutorialProgress extends NetBaseRespNtf {
        step: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.GetTutorialProgress;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.step = msg["step"] != null ? Number(msg["step"]) : 0;
            return this;
        }
    }

    /** 刷新新手引导步骤 */
    export class ReqUpdateTutorialProgress extends NetBaseReq {
        game_type: number;
        step: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.UpdateTutorialProgress;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespUpdateTutorialProgress extends NetBaseRespNtf {
        success: boolean;
        message: string;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.UpdateTutorialProgress;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.success = msg["success"] || false;
            this.message = msg["message"] || "";
            return this;
        }
    }

    /** 地图进度 */
    export class ReqMapProgress extends NetBaseReq {
        mat_id: number;
        game_type: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.MapProgress;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespMapProgress extends NetBaseRespNtf {
        big_areas: BigAreaData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.MapProgress;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.big_areas = msg["big_areas"] || [];
            return this;
        }
    }

    /** 更新大地图勋章状态 */
    export class ReqMapProgressMedal extends NetBaseReq {
        mat_id: number;
        game_type: number;
        big_area_id: number;
        medal_status: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.MapProgressMedal;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespMapProgressMedal extends NetBaseRespNtf {
        success: boolean;
        message: string;
        big_area_id: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.MapProgressMedal;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.success = msg["success"] || false;
            this.message = msg["message"] || "";
            this.big_area_id = msg["big_area_id"] || 0;
            return this;
        }
    }

    /** 获取课程单词 */
    export class ReqMapWords extends NetBaseReq {
        mat_id: number;
        game_type: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.MapWords;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespMapWords extends NetBaseRespNtf {
        words: BigAreaWordsData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.MapWords;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.words = msg["words"] || [];
            return this;
        }
    }

    export interface BigAreaWordsData {
        big_area_id: number;
        small_areas: SmallAreaWordsData[];
        start_index: 0;
    }

    export interface SmallAreaWordsData {
        small_area_id: number;
        word_ids: number[];
        start_index: 0;
    }

    export interface CourseWordData {
        word_id: number;
        english: string;
        chinese: string;
        phonetic: string;
        difficulty: number;
    }

    export interface BigAreaData {
        big_area_id: number;
        blocked: number;
        medal_status: number;
        small_areas: SmallAreaData[];
    }

    export interface SmallAreaData {
        small_area_id: number;
        blocked: number;
        completed_waves: number;
        total_waves: number;
        boss_completed: number;
    }

    /** 区域详情 */
    export class ReqAreaDetail extends NetBaseReq {
        mat_id: number;
        game_type: number;
        big_area_id: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.AreaDetail;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespAreaDetail extends NetBaseRespNtf {
        area_details: AreaDetailData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.AreaDetail;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.area_details = msg["area_details"] || [];
            return this;
        }
    }

    export interface AreaDetailData {
        small_area_id: number;
        completed_waves: number;
        total_waves: number;
        boss_completed: number;
        mastered_words: number;
        total_words: number;
        last_learn_time: number;
        grade_id: number;
    }

    /** 开始战斗 */
    export class ReqStartBattle extends NetBaseReq {
        mat_id: number;
        game_type: number;
        big_area_id: number;
        small_area_id: number;
        wave: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.StartBattle;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespStartBattle extends NetBaseRespNtf {
        words: BattleWordData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.StartBattle;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.words = msg["words"] || [];
            return this;
        }
    }

    export interface BattleWordData {
        word_id: number;
        english: string;
        chinese: string;
        is_new: boolean;
    }

    /** 提交战斗结果 */
    export class ReqSubmitBattleResult extends NetBaseReq {
        mat_id: number;
        game_type: number;
        big_area_id: number;
        small_area_id: number;
        wave: number;
        is_victory: boolean;
        answers: BattleAnswerData[];

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.SubmitBattleResult;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export interface BehaviorRewardUnlockedItemData {
        category: number;
        id: number;
        type: number;
    }

    export interface BehaviorRewardData {
        rewarded: boolean;
        exp_delta: number;
        coin_delta: number;
        level_before: number;
        level_after: number;
        level_xp_before: number;
        level_xp_total_before: number;
        level_xp_after: number;
        level_xp_total_after: number;
        coin_balance_before: number;
        coin_balance_after: number;
        unlocked_items: BehaviorRewardUnlockedItemData[];
        dynasty_icon_id: number;
    }

    export class RespSubmitBattleResult extends NetBaseRespNtf {
        success: boolean;
        message: string;
        rewards: RewardData[];
        exp_gained: number;
        level_up: boolean;
        new_level: number;
        behavior_reward: BehaviorRewardData | null;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.SubmitBattleResult;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.success = msg["success"] || false;
            this.message = msg["message"] || "";
            this.rewards = msg["rewards"] || [];
            this.exp_gained = msg["exp_gained"] || 0;
            this.level_up = msg["level_up"] || false;
            this.new_level = msg["new_level"] || 0;
            this.behavior_reward = null;

            const behaviorReward = msg["behavior_reward"];
            if (behaviorReward) {
                const unlockedItems = behaviorReward["unlocked_items"] || [];
                this.behavior_reward = {
                    rewarded: behaviorReward["rewarded"] || false,
                    exp_delta: behaviorReward["exp_delta"] || 0,
                    coin_delta: behaviorReward["coin_delta"] || 0,
                    level_before: behaviorReward["level_before"] || 0,
                    level_after: behaviorReward["level_after"] || 0,
                    level_xp_before: behaviorReward["level_xp_before"] || 0,
                    level_xp_total_before: behaviorReward["level_xp_total_before"] || 0,
                    level_xp_after: behaviorReward["level_xp_after"] || 0,
                    level_xp_total_after: behaviorReward["level_xp_total_after"] || 0,
                    coin_balance_before: behaviorReward["coin_balance_before"] || 0,
                    coin_balance_after: behaviorReward["coin_balance_after"] || 0,
                    unlocked_items: unlockedItems.map((item) => ({
                        category: item["category"] || 0,
                        id: item["id"] || 0,
                        type: item["type"] || 0,
                    })),
                    dynasty_icon_id: behaviorReward["dynasty_icon_id"] || 0,
                };
            }
            return this;
        }
    }

    export interface BattleAnswerData {
        word_id: number;
        is_correct: boolean;
    }

    /** 编辑教材年级 */
    export class ReqMaterialGradeEdit extends NetBaseReq {
        mat_id: number;
        grade_id: number;

        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.MaterialGradeEdit;
        }
        serialize(): string {
            return JSON.stringify(this);
        }
    }

    export class RespMaterialGradeEdit extends NetBaseRespNtf {
        err: number;
        message: string;
        constructor() {
            super();
            this.msg_code = NetMsgCodeDefine.MaterialGradeEdit;
        }
        deserialize(msg: string): NetBaseRespNtf {
            return this;
        }
        deserializeFromObj(msg: Object): NetBaseRespNtf {
            this.err = msg["err"] || 0;
            this.message = msg["message"] || "";
            return this;
        }
    }
}
