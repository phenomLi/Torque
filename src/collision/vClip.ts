import { Edge, VertexList } from "../common/vertices";
import { Vector, _tempVector1, _tempVector2 } from "../math/vector";
import { Contact } from "../constraint/contact";
import { MinOverlap } from "./sat";


/**
 * 寻找 incident edge
 * @param oppositeVertexList 
 * @param normal 
 * @param oppositeClosestIndex 
 */
function findIncidentEdge(oppositeVertexList: VertexList, normal: Vector, oppositeClosestIndex: number): Edge {
    let prev: Vector, cur: Vector, next: Vector, 
        index: number = oppositeClosestIndex,
        edge: Edge = { start: null, end: null };
   
    cur = oppositeVertexList[index];
    prev = oppositeVertexList[index === 0? oppositeVertexList.length - 1: index - 1];
    next = oppositeVertexList[(index + 1) % oppositeVertexList.length];
    cur.sub(prev, _tempVector1);
    cur.sub(next, _tempVector2);

    let d1 = Math.abs(_tempVector1.dot(normal)),
        d2 = Math.abs(_tempVector2.dot(normal));

    if(d1 < d2) {
        edge.start = prev;
        edge.end = cur;
    }
    else {
        edge.start = cur;
        edge.end = next;
    }
    
    return edge;
}

/**
 * 筛选两边
 * @param incEdge
 * @param refV 
 * @param d 
 */
function clipSide(incEdge: Edge, refV: Vector, d: number): number {
    let d1 = incEdge.start.dot(refV) - d,
        d2 = incEdge.end.dot(refV) - d;

    if(d1 > 0) {
        return 0;
    }

    if(d2 > 0) {
        return 1;
    }
        
    return -1;
}


/**
 * V-Clip 算法寻找碰撞点
 * 详见：https://github.com/phenomLi/Blog/issues/42
 * @param poly1
 * @param poly2
 * @param normal 
 * @param depth
 */
export function vClip(minOverlap: MinOverlap): Contact[] {
    let axis = minOverlap.axis,
        normal = axis.value,
        depth: number = minOverlap.value,
        incEdge: Edge,
        refEdge: Edge,
        contacts: Contact[] = [];

    incEdge = findIncidentEdge(<VertexList>axis.opposite, normal, minOverlap.oppositeClosestIndex);
    refEdge = axis.edge;

    // ------------------------------------- 首先向 refEdge 的内部进行筛选 -------------------

    let refV = refEdge.end.sub(refEdge.start).nol(),
        refN = normal,
        d = refEdge.start.dot(refN),
        d1 = incEdge.start.dot(refN) - d,
        d2 = incEdge.end.dot(refN) - d,
        incVertex: Vector[] = [],
        removeIndex: number = -1;

    if(d1 <= 0) {
        incVertex[0] = incEdge.start;
    }

    if(d2 <= 0) {
        incVertex[1] = incEdge.end;
    }

    // ------------------------------------- 接下来进行两边筛选 -------------------
    removeIndex = clipSide(incEdge, refV, refEdge.end.dot(refV));
    if(removeIndex !== -1 && incVertex[removeIndex]) {
        incVertex[removeIndex] = refEdge.end;
    }

    removeIndex = clipSide(incEdge, refV.inv(refV), refEdge.start.dot(refV));
    if(removeIndex !== -1 && incVertex[removeIndex]) {
        incVertex[removeIndex] = refEdge.start;
    }

    if(incVertex[0]) {
        contacts.push(new Contact(incVertex[0], Math.abs(d1)));
    }

    if(incVertex[1]) {
        contacts.push(new Contact(incVertex[1], Math.abs(d2)));
    }
        
    return contacts;
}


