/**
 * Tween 工具
 */
export default class TweenUtil {

    /**
     * 抖动
     * @param node 目标节点
     * @param amplitude 振幅
     * @param repeatCnt 次数
     */
    static shakeNode(node: cc.Node, amplitude: number = 2, repeatCnt: number = 20, callback?: Function) {
        if (node == null) {
            return;
        }

        const nodePos = node.getPosition();
        node.stopAllActions();
        node.setPosition(nodePos);

        const action = this.shakeAction(amplitude, nodePos);
        // cc.tween(node)
        //     .repeat(repeatCnt,
        //         action
        //     )
        //     .call(() => {
        //         node.setPosition(nodePos);
        //         callback && callback();
        //     })
        //     .start();
        node.runAction(
            cc.sequence(
                cc.repeat(action, repeatCnt),
                cc.callFunc(() => {
                    node.setPosition(nodePos);
                    callback && callback();
                })
            )
        );
    }

    /**
     * 震动
     * @param amplitude 振幅
     * @param nodePos 目标节点坐标
     */
    static shakeAction(amplitude: number, nodePos: cc.Vec2): any {
        const sv = cc.v2(0, amplitude);
        // const action = cc.tween()
        //     .to(0.02, { position: nodePos.add(sv.rotate(Math.PI / 4 * (0 * 3) % 8)) })
        //     .to(0.02, { position: nodePos.add(sv.rotate(Math.PI / 4 * (1 * 3) % 8)) })
        //     .to(0.02, { position: nodePos.add(sv.rotate(Math.PI / 4 * (2 * 3) % 8)) })
        //     .to(0.02, { position: nodePos.add(sv.rotate(Math.PI / 4 * (3 * 3) % 8)) })
        //     .to(0.02, { position: nodePos.add(sv.rotate(Math.PI / 4 * (4 * 3) % 8)) })
        //     .to(0.02, { position: nodePos.add(sv.rotate(Math.PI / 4 * (5 * 3) % 8)) })
        //     .to(0.02, { position: nodePos.add(sv.rotate(Math.PI / 4 * (6 * 3) % 8)) })
        //     .to(0.02, { position: nodePos.add(sv.rotate(Math.PI / 4 * (7 * 3) % 8)) });
        const action = cc.sequence(
            cc.moveTo(0.02, nodePos.add(sv.rotate(Math.PI / 4 * (0 * 3) % 8))),
            cc.moveTo(0.02, nodePos.add(sv.rotate(Math.PI / 4 * (1 * 3) % 8))),
            cc.moveTo(0.02, nodePos.add(sv.rotate(Math.PI / 4 * (2 * 3) % 8))),
            cc.moveTo(0.02, nodePos.add(sv.rotate(Math.PI / 4 * (3 * 3) % 8))),
            cc.moveTo(0.02, nodePos.add(sv.rotate(Math.PI / 4 * (4 * 3) % 8))),
            cc.moveTo(0.02, nodePos.add(sv.rotate(Math.PI / 4 * (5 * 3) % 8))),
            cc.moveTo(0.02, nodePos.add(sv.rotate(Math.PI / 4 * (6 * 3) % 8))),
            cc.moveTo(0.02, nodePos.add(sv.rotate(Math.PI / 4 * (7 * 3) % 8)))
        );

        return action;
    }

    /**
     * 上下浮动
     * @param node 
     * @param startPos 初始位置
     * @param special 是否加速
     */
    static floatingAnim(node: cc.Node, startPos: cc.Vec2 = cc.v2(0, 0), special: boolean = false) {
        if (node) {
            node.stopAllActions();
            node.setPosition(startPos);
            if (special) {
                const action = cc.tween()
                    .by(0.5, { position: cc.v2(0, 20) }, { easing: "sineOut" })
                    .by(0.2, { position: cc.v2(0, -20) }, { easing: "sineIn" });
                cc.tween(node)
                    .repeatForever(action)
                    .start();
            } else {
                const action = cc.tween()
                    .by(0.5, { position: cc.v2(0, 20) })
                    .by(0.5, { position: cc.v2(0, -20) });
                cc.tween(node)
                    .repeatForever(action)
                    .start();
            }
        }
    }

    /**
     * 呼吸
     * @param node 
     * @param fast 是否加速
     */
    static breathingAnim(node: cc.Node, fast: boolean = false) {
        if (node) {
            node.stopAllActions();
            node.opacity = 255;
            node.scale = 1;

            let dur1 = 4;
            let dur2 = 3;
            let dur3 = 2;
            let times = 2;
            if (fast) {
                dur1 = 1;
                dur2 = 0.8;
                dur3 = 0.2;
                times = 5;
            }
            let scaleTween = cc.tween()
                .to(dur1, { scale: 1.3 }, { easing: "sineIn" })
                .delay(0.2)
                .to(dur2, { scale: 1 }, { easing: "sineOut" });
            let opacityTween = cc.tween()
                .to(dur3, { opacity: 100 })
                .to(dur3, { opacity: 255 });
            let action = cc.tween()
                .parallel(scaleTween, cc.tween().repeat(times, opacityTween));

            if (fast) {
                cc.tween(node)
                    .repeat(3, action)
                    .call(() => {
                        this.breathingAnim(node);
                    })
                    .start();
            } else {
                cc.tween(node)
                    .repeat(Number.MAX_SAFE_INTEGER, action)
                    .start();
            }
        }
    }

    /**
     * 摇晃
     * @param node 
     * @param angleNum 角度
     * @param duration 时间
     */
    static swingAnim(node: cc.Node, angleNum: number, duration: number = 0.2) {
        if (node == null) {
            return;
        }

        node.stopAllActions();
        const action = cc.tween()
            .to(duration, { angle: angleNum })
            .to(duration, { angle: -angleNum })
            .to(duration / 2, { angle: 0 })
            .delay(1);
        cc.tween(node)
            .repeatForever(action)
            .start();
    }

    /**
     * 水平翻转（翻牌）
     * @param node 节点
     * @param duration 总时长
     * @param onMiddle 中间状态回调
     * @param onComplete 完成回调
     */
    static flip(node: cc.Node, duration: number, onMiddle?: Function, onComplete?: Function): Promise<void> {
        return new Promise<void>(res => {
            const time = duration / 2;
            const skew = 10;
            cc.tween(node)
                .parallel(
                    cc.tween().to(time, { scaleX: 0 }, { easing: 'sineIn' }),
                    cc.tween().to(time, { skewY: -skew }),
                )
                .set({ skewY: skew })
                .call(() => {
                    onMiddle && onMiddle();
                })
                .parallel(
                    cc.tween().to(time, { scaleX: 1 }, { easing: 'sineOut' }),
                    cc.tween().to(time, { skewY: 0 }),
                )
                .call(() => {
                    onComplete && onComplete();
                    res();
                })
                .start();
        });
    }

    /**
     * 闪避
     * @param node 
     * @param moveOffset 
     */
    static miss(node: cc.Node, moveOffset: number) {
        if (node == null) {
            return;
        }

        cc.tween(node)
            .by(0.1, { position: cc.v3(moveOffset, 0, 0) })
            .by(0.1, { position: cc.v3(-moveOffset, 0, 0) })
            .start();
    }

    /**
     * 提示语
     * @param node 
     * @param appearDur 
     * @param disappearDur 
     */
    static tips(node: cc.Node, appearDur: number, disappearDur: number, targetPos: cc.Vec2) {
        if (node == null) {
            return;
        }

        node.stopAllActions();
        node.setPosition(cc.v2(targetPos.x + 320, targetPos.y));
        node.active = true;
        // cc.tween(node)
        //     .by(appearDur, { position: cc.v3(-320, 0, 0) }, { easing: 'sineOut' })
        //     .delay(1.5)
        //     .by(disappearDur, { position: cc.v3(-320, 0, 0) }, { easing: 'sineIn' })
        //     .call(() => {
        //         node.active = false;
        //     })
        //     .start();
        node.runAction(
            cc.sequence(
                cc.moveBy(appearDur, -320, 0),
                cc.delayTime(1.5),
                cc.moveBy(disappearDur, -320, 0),
                cc.callFunc(() => {
                    node.active = false;
                })
            )
        );
    }

    /**
     * 旋转消失
     * @param node 
     * @param targetPos 
     * @param clockwise 顺时针
     */
    static rotateMove(node: cc.Node, targetPos: cc.Vec3, clockwise: boolean) {
        if (node == null) {
            return;
        }

        const rotateAngle = clockwise ? -360 : 360;
        let rotateTween = cc.tween()
            .by(0.1, { angle: rotateAngle })

        cc.tween(node)
            .parallel(
                cc.tween().repeat(Number.MAX_SAFE_INTEGER, rotateTween),
                cc.tween().to(0.8, { position: targetPos }, { easing: 'sineIn' })
            )
            .start();
    }

    /** 泛红 */
    static changeNodeRed(node: cc.Node) {
        if (node == null) {
            return;
        }

        node.stopAllActions();
        cc.tween(node)
            .parallel(
                cc.tween()
                    .to(0.2, { color: cc.color(255, 0, 0) })
                    .to(0.2, { color: cc.color(255, 255, 255) }),
                cc.tween()
                    .to(0.2, { scale: 1.2 })
                    .to(0.2, { scale: 1 })
            )
            .start();
    }
}
