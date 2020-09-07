import { Vector, _tempVector1 } from "../math/vector";
import { Poly, Vertices } from "../common/vertices";
import { Arcs, Arc } from "../common/arcs";
import { Collision, Geometry } from "./manifold";
import { VClosest } from "./vClosest";
import { Contact } from "../constraint/contact";
import { EngineOpt } from "../core/engine";
import { Util } from "../common/util";
import { axesFilter_closestVertices } from "./axesFilter_closestVertices";


/**
 * 分离轴算法
 * 参考：https://gamedevelopment.tutsplus.com/tutorials/collision-detection-using-the-separating-axis-theorem--gamedev-169
 */

export class SAT {
    private enableAxesFilter: boolean = true;
    private axesFilterThreshold: number = 8;

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
            result = null;
        
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
            let axes = this.filterAxes(poly, geometry);

            collision = new Collision();

            result = this.detect(poly, geometry, axes);

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

        collision.contacts = this.findContacts(poly, geometry, collision.normal, result.minOverlap);
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
     * @param poly 
     * @param geometry 
     * @param axes 
     */
    private detect(poly: Poly, geometry: Geometry, axes: Vector[]): { minOverlap: number, index: number } {
        let minOverlap = Infinity,
            overlaps, 
            len = axes.length,
            i, index;

        // 将两个刚体投影到所有轴上
        for(i = 0; i < len; i++) {
            overlaps = this.minOverlaps(poly, geometry, axes[i]);

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
     * 过滤有可能的轴和顶点集
     * @param poly 
     * @param geometry 
     */
    private filterAxes(poly: Poly, geometry: Geometry): Vector[] {
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

        // 如果开启了轴过滤功能并且两个图形得轴的数量大于给定的阈值，进行轴过滤
        if(this.enableAxesFilter && axes.length >= this.axesFilterThreshold) {
            axes = axesFilter_closestVertices(poly, geometry);
            // axes = axesFilter_intersection(poly, geometry, intersection);

            if(circleAxis) {
                axes.push(circleAxis);
            }
        }

        // console.log(axes);

        return Vertices.uniqueAxes(axes);
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
     * 求最小投影重叠
     * @param poly 
     * @param geometry
     * @param axis 投影轴
     */
    private minOverlaps(poly: Poly, geometry: Geometry, axis: Vector): number {
        let projection1,
            projection2;

        // 若geometry是多边形
        if(geometry instanceof Poly) {
            projection1 = Vertices.projection(poly.vertexList, axis),
            projection2 = Vertices.projection((<Poly>geometry).vertexList, axis);
        }
        // 是圆形
        else { 
            projection1 = Vertices.projection(poly.vertexList, axis),
            projection2 = Arcs.Projection((<Arc>geometry), axis);
        }

        return Math.min(projection1.max - projection2.min, projection2.max - projection1.min);
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
     * @param poly 
     * @param geometry 
     * @param normal 
     * @param depth 
     */
    private findContacts(poly: Poly, geometry: Geometry, normal: Vector, depth: number): Contact[] {
        if(geometry instanceof Poly) {
            return VClosest(poly, geometry, normal, depth);
            //return VClip(poly, geometry, normal, depth);
        }
        else {
            let vertex = (<Arc>geometry).centroid.loc(normal, (<Arc>geometry).radius - depth / 2);
            return [new Contact(vertex, depth)];
        }
    }
};


