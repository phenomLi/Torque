/**
 * 多边形刚体
 */

import { Body, BodyOpt, bodyType } from "./body";
import { VertexList, Poly, Vertices } from "../common/vertices";
import { Vector } from "../math/vector";




export interface PolygonOpt extends BodyOpt {
    vertices?: Vector[];
}



export class Polygon extends Body {
    // 多边形顶点（本地坐标）
    vertexList: VertexList;
    // 是否为凹多边形
    isConcave: boolean;

    poly: Poly;

    constructor(opt: PolygonOpt) {
        super(opt, bodyType.polygon);

        // 用户一开始便设置了旋转的情况
        if(this.rotation) {
            this.rotate(this.rotation, this.position);
        }
    }

    init(opt: PolygonOpt) {
        // 将向量转化为顶点
        if(opt.vertices) {
            this.vertexList = opt.vertices.slice(0);
        }

        // 顶点数 > 3才构成多边形
        if(this.vertexList && this.vertexList.length < 3) return;

        this.parts = this.getParts();
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
        return Vertices.getCentroid(this.vertexList);
    }

    getInertia(): number {
        return Vertices.getInertia(this.vertexList, this.mass, this.position);
    }

    translate(distance: Vector) {
        // 位移图形原点
        this.origin.x += distance.x;
        this.origin.y += distance.y;
        // 位移多边形顶点
        Vertices.translate(this.poly, distance);

        // 若多边形是凹多边形, 位移子多边形包围盒
        if(this.isConcave) {
            for(let i = 0; i < this.parts.length; i++) {
                let part: Poly = this.parts[i];

                part.centroid.x += distance.x;
                part.centroid.y += distance.y;
                part.bound.translate(distance);
            }
        }
    }

    rotate(radian: number, point: Vector) {
        // 旋转顶点
        Vertices.rotate(this.poly, radian, point);

        // 若多边形是凹多边形, 更新子多边形包围盒
        if(this.isConcave) {
            for(let i = 0; i < this.parts.length; i++) {
                let part: Poly = this.parts[i];

                part.centroid.rot(radian, point, part.centroid);
                part.bound.update(part.vertexList);
            }
        }
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
            this.isConcave = true;
            parts = Vertices.divide(poly);
        }
        // 若是凸多边形
        else {
            parts = [poly];
        }

        this.bound = poly.bound;
        this.poly = poly;

        return parts;
    }
}