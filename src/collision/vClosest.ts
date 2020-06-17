import { VertexList, Poly, Vertices } from "../common/vertices";
import { Vector } from "../math/vector";
import { Contact, Geometry } from "./manifold";
import { Arc } from "../common/arcs";


/**
 * 将顶点按照在法线上投影的大小顺序排序
 * @param vertexList 
 * @param normal 
 */
function orderProjectionVertexInNormalDirection(vertexList: VertexList, normal: Vector): Vector[] {
    return vertexList.slice(0).sort((vertexA, vertexB) => vertexA.dot(normal) - vertexB.dot(normal));
}


/**
 * 最近内部顶点法寻找碰撞点
 * 详见：https://github.com/phenomLi/Blog/issues/41
 * @param poly 
 * @param geometry 
 */
export function VClosest(poly: Poly, geometry: Geometry, normal: Vector, depth: number): Contact[] {
    let potentialContactsA: Vector[] = [],
        potentialContactsB: Vector[] = [],
        contacts: Contact[] = [],
        normalInv = normal.inv(),
        i;

    if(geometry instanceof Poly) {
        let vertexListA = poly.vertexList,
            vertexListB = (<Poly>geometry).vertexList;

        // 寻找多边形A最接近多边形B的两个点
        potentialContactsA = orderProjectionVertexInNormalDirection(vertexListA, normal);

        for(i = 0; i < potentialContactsA.length; i++) {
            // 查看这些点是否在多边形B内部
            if(Vertices.isContains(vertexListB, potentialContactsA[i])) {
                // 如果是，则这个点记为一个碰撞点
                contacts.push(new Contact(potentialContactsA[i], depth));
            } 
            else {
                if(i !== 0) break;
            }
        }

        if(contacts.length >= 2) return contacts;

        // 同理上面
        potentialContactsB = orderProjectionVertexInNormalDirection(vertexListB, normalInv);

        for(i = 0; i < potentialContactsB.length; i++) {
            if(Vertices.isContains(vertexListA, potentialContactsB[i])) {
                contacts.push(new Contact(potentialContactsB[i], depth));
            }
            else {
                if(i !== 0) break;
            } 
        }

        // 边界情况：即没有碰撞点的情况
        if(contacts.length < 1) {
            contacts.push(new Contact(potentialContactsA[0], depth));
        }
    }
    else {
        let vertex = (<Arc>geometry).center.loc(normal, (<Arc>geometry).radius - depth / 2);
        contacts.push(new Contact(vertex, depth));
    }

    return contacts;
}

