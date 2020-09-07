import { Geometry } from "./manifold";
import { Poly, VertexList } from "../common/vertices";
import { Vector, _tempVector1 } from "../math/vector";




export function axesFilter_closestVertices(geometryA: Geometry, geometryB: Geometry): Vector[] {
    const centroidVector = geometryA.centroid.sub(geometryB.centroid, _tempVector1),
          axes: Vector[] = [];

    if(geometryA instanceof Poly) {
        axes.push(...findAxisPair(geometryA, centroidVector));
    }

    if(geometryB instanceof Poly) {
        axes.push(...findAxisPair(geometryB, centroidVector.inv(_tempVector1)));
    }

    return axes;
}


/**
 * @param poly 
 * @param centroidVector 
 */
function findAxisPair(poly: Poly, centroidVector: Vector): Vector[] {
    let v: VertexList = poly.vertexList,
        axes: Vector[] = poly.axes,
        vertex: Vector,
        projection: number,
        minProjection: number = Infinity,
        index: number,
        last: number,
        res: Vector[] = [];

    for(let i = 0; i < v.length; i++) {
        vertex = v[i];
        projection = vertex.dot(centroidVector);

        if(projection < minProjection) {
            minProjection = projection;
            index = i;
        }
    }

    last = index > 0? index - 1: v.length - 1;

    if(axes[last]) {
        res.push(axes[last]);
    }

    if(axes[index]) {
        res.push(axes[index]);
    }

    return res;
}



