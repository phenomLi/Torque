/**
 * 多边形刚体
 */

import { Body, BodyOpt, bodyType } from "./body";
import { VertexList, Vertices, Axis } from "../common/vertices";
import { Vector, _tempVector4 } from "../math/vector";
import { Bound } from "../common/bound";




export interface PolygonOpt extends BodyOpt {
    vertices?: Vector[];
}



export class Polygon extends Body {
    // 多边形顶点（本地坐标）
    localVertexList: VertexList;
    // 多边形顶点（世界坐标）
    vertexList: VertexList;

    constructor(opt: PolygonOpt) {
        super(opt, bodyType.polygon);
    }

    beforeInitializeProperties(opt: PolygonOpt) {
        // 将向量转化为顶点
        if(opt.vertices) {
            this.localVertexList = opt.vertices;
        }

        // 顶点数 > 3才构成多边形
        if(this.localVertexList && this.localVertexList.length < 3) return;

        // 计算世界顶点坐标
        this.vertexList = this.getVertexList();
    }

    /**
     * 获取世界顶点坐标
     */
    getVertexList(): VertexList {
        return Vertices.transform2World(this.origin, this.localVertexList);
    }

    getArea(): number {
        return Math.abs(Vertices.getArea(this.vertexList));
    }

    getCentroid(): Vector {
        return Vertices.getCentroid(this.vertexList);
    }

    getInertia(position?: Vector): number {
        position = position || this.position;
        return Vertices.getInertia(this.vertexList, this.mass, position);
    }

    getAxes(): Axis[] {
        return Vertices.getAxes(this.vertexList);
    }

    getBound(): Bound {
        return Vertices.getBound(this.vertexList);
    }

    translate(dx: number, dy: number) {
        // 位移图形原点
        this.origin.x += dx;
        this.origin.y += dy;
        // 位移多边形顶点
        Vertices.translate(this.vertexList, dx, dy);

        // 位移包围盒
        this.bound.translate(dx, dy);
    }

    rotate(radian: number) {
        // 旋转顶点
        Vertices.rotate(this.vertexList, radian, this.rotateCenter);

        _tempVector4.x = this.rotateCenter.x - this.position.x;
        _tempVector4.y = this.rotateCenter.y - this.position.y;

        _tempVector4.x = 0;
        _tempVector4.y = 0;

        // 转动轴
        for(let i = 0; i < this.axes.length; i++) {
            this.axes[i] && this.axes[i].value.rot(radian, _tempVector4, this.axes[i].value);
        }

        // 更新包围盒
        this.bound.update(this.vertexList);
    }

    isContains(x: number, y: number): boolean {
        return Vertices.isContains(this.vertexList, new Vector(x, y));
    }
}