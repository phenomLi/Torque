import { VertexList, Vertices } from "../common/vertices";
import { Vector, _tempVector3 } from "../math/vector";
import { Contact, ContactConstraint } from "../constraint/contact";
import { MinOverlap } from "./sat";


/**
 * 将顶点按照在法线上投影的大小顺序排序
 * @param vertexList 
 * @param normal 
 */
function findClosestVertexIndex(vertexList: VertexList, normal: Vector): number {
    let projection: number,
        index: number;

    let maxProjection = -Infinity;

    for(let i = 0; i < vertexList.length; i++) {
        projection = vertexList[i].dot(normal);

        if(projection > maxProjection) {
            maxProjection = projection;
            index = i;
        }
    }

    return index;
}


/**
 * 最近内部顶点法寻找碰撞点
 * 详见：https://github.com/phenomLi/Blog/issues/41
 * @param vertexListA 
 * @param vertexListB 
 * @param normal 
 * @param depth
 */
export function vClosest(minOverlap: MinOverlap): Contact[] {
    let contacts: Contact[] = [],
        axis = minOverlap.axis,
        normal = axis.value,
        normalInv = axis.value.inv(_tempVector3),
        index: number, prev: number, next: number,
        depth: number = minOverlap.value,
        vertexListA = axis.origin,
        vertexListB = axis.opposite as VertexList,
        testVertices: Vector[] = [],
        i;

    // 寻找多边形A最接近多边形B的两个点
    index = findClosestVertexIndex(vertexListA, normal);
    prev = index > 0? index - 1: vertexListA.length - 1;
    next = index < vertexListA.length - 1? index + 1: 0;

    testVertices.push(vertexListA[prev]);
    testVertices.push(vertexListA[index]);
    testVertices.push(vertexListA[next]);

    for(i = 0; i < testVertices.length; i++) {
        // 查看这些点是否在多边形B内部
        if(Vertices.isContains(vertexListB, testVertices[i])) {
            // 如果是，则这个点记为一个碰撞点
            contacts.push(ContactConstraint.create(null, testVertices[i], depth));
        } 
    }

    if(contacts.length >= 2) {
        return contacts;
    };

    testVertices.length = 0;

    // 同理上面
    index = findClosestVertexIndex(vertexListB, normalInv);
    prev = index > 0? index - 1: vertexListB.length - 1;
    next = index < vertexListB.length - 1? index + 1: 0;

    testVertices.push(vertexListB[prev]);
    testVertices.push(vertexListB[index]);
    testVertices.push(vertexListB[next]);

    for(i = 0; i < testVertices.length; i++) {
        if(Vertices.isContains(vertexListA, testVertices[i])) {
            contacts.push(ContactConstraint.create(null, testVertices[i], depth));
        }
    }

    // 边界情况：即没有碰撞点的情况
    if(contacts.length < 1) {
        contacts.push(ContactConstraint.create(null, vertexListB[index], depth));
    }

    return contacts;
}

