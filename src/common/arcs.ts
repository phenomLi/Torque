import { Vector } from "../math/vector";
import { Circle } from "../body/circle";
import { Axis, Vertices } from "./vertices";
import { Bound } from "./bound";
import { Polygon } from "../body/polygon";


const _tempDynamicAxis: Axis = {
    index: 0,
    value: null,
    opposite: null,
    origin: null,
    supportVertexIndex: null,
    oppositeVertexIndex: null,
    edge: null
};




export const Arcs = {
 
    /**
     * 获取两个圆的圆心间的距离
     * @param circleA 
     * @param circleB 
     */
    distance(circleA: Circle, circleB: Circle): number {
        return circleA.position.sub(circleB.position).len();
    },

    /**
     * 获取圆形和顶点集间的轴
     * @param vertices 顶点信息
     */
    getAxes(circle: Circle, poly: Polygon): Axis {
        let closestVertex = Vertices.getClosestVertex(circle.position, poly.vertexList);

        _tempDynamicAxis.value = closestVertex.sub(circle.position).nol();

        return _tempDynamicAxis;
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
    projection(circle: Circle, axis: Vector): {min: number, max: number} {
        let len = circle.position.pro(axis);

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
    isContains(circle: Circle, point: Vector): boolean {
        return circle.radius - Math.hypot(point.x - circle.position.x, point.y - circle.position.y) > 0; 
    }
};