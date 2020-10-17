import { Body } from "../body/body";
import { Vector } from "../math/vector";






export const Compose = {

    /**
     * 获取质量
     * @param bodies 
     */
    getMass(bodies: Body[]): number {
        let totalMass: number = 0,
            body: Body;

        for(let i = 0; i < bodies.length; i++) {
            body = bodies[i];
            totalMass += body.mass;
        }

        return totalMass;
    },

    /**
     * 计算复合刚体的质心
     * 参考：https://zhuanlan.zhihu.com/p/26395651
     * @param composite 
     */
    getCentroid(bodies: Body[], mass: number): Vector {
        let centroid = new Vector(0, 0),
            body: Body, i: number;

        for(i = 0; i < bodies.length; i++) {
            body = bodies[i];

            centroid.x += body.position.x * body.mass;
            centroid.y += body.position.y * body.mass;
        }

        centroid.x /= mass;
        centroid.y /= mass;

        return centroid;
    },

    /**
     * 计算复合刚体的质量
     * @param composite 
     */
    getArea(bodies: Body[]): number {
        let totalArea: number = 0,
            body: Body, i: number;

        for(let i = 0; i < bodies.length; i++) {
            body = bodies[i];
            totalArea += body.area;
        }

        return totalArea;
    },

    /**
     * 获取转动惯量
     * @param bodies 
     */
    getInertia(bodies: Body[]): number {
        let totalInertia: number = 0,
            body: Body, i: number;

        for(let i = 0; i < bodies.length; i++) {
            body = bodies[i];
            totalInertia += body.inertia;
        }

        return totalInertia;
    }
};