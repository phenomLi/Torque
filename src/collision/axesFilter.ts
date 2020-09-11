import { Poly, VertexList, Vertices } from "../common/vertices";
import { Vector, _tempVector1, _tempVector2 } from "../math/vector";
import { Geometry } from "./manifold";




export function axesFilter(geometryA: Geometry, geometryB: Geometry): Vector[] {
    const centroidVector = geometryA.centroid.sub(geometryB.centroid, _tempVector1),
          axes: Vector[] = [];

    if(geometryA instanceof Poly) {
        axes.push(...findClosestAxes(geometryA, centroidVector));
    }

    if(geometryB instanceof Poly) {
        axes.push(...findClosestAxes(geometryB, centroidVector));
    }

    return axes;
}


/**
 * @param poly 
 * @param centroidVector 
 */
function findClosestAxes(poly: Poly, centroidVector: Vector): Vector[] {
    let v: VertexList = poly.vertexList,
        axes: Vector[] = poly.axes,
        vertex: Vector,
        projection: number,
        minProjection: number = Infinity,
        index: number,
        res: Vector[] = [];

    for(let i = 0; i < v.length; i++) {
        vertex = v[i];
        projection = vertex.dot(centroidVector);

        if(projection < minProjection) {
            minProjection = projection;
            index = i;
        }
    }

    let prev = index > 0? index - 1: v.length - 1;

    if(axes[prev]) {
        res.push(axes[prev]);
    }

    res.push(axes[index]);

    return res;
}


