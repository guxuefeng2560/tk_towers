type NodeFactory = () => cc.Node;

export default class PoolManager {
    private readonly pools: Record<string, cc.Node[]> = {};

    public get(key: string, parent: cc.Node, factory: NodeFactory): cc.Node {
        if (!this.pools[key]) {
            this.pools[key] = [];
        }

        const pool = this.pools[key];
        const node = pool.length > 0 ? pool.pop()! : factory();
        node.active = true;
        node.parent = parent;
        return node;
    }

    public put(key: string, node: cc.Node): void {
        if (!node) {
            return;
        }

        if (!this.pools[key]) {
            this.pools[key] = [];
        }

        node.stopAllActions();
        node.removeFromParent(false);
        node.active = false;
        this.pools[key].push(node);
    }

    public clear(key?: string): void {
        if (key) {
            this.destroyPool(key);
            return;
        }

        Object.keys(this.pools).forEach((poolKey) => this.destroyPool(poolKey));
    }

    private destroyPool(key: string): void {
        const pool = this.pools[key];
        if (!pool) {
            return;
        }

        pool.forEach((node) => node.destroy());
        delete this.pools[key];
    }
}
