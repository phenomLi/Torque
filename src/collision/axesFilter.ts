import { Axis, Poly, VertexList } from "../common/vertices";
import { Vector, _tempVector1, _tempVector2, _tempVector3 } from "../math/vector";
import { Geometry } from "./manifold";




export function axesFilter(polyA: Poly, geometryB: Geometry): Axis[] {
    let centroidVector = geometryB.centroid.sub(polyA.centroid, _tempVector1),
        axesA: Axis[], axesB: Axis[],
        supportIndexA: number, supportIndexB: number,
        i, res: Axis[] = [];

    axesA = findClosestAxes(polyA, geometryB, centroidVector);
    supportIndexA = axesA[0].supportVertexIndex;

    if(geometryB instanceof Poly) {
        axesB = findClosestAxes(geometryB, polyA, centroidVector.inv(centroidVector));
        supportIndexB = axesB[0].supportVertexIndex;
    }

    for(i = 0; i < axesA.length; i++) {
        axesA[i].oppositeVertexIndex = supportIndexB;
        res.push(axesA[i]);
    }

    if(axesB) {
        for(i = 0; i < axesB.length; i++) {
            axesB[i].oppositeVertexIndex = supportIndexA;
            res.push(axesB[i]);
        }
    }

    return res;
}


/**
 * @param poly 
 * @param geometry
 * @param centroidVector 
 * @param oppositeCentroid
 */
function findClosestAxes(poly: Poly, geometry: Geometry, centroidVector: Vector): Axis[] {
    let v: VertexList = poly.vertexList,
        axes: Axis[] = poly.axes,
        vertex: Vector,
        axis: Axis,
        distance: number,
        minDistance: number = Infinity,
        dot: number,
        lastDot: number = -1,
        index: number = 0,
        opposite = geometry instanceof Poly? geometry.vertexList: geometry,
        oppositeCentroid = geometry.centroid,
        res: Axis[] = [];

    if(axes[axes.length - 1]) {
        lastDot = axes[axes.length - 1].value.dot(centroidVector);
    }
    
    for(let i = 0; i < v.length; i++) {
        vertex = v[i];
        axis = axes[i];

        dot = axis? axis.value.dot(centroidVector): -1;
 
        if(dot <= 0 && lastDot <= 0) {
            continue;
        }

        distance = (vertex.x - oppositeCentroid.x) ** 2 + (vertex.y - oppositeCentroid.y) ** 2;

        if(distance < minDistance) {
            minDistance = distance;
            index = i;
        }
 
        lastDot = dot;
    }

    let prev = index > 0? index - 1: v.length - 1,
        prevAxis = axes[prev],
        indexAxis = axes[index];

    if(prevAxis) {
        res.push(prevAxis);
    }

    if(indexAxis) {
        res.push(indexAxis);
    }

    for(let i = 0; i < res.length; i++) {
        res[i].supportVertexIndex = index;
        res[i].opposite = opposite;
        res[i].origin = poly.vertexList;
    }

    return res;
}
