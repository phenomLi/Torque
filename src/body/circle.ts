import { Body, BodyOpt, bodyType } from "./body";
import { Vector } from "../math/vector";
import { Bound } from "../collision/bound";
import { Arc, Arcs } from "../common/arcs";

/**
 * 圆形刚体
 */


export interface CircleOpt extends BodyOpt {
    radius: number;
}


export class Circle extends Body {
    // 半径
    radius: number;
    arc: Arc;

    constructor(opt: CircleOpt) {
        super(opt, bodyType.circle);

        this.arc = this.getArc();
        this.parts = [this.arc];
        this.bound = this.arc.bound;
    }

    getArea(): number {
        return Math.PI*this.radius*this.radius;
    }

    getCentroid(): Vector {
        return this.origin.col();
    }

    getInertia(): number {
        return 0.5 * this.mass * Math.pow(this.radius, 2);
    }

    /**
     * 获取圆形信息包
     */
    getArc(): Arc {
        return Arcs.create(this);
    }

    translate(dx: number, dy: number) {
        // 位移图形原点
        this.origin.x += dx;
        this.origin.y += dy;

        // 位移圆形
        Arcs.translate(this.arc, dx, dy);
    }
}