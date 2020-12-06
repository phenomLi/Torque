import { Vector, _tempVector1, _tempVector2 } from "../math/vector";
import { VertexList, Vertices } from "./vertices";
import { Body } from "../body/body";





// AABB包围盒（速度扩展的）
export class Bound {
    min: Vector;
    max: Vector;

    constructor(min: Vector, max: Vector) {
        this.min = new Vector(0, 0);
        this.max = new Vector(0, 0);
        this.set(min, max);
    }

    /**
     * 设置包围盒范围
     * 
     *  min ----------|
     *   |            |
     *   |            |
     *   | --------- max
     * 
     * @param min 最小值
     * @param max 最大值
     */
    set(min: Vector, max: Vector) {
        this.min.x = min.x;
        this.min.y = min.y;
        this.max.x = max.x;
        this.max.y = max.y;
    }

    /**
     * 位移包围盒
     * @param dx
     * @param dy
     */
    translate(dx: number, dy: number) {
        this.min.x += dx;
        this.min.y += dy;
        this.max.x += dx;
        this.max.y += dy;
    }

    /**
     * 更新包围盒（通常发生在刚体发生旋转，min和max都要重新计算）
     * @param vertices
     */
    update(vertices: VertexList) {
        let maxX = -Infinity, maxY = -Infinity,
            minX = Infinity, minY = Infinity;

        for(let i = 0; i < vertices.length; i++) {
            let v = vertices[i];

            if(v.x < minX) {
                minX = v.x;
            }

            if(v.x > maxX) {
                maxX = v.x;
            }

            if(v.y < minY) {
                minY = v.y;
            }

            if(v.y > maxY) {
                maxY = v.y;
            }
        }

        this.min.x = minX;
        this.min.y = minY;
        this.max.x = maxX;
        this.max.y = maxY;
    }

    /**
     * 根据子包围盒更新包围盒
     * @param bodies
     */
    updateByBounds(bodies: Body[]) {
        let bound: Bound,
            maxX: number = -Infinity, 
            maxY: number = -Infinity,
            minX: number = Infinity,
            minY: number = Infinity; 

        for(let i = 0; i < bodies.length; i++) {
            bound = bodies[i].bound;
            
            if(bound.min.x < minX) {
                minX = bound.min.x;
            }

            if(bound.min.y < minY) {
                minY = bound.min.y;
            }

            if(bound.max.x > maxX) {
                maxX = bound.max.x;
            }

            if(bound.max.y > maxY) {
                maxY = bound.max.y;
            }
        }

        this.min.x = minX;
        this.min.y = minY;
        this.max.x = maxX;
        this.max.y = maxY;
    }

    /**
     * 两包围盒求交集
     * @param b 
     */
    intersect(b: Bound): Bound {
        let x, y, 
            maxX, maxY,
            overlapsX,
            overlapsY;

        x = Math.max(this.min.x, b.min.x);
        maxX = Math.min(this.max.x, b.max.x);
        
        y = Math.max(this.min.y, b.min.y);
        maxY = Math.min(this.max.y, b.max.y);

        overlapsX = maxX - x;
        overlapsY = maxY - y;
            
        if(overlapsX < 0 || overlapsY < 0) return null;

        _tempVector1.x = x;
        _tempVector1.y = y;
        _tempVector2.x = x + overlapsX;
        _tempVector2.y = y + overlapsY;

        return new Bound(_tempVector1, _tempVector2);
    }

    /**
     * 求多个包围盒的并集
     * @param arg 
     */
    union(bound: Bound): Bound {
        let min: Vector = _tempVector1,
            max: Vector = _tempVector2;

        min.x = Math.min(this.min.x, bound.min.x);
        min.y = Math.min(this.min.y, bound.min.y);
        max.x = Math.max(this.max.x, bound.max.x);
        max.y = Math.max(this.max.y, bound.max.y);

        return new Bound(_tempVector1, _tempVector2);
    }


    /**
     * 判断与另一个包围盒是否相交
     * @param bound 
     */
    isIntersect(bound: Bound): boolean {
        return (this.min.x <= bound.max.x && this.max.x >= bound.min.x) && (this.min.y <= bound.max.y && bound.min.y <= this.max.y);
    }

    /**
     * 求一个包围盒是否包含另一个包围盒
     * @param bound 
     */
    isContains(bound: Bound): boolean {
        return this.min.x <= bound.min.x &&
               this.min.y <= bound.min.y &&
               this.max.x >= bound.max.x &&
               this.max.y >= bound.max.y;
    }

    /**
     * 查看点是否在包围盒中
     * @param point 
     */
    contains(point: Vector): boolean {
        return point.x >= this.min.x && 
               point.x <= this.max.x && 
               point.y >= this.min.y && 
               point.y <= this.max.y;
    }
}




