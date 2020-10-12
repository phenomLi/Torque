import { Axis, Poly, VertexList } from "../common/vertices";
import { Vector, _tempVector1, _tempVector2, _tempVector3 } from "../math/vector";
import { Geometry } from "./manifold";




export function axesFilter(geometryA: Geometry, geometryB: Geometry): Axis[] {
    let centroidVector = geometryB.centroid.sub(geometryA.centroid, _tempVector1),
        axesA: Axis[] | number, axesB: Axis[] | number,
        supportIndexA: number, supportIndexB: number,
        i, res: Axis[] = [];

    if(geometryA instanceof Poly) {
        axesA = findClosestAxes(geometryA, geometryB, centroidVector);
        supportIndexA = Array.isArray(axesA)? axesA[0].supportVertexIndex: axesA;
        
    }

    if(geometryB instanceof Poly) {
        axesB = findClosestAxes(geometryB, geometryA, centroidVector.inv(centroidVector));
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
function findClosestAxes(poly: Poly, geometry: Geometry, centroidVector: Vector): Axis[] | number {
    let v: VertexList = poly.vertexList,
        axes: Axis[] = poly.axes,
        centroid: Vector = poly.centroid,
        axis: Axis,
        vStart: Vector, vEnd: Vector,
        croStart: number, croEnd: number,
        index: number = 0,
        opposite = geometry instanceof Poly? geometry.vertexList: geometry,
        res: Axis[] = [];

    for(let i = 0; i < axes.length; i++) {
        axis = axes[i];

        if(axis === null || axis.value.dot(centroidVector) <= 0) continue;
        
        vStart = axis.edge.start.sub(centroid, _tempVector2);
        vEnd = axis.edge.end.sub(centroid, _tempVector3);

        croStart = vStart.cro(centroidVector);
        croEnd = vEnd.cro(centroidVector);

        if(croStart === 0) {
            res.push(axis);

            let prev = i > 0? i - 1: axes.length - 1;
            if(axes[prev]) {
                res.push(axes[prev]);
            }

            index = i;

            break;
        }
        
        if(croEnd === 0) {
            res.push(axis);

            let next = (i + 1) % axes.length;
            if(axes[next]) {
                res.push(axes[next]);
            }

            index = (i + 1) % v.length;

            break;
        }

        if(croStart * croEnd < 0) {
            res.push(axis);
            index = i;

            let d1 = axis.edge.start.dot(centroidVector),
                d2 = axis.edge.end.dot(centroidVector);

            if(d2 > d1) {
                index = (i + 1) % v.length;
            }
            
            break;
        }
    }

    if(res.length) {
        for(let i = 0; i < res.length; i++) {
            res[i].supportVertexIndex = index;
            res[i].opposite = opposite;
            res[i].origin = poly.vertexList;
        }

        return res;
    }

    return index;
}
