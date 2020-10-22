import { Vector, _tempVector1, _tempVector2 } from "../math/vector";
import { Bound } from "./bound";
import { Body } from "../body/body";
import { Circle } from "../body/circle";


// 顶点列表类型
export type VertexList = Array<Vector>;
// 边类型
export type Edge = {
    start: Vector;
    end: Vector;
};
// 边法向量（轴）类型
export type Axis = {
    value: Vector;
    supportVertexIndex: number;
    oppositeVertexIndex: number;
    opposite: VertexList | Circle;
    origin: VertexList;
    edge: Edge;
};


// 顶点操作工具
export const Vertices = {

    /**
     * 获取多边形中心点
     * @param vertexList 
     */
    getCenter(vertexList: VertexList): Vector {
        let range = Vertices.getRange(vertexList),
            centerX = (range.max.x + range.min.x) / 2,
            centerY = (range.max.y + range.min.y) / 2;
        
        return new Vector(centerX, centerY);
    },

    /**
     * 获取多边形质心
     * @param vertexList 
     */
    getCentroid(vertexList: VertexList): Vector {
        let area = Vertices.getArea(vertexList),
            centroid = new Vector(0, 0),
            cross = 0,
            temp,
            j;

        for (let i = 0; i < vertexList.length; i++) {
            j = (i + 1) % vertexList.length;
            cross = vertexList[i].cro(vertexList[j]);
            temp = vertexList[i].add(vertexList[j]).scl(cross);
            centroid.add(temp, centroid);
        }

        return centroid.scl(1 / (6 * area), centroid);
    },

    /**
     * 获取多边形面积
     * @param vertexList 
     */
    getArea(vertexList: VertexList): number {
        let area = 0,
            j = vertexList.length - 1;

        for(let i = 0; i < vertexList.length; i++) {
            area += (vertexList[j].x - vertexList[i].x)*(vertexList[j].y + vertexList[i].y);
            j = i;
        }

        return area/2;
    },

    /**
     * 获取多边形的转动惯量
     * 公式来自：https://blog.csdn.net/weixin_34194702/article/details/93587529
     * @param vertexList 
     * @param mass 质量
     * @param position
     */
    getInertia(vertexList: VertexList, mass: number, position: Vector): number {
        let numerator = 0,
            denominator = 0,
            v = vertexList,
            cur, next,
            cross;

        for(let n = 0; n < v.length; n++) {
            cur = v[n].sub(position, cur);
            next = v[(n + 1) % v.length].sub(position, next);

            cross = Math.abs(cur.cro(next));
            numerator += cross * (cur.dot(cur) + cur.dot(next) + next.dot(next));
            denominator += cross;
        }

        return (mass / 6) * (numerator / denominator);
    },

    /**
     * 求三角形的转动惯量
     * @param vertexList 
     * @param mass 
     * 参考：http://www.doc88.com/p-5456260484135.html
     */
    getTriInertia(vertexList: VertexList, mass: number): number {
        let l1 = vertexList[0].sub(vertexList[1]).len_s(),
            l2 = vertexList[1].sub(vertexList[2]).len_s(),
            l3 = vertexList[2].sub(vertexList[0]).len_s();

        return  (l1 + l2 + l3) * (mass / 36);
    },

    /**
     * 求顶点围成的所有面的轴
     * @param vertexList 
     */
    getAxes(vertexList: VertexList): Axis[] {
        let v = vertexList,
            axis: Vector, axes: Axis[] = [],
            i, j;

            for(i = 0; i < v.length; i++) {
                j = (i + 1) % v.length;

                axis = v[j].sub(v[i]).nor().nol();
                axes.push({
                    value: axis,
                    opposite: null,
                    origin: vertexList,
                    supportVertexIndex: null,
                    oppositeVertexIndex: null,
                    edge: {
                        start: v[i],
                        end: v[j]
                    }
                });
            }

        return axes;
    },  

    /**
     * 获取顶点集的范围
     * @param vertexList 
     */
    getRange(vertexList: VertexList): {min: Vector, max: Vector} {
        let xList = vertexList.map(v => v.x),
            yList = vertexList.map(v => v.y);

        return {
            min: new Vector(Math.min.apply(Math, xList), Math.min.apply(Math, yList)),
            max: new Vector(Math.max.apply(Math, xList), Math.max.apply(Math, yList))
        };
    },
    
    /**
     * 获取顶点集形成的包围盒
     * @param vertexList 
     */
    getBound(vertexList: VertexList): Bound {
        let range = Vertices.getRange(vertexList);
        return new Bound(range.min, range.max);
    },


    /**
     * 使用斜率筛去共线的轴
     * @param axes 要筛选的轴
     */
    uniqueAxes(axes: Axis[]): Axis[] {
        let axisVector: Vector,
            tmpAxes: Axis[] = [],
            axesTable = {},
            i, gradient;

        for (i = 0; i < axes.length; i++) {
            axisVector = axes[i].value;
            gradient = (axisVector.y === 0) ? Infinity : (axisVector.x / axisVector.y);
            
            // 限制精度
            gradient = gradient.toFixed(3).toString();
            axesTable[gradient] = axes[i];
        }

        Object.keys(axesTable).map(item => {
            tmpAxes.push(axesTable[item]);
        });

        return tmpAxes;
    },


    /**
     * 旋转顶点
     * @param vertexList 多边形顶点 
     * @param radian 弧度
     * @param point 绕点
     */
    rotate(vertexList: VertexList, radian: number, point: Vector) {
        for(let i = 0; i < vertexList.length; i++) {
            vertexList[i].rot(radian, point, vertexList[i]);
        }
    },  

    /**
     * 位移顶点
     * @param vertexList 多边形顶点
     * @param dx
     * @param dy
     */
    translate(vertexList: VertexList, dx: number, dy: number) {
        for(let i = 0; i < vertexList.length; i++) {
            vertexList[i].x += dx;
            vertexList[i].y += dy;
        }
    },

    /**
     * 将凹多边形分解为多个子凸多边形
     * @param vertexList
     */
    split(vertexList: VertexList): VertexList[] {
        // 将拆分出来的多边形保存到这个数组
        let parts: VertexList[] = [],
            vertexListA: Vector[], 
            vertexListB: Vector[],
            xAxis: Vector,
            vTest: Vector,
            vDiv: Vector,
            dividePointA: Vector,
            dividePointB: Vector,
            len = vertexList.length, i, j, cur, next, next2, 
            flag = false;

        for(i = 0 ; i < len; i++) {
            cur = i;
            next = (i + 1) % len;
            next2 = (i + 2) % len;

            xAxis = vertexList[next].sub(vertexList[cur]); 
            vTest = vertexList[next2].sub(vertexList[cur]);

            if(xAxis.cro(vTest) < 0) {
                for(j = i + 3; j < len; j++) {
                    vDiv = vertexList[j].sub(vertexList[cur]);
                    if(xAxis.cro(vDiv) > 0) {
                        flag = true;
                        break;
                    }
                }

                if(flag) break;
            }
        }

        // 获取两个分割点
        dividePointA = vertexList[next],
        dividePointB = vertexList[j];

        // 拆分为两个多边形vertexListA和vertexListB
        vertexListB = vertexList.splice(next2, j - next2);
        vertexListA = vertexList;
        vertexListB.unshift(dividePointA);
        vertexListB.push(dividePointB);

        // 检测拆分出来的两个多边形是否是凹多边形，若果是，继续递归拆分
        if(Vertices.isConcave(vertexListA)) {
            parts.push(...Vertices.split(vertexListA));
        }
        else {
            parts.push(vertexListA);
        }

        if(Vertices.isConcave(vertexListB)) {
            parts.push(...Vertices.split(vertexListB));
        }
        else {
            parts.push(vertexListB);
        }

        return parts;
    },

    /**
     * 判断是否包含顶点（射线法）
     * 参考：https://www.cnblogs.com/anningwang/p/7581545.html
     * @param vertexList 
     * @param point 检测的顶点
     */
    isContains(vertexList: VertexList, point: Vector): boolean {
        let v = vertexList,
            cur, next, len = vertexList.length;

        for(let i = 0; i < len; i++) {
            cur = v[i], next = v[(i + 1) % len];

            if((point.x - cur.x) * (next.y - cur.y) + (point.y - cur.y) * (cur.x - next.x) >= 0) {
                return false;
            } 
        }

        return true;
    },

    /**
     * 判断是否为凹多边形
     * @param vertexList 
     */
    isConcave(vertexList: VertexList): boolean {
        let v = vertexList,
            // 上两向量间的叉积
            prevCor, 
            // 当前两向量的叉积
            curCor,
            // 上一顶点到当前顶点的向量
            prev2Cur,
            // 当前顶点到下一顶点的向量
            cur2Next,
            len = v.length, 
            i, j, k;

        for(i = 1; i < len; i++) {
            j = i - 1;
            k = (i + 1)%len;

            prev2Cur = v[i].sub(v[j]);
            cur2Next = v[k].sub(v[i]);

            // 计算向量叉积
            curCor = prev2Cur.cro(cur2Next) >= 0? 1: -1;

            if(prevCor !== undefined && prevCor !== curCor) {
                return true;
            } 
            
            prevCor = curCor;
        }

        return false;
    },

    /**
     * 转换到世界坐标
     * @param point 参考点
     * @param vertexList 
     */
    transform2World(point: Vector, vertexList: VertexList): VertexList {
        return vertexList.map(v => v.add(point));
    },

    /**
     * 转换到本地坐标
     * @param point 参考点
     * @param vertexList 
     */
    transform2Local(point: Vector, vertexList: VertexList): VertexList {
        return vertexList.map(v => v.sub(point));
    },

    /**
     * 求多边形在某个轴的投影
     * @param vertexList 
     * @param axis 投影轴
     */
    projection(vertexList: VertexList, axis: Vector): {min: number, max: number} {
        let projection: number,
            minProjection: number = Infinity,
            maxProjection: number = -Infinity;

        for(let i = 0; i < vertexList.length; i++) {
            projection = vertexList[i].dot(axis);

            if(projection < minProjection) {
                minProjection = projection;
            }

            if(projection > maxProjection) {
                maxProjection = projection;
            }
        }

        return {
            min: minProjection,
            max: maxProjection
        };  
    },

    /**
     * 计算顶点集中离给定点最近的顶点
     * @param point 给定点
     * @param vertexList 顶点集
     */
    getClosestVertex(point: Vector, vertexList: VertexList): Vector {
        let v = vertexList,
            i, min = Infinity, length, index,
            len = v.length;

        for(i = 0; i < len; i++) {
            length = v[i].sub(point).len();

            if(length < min) {
                min = length;
                index = i;
            }
        }

        return vertexList[index];
    },

    /**
     * 寻找顶点集中所有凹点
     * @param vertexList 
     */
    findCaves(vertexList: VertexList): Vector[] {
        let caves = [],
            v = vertexList,
            prevVertex,
            curVertex, 
            nextVertex,
            len = v.length,
            i;

        for(i = 1; i < len; i++) {
            prevVertex = v[i - 1];
            curVertex = v[i];
            nextVertex = v[(i + 1) % len];

            // 利用叉乘判断
            if(curVertex.sub(prevVertex).cro(nextVertex.sub(curVertex)) < 0) {
                caves.push(curVertex);
            }
        }

        return caves;
    },

    /**
     * 过滤共线的顶点
     * @param vertexList 
     */
    filterCollinearVertex(vertexList: VertexList): VertexList {
        let vertex: Vector, 
            next: Vector, 
            next2: Vector,
            len = vertexList.length,
            vNext: Vector, vNext2: Vector,
            removeIndex: number[] = [],
            i;

        for(i = 0; i < len; i++) {
            vertex = vertexList[i];
            next = vertexList[(i + 1) % len];
            next2 = vertexList[(i + 2) % len];

            vNext = next.sub(vertex, _tempVector1);
            vNext2 = next2.sub(vertex, _tempVector2);

            if(vNext.cro(vNext2) === 0) {
                removeIndex.push((i + 1) % len);
            }
        }

        for(i = 0; i < removeIndex.length; i++) {
            vertexList.splice(removeIndex[i], 1);
        }

        return vertexList;
    }
}



