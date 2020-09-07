import { Poly } from "../common/vertices";
import { Bound } from "./bound";
import { Vector, _tempVector4, _tempVector1, _tempVector2 } from "../math/vector";
import { Geometry } from "./manifold";


/**
 * @param geometryA 
 * @param geometryB 
 * @param intersection myMhd
 */
export function axesFilter_myMethod(geometryA: Geometry, geometryB: Geometry, intersection: Bound): Vector[] {
    let axes: Vector[] = [],
        center: Vector = _tempVector2, centerVector: Vector;

    center.x = (intersection.max.x + intersection.min.x) / 2;
    center.y = (intersection.max.y + intersection.min.y) / 2;

    if(geometryA instanceof Poly) {
        centerVector = center.sub(geometryA.centroid, _tempVector1);
        axes.push(...findAxisPair(geometryA, centerVector));
    }

    if(geometryB instanceof Poly) {
        centerVector = center.sub(geometryB.centroid, _tempVector1);
        axes.push(...findAxisPair(geometryB, centerVector.inv(centerVector)));
    }

    return sortAxes(axes, intersection);
}




/**
 * @param poly
 * @param centerVector
 */
function findAxisPair(poly: Poly, centerVector: Vector): [Vector, Vector] {
    let vertexList = poly.vertexList,
        axes = poly.axes,
        vertex: Vector,
        projection: number,
        maxProjection: number = -Infinity,
        index: number,
        last: number;

    for(let i = 0; i < vertexList.length; i++) {
        vertex = vertexList[i];

        projection = vertex.dot(centerVector);

        if(projection > maxProjection) {
            maxProjection = projection;
            index = i;
        }
    }

    last = index > 0? index - 1: vertexList.length - 1;

    return [axes[last], axes[index]];
}


/**
 * 
 * @param axes
 * @param intersection 
 */
function sortAxes(axes: Vector[], intersection: Bound): Vector[] {
    let width: number,
        height: number,
        ref: Vector = _tempVector4;

    width = intersection.max.x - intersection.min.x;
    height = intersection.max.y - intersection.min.y;

    if(width === height) {
        return axes;
    }

    if(width > height) {
        ref.x = 1;
        ref.y = 0;
    }
    else {
        ref.x = 0;
        ref.y = 1;
    }

    // axes.sort((a1, a2) => Math.abs(a2.dot(ref)) - Math.abs(a1.dot(ref)));

    return axes;
}





