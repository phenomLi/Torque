import { Poly } from "../common/vertices";
import { Vector, _tempVector1, _tempVector2 } from "../math/vector";
import { Contact } from "../constraint/contact";

export type edge = { start: Vector; end: Vector };
export type edgeInfo = {
    e: edge;
    d: number;
    poly: Poly;
};

/**
 * 寻找 incident edge 和 reference edge
 * @param poly
 * @param edges
 * @param normal 
 */
function findEdge(poly: Poly, edges: { ref: edgeInfo, inc: edgeInfo }, normal: Vector) {
    let v = poly.vertexList,
        prev: Vector, cur: Vector, next: Vector, index: number,
        d1, d2, d, min = Infinity,
        e = { start: null, end: null };

    for(let i = 0; i < v.length; i++) {
        let dot = v[i].dot(normal);

        if(dot < min) {
            min = dot;
            index = i;
        }
    }

    cur = v[index];
    prev = v[index === 0? v.length - 1: index - 1];
    next = v[(index + 1) % v.length];
    cur.sub(prev, _tempVector1);
    cur.sub(next, _tempVector2);

    d1 = Math.abs(_tempVector1.dot(normal));
    d2 = Math.abs(_tempVector2.dot(normal));

    if(d1 < d2) {
        e.start = prev;
        e.end = cur;
        d = d1;
    }

    if(d2 < d1) {
        e.start = cur;
        e.end = next;
        d = d2;
    }

    if(edges.ref === null) {
        edges.ref = {
            poly,
            d,
            e
        };
    }
    else {
        if(d < edges.ref.d) {
            edges.inc = edges.ref;
            edges.ref = {
                poly,
                d,
                e
            };
        }
        else {
            edges.inc = {
                poly,
                d,
                e
            };
        }
    }
}


function clip(vertex: Vector[], refv: Vector, d: number): Vector[] {
    let d1, d2, res: Vector[] = [];

    d1 = vertex[0].dot(refv) - d;
    d2 = vertex[1].dot(refv) - d;

    if(d1 >= 0) {
        res.push(vertex[0]);
    }

    if(d2 >= 0) {
        res.push(vertex[1]);
    }

    // 若 两候选点在裁剪线两侧，则生成一个新交点
    if(d1 * d2 < 0) {
        let v = vertex[1].sub(vertex[0]);
        v.scl(d1 / (d1 - d2), v).add(vertex[0], v);

        res.push(v);
    }
        
    return res;
}

/**
 * V-Clip 算法寻找碰撞点
 * 详见：https://github.com/phenomLi/Blog/issues/42
 * @param poly1
 * @param poly2
 * @param normal 
 * @param depth
 */
export function VClip(poly1: Poly, poly2: Poly, normal: Vector, depth: number): Contact[] {
    let edges: { ref: edgeInfo, inc: edgeInfo } = { ref: null, inc: null },
        vertex,
        contact: Contact[] = [];

    findEdge(poly1, edges, normal);
    findEdge(poly2, edges, normal.inv());

    const inc = edges.inc.e,
          ref = edges.ref.e;

    let refv = ref.end.sub(ref.start).nol(),
        refn = normal;

    vertex = [inc.start, inc.end];
    vertex = clip(vertex, refv, ref.start.dot(refv));

    // 只有一个潜在碰撞点，则不用继续测试了
    if(vertex.length < 2) {
        return vertex.map(item => new Contact(item, depth));
    }

    vertex = clip(vertex, refv.inv(refv), ref.end.dot(refv));

    // 只有一个潜在碰撞点，则不用继续测试了
    if(vertex.length < 2) {
        return vertex.map(item => new Contact(item, depth));
    }
    
    if(edges.ref.poly.centroid.sub(ref.start).dot(refn) <= 0) {
        refn = refn.inv();
    }

    let d = ref.start.dot(refn),
        d1 = vertex[0].dot(refn) - d,
        d2 = vertex[1].dot(refn) - d;

    if(d1 > 0) {
        contact.push(new Contact(vertex[0], d1));
    }

    if(d2 > 0) {
        contact.push(new Contact(vertex[1], d2));
    }

    return contact;
}
