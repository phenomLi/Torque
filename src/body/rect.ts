/**
 * 矩形刚体
 */

import { Polygon, PolygonOpt } from "./polygon";
import { Vector } from "../math/vector";
import { Poly, Vertices } from "../common/vertices";



export interface RectOpt extends PolygonOpt {
    width: number;
    height: number;
}


export class Rect extends Polygon {
    // 宽
    width: number;
    // 高
    height: number;

    constructor(opt: RectOpt) {
        super(opt);
    }

    getPoly(): Poly {
        let leftTop = this.origin.col(),
            rightTop = leftTop.add(new Vector(this.width, 0)),
            rightBottom = leftTop.add(new Vector(this.width, this.height)),
            leftBottom = leftTop.add(new Vector(0, this.height)),
            poly = Vertices.create(this, [leftTop, rightTop, rightBottom, leftBottom]);

            // 筛选矩形的轴
            poly.axes = Vertices.uniqueAxes(poly.axes);

        return poly;
    }

    getArea(): number {
        return this.width * this.height;
    }

    getCentroid(): Vector {
        return this.origin.add(new Vector(this.width / 2, this.height / 2));
    }

    getInertia(): number {
        return this.mass * (this.width * this.width + this.height * this.height) / 12;
    }
}