import { Axis, Poly, VertexList } from "../common/vertices";
import { Vector, _tempVector1, _tempVector2 } from "../math/vector";
import { Geometry } from "./manifold";




export function axesFilter(geometryA: Geometry, geometryB: Geometry): Axis[] {
    let centroidVector = geometryA.centroid.sub(geometryB.centroid, _tempVector1),
        axesA: Axis[], axesB: Axis[],
        i, res: Axis[] = [];

    if(geometryA instanceof Poly) {
        axesA = findClosestAxes(geometryA, geometryB, centroidVector);
        res.push(...axesA);
    }

    if(geometryB instanceof Poly) {
        axesB = findClosestAxes(geometryB, geometryA, centroidVector.inv(centroidVector));
        res.push(...axesB);
    }

    if(axesA && axesB) {
        for(i = 0; i < axesA.length; i++) {
            axesA[i].oppositeVertexIndex = axesB[0].supportVertexIndex;
        }
        
        for(i = 0; i < axesB.length; i++) {
            axesB[i].oppositeVertexIndex = axesA[0].supportVertexIndex;
        }
    }

    return res;
}


/**
 * @param poly 
 * @param centroidVector 
 */
function findClosestAxes(poly: Poly, geometry: Geometry, centroidVector: Vector): Axis[] {
    let v: VertexList = poly.vertexList,
        axes: Axis[] = poly.axes,
        vertex: Vector,
        projection: number,
        minProjection: number = Infinity,
        index: number,
        opposite = geometry instanceof Poly? geometry.vertexList: geometry,
        res: Axis[] = [];

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
        axes[prev].supportVertexIndex = index;
        axes[prev].opposite = opposite;
        axes[prev].origin = poly.vertexList;
        res.push(axes[prev]);
    }

    axes[index].supportVertexIndex = index;
    axes[index].opposite = opposite;
    axes[index].origin = poly.vertexList;
    res.push(axes[index]);

    return res;
}


