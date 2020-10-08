import { Axis, Poly, VertexList } from "../common/vertices";
import { Vector, _tempVector1, _tempVector2, _tempVector3 } from "../math/vector";
import { Geometry } from "./manifold";




export function axesFilter(geometryA: Geometry, geometryB: Geometry): Axis[] {
    let centroidVector = geometryA.centroid.sub(geometryB.centroid, _tempVector1),
        axesA: Axis[] | number, axesB: Axis[] | number,
        supportIndexA: number, supportIndexB: number,
        i, res: Axis[] = [];

    if(geometryA instanceof Poly) {
        axesA = findClosestAxes(geometryA, geometryB, centroidVector, geometryB.centroid);
        supportIndexA = Array.isArray(axesA)? axesA[0].supportVertexIndex: axesA;
        
    }

    if(geometryB instanceof Poly) {
        axesB = findClosestAxes(geometryB, geometryA, centroidVector.inv(centroidVector), geometryA.centroid);
        supportIndexB = Array.isArray(axesB)? axesB[0].supportVertexIndex: axesB;
    }

    if(Array.isArray(axesA)) {
        for(i = 0; i < axesA.length; i++) {
            axesA[i].oppositeVertexIndex = supportIndexB;
            res.push(axesA[i]);
        }
    }

    if(Array.isArray(axesB)) {
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
function findClosestAxes(poly: Poly, geometry: Geometry, centroidVector: Vector, oppositeCentroid: Vector): Axis[] | number {
    let v: VertexList = poly.vertexList,
        axes: Axis[] = poly.axes,
        centroid: Vector = poly.centroid,
        vertex: Vector,
        d: number,
        minD: number = Infinity,
        index: number = -1,
        opposite = geometry instanceof Poly? geometry.vertexList: geometry,
        res: Axis[] = [];

    for(let i = 0; i < v.length; i++) {
        vertex = v[i];
        d = (v[i].x - oppositeCentroid.x) ** 2 + (v[i].y - oppositeCentroid.y) ** 2;

        if(d < minD) {
            minD = d;
            index = i;
        }
    }

    let prev = index > 0? index - 1: v.length - 1,
        next =  index < v.length - 1? index + 1: 0,
        prevAxis = axes[prev],
        indexAxis = axes[index];

    if(prevAxis && testEdge(centroid, centroidVector, v[index], v[prev])) {
        prevAxis.supportVertexIndex = index;
        prevAxis.opposite = opposite;
        prevAxis.origin = poly.vertexList;
        res.push(prevAxis);
    }

    if(indexAxis && testEdge(centroid, centroidVector, v[index], v[next])) {
        indexAxis.supportVertexIndex = index;
        indexAxis.opposite = opposite;
        indexAxis.origin = poly.vertexList;
        res.push(indexAxis);
    }

    if(res.length) {
        return res;
    }

    return index;
}


function testEdge(centroid: Vector, centroidVector: Vector, support: Vector, opposite: Vector): boolean {
    let v1 = support.sub(centroid, _tempVector2),
        v2 = opposite.sub(centroid, _tempVector3);

    return v1.cro(centroidVector) * v2.cro(centroidVector) <= 0;
}

