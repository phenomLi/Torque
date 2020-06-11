import { Vector } from "../math/vector";
import { VertexList } from "./vertices";


/**
 * 线段类型
 * [start: {x, y}, end: {x, y}]
 */
export type LineSegment = Vector[];


/**
 * 线段操作工具
 * line: [start: Vector, end: Vector]
 */
export const Lines = {

   

    /**
     * 判断点在线段的哪一侧
     * @param line 线段
     * @param point 被检测点
     */
    side(line: LineSegment, point: Vector): number {
        let v1 = line[1].sub(line[0]),
            v2 = point.sub(line[0]),
            cor = v2.cro(v1);
    
        // > 0：左侧；< 0：右侧；= 0：点在线上
        if(cor === 0) return cor;
        else if(cor < 0) {
            return -1;
        }
        else {
            return 1
        }
    },


    /**
     * 判断两条线段是否相交
     * 参考：https://www.cnblogs.com/tuyang1129/p/9390376.html
     * @param line1 第一条线段
     * @param line2 第二条线段
     */
    isIntersect(line1: LineSegment, line2: LineSegment): boolean {
        let point11 = line1[0],
            point12 = line1[1], 
            point21 = line2[0],
            point22 = line2[1];
    
    return this.side(line1, point21) !== this.side(line1, point22) && this.side(line2, point11) !== this.side(line2, point12);
    },

    /**
     * 查看一条直线是否穿过一个多边形
     * 原理：查看多边形的所有顶点是否在线段的同一侧
     * @param line 
     * @param vertexList 
     */
    isIntersectWithVertices(line: LineSegment, vertexList: VertexList): boolean {
        let curCor, prevCor, len = vertexList.length, i;

        for(i = 0; i < len; i++) {
            curCor = this.side(line, vertexList[i]);

            if(curCor === 0) continue;

            if(prevCor && prevCor !== curCor) return true;

            prevCor = curCor;
        }
            
        return false;
    },

    /**
     * 求两线段的交点（相似三角形法）
     * 参考：https://blog.csdn.net/Mr_HCW/article/details/82856056
     * @param line1 第一条线段
     * @param line2 第二条线段
     */
    intersection(line1: LineSegment, line2: LineSegment): Vector {
        let v1 = line1[1].sub(line1[0]),
            v2 = line2[1].sub(line2[0]),
            tv1 = line1[0].sub(line2[0]),
            tv2 = line1[1].sub(line2[1]),
            d1 = Math.abs(tv1.cro(v1)/v1.len()),
            d2 = Math.abs(tv2.cro(v1)/v1.len()),
            tv3 = v2.scl(d1/(d1 + d2));

        return line2[0].add(tv3);
    },

    /**
     * 将线段投影到某个轴
     * @param line 
     * @param axis 
     */
    projection(line: LineSegment, axis: Vector): { min: number, max: number } {
        let n1 = line[0].pro(axis),
            n2 = line[1].pro(axis);
        
        if(n1 > n2) {
            return { min: n2, max: n1 };
        }
        else {
            return { min: n1, max: n2 };
        }
    }
};