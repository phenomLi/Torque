import { Vector } from "../math/vector";
import { Circle } from "../body/circle";
import { Axis, Poly, Vertices } from "./vertices";
import { Bound } from "../collision/bound";



// 一个圆形信息包
export class Arc {
    id: number;
    centroid: Vector;
    radius: number;
    body: Circle;
    bound: Bound;

    constructor(body: Circle, centroid: Vector, radius: number) {
        this.id = body.id;
        this.body = body;
        this.centroid = centroid;
        this.radius = radius;
        this.bound = Arcs.getBound(centroid, radius);
    }
}




export const Arcs = {
    /**
     * 创造圆形信息包
     * @param body 
     */
    create(body: Circle): Arc {
        return new Arc(body, body.position.col(), body.radius);
    },

    /**
     * 获取两个圆的圆心间的距离
     * @param circleA 
     * @param circleB 
     */
    distance(circleA: Arc, circleB: Arc): number {
        return circleA.centroid.sub(circleB.centroid).len();
    },

    /**
     * 获取圆形和顶点集间的轴
     * @param vertices 顶点信息
     */
    getAxes(circle: Arc, poly: Poly): Axis {
        let closestVertex = Vertices.getClosestVertex(circle.centroid, poly.vertexList);
        return {
            value: closestVertex.sub(circle.centroid).nol(),
            opposite: null,
            origin: null,
            supportVertexIndex: null,
            oppositeVertexIndex: null
        };
    },

    getBound(centroid: Vector, radius: number): Bound {
        let min = new Vector(centroid.x - radius, centroid.y - radius),
            max = new Vector(centroid.x + radius, centroid.y + radius);

        return new Bound(min, max);
    },

    /**
     * 获取圆形在给定轴上的投影
     * @param axis 
     */
    projection(circle: Arc, axis: Vector): {min: number, max: number} {
        let len = circle.centroid.pro(axis);

        return {
            min: len - circle.radius,
            max: len + circle.radius
        };
    },

    /**
     * 查看圆形是否包含某个点
     * @param circle 
     * @param point 
     */
    isContains(circle: Arc, point: Vector): boolean {
        return circle.radius*circle.radius - circle.centroid.sub(point).len_s() > 0; 
    },

    /**
     * 位移圆形
     * @param arc
     * @param distance 位移向量
     */
    translate(arc: Arc, distance: Vector) {
        arc.centroid.x += distance.x;
        arc.centroid.y += distance.y;

        // 位移包围盒
        arc.bound.translate(distance);
    }
};