import WordsConfig from "./Data/WordsConfig";
import AudioManager from "./Framework/audio/TD_AudioManager";
import ConfigLoaderModule from "./Framework/config/TD_ConfigLoaderModule";
import LanguageSprite from "./Framework/language/TD_LanguageSprite";
import ResModuleManager from "./Framework/moduleManager/TD_ResModuleManager";
import { Constants } from "./global/TD_Constants";
import { EVENT_INIT_END } from "./global/TD_Event";
import Global from "./global/TD_Global";
import RequestManager from "./netMessage/TD_RequestManager";
import HttpManager from "./tools/net/TD_HttpManager";
import ResourceManager from "./tools/TD_ResourceManager";


const { ccclass, property } = cc._decorator;

@ccclass
export default class LoadingScene extends cc.Component {
    @property(cc.Node)
    NodeMask: cc.Node = null;
    @property({
        type: cc.Boolean,
    })

    @property(cc.Node)
    NodeLoading: cc.Node = null;

    @property(cc.Node)
    NodeBg: cc.Node = null;

    @property(cc.Label)
    LabelProgress: cc.Label = null;

    @property(cc.Label)
    LabelLoading: cc.Label = null;

    @property(cc.ProgressBar)
    ProgressBar: cc.ProgressBar = null;

    private readonly GAME_ID = Global.game_id;
    private readonly BUNDLE_NAME: string = Global.game_id;

    private _requestId = "";

    private _moduleInitEnd: boolean = false;
    private _isReadyToMain: boolean = false;
    /** 是否正式版本 */
    private static IS_RELEASE: boolean = true;
    private _configModule: any;

    onLoad() {
        Global.is_load_success = false;
        this._moduleInitEnd = false;
        this._isReadyToMain = false;
        if (LoadingScene.IS_RELEASE) {
            this.preLoadRes();
        }
        this.initFitLayout();
        
        this.ProgressBar.progress = 0;
        this.LabelProgress.string = "0%";
    }

    private initFitLayout() {
        const designWidth = cc.view.getDesignResolutionSize().width;
        const visibleWidth = cc.view.getVisibleSize().width;
        // 长屏
        if (visibleWidth > designWidth) {
            this.NodeBg.setScale(visibleWidth/designWidth);
        } 
    }

    initLanguages() {
        
    }

    start() {
        if (!LoadingScene.IS_RELEASE) {
            
        }
    }

    onInitModules() {
        this._configModule = new ConfigLoaderModule(
            WordsConfig.getInstance(),
        );

        this._configModule.moduleInit(()=>{
            this.onInitEnd();
        });
    }

    onDestroy() {
        this.unregisterEvent();
    }


    private unregisterEvent() {
        
    }


    /** 以下资源加载 */
    private preLoadRes() {
        ResModuleManager.init(Global.game_id, Global.game_id);
        ResModuleManager.setModuleID(Global.game_id);

        // RequestManager.getInstance();
        // ResourceManager.getInstance();
        AudioManager.getInstance();
        AudioManager.getInstance().stopAll();
        this.onInitModules();
    }

    /** 配置加载完成 */
    private onInitEnd() {
        let self = this;
        self.ProgressBar.progress = 1;
        self.LabelProgress.string = "100%";
        self._moduleInitEnd = true;
        Global.is_load_success = true;
        // if (self._isReadyToMain) {
            self.toGameMain()
        // }
    }

    private toGameMain() {
        if (!this._moduleInitEnd) {
            this._isReadyToMain = true;
            return;
        }

        Global.isLoadScene = null;

        // 使用 ResModuleManager 统一加载场景
        // ResModuleManager.loadAndRunScene(Global.game_id, Constants.SCENE_MAIN);
        cc.director.loadScene("TowerDefenseScene");
    }
}
