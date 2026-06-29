import Global from "../global/TD_Global";
import { FarmBundle } from "./TD_BundleManager";
import HttpManager from "../tools/net/TD_HttpManager";
import { Constants } from "../global/TD_Constants";
import Singleton from "../Framework/TD_Singleton";


/**
 * HTTP请求管理
 */
export default class RequestManager extends Singleton {

    /** 
     * 检查游戏版本
     */
    sendReqAppVersion() {
        const req = new FarmBundle.ReqAppVersion();
        req.app_id = Constants.APPKEY;
        req.device_id = "1";
        req.os_version_code = "Android10.3";
        req.app_version_code = Global.versionCode;
        req.channel_abbr = Constants.CHANNEL_CODE_EX;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 
     * AppConfig
     */
    sendReqAppConfig() {
        const req = new FarmBundle.ReqAppConfig();
        req.app_id = Constants.APPKEY;
        req.device_id = "1";
        req.os_version_code = "Android10.3";
        req.app_version_code = Global.versionCode;
        req.request_server = Constants.REQUEST_MODE;
        req.channel_abbr = Constants.CHANNEL_CODE_EX;
        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 用户信息
     */
    sendReqUserHome() {
        const req = new FarmBundle.ReqUserHome();
        req.channel_code = Constants.CHANNEL_CODE;
        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 修改性别
     */
    sendReqChangeGender(gender: number) {
        const req = new FarmBundle.ReqChangeGender();
        req.gender = gender;

        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 修改昵称
     */
    sendReqUpdateNickName(nickname: string) {
        const req = new FarmBundle.ReqUpdateNickName();
        req.nick_name = nickname;

        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 支付方式列表
     */
    sendReqAvailableList() {
        const req = new FarmBundle.ReqAvailableList();
        req.platform = Constants.CHANNEL_CODE_EX;
        req.app_key = Constants.APPKEY;
        req.channel_id = Constants.CHANNEL;

        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 价格列表
     */
    sendReqWatchVips() {
        const req = new FarmBundle.ReqWatchVips();
        req.channel_code = Constants.CHANNEL_CODE;
        req.game_code = Constants.GAME_CODE;
        HttpManager.getInstance().SendRequest(req);
    }


    /**
     * 升级
     * @param utype 1农场 2战士 
     * @param id 农场传user_id 战士传configId
     */
    sendReqUpgrade(utype: number, id: number) {
        const req = new FarmBundle.ReqUpgrade();
        req.utype = utype;
        req.id = id;
        req.mat_id = Number(Global.tech_book) || 0;
        req.warrior_id = id;
        req.game_type = Global.game_type;
        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 解锁
     * @param utype 教材 ID 
     * @param warrior_id 战士id
     * @param game_type 游戏类型
     */
    sendReqUnclock(utype: number, warrior_id: number, shape_id: number) {
        const req = new FarmBundle.ReqUnclock();
        req.mat_id = Number(Global.tech_book) || 0;
        req.warrior_id = warrior_id;
        req.game_type = Global.game_type;
        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 出战
     * @param role_id 战士id
     * @param shape_id 形态id
     */
    sendReqGoWar(role_id: number, shape_id: number) {
        const req = new FarmBundle.ReqGoWar();
        req.role_id = role_id;
        req.shape_id = shape_id;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 一键合成 */
    sendReqSynthesis() {
        const req = new FarmBundle.ReqSynthesis();
        HttpManager.getInstance().SendRequest(req);
    }

    /** 请求任务列表 */
    sendReqTaskList() {
        const req = new FarmBundle.ReqTaskList();
        HttpManager.getInstance().SendRequest(req);
    }

    /** 请求地图信息 */
    sendReqWorldList() {
        const req = new FarmBundle.ReqWorldInfo();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        HttpManager.getInstance().SendRequest(req);
    }

    sendReqWorldItems() {
        const req = new FarmBundle.ReqWorldItems();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        HttpManager.getInstance().SendRequest(req);
    }

    sendReqBaseOverview() {
        const req = new FarmBundle.ReqBaseOverview();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        HttpManager.getInstance().SendRequest(req);
    }

    sendReqPlotInfo(regionNo: number, plotNo: number) {
        const req = new FarmBundle.ReqPlotInfo();
        req.mat_id = Number(Global.tech_book) || 0;
        req.region_num = regionNo;
        req.plot_num = plotNo;
        req.game_type = Global.game_type;
        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 领取任务奖励
     * @param ttype 任务类型 1每日 2赛季
     * @param id 任务序列id
     */
    sendReqGetTaskAward(ttype: number, id: number) {
        const req = new FarmBundle.ReqGetTaskAward();
        req.ttype = ttype;
        req.id = id;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 请求邮件列表 */
    sendReqMailList() {
        const req = new FarmBundle.ReqMailList();
        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 请求邮件详情
     * @param mail_id 邮件id
     * @param mtype 邮件类型
     */
    sendReqMailListDetail(mail_id: number, mtype: number) {
        const req = new FarmBundle.ReqMailListDetail();
        req.mail_id = mail_id;
        req.mtype = mtype;
        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 领取邮件奖励
     * @param mail_id 邮件id
     */
    sendReqGetMailAward(mail_id: number) {
        const req = new FarmBundle.ReqGetMailAward();
        req.mail_id = mail_id;
        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 请求好友操作
     * @param otype 操作类型 0申请加好友 1同意好友请求 2拒绝好友请求 3删除好友
     * @param friend_id 对方好友id
     * @param mail_id 邮箱id otype=0时 mail_id=0 
     */
    sendReqOptionFriend(otype: number, friend_id: number, mail_id: number) {
        const req = new FarmBundle.ReqOptionFriend();
        req.otype = otype;
        req.friend_id = friend_id;
        req.mail_id = mail_id;
        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 请求材料交换
     * @param etype 操作类型 0材料请求 1同意交换 2拒绝交换
     * @param friend_id 对方user_id
     * @param item_id 材料id
     * @param mail_id 邮箱id etype=0时 mail_id=0
     */
    sendReqExchange(etype: number, friend_id: number, item_id: number, mail_id: number) {
        const req = new FarmBundle.ReqExchange();
        req.etype = etype;
        req.friend_id = friend_id;
        req.item_id = item_id;
        req.item_num = 1;
        req.mail_id = mail_id;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 请求赛季收成 */
    sendReqSeasonHarvest() {
        const req = new FarmBundle.ReqSeasonHarvest();
        HttpManager.getInstance().SendRequest(req);
    }

    /** 请求排行榜 */
    sendReqRankingList() {
        const req = new FarmBundle.ReqRankingList();
        HttpManager.getInstance().SendRequest(req);
    }

    /** 请求好友列表 */
    sendReqFriendList() {
        const req = new FarmBundle.ReqFriendList();
        HttpManager.getInstance().SendRequest(req);
    }

    /** 请求推荐好友列表 */
    sendReqRecommendFriendList() {
        const req = new FarmBundle.ReqRecommendFriendList();
        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 请求搜素好友
     * @param user_id 踢卡号
     */
    sendReqSearchFriend(user_id: number) {
        const req = new FarmBundle.ReqSearchFriend();
        req.user_id = user_id;
        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 请求帮助好友守卫
     * @param user_id 
     */
    sendReqFriendDetail(user_id: number) {
        const req = new FarmBundle.ReqFriendDetail();
        req.user_id = user_id;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 已解锁的角色列表 */
    sendReqRoleList() {
        const req = new FarmBundle.ReqRoleList();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 单词列表 */
    sendReqWordList() {
        const req = new FarmBundle.ReqWordList();
        HttpManager.getInstance().SendRequest(req);
    }

    /** 请求战斗结算 */
    sendReqSettlement(friendHelp: number) {
        const req = new FarmBundle.ReqSettlement();
        req.ftype = friendHelp ? 2 : 1;
        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 请求包裹奖励
     * @param num 点击次数
     */
    sendReqPackageAward(num: number) {
        const req = new FarmBundle.ReqPackageAward();
        req.num = num;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 请求体力 */
    sendReqGetEnergy() {
        const req = new FarmBundle.ReqGetEnergy();
        HttpManager.getInstance().SendRequest(req);
    }

    /** 请求消耗体力 */
    sendReqConsumeEnergy() {
        const req = new FarmBundle.ReqConsumeEnergy();
        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 请求使用道具
     * @param id 道具id
     * @param num 道具数量
     */
    sendReqUseProps(id: number, num: number) {
        const req = new FarmBundle.ReqUseProps();
        req.id = id;
        req.num = num;
        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 上传单局游戏数据
     * @param critCount 
     * @param clickCount 
     * @param learn_detail 
     */
    sendReqUploadLearn(friendHelp: number) {
        const req = new FarmBundle.ReqUploadLearn();

        if (friendHelp) {
            req.ftype = 2;
            req.friend_id = friendHelp;
        } else {
            req.ftype = 1;
            req.friend_id = 0;
        }

        req.total_right = BattleManager.getInstance().rightWordCount;
        req.total_wrong = BattleManager.getInstance().wrongWordCount;
        req.total_time_out = BattleManager.getInstance().timeoutWordCount;
        req.total_click = BattleManager.getInstance().clickCount;
        req.result = BattleManager.getInstance().victory;
        req.rest_num = BattleManager.getInstance().restCount;
        req.melee_time = BattleManager.getInstance().meleeTime;
        req.round_num = BattleManager.getInstance().currRound;
        // req.learn_detail = BattleManager.getInstance().selectedWords;
        req.start_time = Math.floor(BattleManager.getInstance().startTime / 1000);
        req.end_time = Math.floor(BattleManager.getInstance().endTime / 1000);
        HttpManager.getInstance().SendRequest(req);
    }

    /** 请求农场等级经验值 */
    sendReqGetExp() {
        const req = new FarmBundle.ReqGetExp();
        HttpManager.getInstance().SendRequest(req);
    }

    /** 请求战斗信息 */
    sendReqStudyRecords(deadline: string = "") {
        const req = new FarmBundle.ReqStudyRecords();
        req.mat_id = Number(Global.tech_book) || 0;
        req.deadline = deadline || "";
        HttpManager.getInstance().SendRequest(req);
    }

    /** 璇锋眰鎴樻枟淇℃伅 */
    sendReqFightInfo(day: string) {
        const req = new FarmBundle.ReqFightInfo();
        req.day = day;
        HttpManager.getInstance().SendRequest(req);
    }

    /**
     * 上传埋点数据
     */
    sendReqBuriedPoints() {
    }

    /**
     * 登录/签到奖励
     * @param ltype 1登录 2连续签到
     */
    sendReqGetLoginAward(ltype: number) {
        const req = new FarmBundle.ReqGetLoginAward();
        req.ltype = ltype;
        HttpManager.getInstance().SendRequest(req);
    }

    // ==================== 新 GameX 协议请求方法 ====================

    /** 基地信息 */
    sendReqBaseInfo() {
        const req = new FarmBundle.ReqBaseInfo();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 背包信息 */
    sendReqInventory() {
        const req = new FarmBundle.ReqInventory();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 战士列表 */
    sendReqWarriorList() {
        const req = new FarmBundle.ReqWarriorList();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 解锁战士 */
    sendReqUnlockWarrior(warriorType: number) {
        const req = new FarmBundle.ReqUnlockWarrior();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        req.warrior_type = warriorType;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 升级战士 */
    sendReqUpgradeWarrior(warriorId: number) {
        const req = new FarmBundle.ReqUpgradeWarrior();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        req.warrior_id = warriorId;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 卡片合成 */
    sendReqSynthesizeCard() {
        const req = new FarmBundle.ReqSynthesizeCard();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 每日任务 */
    sendReqGetDailyTasks() {
        const req = new FarmBundle.ReqGetDailyTasks();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 领取星星奖励 */
    sendReqClaimStarReward(task_Id: number) {
        const req = new FarmBundle.ReqClaimStarReward();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        req.task_id = task_Id;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 开启魔盒 */
    sendReqOpenBox(count: number) {
        const req = new FarmBundle.ReqOpenBox();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        req.count = count;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 学习记录 */
    sendReqLearningRecords(timestamp: number) {
        const req = new FarmBundle.ReqLearningRecords();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        req.timestamp = timestamp;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 新手引导 */
    sendReqGetTutorialProgress() {
        const req = new FarmBundle.ReqGetTutorialProgress();
        req.game_type = Global.game_type;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 刷新新手引导 */
    sendReqUpdateTutorialProgress(step: number) {
        const req = new FarmBundle.ReqUpdateTutorialProgress();
        req.game_type = Global.game_type;
        req.step = step;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 地图进度 */
    sendReqMapProgress() {
        const req = new FarmBundle.ReqMapProgress();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 更新大地图勋章状态 */
    sendReqMapProgressMedal(bigAreaId: number, medalStatus: number) {
        const req = new FarmBundle.ReqMapProgressMedal();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        req.big_area_id = bigAreaId;
        req.medal_status = medalStatus;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 获取课程单词 */
    sendReqMapWords() {
        const req = new FarmBundle.ReqMapWords();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 区域详情 */
    sendReqAreaDetail(bigAreaId: number) {
        const req = new FarmBundle.ReqAreaDetail();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        req.big_area_id = bigAreaId;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 开始战斗 */
    sendReqStartBattle(bigAreaId: number, smallAreaId: number, wave: number) {
        const req = new FarmBundle.ReqStartBattle();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        req.big_area_id = bigAreaId;
        req.small_area_id = smallAreaId;
        req.wave = wave;
        HttpManager.getInstance().SendRequest(req);
    }

    /** 提交战斗结果 */
    sendReqSubmitBattleResult(bigAreaId: number, smallAreaId: number, wave: number, answers: FarmBundle.BattleAnswerData[], isVictory: boolean) {
        const req = new FarmBundle.ReqSubmitBattleResult();
        req.mat_id = Number(Global.tech_book) || 0;
        req.game_type = Global.game_type;
        req.big_area_id = bigAreaId;
        req.small_area_id = smallAreaId;
        req.wave = wave;
        req.is_victory = isVictory;
        req.answers = answers;
        HttpManager.getInstance().SendRequest(req);
    }
}
