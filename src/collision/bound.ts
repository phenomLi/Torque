import { Vector } from "../math/vector";
import { VertexList, Vertices } from "../common/vertices";


// AABB包围盒（速度扩展的）
export class Bound {
    min: Vector;
    max: Vector;

    constructor(min: Vector, max: Vector) {
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
        this.min = min;
        this.max = max;
    }

    /**
     * 位移包围盒
     * @param distance
     */
    translate(distance: Vector) {
        this.set(this.min.add(distance), this.max.add(distance));
    }

    /**
     * 更新包围盒（通常发生在刚体发生旋转，min和max都要重新计算）
     * @param vertexList 
     */
    update(vertexList: VertexList) {
        let range = Vertices.getRange(vertexList);
        this.set(range.min, range.max);
    }

    /**
     * 判断与另一个包围盒是否相交
     * @param bound 
     */
    isIntersect(bound: Bound): Boolean {
        return (this.min.x < bound.max.x && this.max.x > bound.min.x) && (this.min.y < bound.max.y && bound.min.y < this.max.y);
    }

    /**
     * 查看点是否在包围盒中
     * @param point 
     */
    isContains(point: Vector): boolean {
        return point.x > this.min.x && point.x < this.max.x && point.y > this.min.y && point.y < this.max.y;
    }
}