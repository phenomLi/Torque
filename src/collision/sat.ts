import { Vector, _tempVector1, _tempVector4 } from "../math/vector";
import { Axis, Poly, Vertices } from "../common/vertices";
import { Arcs, Arc } from "../common/arcs";
import { Collision, Geometry } from "./manifold";
import { Contact } from "../constraint/contact";
import { EngineOpt } from "../core/engine";
import { Util } from "../common/util";
import { axesFilter } from "./axesFilter";
import { VClip } from "./vClip";


// 投影重叠类型
export type MinOverlap = {
    value: number;
    axis: Axis;
    oppositeClosestIndex: number;
};


/**
 * 分离轴算法
 * 参考：https://gamedevelopment.tutsplus.com/tutorials/collision-detection-using-the-separating-axis-theorem--gamedev-169
 */

export class SAT {
    // 是否开启SAT加速
    private enableSATBoost: boolean = true;

    constructor(opt: EngineOpt) {
        Util.merge(this, opt);
    }

    /**
     * 多边形 - 多边形或圆形（geometry）
     * @param poly
     * @param geometry 
     * @param prevCollision
     */
    polygonCollideBody(poly: Poly, geometry: Geometry, prevCollision: Collision): Collision {
        let canReuse: boolean = this.canReuseCollision(poly, geometry, prevCollision),
            collision: Collision = null,
            minOverlap: MinOverlap,
            axes: Axis[];

        // 若能用缓存，使用缓存
        if(canReuse) {
            collision = prevCollision;
            minOverlap = this.detect(poly, geometry, [collision.axis], collision.oppositeClosestIndex);

            if(minOverlap === null) {
                collision.collide = false;
                return collision;
            }

            let prevContacts = collision.contacts;
            for(let i = 0; i < prevContacts.length; i++) {
                prevContacts[i].depth = minOverlap.value;
            }
        }
        // 若不能用缓存，则进行完整的测试
        else {
            collision = new Collision();
            axes = this.getTestAxes(poly, geometry);
            minOverlap = this.detect(poly, geometry, axes);

            // 若发现两个刚体投影的重叠部分是负的，即表示它们没相交
            if(minOverlap === null) {
                collision.collide = false;
                return collision;
            }

            let axis = minOverlap.axis,
                normal = this.reviseNormal(minOverlap.axis.value, poly, geometry);

            // 此处collision.axis与minOverlap.axis不能共享一个对象，因为collision.axis是根据不同碰撞而变化的，而minOverlap.axis不能变
            collision.axis.value = axis.value;
            collision.axis.supportVertexIndex = axis.supportVertexIndex;
            collision.axis.oppositeVertexIndex = axis.oppositeVertexIndex;
            collision.axis.opposite = axis.opposite;
            collision.axis.origin = axis.origin;
            collision.axis.edge = axis.edge;

            collision.oppositeClosestIndex = minOverlap.oppositeClosestIndex;
            collision.normal = normal;
            collision.tangent = normal.nor();

            collision.partA = poly;
            collision.partB = geometry;
            collision.bodyA = poly.body;
            collision.bodyB = geometry.body;

            // 计算碰撞点
            collision.contacts = this.findContacts(poly, geometry, normal, minOverlap);
        }

        collision.collide = true;

        return collision;
    }

    /**
     * 圆形 - 圆形
     * @param circleA 
     * @param circleB 
     * @param prevCollision
     */
    circleCollideCircle(arcA: Arc, arcB: Arc, prevCollision: Collision): Collision {
        let axis: Vector = arcA.centroid.sub(arcB.centroid, _tempVector1),
            overlaps: number = (arcA.radius + arcB.radius) - axis.len(),
            collision: Collision = new Collision(),
            normal: Vector;

        // 两圆心距离比两圆半径和要大，即没有发生碰撞
        if(overlaps < 0) {
            collision.collide = false;
            return collision;
        }

        normal = this.reviseNormal(axis, arcA, arcB).nol();

        collision.axis = null;
        collision.partA = arcA;
        collision.partB = arcB;
        collision.bodyA = arcA.body;
        collision.bodyB = arcB.body;

        collision.normal = normal;
        collision.tangent = normal.nor();

        let position = arcA.centroid.loc(normal.inv(_tempVector1), arcA.radius - overlaps / 2);

        collision.contacts = [new Contact(position, overlaps)];
        collision.collide = true;

        return collision;
    }



    /**
     * --------------------------------------------------------------------------------------------------
     */

    /**
     * 进行分离轴检测
     * @param poly 
     * @param geometry 
     * @param axes 
     * @param prevOppositeClosestIndex
     */
    private detect(poly: Poly, geometry: Geometry, axes: Axis[], prevOppositeClosestIndex?: number): MinOverlap {
        let minOverlap: number = Infinity,
            oppositeClosestIndex: number,
            getOverlaps = this.enableSATBoost? this.selectiveProjectionMethod: this.fullProjectionMethod,
            overlaps: {depth: number, oppositeClosestIndex: number}, 
            i, index;

        // 将两个刚体投影到所有轴上
        for(i = 0; i < axes.length; i++) {
            if(axes[i] === null) {
                continue;
            }

            overlaps = getOverlaps(poly, geometry, axes[i], prevOppositeClosestIndex);

            if(overlaps.depth < 0) {
                return null;
            }

            if(overlaps.depth < minOverlap) {
                minOverlap = overlaps.depth;
                oppositeClosestIndex = overlaps.oppositeClosestIndex;
                index = i;
            }
        }

        return {
            value: minOverlap,
            oppositeClosestIndex,
            axis: axes[index],
        }
    } 


    /**
     * 获取测试轴
     * @param poly 
     * @param geometry 
     */
    private getTestAxes(poly: Poly, geometry: Geometry): Axis[] {
        let axes: Axis[],
            circleAxis: Axis;

        // 若geometry是圆形，计算一条动态轴
        if(geometry instanceof Arc) {
            circleAxis = Arcs.getAxes(<Arc>geometry, poly);
        }

        // 如果开启了加速功能，首先进行轴过滤
        if(this.enableSATBoost) {
            axes = axesFilter(poly, geometry);

            if(circleAxis) {
                axes.push(circleAxis);
            }
        }
        else {
            axes = [];

            axes.push(...poly.axes);

            if(circleAxis) {
                axes.push(circleAxis);
            }
            else {
                axes.push(...(<Poly>geometry).axes);
            }
        }
        
        return axes;
    }

    /**
     * 全投影法（传统）
     * @param poly 
     * @param geometry 
     * @param axis 
     */
    private fullProjectionMethod(poly: Poly, geometry: Geometry, axis: Axis): {depth: number, oppositeClosestIndex: number} {
        let axisVector: Vector = axis.value,
            partA = poly.vertexList,
            partB = geometry instanceof Poly? geometry.vertexList: geometry,
            projection1,
            projection2;

        // 若geometry是多边形
        if(Array.isArray(partB)) {
            projection1 = Vertices.projection(partA, axisVector),
            projection2 = Vertices.projection(partB, axisVector);
        }
        // 是圆形
        else { 
            projection1 = Vertices.projection(partA, axisVector),
            projection2 = Arcs.projection(partB, axisVector);
        }

        return {
            depth: Math.min(projection1.max - projection2.min, projection2.max - projection1.min),
            oppositeClosestIndex: -1
        };
    }

    /**
     * 选择投影法
     * @param poly 
     * @param geometry 
     * @param axis 
     * @param oppositeClosestIndex
     */
    private selectiveProjectionMethod(poly: Poly, geometry: Geometry, axis: Axis, oppositeClosestIndex?: number): {depth: number, oppositeClosestIndex: number} {
        let axisVector: Vector = axis.value,
            opposite = axis.opposite;
            
        // 该轴是圆形和多边形的动态轴
        if(opposite === null) {
            let projection1 = Vertices.projection(poly.vertexList, axisVector),
                projection2 = Arcs.projection(<Arc>geometry, axisVector);

            return {
                depth: Math.min(projection1.max - projection2.min, projection2.max - projection1.min),
                oppositeClosestIndex
            };
        }

        let supportVertex = axis.origin[axis.supportVertexIndex],
            supportProjection: number = supportVertex.dot(axisVector);

        // 对面是圆形
        if(opposite instanceof Arc) {
            let circleProjection = Arcs.projection(opposite, axisVector);
            return {
                depth: supportProjection - circleProjection.min,
                oppositeClosestIndex
            };
        }
        
        let maxOverlap: number = -Infinity;

        // 若最近点没有缓存，执行爬山法重新计算最近点
        if(oppositeClosestIndex === undefined) {
            let oppositeIndex = axis.oppositeVertexIndex,
                prev: number, next: number, 
                seekPrev: boolean = true,
                seekNext: boolean = true,
                lastPrevPro: number,
                lastNextPro: number,
                projection: number;

            projection = opposite[oppositeIndex].dot(axisVector);
            prev = next = oppositeIndex;
            lastPrevPro = lastNextPro = projection;
            oppositeClosestIndex = oppositeIndex;

            do {
                if(!seekPrev && !seekNext) {
                    break;
                } 
    
                if(seekPrev) {
                    prev = prev > 0? prev - 1: opposite.length - 1;
                    projection = opposite[prev].dot(axisVector);
    
                    if(projection > lastPrevPro) {
                        seekPrev = false;
                        prev = (prev + 1) % opposite.length;
                    }
                    else {
                        oppositeClosestIndex = prev;
                        lastPrevPro = projection;
                    }
                }
    
                if(seekNext) {
                    next = (next + 1) % opposite.length;
                    projection = opposite[next].dot(axisVector);
    
                    if(projection > lastNextPro) {
                        seekNext = false;
                        next = next > 0? next - 1: opposite.length - 1;
                    }
                    else {
                        oppositeClosestIndex = next;
                        lastNextPro = projection;
                    }
                }
    
            } while(prev !== next);
        }

        maxOverlap = supportProjection - opposite[oppositeClosestIndex].dot(axisVector);

        return {
            depth: maxOverlap,
            oppositeClosestIndex
        };
    }

    /**
     * 修正碰撞法线方向，使其始终背向刚体A
     * @param normal 要修正的法线
     * @param bodyA 刚体A
     * @param bodyB 刚体B
     */
    private reviseNormal(normal: Vector, geometryA: Geometry, geometryB: Geometry): Vector {
        if (normal.dot(geometryB.centroid.sub(geometryA.centroid, _tempVector1)) > 0) {
            return normal.inv();
        } 

        return normal;
    }

    /**
     * 查看碰撞缓存是否可以复用
     * @param geometryA
     * @param geometryB
     * @param prevCollision 上一次的碰撞
     */
    private canReuseCollision(geometryA: Geometry, geometryB: Geometry, prevCollision: Collision): boolean {
        // 若上次碰撞的缓存存在
        if(prevCollision) {
            let bodyA = geometryA.body,
                bodyB = geometryB.body,
                motion = Math.sqrt(bodyA.motion + bodyB.motion);

            // 若上次碰撞判定为真，且当前碰撞对刚体趋于静止，可复用
            return prevCollision.collide && motion < 0.05;
        }
        
        // 碰撞缓存不存在，直接判定无法复用
        return false;
    }

    /**
     * 求解碰撞点
     * @param poly 
     * @param geometry 
     * @param normal
     * @param minOverlap
     */
    private findContacts(poly: Poly, geometry: Geometry, normal: Vector, minOverlap: MinOverlap): Contact[] {
        if(geometry instanceof Poly) {
            // return VClosest(poly.vertexList, geometry.vertexList, normal, minOverlap);
            return VClip(minOverlap);
        }
        else {
            let vertex = geometry.centroid.loc(minOverlap.axis.value, geometry.radius - minOverlap.value / 2);
            return [new Contact(vertex, minOverlap.value)];
        }
    }
};


