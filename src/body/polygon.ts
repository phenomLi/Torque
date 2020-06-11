/**
 * 多边形刚体
 */

import { Body, BodyOpt, bodyType } from "./body";
import { VertexList, Poly, Vertices, Vertex } from "../common/vertices";
import { Vector } from "../math/vector";




export interface PolygonOpt extends BodyOpt {
    vertices?: Vector[];
}



export class Polygon extends Body {
    // 多边形顶点（本地坐标）
    private vertexList: VertexList;
    // 是否为凹多边形
    isConcave: boolean

    constructor(opt: PolygonOpt, type?: number) {
        super(opt, type || bodyType.polygon);

        // 将向量转化为顶点
        if(opt.vertices) {
            this.vertexList = opt.vertices.map(v => new Vertex(v));
        }

        // 顶点数 > 3才构成多边形
        if(this.vertexList && this.vertexList.length < 3) return;

        this.parts = this.getParts();

        // 用户一开始便设置了旋转的情况
        if(this.rotation) {
            this.rotate(this.rotation, this.position);
        }
    }

    /**
     * 获取世界坐标
     */
    getPoly(): Poly {
        return Vertices.create(this, Vertices.transform2World(this.origin, this.vertexList));
    }

    getArea(): number {
        return Math.abs(Vertices.getArea(this.vertexList));
    }

    getCentroid(): Vector {
        return Vertices.getCentroid(this.vertexList).add(this.origin);
    }

    getInertia(): number {
        return Vertices.getInertia(this.vertexList, this.mass);
    }

    translate(distance: Vector) {
        // 位移图形原点
        this.origin.x += distance.x;
        this.origin.y += distance.y;
        // 位移多边形顶点
        this.parts.map((part: Poly) => Vertices.translate(part, distance));
    }

    rotate(angle: number, point: Vector) {
        // 旋转顶点
        this.parts.map((part: Poly) => Vertices.rotate(part, angle, point));
    }


    /**
     * 分割多边形
     * 若是凹多边形，则先分割为多个凸多边形，然后凸多边形再分割为小三角形
     * 若是凸多边形，则直接分割为小三角形
     */
    getParts(): Poly[] {
        let parts = [],
            poly = this.getPoly();

        // 若是凹多边形
        if(Vertices.isConcave(poly.vertexList)) {
            parts = Vertices.divide(poly);
            return parts;
        }
        // 若是凸多边形
        else {
            parts = [poly];
        }

        parts.map(part => {
            part.parts = Vertices.decomposition(part);
        });

        this.bound = poly.bound;

        return parts;
    }
}