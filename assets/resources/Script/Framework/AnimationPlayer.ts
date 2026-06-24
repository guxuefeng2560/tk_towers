/**
 * 动画播放器
 * 负责管理骨骼动画（Spine）和帧动画
 * 提供统一的动画播放接口
 */
export class AnimationPlayer {
    private static _instance: AnimationPlayer | null = null;

    // 正在播放的动画映射
    private playingAnimations: Map<string, sp.Skeleton> = new Map();

    /**
     * 获取单例实例
     */
    public static get instance(): AnimationPlayer {
        if (!AnimationPlayer._instance) {
            AnimationPlayer._instance = new AnimationPlayer();
        }
        return AnimationPlayer._instance;
    }

    /**
     * 私有构造函数
     */
    private constructor() { }

    /**
     * 播放循环动画
     * @param skeleton Spine 组件
     * @param animationName 动画名称
     * @param trackIndex 轨道索引（默认 0）
     * @param loop 是否循环（默认 true）
     */
    public playLoop(
        skeleton: sp.Skeleton,
        animationName: string,
        trackIndex: number = 0,
        loop: boolean = true
    ): void {
        if (!skeleton) {
            console.warn("[AnimationPlayer] Skeleton is null");
            return;
        }

        if (!skeleton.findAnimation(animationName)) {
            console.warn(`[AnimationPlayer] Animation '${animationName}' not found`);
            return;
        }

        skeleton.clearTrack(trackIndex);
        skeleton.setAnimation(trackIndex, animationName, loop);
    }

    /**
     * 播放单次动画，播放完成后回到默认动画
     * @param skeleton Spine 组件
     * @param animationName 动画名称
     * @param fallbackAnimation 回退动画名称（可选）
     * @param trackIndex 轨道索引（默认 0）
     */
    public playOnce(
        skeleton: sp.Skeleton,
        animationName: string,
        fallbackAnimation: string | null = null,
        trackIndex: number = 0
    ): void {
        if (!skeleton) {
            console.warn("[AnimationPlayer] Skeleton is null");
            return;
        }

        if (!skeleton.findAnimation(animationName)) {
            console.warn(`[AnimationPlayer] Animation '${animationName}' not found`);
            if (fallbackAnimation) {
                this.playLoop(skeleton, fallbackAnimation, trackIndex);
            }
            return;
        }

        skeleton.clearTrack(trackIndex);
        const track = skeleton.setAnimation(trackIndex, animationName, false);

        if (fallbackAnimation) {
            skeleton.addAnimation(trackIndex, fallbackAnimation, true, 0);
        }
    }

    /**
     * 播放单次动画并回调
     * @param skeleton Spine 组件
     * @param animationName 动画名称
     * @param onComplete 完成回调
     * @param trackIndex 轨道索引（默认 0）
     */
    public playOnceWithCallback(
        skeleton: sp.Skeleton,
        animationName: string,
        onComplete: () => void,
        trackIndex: number = 0
    ): void {
        if (!skeleton) {
            console.warn("[AnimationPlayer] Skeleton is null");
            return;
        }

        if (!skeleton.findAnimation(animationName)) {
            console.warn(`[AnimationPlayer] Animation '${animationName}' not found`);
            onComplete();
            return;
        }

        skeleton.clearTrack(trackIndex);
        skeleton.setAnimation(trackIndex, animationName, false);

        // 设置完成监听
        skeleton.setCompleteListener((trackEntry) => {
            if (trackEntry.trackIndex === trackIndex) {
                onComplete();
                skeleton.setCompleteListener(null);
            }
        });
    }

    /**
     * 暂停动画
     * @param skeleton Spine 组件
     * @param trackIndex 轨道索引（可选，不传则暂停所有）
     */
    public pause(skeleton: sp.Skeleton, trackIndex?: number): void {
        if (!skeleton) {
            return;
        }

        if (trackIndex !== undefined) {
            const track = skeleton.getCurrent(trackIndex);
            if (track) {
                track.timeScale = 0;
            }
        } else {
            skeleton.timeScale = 0;
        }
    }

    /**
     * 恢复动画
     * @param skeleton Spine 组件
     * @param trackIndex 轨道索引（可选）
     * @param timeScale 时间缩放（默认 1）
     */
    public resume(skeleton: sp.Skeleton, trackIndex?: number, timeScale: number = 1): void {
        if (!skeleton) {
            return;
        }

        if (trackIndex !== undefined) {
            const track = skeleton.getCurrent(trackIndex);
            if (track) {
                track.timeScale = timeScale;
            }
        } else {
            skeleton.timeScale = timeScale;
        }
    }

    /**
     * 停止动画
     * @param skeleton Spine 组件
     * @param trackIndex 轨道索引（可选）
     */
    public stop(skeleton: sp.Skeleton, trackIndex?: number): void {
        if (!skeleton) {
            return;
        }

        if (trackIndex !== undefined) {
            skeleton.clearTrack(trackIndex);
        } else {
            skeleton.clearTracks();
        }
    }

    /**
     * 设置动画播放速度
     * @param skeleton Spine 组件
     * @param timeScale 时间缩放
     */
    public setTimeScale(skeleton: sp.Skeleton, timeScale: number): void {
        if (skeleton) {
            skeleton.timeScale = timeScale;
        }
    }

    /**
     * 检查动画是否正在播放
     * @param skeleton Spine 组件
     * @param animationName 动画名称（可选）
     * @param trackIndex 轨道索引（默认 0）
     */
    public isPlaying(skeleton: sp.Skeleton, animationName?: string, trackIndex: number = 0): boolean {
        if (!skeleton) {
            return false;
        }

        const track = skeleton.getCurrent(trackIndex);
        if (!track) {
            return false;
        }

        if (animationName) {
            return track.animation ? track.animation.name === animationName : false;
        }

        return true;
    }

    /**
     * 获取动画时长
     * @param skeleton Spine 组件
     * @param animationName 动画名称
     */
    public getAnimationDuration(skeleton: sp.Skeleton, animationName: string): number {
        if (!skeleton) {
            return 0;
        }

        const animation = skeleton.findAnimation(animationName);
        return animation ? animation.duration : 0;
    }

    /**
     * 获取所有可用动画名称
     * @param skeleton Spine 组件
     */
    public getAvailableAnimations(skeleton: sp.Skeleton): string[] {
        if (!skeleton) {
            return [];
        }

        // 常用的动画名称列表
        const commonAnimations = ["idle", "walk", "run", "attack", "hit", "die"];
        const result: string[] = [];

        // 检查哪些动画存在
        for (const name of commonAnimations) {
            if (skeleton.findAnimation(name)) {
                result.push(name);
            }
        }

        return result;
    }

    /**
     * 设置皮肤
     * @param skeleton Spine 组件
     * @param skinName 皮肤名称
     */
    public setSkin(skeleton: sp.Skeleton, skinName: string): boolean {
        if (!skeleton) {
            return false;
        }

        // 直接尝试设置皮肤（不同版本 Spine API 可能不同）
        try {
            skeleton.setSkin(skinName);
            return true;
        } catch (e) {
            console.warn(`[AnimationPlayer] Failed to set skin '${skinName}':`, e);
            return false;
        }
    }

    /**
     * 播放帧动画
     * @param sprite Sprite 组件
     * @param frames 帧列表
     * @param duration 总时长（秒）
     * @param loop 是否循环
     * @param onComplete 完成回调
     */
    public playFrameAnimation(
        sprite: cc.Sprite,
        frames: cc.SpriteFrame[],
        duration: number,
        loop: boolean = false,
        onComplete?: () => void
    ): void {
        if (!sprite || frames.length === 0) {
            return;
        }

        const frameDuration = duration / frames.length;
        let currentIndex = 0;

        const playFrame = () => {
            if (currentIndex >= frames.length) {
                if (loop) {
                    currentIndex = 0;
                } else {
                    if (onComplete) {
                        onComplete();
                    }
                    return;
                }
            }

            sprite.spriteFrame = frames[currentIndex];
            currentIndex++;

            setTimeout(playFrame, frameDuration * 1000);
        };

        playFrame();
    }

    /**
     * 停止所有正在播放的动画
     */
    public stopAll(): void {
        this.playingAnimations.forEach((skeleton) => {
            skeleton.clearTracks();
        });
        this.playingAnimations.clear();
    }
}

/**
 * 便捷导出单例实例
 */
export const animationPlayer = AnimationPlayer.instance;