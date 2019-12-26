import { Vector } from "../math/vector";
import { Poly, VertexList, Vertices, Vertex } from "../common/vertices";
import { Arcs, Arc } from "../common/arcs";
import { Util } from "../common/util";
import { Collision, Contact, Geometry } from "./manifold";



/**
 * 分离轴算法
 * 参考：https://gamedevelopment.tutsplus.com/tutorials/collision-detection-using-the-separating-axis-theorem--gamedev-169
 */

export class SAT {

    /**
     * 多边形 - 多边形或圆形（geometry）
     * @param poly
     * @param geometry 
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

            collision.normal = this.reviseNormal(axes[result.index], poly, geometry);
            collision.partA = poly;
            collision.partB = geometry;
            collision.bodyA = poly.body;
            collision.bodyB = geometry.body;
            collision.tangent = collision.normal.nor();
        }

        collision.depth = result.minOverlap;
        collision.penetration = collision.normal.scl(collision.depth);
        collision.contacts = this.findContacts(poly, geometry, collision.normal, collision.depth);
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
        let axis: Vector = arcA.center.sub(arcB.center),
            overlaps: number = 0,
            collision: Collision = null;
        
        collision = new Collision();
        axis = arcA.center.sub(arcB.center);
        overlaps = (arcA.radius + arcB.radius) - axis.len();

        // 两圆心距离比两圆半径和要大，即没有发生碰撞
        if(overlaps < 0) {
            collision.collide = false;
            return collision;
        }

        collision.partA = arcA;
        collision.partB = arcB;
        collision.bodyA = arcA.body;
        collision.bodyB = arcB.body;
        collision.normal = this.reviseNormal(axis, arcA, arcB).nol();
        collision.tangent = collision.normal.nor().nol();
        collision.depth = overlaps;
        collision.penetration = collision.normal.scl(overlaps);
        collision.contacts = [new Contact(new Vertex(arcA.center.loc(collision.normal.inv(), arcA.radius - overlaps/2)))];
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
     * @param collision 
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
        let axes = [],
            partsA: Geometry[] = poly.parts,
            partsB: Geometry[] = null,
            partA: Geometry,
            partB: Geometry,
            i, j;

        // 若geometry是多边形
        if(geometry instanceof Poly) {
            partsB = geometry.parts;

            if(partsA.length && partsB.length) {
                for(i = 0; i < partsA.length; i++) {
                    partA = <Poly>partsA[i];
                    for(j = 0; j < partsB.length; j++) {
                        partB = <Poly>partsB[j];

                        if(partA.bound.isIntersect(partB.bound)) {
                            axes = axes.concat(partA.axes);
                            axes = axes.concat(partB.axes);
                        }
                    }
                }
            }
        }
        // 是圆形
        else {
            for(i = 0; i < partsA.length; i++) {
                partA = <Poly>partsA[i];
                if(partsA[i].bound.isIntersect(geometry.bound)) {
                    axes = axes.concat(partA.axes);
                }
            }

            axes = axes.concat(Arcs.getAxes(<Arc>geometry, poly));
        }

        return Vertices.uniqueAxes(axes);
    }

 
    /**
     * 修正碰撞法线方向，使其始终背向刚体A
     * @param normal 要修正的法线
     * @param bodyA 刚体A
     * @param bodyB 刚体B
     */
    private reviseNormal(normal: Vector, geometryA: Geometry, geometryB: Geometry): Vector {
        if (normal.dot(geometryB.center.sub(geometryA.center)) > 0) {
            return normal.inv();
        } 

        return normal;
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
     * 寻找碰撞点
     * @param poly 
     * @param geometry 
     * @param collision 
     */
    private findContacts(poly: Poly, geometry: Geometry, normal: Vector, depth: number): Contact[] {
        let potentialcContactsA: Vertex[] = [],
            potentialcContactsB: Vertex[] = [],
            contacts: Contact[] = [],
            normalInv = normal.inv(),
            i;

        if(geometry instanceof Poly) {
            let vertexListA = poly.vertexList,
                vertexListB = (<Poly>geometry).vertexList;

            // 寻找多边形A最接近多边形B的两个点
            potentialcContactsA = this.orderProjectionVertexInNormalDirection(vertexListA, normal);

            for(i = 0; i < potentialcContactsA.length; i++) {
                // 查看这些点是否在多边形B内部
                if(Vertices.isContains(vertexListB, potentialcContactsA[i])) {
                    // 如果是，则这个点记为一个碰撞点
                    contacts.push(new Contact(potentialcContactsA[i]));
                } 
                else {
                    if(i !== 0) break;
                }
            }

            if(contacts.length >= 2) return contacts;

            // 同理上面
            potentialcContactsB = this.orderProjectionVertexInNormalDirection(vertexListB, normalInv);

            for(i = 0; i < potentialcContactsB.length; i++) {
                if(Vertices.isContains(vertexListA, potentialcContactsB[i])) {
                    contacts.push(new Contact(potentialcContactsB[i]));
                }
                else {
                    if(i !== 0) break;
                } 
            }

            // 边界情况：即没有碰撞点的情况
            if(contacts.length < 1) {
                contacts.push(new Contact(potentialcContactsA[0]));
            }
        }
        else {
            contacts.push(new Contact(new Vertex((<Arc>geometry).center.loc(normal, (<Arc>geometry).radius - depth/2))));
        }

        return contacts;
    }

    /**
     * 将顶点按照在法线上投影的大小顺序排序
     * @param vertexList 
     * @param normal 
     */
    private orderProjectionVertexInNormalDirection(vertexList: VertexList, normal: Vector): Vertex[] {
        return vertexList.slice(0).sort((vertexA, vertexB) => vertexA.dot(normal) - vertexB.dot(normal));
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
                motion = bodyA.speed**2 + bodyA.angularSpeed**2 + bodyB.speed**2 + bodyB.angularSpeed**2;

            // 若上次碰撞判定为真，且当前碰撞对刚体趋于静止，可复用
            return prevCollision.collide && motion < 0.011;
        }
        
        // 碰撞缓存不存在，直接判定无法复用
        return false;
    }
};


