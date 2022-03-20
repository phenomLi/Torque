import { Vector, _tempVector1, _tempVector4 } from "../math/vector";
import { Axis, Vertices } from "../common/vertices";
import { Arcs } from "../common/arcs";
import { Collision } from "./manifold";
import { Contact, ContactConstraint } from "../constraint/contact";
import { EngineOpt } from "../core/engine";
import { Util } from "../common/util";
import { axesFilter } from "./axesFilter";
import { vClip, vClipCircle } from "./vClip";
import { Polygon } from "../body/polygon";
import { Circle } from "../body/circle";
import { Body, bodyType } from "../body/body";


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

export class NFSP_SAT {
    // 是否开启SAT加速
    private enableSATBoost: boolean = true;
    private reuseCollisionThreshold: number = 0.4;

    constructor(opt: EngineOpt) {
        Util.merge(this, opt);
    }

    /**
     * 多边形 - 多边形或圆形（geometry）
     * @param poly
     * @param geometry 
     * @param prevCollision
     */
    polygonCollideBody(poly: Polygon, geometry: Body, prevCollision: Collision): Collision {
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

            collision.prevContacts = collision.contacts;
            collision.isReuse = true;
        }
        // 若不能用缓存，则进行完整的测试
        else {
            if(prevCollision) {
                prevCollision.isReuse = false;
            }

            collision = new Collision();
            axes = this.getTestAxes(poly, geometry);
            minOverlap = this.detect(poly, geometry, axes);

            // 若发现两个刚体投影的重叠部分是负的，即表示它们没相交
            if(minOverlap === null) {
                collision.collide = false;
                return collision;
            }

            collision.partA = poly;
            collision.partB = geometry;
            collision.bodyA = poly.parent || poly;
            collision.bodyB = geometry.parent || geometry;

            let axis = minOverlap.axis,
                normal = this.reviseNormal(minOverlap.axis.value, poly, geometry);

            // 此处collision.axis与minOverlap.axis不能共享一个对象，因为collision.axis是根据不同碰撞而变化的，而minOverlap.axis不能变
            collision.axis.index = axis.index;
            collision.axis.value = axis.value;
            collision.axis.supportVertexIndex = axis.supportVertexIndex;
            collision.axis.oppositeVertexIndex = axis.oppositeVertexIndex;
            collision.axis.opposite = axis.opposite;
            collision.axis.origin = axis.origin;
            collision.axis.edge = axis.edge;

            collision.oppositeClosestIndex = minOverlap.oppositeClosestIndex;
            collision.normal = normal;
            collision.tangent = normal.nor();
        }

        // 计算碰撞点
        collision.contacts = this.findContacts(poly, geometry, minOverlap, collision.normal);
        collision.collide = true;

        return collision;
    }

    /**
     * 圆形 - 圆形
     * @param circleA 
     * @param circleB 
     * @param prevCollision
     */
    circleCollideCircle(circleA: Circle, circleB: Circle, prevCollision: Collision): Collision {
        let axis: Vector = circleA.position.sub(circleB.position, _tempVector1),
            overlaps: number = (circleA.radius + circleB.radius) - axis.len(),
            minOverlap: MinOverlap = {
                value: overlaps,
                axis: {
                    index: 0,
                    value: axis,
                    origin: null,
                    opposite: null,
                    edge: null,
                    supportVertexIndex: -1,
                    oppositeVertexIndex: -1
                },
                oppositeClosestIndex: -1
            },
            collision: Collision = new Collision(),
            normal: Vector;

        // 两圆心距离比两圆半径和要大，即没有发生碰撞
        if(overlaps < 0) {
            collision.collide = false;
            return collision;
        }

        normal = this.reviseNormal(axis, circleA, circleB).nol();
        minOverlap.axis.value = normal;

        collision.axis = minOverlap.axis;
        collision.partA = circleA;
        collision.partB = circleB;
        collision.bodyA = circleA.parent || circleA;
        collision.bodyB = circleB.parent || circleB;

        collision.normal = normal;
        collision.tangent = normal.nor();

        let position = circleB.position.loc(normal, circleB.radius - minOverlap.value / 2);

        collision.contacts = [ContactConstraint.create(null, position, minOverlap.value)];
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
    private detect(poly: Polygon, geometry: Body, axes: Axis[], prevOppositeClosestIndex?: number): MinOverlap {
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
    private getTestAxes(poly: Polygon, geometry: Body): Axis[] {
        let axes: Axis[],
            circleAxis: Axis;

        // 若geometry是圆形，计算一条动态轴
        if(geometry.type === bodyType.circle) {
            circleAxis = Arcs.getAxes(<Circle>geometry, poly);
        }

        // 如果开启了加速功能，首先进行轴过滤
        if(this.enableSATBoost) {
            axes = axesFilter(poly, geometry);

            if(circleAxis) {
                axes.push(circleAxis);
            }
        }
        else {
            let opposite = geometry.type === bodyType.circle? <Circle>geometry: (<Polygon>geometry).vertexList, 
                oppositeAxes: Axis[], i;

            axes = [];

            for(i = 0; i < poly.axes.length; i++) {
                if(poly.axes[i]) {
                    poly.axes[i].opposite = opposite;
                    axes.push(poly.axes[i]);
                }
            }

            if(circleAxis) {
                axes.push(circleAxis);
            }
            else {
                oppositeAxes = (<Polygon>geometry).axes;
                for(i = 0; i < oppositeAxes.length; i++) {
                    if(oppositeAxes[i]) {
                        oppositeAxes[i].opposite = poly.vertexList;
                        axes.push(oppositeAxes[i]);
                    }
                }
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
    private fullProjectionMethod(poly: Polygon, geometry: Body, axis: Axis, prevOppositeClosestIndex: number): {depth: number, oppositeClosestIndex: number} {
        let axisVector: Vector = axis.value,
            partA = poly.vertexList,
            partB = geometry.type === bodyType.polygon? (<Polygon>geometry).vertexList: <Circle>geometry,
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
    private selectiveProjectionMethod(poly: Polygon, geometry: Body, axis: Axis, oppositeClosestIndex?: number): {depth: number, oppositeClosestIndex: number} {
        let axisVector: Vector = axis.value,
            opposite = axis.opposite;
            
        // 该轴是圆形和多边形的动态轴
        if(opposite === null) {
            let projection1 = Vertices.projection(poly.vertexList, axisVector),
                projection2 = Arcs.projection(<Circle>geometry, axisVector);

            return {
                depth: Math.min(projection1.max - projection2.min, projection2.max - projection1.min),
                oppositeClosestIndex
            };
        }

        let supportVertex = axis.origin[axis.supportVertexIndex],
            supportProjection: number = supportVertex.dot(axisVector);

        // 对面是圆形
        if(opposite instanceof Circle) {
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
    private reviseNormal(normal: Vector, bodyA: Body, bodyB: Body): Vector {
        if (normal.dot(bodyB.position.sub(bodyA.position, _tempVector1)) > 0) {
            return normal.inv();
        } 

        return normal;
    }

    /**
     * 查看碰撞缓存是否可以复用
     * @param bodyA
     * @param bodyB
     * @param prevCollision 上一次的碰撞
     */
    private canReuseCollision(bodyA: Body, bodyB: Body, prevCollision: Collision): boolean {
        // 若上次碰撞的缓存存在
        if(prevCollision && bodyB.type !== bodyType.circle) {
            let parentA = bodyA.parent || bodyA,
                parentB = bodyB.parent || bodyB,
                motion = Math.sqrt(parentA.motion + parentB.motion);

            // 若上次碰撞判定为真，且当前碰撞对刚体趋于静止，可复用
            return prevCollision.collide && motion < this.reuseCollisionThreshold;
        }
        
        // 碰撞缓存不存在，直接判定无法复用
        return false;
    }

    /**
     * 求解碰撞点
     * @param geometry 
     * @param minOverlap
     * @param normal
     */
    private findContacts(polygon: Polygon, geometry: Body, minOverlap: MinOverlap, normal: Vector): Contact[] {
        if(geometry.type === bodyType.polygon) {
            return vClip(minOverlap);
        }
        else {
            return vClipCircle(polygon, <Circle>geometry, normal, minOverlap.value);
        }
    }
};


