import { SAT } from "./sat";
import { broadPhasePair } from "./broadPhase";
import { Arc } from "../common/arcs";
import { Poly } from "../common/vertices";
import { Engine } from "../core/engine";
import { Collision, Geometry } from "./manifold";
import { Util } from "../common/util";
import { ManifoldTable } from "./manifoldTable";




export class NarrowPhase {
    private engine: Engine;

    // 分离轴测试
    private SAT: SAT;
    // 碰撞对
    collisions: Collision[];


    constructor(engine: Engine) {
        this.engine = engine;

        this.SAT = new SAT();
    }

    /**
     * 检测
     * @param broadPhasePairList 粗检查生成的潜在碰撞对
     */
    detect(broadPhasePairList: broadPhasePair[]): Collision[] {
        let collisions = [],
            prevCollision = null,
            pair: broadPhasePair,
            partsA: Geometry[],
            partsB: Geometry[],
            partA: Geometry,
            partB: Geometry,
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
                    if(partA instanceof Arc && partB instanceof Arc) {
                        collisions.push(this.SAT.circleCollideCircle(partA, partB, prevCollision));
                    }
                    // A为多边形，B为圆形
                    else if(partA instanceof Poly && partB instanceof Arc) {
                        collisions.push(this.SAT.polygonCollideBody(partA, partB, prevCollision));
                    }
                    // A为圆形，B为多边形
                    else if(partA instanceof Arc && partB instanceof Poly) {
                        collisions.push(this.SAT.polygonCollideBody(partB, partA, prevCollision));
                    }
                    // A,B皆为多边形
                    else {
                        collisions.push(this.SAT.polygonCollideBody(<Poly>partA, <Poly>partB, prevCollision));
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
    getPrevCollision(partA: Geometry, partB: Geometry, manifoldTable: ManifoldTable): Collision {
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