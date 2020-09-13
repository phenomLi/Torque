import { Body } from "../body/body";
import { Vector } from "../math/vector";
import { Util } from "../common/util";
import { Axis, Poly, VertexList } from "../common/vertices";
import { Arc } from "../common/arcs";
import { Contact } from "../constraint/contact";


/**
 * 碰撞信息，碰撞流形，接触点
 */

export type Geometry = Poly | Arc;


/**
 * 一个碰撞结构，包含了碰撞的所有信息
 */

export class Collision {
    // 碰撞刚体A
    bodyA: Body;
    // 碰撞刚体B
    bodyB: Body;
    // 碰撞子图形A
    partA: Geometry;
    // 碰撞子图形B
    partB: Geometry;
    // 碰撞法线
    normal: Axis;
    // 碰撞切线
    tangent: Vector;
    // 接触点
    contacts: Contact[];
    // 是否发生了碰撞
    collide: boolean;
};


/**
 * 碰撞流形
 * 主要用于记录相互碰撞的刚体和进行碰撞缓存
 */
export class Manifold {
    // id
    id: string;

    bodyA: Body;
    bodyB: Body;
    partA: Geometry;
    partB: Geometry;
    // 碰撞信息
    collision: Collision;
    // 激活状态
    // 激活状态的意思即上一次更新时流形是否发生碰撞，若是，则表示该流形在激活状态
    isActive: boolean;
    // 确认激活状态
    // 确认激活状态意思即是当前更新时流形是否激活
    confirmedActive: boolean;
    // 流形创建时间
    timeCreated: number;
    // 流形更新时间
    timeUpdated: number;
    // 摩擦力
    friction: number;
    // 恢复系数
    restitution: number;
    // 质量和倒数
    inverseMass: number;

    constructor(collision: Collision, timeStamp: number) {
        this.bodyA = collision.bodyA;
        this.bodyB = collision.bodyB;
        this.partA = collision.partA;
        this.partB = collision.partB;
        this.id = Util.compositeId(this.partA.id, this.partB.id);
        this.collision = collision;
        this.isActive = true;
        this.confirmedActive = true;
        this.timeCreated = timeStamp;
        this.timeUpdated = timeStamp;
        this.friction = 0;
        this.restitution = 0;
        this.inverseMass = 0;

        this.update(collision, timeStamp);
    }

    /**
     * 更新流形
     * @param collision 碰撞信息
     * @param timeStamp 时间戳
     */
    update(collision: Collision, timeStamp: number) {
        this.collision = collision;

        // 如果该碰撞对真的发生了碰撞
        if(collision.collide) {
            let bodyA: Body, bodyB: Body;

            bodyA = collision.bodyA;
            bodyB = collision.bodyB;

            this.friction = Math.sqrt(bodyA.friction * bodyB.friction);
            this.restitution = (bodyA.restitution + bodyB.restitution) / 2;
            this.inverseMass = bodyA.invMass + bodyB.invMass;

            this.toggleActive(true, timeStamp);
        }
        // 否则
        else {
            this.isActive && this.toggleActive(false, timeStamp);
        }
    }

    /**
     * 更改流形激活状态
     * @param active 激活状态
     * @param timeStamp 时间戳
     */
    toggleActive(active: boolean, timeStamp: number) {
        this.isActive = active;

        if(active) {
            this.timeUpdated = timeStamp;
        }
    }
}

