import { Engine, EngineOpt } from "../core/engine";
import { Bound } from "../common/bound";
import { Util } from "../common/util";
import { Body, bodyType } from "../body/body";
import { Collision } from "./manifold";
import { ManifoldTable } from "./manifoldTable";
import { Circle } from "../body/circle";
import { Polygon } from "../body/polygon";
import { NFSP_SAT } from "./nfsp-sat";


/**
 * 碰撞检测
 */


// 粗检测阶段生成的结果对结构
export type broadPhasePair = {
    bodyA: Body;
    bodyB: Body;
};

export class Detector {
    private engine: Engine;
    // 分离轴测试
    private NFSP_SAT: NFSP_SAT;

    constructor(engine: Engine, opt: EngineOpt) {
        this.engine = engine;
        this.NFSP_SAT = new NFSP_SAT(opt);
    }

    /**
     * 碰撞检测函数
     * @param bodies 
     */
    detect(bodies: Body[]): Collision[] {
        let broadPhasePairs: broadPhasePair[],
            collisions: Collision[];

        // 粗阶段检测
        broadPhasePairs = this.broadPhase(bodies);

        // console.log(broadPhasePairs);

        // 细阶段检测
        collisions = this.narrowPhase(broadPhasePairs);

        // console.log(collisions);

        return collisions;
    }

    // --------------------------------------------- 粗阶段 --------------------------------

    /**
     * 粗检测阶段
     * @param bodies 所有刚体
     */
    broadPhase(bodies: Body[]): broadPhasePair[] {
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
        if(bodyA.mask !== 0 && bodyB.mask !== 0 && bodyA.mask === bodyB.mask) return false;
        
        // 若刚体已经移出可视区了，跳过
        if(this.isBodyOutWindow(bodyA.bound) || this.isBodyOutWindow(bodyB.bound)) return false;

        // 两个静态刚体 ，跳过
        if((bodyA.static || bodyA.kinetic) && (bodyB.static || bodyB.kinetic)) return false;

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
                if(boundA.min.y <= boundB.max.y && boundB.min.y <= boundA.max.y) {
                    broadPhasePairList.push({
                        bodyA: bodies[i],
                        bodyB: bodies[j],
                    });
                }
            }
        }

        return broadPhasePairList;
    } 

    // --------------------------------------------- 细阶段 --------------------------------

    /**
     * 细检测阶段
     * @param broadPhasePairList 粗检查生成的潜在碰撞对
     */
    narrowPhase(broadPhasePairList: broadPhasePair[]): Collision[] {
        let collisions = [],
            prevCollision = null,
            pair: broadPhasePair,
            partsA: Body[],
            partsB: Body[],
            partA: Body,
            partB: Body,
            i, j, k;

        for(i = 0; i < broadPhasePairList.length; i++) {
            pair = broadPhasePairList[i];
            partsA = pair.bodyA.parts;
            partsB = pair.bodyB.parts;

            for(j = 0; j < partsA.length; j++) {
                partA = partsA[j];

                for(k = 0; k < partsB.length; k++) {
                    partB = partsB[k];

                    // 两个子图形包围盒不相交，跳过
                    if(!partA.bound.isIntersect(partB.bound)) continue;

                    prevCollision = this.getPrevCollision(partA, partB, this.engine.manifoldTable);

                    // A,B皆为圆形
                    if(partA.type === bodyType.circle && partB.type === bodyType.circle) {
                        collisions.push(this.NFSP_SAT.circleCollideCircle(<Circle>partA, <Circle>partB, prevCollision));
                    }
                    // A为多边形，B为圆形
                    else if(partA.type === bodyType.polygon && partB.type === bodyType.circle) {
                        collisions.push(this.NFSP_SAT.polygonCollideBody(<Polygon>partA, partB, prevCollision));
                    }
                    // A为圆形，B为多边形
                    else if(partA.type === bodyType.circle && partB.type === bodyType.polygon) {
                        collisions.push(this.NFSP_SAT.polygonCollideBody(<Polygon>partB, partA, prevCollision));
                    }
                    // A,B皆为多边形
                    else {
                        collisions.push(this.NFSP_SAT.polygonCollideBody(<Polygon>partA, <Polygon>partB, prevCollision));
                    }
                }
            }
        }

        return collisions;
    }

    /**
     * 获取上一次碰撞
     * @param partA 
     * @param partB 
     * @param manifoldTable 
     */
    getPrevCollision(partA: Body, partB: Body, manifoldTable: ManifoldTable): Collision {
        let id = Util.compositeId(partA.id, partB.id),
            manifold = manifoldTable.table[id];

        if(this.engine.manifoldTable.enableCache && manifold && manifold.isActive) {
            return manifold.collision;
        }
        else {
            return null;
        }
    }
}