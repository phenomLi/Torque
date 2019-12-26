import { Bound } from "./bound";
import { Vector } from "../math/vector";

/**
 * 基于速度扩展的包围盒
 */



export class VelocityBound extends Bound {
    // 速度
    velocity: Vector;
    min: Vector;
    max: Vector;

    constructor(min: Vector, max: Vector, velocity: Vector) {
        super(min, max);
        this.velocity = velocity;
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
     * @param velocity 速度
     */
    set(min: Vector, max: Vector) {
        this.min = min;
        this.max = max;

       
        if (this.velocity.x > 0) {
            this.max.x += this.velocity.x;
        } else {
            this.min.x += this.velocity.x;
        }
        
        if (this.velocity.y > 0) {
            this.max.y += this.velocity.y;
        } else {
            this.min.y += this.velocity.y;
        }
    }
}