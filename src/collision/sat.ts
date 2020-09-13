import { Vector, _tempVector1, _tempVector4 } from "../math/vector";
import { Axis, Poly, VertexList, Vertices } from "../common/vertices";
import { Arcs, Arc } from "../common/arcs";
import { Collision, Geometry } from "./manifold";
import { VClosest } from "./vClosest";
import { Contact } from "../constraint/contact";
import { EngineOpt } from "../core/engine";
import { Util } from "../common/util";
import { axesFilter } from "./axesFilter";



/**
 * 分离轴算法
 * 参考：https://gamedevelopment.tutsplus.com/tutorials/collision-detection-using-the-separating-axis-theorem--gamedev-169
 */

export class SAT {
    // 是否开启SAT加速
    private enableSATBoost: boolean = true;
    private polySimplificationThreshold: number = 5;

    constructor(opt: EngineOpt) {
        Util.merge(this, opt);
    }

    /**
     * 多边形 - 多边形或圆形（geometry）
     * @param poly
     * @param geometry 
     * @param intersection
     * @param prevCollision
     */
    polygonCollideBody(poly: Poly, geometry: Geometry, prevCollision: Collision): Collision {
        let canReuse: boolean = this.canReuseCollision(poly, geometry, prevCollision),
            collision: Collision = null,
            result = null,
            axes: Axis[];

        // 若能用缓存，使用缓存
        if(canReuse) {
            collision = prevCollision;
            result = this.detect(poly, geometry, [collision.normal]);

            if(result.minOverlap < 0) {
                collision.collide = false;
                return collision;
            }
        }
        // 若不能用缓存，则进行完整的测试
        else {
            collision = new Collision();
            axes = this.getTestAxes(poly, geometry);
            result = this.detect(poly, geometry, axes);

            // 若发现两个刚体投影的重叠部分是负的，即表示它们没相交
            if(result.minOverlap < 0) {
                collision.collide = false;
                return collision;
            }

            let normal = this.reviseNormal(axes[result.index], poly, geometry);

            collision.normal = normal;
            collision.tangent = normal.value.nor();

            collision.partA = poly;
            collision.partB = geometry;
            collision.bodyA = poly.body;
            collision.bodyB = geometry.body;
        }

        collision.collide = true;

        // 计算碰撞点
        collision.contacts = this.findContacts(poly, geometry, collision.normal, result.minOverlap);

        return collision;
    }

    /**
     * 圆形 - 圆形
     * @param circleA 
     * @param circleB 
     * @param prevCollision
     */
    circleCollideCircle(arcA: Arc, arcB: Arc, prevCollision: Collision): Collision {
        let axis: Axis = {
                value: arcA.centroid.sub(arcB.centroid, _tempVector1),
                opposite: null,
                origin: null,
                supportVertexIndex: null,
                oppositeVertexIndex: null
            },
            overlaps: number = (arcA.radius + arcB.radius) - axis.value.len(),
            collision: Collision = new Collision(),
            normal: Axis;

        // 两圆心距离比两圆半径和要大，即没有发生碰撞
        if(overlaps < 0) {
            collision.collide = false;
            return collision;
        }

        normal = this.reviseNormal(axis, arcA, arcB);
        normal.value = normal.value.nol();

        collision.partA = arcA;
        collision.partB = arcB;
        collision.bodyA = arcA.body;
        collision.bodyB = arcB.body;

        collision.normal = normal;
        collision.tangent = normal.value.nor();

        let position = arcA.centroid.loc(normal.value.inv(_tempVector1), arcA.radius - overlaps / 2);

        collision.contacts = [new Contact(position, overlaps)];
        collision.collide = true;

        return collision;
    }



    /**
     * --------------------------------------------------------------------------------------------------
     */

    /**
     * 进行分离轴检测
     * @param intersectionPartA 
     * @param intersectionPartB 
     * @param axes 
     */
    private detect(poly: Poly, geometry: Geometry, axes: Axis[]): { minOverlap: number, index: number } {
        let minOverlap = Infinity,
            overlaps, 
            getOverlaps = this.enableSATBoost? this.getOverlaps_boost: this.getOverlaps,
            // getOverlaps = this.getOverlaps,
            i, index;

        // 将两个刚体投影到所有轴上
        for(i = 0; i < axes.length; i++) {
            overlaps = getOverlaps(poly, geometry, axes[i]);

            if(overlaps < 0) {
                return {
                    minOverlap: overlaps, 
                    index
                }
            }

            if(overlaps < minOverlap) {
                minOverlap = overlaps;
                index = i;
            }
        }

        return {
            minOverlap, 
            index
        }
    } 


    /**
     * 获取测试轴
     * @param poly 
     * @param geometry 
     * @param intersection
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
     * 求投影重叠（常规方法）
     * @param poly 
     * @param geometry
     * @param axis 投影轴
     * @param intersection
     * @param intersectionCenter
     */
    private getOverlaps(poly: Poly, geometry: Geometry, axis: Axis): number {
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

        return Math.min(projection1.max - projection2.min, projection2.max - projection1.min);
    }

    /**
     * 求投影重叠（加速方法）
     * @param poly 
     * @param geometry 
     * @param axis 
     */
    private getOverlaps_boost(poly: Poly, geometry: Geometry, axis: Axis): number {
        let axisVector: Vector = axis.value,
            opposite = axis.opposite;
            
        // 该轴是圆形和多边形的动态轴
        if(opposite === null) {
            let projection1 = Vertices.projection(poly.vertexList, axisVector),
                projection2 = Arcs.projection(<Arc>geometry, axisVector);

            return Math.min(projection1.max - projection2.min, projection2.max - projection1.min);
        }

        let supportVertex = axis.origin[axis.supportVertexIndex],
            supportProjection: number = supportVertex.dot(axisVector);

        // 对面是圆形
        if(opposite instanceof Arc) {
            let circleProjection = Arcs.projection(opposite, axisVector);
            return supportProjection - circleProjection.min;
        }
        
        let oppositeIndex = axis.oppositeVertexIndex,
            maxOverlap: number = -Infinity,
            prev: number, next: number, 
            seekPrev: boolean = true,
            seekNext: boolean = true,
            lastPrevPro: number,
            lastNextPro: number,
            projection: number,
            overlap: number;

        prev = next = oppositeIndex;
        projection = opposite[oppositeIndex].dot(axisVector);
        lastPrevPro = lastNextPro = projection;
        overlap = supportProjection - projection; 
        maxOverlap = overlap;
        
        do {
            if(!seekPrev && !seekNext) {
                break;
            } 

            if(seekPrev) {
                prev = prev > 0? prev - 1: opposite.length - 1;
                projection = opposite[prev].dot(axisVector);
                overlap = supportProjection - projection;

                if(projection > lastPrevPro) {
                    seekPrev = false;
                }
                else {
                    if(overlap > maxOverlap) {
                        maxOverlap = overlap;
                    }
    
                    lastPrevPro = projection;
                }
            }

            if(seekNext) {
                next = next < opposite.length - 1? next + 1: 0;
                projection = opposite[next].dot(axisVector);
                overlap = supportProjection - projection;

                if(projection > lastNextPro) {
                    seekNext = false;
                }
                else {
                    if(overlap > maxOverlap) {
                        maxOverlap = overlap;
                    }
    
                    lastNextPro = projection;
                }
            }

        } while(prev !== next);

        return maxOverlap;
    }

    /**
     * 修正碰撞法线方向，使其始终背向刚体A
     * @param normal 要修正的法线
     * @param bodyA 刚体A
     * @param bodyB 刚体B
     */
    private reviseNormal(normal: Axis, geometryA: Geometry, geometryB: Geometry): Axis {
        if (normal.value.dot(geometryB.centroid.sub(geometryA.centroid, _tempVector1)) > 0) {
            return {
                ...normal,
                value: normal.value.inv(),
            };
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
     * 寻找碰撞点
     * @param intersectionPartA 
     * @param intersectionPartB 
     * @param normal 
     * @param depth 
     */
    private findContacts(poly: Poly, geometry: Geometry, normal: Axis, depth: number): Contact[] {
        if(geometry instanceof Poly) {
            return VClosest(poly.vertexList, geometry.vertexList, normal, depth);
            //return VClip(poly, geometry, normal, depth);
        }
        else {
            let vertex = geometry.centroid.loc(normal.value, geometry.radius - depth / 2);
            return [new Contact(vertex, depth)];
        }
    }
};


