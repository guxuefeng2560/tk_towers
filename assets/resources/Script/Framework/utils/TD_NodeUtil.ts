/**
 * 节点工具
 */
export default class NodeUtil {

    /**
     * 从节点强制获取一个组件，如果该组件没有就增加一个返回
     * @param node 要获取组件的节点
     * @param componentName 组件名称
     */
    static getComponentForceByName<T>(node: cc.Node, componentName: string): T {
        let com: T = node.getComponent(componentName);
        if (com == null) {
            com = node.addComponent(componentName);
        }
        return com;
    }

    /**
     * 获取某节点上的组件，如果没有该组件则增加一个并返回
     * @param node 要获取组件的节点
     * @param type 要获取的组件类型
     */
    static getComponentForceByType<T extends cc.Component>(node: cc.Node, type: { new(): T }): T {
        let com = node.getComponent(type);
        if (com == null) {
            com = node.addComponent(type);
        }
        return com as T;
    }

    /**
     * 坐标是否在目标节点范围内
     * @param pos 坐标
     * @param target 目标节点
     */
    static isPosOnNodeRect(pos: cc.Vec2, target: cc.Node): boolean {
        const rect = target.getBoundingBoxToWorld();
        return rect.contains(pos);
    }

    /**
     * 两个节点是否重叠
     * @param node1 节点 1
     * @param node2 节点 2
     * @param contains 是否完全包含
     */
    static isNodesOverlap(node1: cc.Node, node2: cc.Node, contains: boolean = false): boolean {
        const rect2 = node2.getBoundingBoxToWorld();
        const rect1 = node1.getBoundingBoxToWorld();
        return contains ? rect2.containsRect(rect1) : rect2.intersects(rect1);
    }

    /**
     * 获取节点当前的世界坐标
     * @param node 节点
     */
    static worldPosition(node: cc.Node): cc.Vec3 {
        let pos = node.convertToWorldSpaceAR(cc.Vec3.ZERO);
        return new cc.Vec3(pos.x, pos.y, 0);
    }

    /**
     * 获取世界坐标在节点坐标系中的坐标
     * @param node 相对的节点
     * @param worldPos 世界坐标
     */
    static localPosition(node: cc.Node, worldPos: cc.Vec3): cc.Vec3 {
        let pos = node.convertToNodeSpaceAR(worldPos);
        return new cc.Vec3(pos.x, pos.y, 0);
    }

    /**
     * 将posNode的坐标转换为targetNode节点坐标系的坐标
     * @param targetNode 节点坐标系
     * @param posNode 要转换的节点
     */
    static localPositionToNode(targetNode: cc.Node, posNode: cc.Node): cc.Vec3 {
        let worldPos = this.worldPosition(posNode);
        return this.localPosition(targetNode, worldPos);
    }

    /**
     * 获取节点在目标节点（容器）下的相对位置
     * @param node 节点
     * @param container 目标节点（容器）
     */
    static getRelativePosition(node: cc.Node, container: cc.Node): cc.Vec2 {
        const worldPos = (node.getParent() || node).convertToWorldSpaceAR(node.getPosition());
        return container.convertToNodeSpaceAR(worldPos);
    }

    /**
     * 将节点active设置为true
     * @param node1 第一个节点
     * @param restOfNode 剩余节点
     */
    static nodeVisible(node1: cc.Node, ...restOfNode: cc.Node[]) {
        node1.active = true;
        restOfNode.forEach((item) => {
            item.active = true;
        });
    }

    /**
     * 将节点active设置为false
     * @param node1 第一个节点
     * @param restOfNode 剩余节点
     */
    static nodeInvisible(node1: cc.Node, ...restOfNode: cc.Node[]) {
        node1.active = false;
        restOfNode.forEach((item) => {
            item.active = false;
        });
    }

    /**
     * 将按钮设置为可点击状态
     * @param btn1 第一个按钮组件
     * @param restOfBtn 剩余按钮组件
     */
    static btnEnableClick(btn1: cc.Button, ...restOfBtn: cc.Button[]) {
        btn1.interactable = true;
        restOfBtn.forEach((item) => {
            item.interactable = true;
        });
    }

    /**
     * 将按钮置为不可点击状态
     * @param btn1 第一个按钮组件
     * @param restOfBtn 剩余按钮组件
     */
    static btnDisableClick(btn1: cc.Button, ...restOfBtn: cc.Button[]) {
        btn1.interactable = false;
        restOfBtn.forEach((item) => {
            item.interactable = false;
        });
    }

    /**
     * 输出节点的路径，即将父节点一一列出，使用/分隔
     * 比如 UIRoot/UIMessageBox/UIOkbtn
     * @param node 需要输出路径的节点
     */
    static getNodePath(node: cc.Node): string {
        let path: string = node.name;
        let parent: cc.Node = node.parent;
        while (parent != null) {
            path = parent.name + "/" + path;
            parent = parent.parent;
        }

        return path;
    }

    /**
     * 设置节点正常或变灰
     * @param node 目标节点
     * @param bright true为正常，false为变灰
     * @param recursion true(默认)为递归，false为仅设置自身
     */
    static changeNodeBright(node: cc.Node | cc.Component, bright: boolean, recursion: boolean = true) {
        if (node instanceof cc.Component) {
            node = node.node;
        }

        if (node instanceof cc.Node) {
            if (recursion) {
                node.getComponentsInChildren(cc.RenderComponent || cc.Sprite).forEach(sprite => {
                    this.setSpriteBright(sprite, bright);
                });
            } else {
                node.getComponents(cc.RenderComponent || cc.Sprite).forEach(sprite => {
                    this.setSpriteBright(sprite, bright);
                });
            }
        }
    }

    private static setSpriteBright(sprite: cc.RenderComponent | cc.Sprite, bright: boolean) {
        if (sprite.setMaterial) {
            const material = bright ? cc.Material.createWithBuiltin(<any>cc.Material.BUILTIN_NAME.SPRITE, 0)
                : cc.Material.createWithBuiltin(<any>cc.Material.BUILTIN_NAME.GRAY_SPRITE, 0)
            if (bright) {
                material.define("USE_TEXTURE", true, 0, false);
            }
            sprite.setMaterial(0, material);
        } else if (sprite instanceof cc.Sprite && sprite.setState) {
            sprite.setState(bright ? cc.Sprite.State.NORMAL : cc.Sprite.State.GRAY);
        } else {
            sprite["_sgNode"] && sprite["_sgNode"].setState(bright ? 0 : 1);
        }
    }
}
