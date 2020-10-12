import { EngineOpt } from "../core/engine";
import { Manifold, Collision } from "./manifold";
import { Util } from "../common/util";




export class ManifoldTable {
    // 是否开启缓存
    enableCache: boolean;
    // 缓存移除时间阈值
    manifoldRemoveThreshold: number;
    // 流形表
    table: {[key: string]: Manifold};
    // 流形队列
    list: Manifold[];
    // 开始碰撞的碰撞对
    collisionStart: Manifold[];
    // 激活碰撞的碰撞对
    collisionActive: Manifold[];
    // 结束碰撞的碰撞对
    collisionEnd: Manifold[];

    constructor(opt: EngineOpt) {
        this.enableCache = false;
        this.manifoldRemoveThreshold = 1000;
        this.table = {};
        this.list = [];
        this.collisionStart = [];
        this.collisionEnd = [];
        this.collisionActive = [];

        Util.merge(this, opt);
    }

    /**
     * 更新所有流形
     * @param collisions 
     * @param timeStamp 
     */
    update(collisions: Collision[], timeStamp: number) {
        let manifold: Manifold,
            id: string,
            collision: Collision,
            i;

        this.collisionStart.length = 0;
        this.collisionEnd.length = 0;
        this.collisionActive.length = 0;

        // 清空确认激活状态
        for (i = 0; i < this.list.length; i++) {
            this.list[i].confirmedActive = false;
        }

        for(i = 0; i < collisions.length; i++) {
            collision = collisions[i];

            // 只有真实发生碰撞的碰撞对才会更新对应的流形
            if(collision.collide) {
                id = Util.compositeId(collision.partA.id, collision.partB.id);
                manifold = this.table[id];

                // 若对应流形存在
                if(manifold) {
                    // 若流形上一刻已经被激活
                    if(manifold.isActive) {
                        this.collisionActive.push(manifold);
                    }
                    // 否则表明该流形第一次发生碰撞
                    else {
                        this.collisionStart.push(manifold);
                    }

                    manifold.update(collision, timeStamp);
                    manifold.confirmedActive = true;
                }
                // 若不存在，则创建对应流形
                else {
                    manifold = new Manifold(collision, timeStamp);
                    this.table[id] = manifold;
                    this.list.push(manifold);

                    this.collisionStart.push(manifold);
                }
            }
        }

        // 遍历查找上一次发生碰撞且当前没有发生碰撞的流形
        for(i = 0; i < this.list.length; i++) {
            manifold = this.list[i];

            // ，将其激活状态取消
            if(manifold.isActive && !manifold.confirmedActive) {
                manifold.toggleActive(false, timeStamp);
                // 标记为碰撞结束
                this.collisionEnd.push(manifold);
            }
        }
    }

    /**
     * 过滤超时的碰撞流形
     * @param timeStamp 
     */
    filter(timeStamp: number) {
        let manifold: Manifold,
            i;

        for(i = 0; i < this.list.length; i++) {
            manifold = this.list[i];

            // 若流形的两刚体有其一处于休眠状态，更新时间，不清除
            if(manifold.bodyA.sleeping || manifold.bodyB.sleeping) {
                manifold.timeUpdated = timeStamp;
                continue;
            }

            // 若流形上次更新的时间离现在已经大于设定阈值，则需要清除
            if(timeStamp - manifold.timeUpdated > this.manifoldRemoveThreshold) {
                delete this.table[manifold.id];
                this.list.splice(i, 1);
                i--;
            }
        }
    }

    /**
     * 清空流形表和队列
     */
    clear() {
        this.table = {};
        this.list.length = 0;
        this.collisionStart.length = 0;
        this.collisionEnd.length = 0;
        this.collisionActive.length = 0;
    }
}
