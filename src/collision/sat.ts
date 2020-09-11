import { Vector, _tempVector1, _tempVector4 } from "../math/vector";
import { Poly, Vertices } from "../common/vertices";
import { Arcs, Arc } from "../common/arcs";
import { Collision, Geometry } from "./manifold";
import { VClosest } from "./vClosest";
import { Contact } from "../constraint/contact";
import { EngineOpt } from "../core/engine";
import { Util } from "../common/util";
import { axesFilter } from "./axesFilter";
import { Bound } from "./bound";



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
    polygonCollideBody(poly: Poly, geometry: Geometry, intersection: Bound, prevCollision: Collision): Collision {
        let canReuse: boolean = this.canReuseCollision(poly, geometry, prevCollision),
            collision: Collision = null,
            intersectionCenter: Vector = _tempVector4,
            intersectionPartA: Vector[] = poly.vertexList, 
            intersectionPartB: Vector[] | Arc = geometry instanceof Poly? geometry.vertexList: geometry,
            result = null,
            axes: Vector[];

        // 使用加速算法简化图形
        if(this.enableSATBoost) {
            let widthA = poly.bound.max.x - poly.bound.min.x,
                widthB = geometry.bound.max.x - poly.bound.min.x,
                biggerBound = widthA > widthB? poly.bound: geometry.bound,
                smallerBound = widthA > widthB? geometry.bound: poly.bound;

            if(!biggerBound.isContains(smallerBound)) {
                intersectionCenter.x = (intersection.min.x + intersection.max.x) / 2;
                intersectionCenter.y = (intersection.min.y + intersection.max.y) / 2;

                if(intersectionPartA.length >= this.polySimplificationThreshold) {
                    intersectionPartA = this.findIntersectionPart(intersectionPartA, intersection, intersectionCenter);
                }

                if(Array.isArray(intersectionPartB) && intersectionPartB.length >= this.polySimplificationThreshold) {
                    intersectionPartB = this.findIntersectionPart(intersectionPartB, intersection, intersectionCenter)
                }
            }
        }
        
        // 若能用缓存，使用缓存
        if(canReuse) {
            collision = prevCollision;
            result = this.detect(intersectionPartA, intersectionPartB, [collision.normal]);

            if(result.minOverlap < 0) {
                collision.collide = false;
                return collision;
            }
        }
        // 若不能用缓存，则进行完整的测试
        else {
            collision = new Collision();

            axes = this.getTestAxes(poly, geometry);
            result = this.detect(intersectionPartA, intersectionPartB, axes);

            // 若发现两个刚体投影的重叠部分是负的，即表示它们没相交
            if(result.minOverlap < 0) {
                collision.collide = false;
                return collision;
            }

            let normal = this.reviseNormal(axes[result.index], poly, geometry);

            collision.normal.x = normal.x;
            collision.normal.y = normal.y;
            collision.tangent = normal.nor();

            collision.partA = poly;
            collision.partB = geometry;
            collision.bodyA = poly.body;
            collision.bodyB = geometry.body;
        }

        collision.collide = true;

        // 计算碰撞点
        collision.contacts = this.findContacts(
            intersectionPartA,
            intersectionPartB,
            collision.normal, 
            result.minOverlap
        );

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
            collision: Collision = new Collision();

        // 两圆心距离比两圆半径和要大，即没有发生碰撞
        if(overlaps < 0) {
            collision.collide = false;
            return collision;
        }

        let normal = this.reviseNormal(axis, arcA, arcB).nol();

        collision.partA = arcA;
        collision.partB = arcB;
        collision.bodyA = arcA.body;
        collision.bodyB = arcB.body;

        collision.normal.x = normal.x;
        collision.normal.y = normal.y;
        collision.tangent = normal.nor().nol();

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
     * @param intersectionPartA 
     * @param intersectionPartB 
     * @param axes 
     */
    private detect(intersectionPartA: Vector[], intersectionPartB: Vector[] | Arc, axes: Vector[]): { minOverlap: number, index: number } {
        let minOverlap = Infinity,
            overlaps, 
            i, index;

        // 将两个刚体投影到所有轴上
        for(i = 0; i < axes.length; i++) {
            overlaps = this.getOverlaps(intersectionPartA, intersectionPartB, axes[i]);

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
    private getTestAxes(poly: Poly, geometry: Geometry): Vector[] {
        let axes: Vector[] = [],
            circleAxis: Vector;

        // 若geometry是多边形
        if(geometry instanceof Poly) {
            axes.push(...poly.axes);
            axes.push(...geometry.axes);
        }
        // 是圆形
        else {
            circleAxis = Arcs.getAxes(<Arc>geometry, poly);
            axes.push(circleAxis, ...poly.axes);
        }

        // 如果开启了加速功能，首先进行轴过滤
        if(this.enableSATBoost) {
            axes = axesFilter(poly, geometry);

            if(circleAxis) {
                axes.push(circleAxis);
            }
        }
        
        return axes;
    }

    /**
     * 求投影重叠
     * @param poly 
     * @param geometry
     * @param axis 投影轴
     * @param intersection
     * @param intersectionCenter
     */
    private getOverlaps(partA: Vector[], partB: Vector[] | Arc, axis: Vector): number {
        let projection1,
            projection2;

        // 若geometry是多边形
        if(Array.isArray(partB)) {
            projection1 = Vertices.projection(partA, axis),
            projection2 = Vertices.projection(partB, axis);
        }
        // 是圆形
        else { 
            projection1 = Vertices.projection(partA, axis),
            projection2 = Arcs.Projection(partB, axis);
        }

        return Math.min(projection1.max - projection2.min, projection2.max - projection1.min);
    }

    /**
     * 寻找图形在包围盒交集中的最小部分
     * @param vertexList 
     * @param intersection 
     * @param intersectionCenter 
     */
    private findIntersectionPart(vertexList: Vector[], intersection: Bound, intersectionCenter: Vector): Vector[] {
        let length = vertexList.length,
            index: number, 
            prev: number, 
            next: number,
            distance: number,
            minDistance: number = Infinity,
            minDistanceIndex: number,
            res: Vector[] = [];
    
        for(let i = 0; i < vertexList.length; i++) {
            let vertex = vertexList[i];
    
            if(intersection.contains(vertex)) {
                index = i;
                break;
            }
    
            distance = (vertex.x - intersectionCenter.x) ** 2 + (vertex.y - intersectionCenter.y) ** 2;
    
            if(distance < minDistance) {
                minDistance = distance;
                minDistanceIndex = i;
            }
        }
    
        if(index === undefined) {
            prev = minDistanceIndex > 0? minDistanceIndex - 1: length - 1;
            next = minDistanceIndex < length - 1? minDistanceIndex + 1: 0;
    
            res.push(vertexList[prev]);
            res.push(vertexList[minDistanceIndex]);
            res.push(vertexList[next]);
    
            return res;
        }
    
        res.push(vertexList[index]);
        prev = next = index;
    
        do {
            prev = prev > 0? prev - 1: length - 1;
            res.unshift(vertexList[prev]);
    
            if(!intersection.contains(vertexList[prev])) {
                break;
            }
        } while(prev !== index);
    
        do {
            next = next < length - 1? next + 1: 0;
    
            if(next === prev) {
                break;
            }
    
            res.push(vertexList[next]);
    
            if(!intersection.contains(vertexList[next])) {
                break;
            }
        } while(next !== index);
    
        return res;
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

        return normal.col();
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
    private findContacts(intersectionPartA: Vector[], intersectionPartB: Vector[] | Arc, normal: Vector, depth: number): Contact[] {
        if(Array.isArray(intersectionPartB)) {
            return VClosest(intersectionPartA, intersectionPartB, normal, depth);
            //return VClip(poly, geometry, normal, depth);
        }
        else {
            let vertex = (<Arc>intersectionPartB).centroid.loc(normal, (<Arc>intersectionPartB).radius - depth / 2);
            return [new Contact(vertex, depth)];
        }
    }
};


