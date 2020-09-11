import { Body } from "../body/body";
import { Util } from "../common/util";
import { Bound } from "./bound";
import { Engine, EngineOpt } from "../core/engine";

/**
 * 粗检测阶段，使用Sweep & Prune算法
 * 参考：https://link.springer.com/article/10.1007/s00371-013-0880-7
 */


// 粗检测阶段生成的结果对结构
export type broadPhasePair = {
    bodyA: Body;
    bodyB: Body;
};



export class BroadPhase {
    engine: Engine;

    constructor(engine: Engine, opt: EngineOpt) {
        this.engine = engine;
    }

    /**
     * 检测
     * @param bodies 所有刚体
     */
    detect(bodies: Body[]): broadPhasePair[] {
        return this.sweepAndPrune(bodies);
    }

    /**
     * 查看刚体是否出了可视区
     * @param bound 
     */
    private isBodyOutWindow(bound: Bound): boolean {
        return bound.max.y < 0 || bound.min.x > this.engine.width || bound.min.y > this.engine.height || bound.max.x < 0;
    }

    /**
     * 查看两个刚体是否允许发生碰撞
     * @param bodyA 
     * @param bodyB 
     */
    private canCollide(bodyA: Body, bodyB: Body): boolean {
        // 若bodies[i]的碰撞过滤器过滤了bodies[i]，不进行检测
        if(!bodyA.methods.filter(bodyA.mask, bodyB.mask) || !bodyB.methods.filter(bodyB.mask, bodyA.mask)) return false;
        
        // 若刚体已经移出可视区了，跳过
        if(this.isBodyOutWindow(bodyA.bound) || this.isBodyOutWindow(bodyB.bound)) return false;

        // 两个静态刚体 ，跳过
        if(bodyA.fixed && bodyB.fixed) return false;

        // 两个睡眠刚体，跳过
        if(bodyA.sleeping && bodyB.sleeping) return false;

        return true;
    }

    /**
     * Sweep & Prune
     * @param bodies 
     */
    private sweepAndPrune(bodies: Body[]): broadPhasePair[] {
        let broadPhasePairList: broadPhasePair[] = [],
            i, j, len = bodies.length;
        
        // 包围盒在x轴上排序 （直接插入排序）
        // 第一次排序时包围盒趋向于无序，这时复杂度为O(n^2) 
        // 而因为时间相干性，在之后的每帧包围盒趋向有序，此时直接插入排序效率最高，为O(nlogn)
        Util.insertSort<Body>(bodies, (bodyA, bodyB) => bodyA.bound.min.x - bodyB.bound.min.x);
    
        for(i = 0; i < len; i++) {
            for(j = i + 1; j < len; j++) {
                let boundA = bodies[i].bound,
                    boundB = bodies[j].bound;

                // 已经不可能发生碰撞了，跳出循环
                if(boundA.max.x < boundB.min.x) break;

                // 若A，B不可以发生碰撞，返回
                if(!this.canCollide(bodies[i], bodies[j])) continue;

                // 一个个对比包围盒是否相交
                if(boundA.min.y < boundB.max.y && boundB.min.y < boundA.max.y) {
                    broadPhasePairList.push({
                        bodyA: bodies[i],
                        bodyB: bodies[j],
                    });
                }
            }
        }

        return broadPhasePairList;
    } 
}

