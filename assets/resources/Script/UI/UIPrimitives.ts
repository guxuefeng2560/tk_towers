export interface UiButton {
    node: cc.Node;
    label: cc.Label;
    setEnabled: (enabled: boolean) => void;
}

export interface UiBar {
    root: cc.Node;
    fill: cc.Node;
    label: cc.Label;
    width: number;
    height: number;
    fillColor: cc.Color;
    progressBar?: cc.ProgressBar | null;
}

export default class UIPrimitives {
    public createPanel(name: string, width: number, height: number, color: cc.Color): cc.Node {
        const panel = new cc.Node(name);
        panel.setContentSize(width, height);
        this.redrawRect(panel, width, height, color);
        return panel;
    }

    public createLabel(parent: cc.Node, text: string, fontSize: number, x: number, y: number, width: number, height: number, color: cc.Color): cc.Label {
        const node = new cc.Node("Label");
        node.parent = parent;
        node.setPosition(x, y);
        node.color = color;
        node.setContentSize(width, height);

        const label = node.addComponent(cc.Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 8;
        label.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        return label;
    }

    public createButton(parent: cc.Node, text: string, x: number, y: number, width: number, height: number, color: cc.Color, target: any, onClick: () => void): UiButton {
        const node = new cc.Node(`Button_${text}`);
        node.parent = parent;
        node.setPosition(x, y);
        node.setContentSize(width, height);
        this.redrawRect(node, width, height, color);

        const buttonComponent = node.addComponent(cc.Button);
        const label = this.createLabel(node, text, 24, 0, 0, width - 12, height - 8, cc.Color.WHITE);
        node.on(cc.Node.EventType.TOUCH_END, onClick, target);

        return {
            node,
            label,
            setEnabled: (enabled: boolean) => {
                node.opacity = enabled ? 255 : 135;
                buttonComponent.interactable = enabled;
                if (enabled) {
                    node.resumeSystemEvents(true);
                } else {
                    node.pauseSystemEvents(true);
                }
            },
        };
    }

    public createBar(parent: cc.Node, x: number, y: number, width: number, height: number, bgColor: cc.Color, fillColor: cc.Color): UiBar {
        const root = new cc.Node("BarRoot");
        root.parent = parent;
        root.setPosition(x, y);
        root.setContentSize(width, height);

        const background = new cc.Node("BarBg");
        background.parent = root;
        background.setContentSize(width, height);
        this.redrawRect(background, width, height, bgColor);

        const fill = new cc.Node("BarFill");
        fill.parent = root;
        fill.anchorX = 0;
        fill.x = -width / 2;
        fill.setContentSize(width, height);
        this.redrawRect(fill, width, height, fillColor);

        const label = this.createLabel(root, "", 18, 0, 0, width, height, cc.Color.WHITE);
        return { root, fill, label, width, height, fillColor };
    }

    public updateBar(bar: UiBar, current: number, max: number, text: string): void {
        const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, current / max));
        if (bar.progressBar) {
            bar.progressBar.progress = ratio;
            bar.label.string = text;
            return;
        }
        const width = Math.max(0, bar.width * ratio);
        this.redrawRect(bar.fill, width, bar.height, bar.fillColor);
        bar.fill.anchorX = 0;
        bar.fill.x = -bar.width / 2;
        bar.label.string = text;
    }

    public redrawRect(node: cc.Node, width: number, height: number, color: cc.Color): void {
        if (width <= 0 || height <= 0) {
            node.active = false;
            return;
        }

        node.active = true;
        node.setContentSize(width, height);
        let graphics = node.getComponent(cc.Graphics);
        if (!graphics) {
            graphics = node.addComponent(cc.Graphics);
        }

        graphics.clear();
        graphics.fillColor = color;
        graphics.roundRect(-width / 2, -height / 2, width, height, Math.min(12, height / 2));
        graphics.fill();
    }

    public redrawCircle(node: cc.Node, radius: number, color: cc.Color): void {
        node.active = true;
        node.setContentSize(radius * 2, radius * 2);
        let graphics = node.getComponent(cc.Graphics);
        if (!graphics) {
            graphics = node.addComponent(cc.Graphics);
        }

        graphics.clear();
        graphics.fillColor = color;
        graphics.circle(0, 0, radius);
        graphics.fill();
    }
}
