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

    constructor(opt: CircleOpt) {
        super(opt, bodyType.circle);

        let arc = this.getArc();
        this.parts = [arc];
        this.bound = arc.bound;
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

    translate(distance: Vector) {
        // 位移图形原点
        this.origin.x += distance.x;
        this.origin.y += distance.y;

        // 位移圆形
        this.parts.map(part => Arcs.translate(part, distance));
    }
}