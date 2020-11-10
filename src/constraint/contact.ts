import { Body } from "../body/body";
import { Vector, _tempVector2, _tempVector1, _tempVector3, _tempVector4 } from "../math/vector";
import { Manifold, Collision } from "../collision/manifold";
import { Constraint } from "./constraint";
import { Util } from "../common/util";


// 接触约束
export class Contact {
    id: [number, number];
    position: Vector;
    shareNormal: number;
    shareTangent: number;
    normalImpulse: number;
    tangentImpulse: number;
    offsetA: Vector;
    offsetB: Vector;
    depth: number;
    positionCorrectiveImpulse: number;
    velocityBias: number;

    constructor(id: [number, number], vertex: Vector, depth: number) {
        this.id = id;
        this.position = vertex;
        this.shareNormal = 0;
        this.shareTangent = 0;
        this.normalImpulse = 0;
        this.tangentImpulse = 0;
        this.positionCorrectiveImpulse = 0;
        this.depth = depth;
        this.velocityBias = 0;
    }

    /**
     * 判断两个碰撞点是否相等
     * @param contact 
     */
    equal(contact: Contact): boolean {
        if(this.id === null || contact.id === null) {
            return false;
        }

        if(this.id === contact.id) {
            return true;
        }

        if(this.id[0] === contact.id[0] && this.id[1] === contact.id[1]) {
            return true;
        }

        if(this.id[0] === contact.id[1] && this.id[1] === contact.id[0]) {
            return true;
        }

        return false;
    }
}

/**
 * 碰撞求解器
 */

export class ContactConstraint extends Constraint {
    // 穿透修正误差
    private slop: number;
    // 偏移因子
    private biasFactor: number;
    // 静止阈值
    private restFactor: number;

    constructor() {
        super();

        this.velocitySolverIterations = 20;
        this.positionSolverIterations = 1;
        this.slop = 0.01;
        this.biasFactor = 0.2;
        this.restFactor = 24;
    }

    static create(id: [number, number], vertex: Vector, depth: number): Contact {
        return new Contact(id, vertex, depth);
    }

    solve(manifolds: Manifold[], dt: number) {
        this.initSolver(manifolds, dt);

        for(let i = 0; i < this.positionSolverIterations; i++) {
            this.solvePosition(manifolds);
        }

        this.preSolveVelocity(manifolds);
        for(let i = 0; i < this.velocitySolverIterations; i++) {
            this.solveVelocity(manifolds);
        }
    }

    initSolver(manifolds: Manifold[], dt: number) {
        let manifold: Manifold,
            collision: Collision,
            contact: Contact,
            bodyA: Body,
            bodyB: Body,
            normal: Vector,
            tangent: Vector,
            i, j;

        for (i = 0; i < manifolds.length; ++i) {
            manifold = manifolds[i];

            if(!manifold.isActive) continue;

            collision = manifold.collision;
            normal = collision.normal;
            tangent = collision.tangent;
            bodyA = collision.bodyA;
            bodyB = collision.bodyB;

            for(j = 0; j < collision.contacts.length; j++) {
                contact = collision.contacts[j];

                // 接触点到刚体A质心的距离
                contact.offsetA = contact.position.sub(bodyA.position);
                // 接触点到刚体B质心的距离
                contact.offsetB = contact.position.sub(bodyB.position);
                
                let invMassNormal = manifold.inverseMass,
                    invMassTangent = manifold.inverseMass,
                    r1 = contact.offsetA,
                    r2 = contact.offsetB,
                    rn1 = contact.offsetA.dot(normal),
                    rn2 = contact.offsetB.dot(normal),
                    rt1 = contact.offsetA.dot(tangent),
                    rt2 = contact.offsetB.dot(tangent);

                // 计算 J(M^-1)(J^T).
                invMassNormal += bodyA.invInertia * (r1.dot(r1) - rn1 * rn1);
                invMassNormal += bodyB.invInertia * (r2.dot(r2) - rn2 * rn2);
                invMassTangent += bodyA.invInertia * (r1.dot(r1) - rt1 * rt1);
                invMassTangent += bodyB.invInertia * (r2.dot(r2) - rt2 * rt2);

                let bias = (1 / dt) * Math.max(0, contact.depth - this.slop);

                // 保存 J(M^-1)(J^T)的倒数
                contact.shareNormal = 1 / invMassNormal;
                contact.shareTangent = 1 / invMassTangent;
                contact.velocityBias = this.biasFactor * bias;
                contact.positionCorrectiveImpulse = contact.velocityBias * manifold.restitution / invMassNormal;
            }
        }
    }

    /**
     * 修正位置约束
     * @param manifolds 
     */
    solvePosition(manifolds: Manifold[]) {
        let manifold: Manifold,
            collision: Collision,
            contact: Contact,
            bodyA: Body,
            bodyB: Body,
            normal: Vector,
            i, j;

        for (i = 0; i < manifolds.length; ++i) {
            manifold = manifolds[i];

            if(!manifold.isActive) continue;

            collision = manifold.collision;
            normal = collision.normal;
            bodyA = collision.bodyA;
            bodyB = collision.bodyB;

            for(j = 0; j < collision.contacts.length; j++) {
                contact = collision.contacts[j];

                let positionCorrectiveImpulse = normal.scl(contact.positionCorrectiveImpulse, _tempVector4);

                bodyA.applyImpulse(positionCorrectiveImpulse, contact.offsetA);
                bodyB.applyImpulse(positionCorrectiveImpulse.inv(positionCorrectiveImpulse), contact.offsetB);
            }
        }
    }

    /**
     * 求解速度约束预处理
     * @param manifolds 碰撞流形
     * @param dt 步长
     */
    preSolveVelocity(manifolds: Manifold[]) {
        let manifold: Manifold,
            collision: Collision,
            contact: Contact,
            bodyA: Body,
            bodyB: Body,
            normal: Vector,
            tangent: Vector,
            i, j;

        for (i = 0; i < manifolds.length; ++i) {
            manifold = manifolds[i];

            if(!manifold.isActive) continue;

            collision = manifold.collision;
            normal = collision.normal;
            tangent = collision.tangent;
            bodyA = collision.bodyA;
            bodyB = collision.bodyB;

            for(j = 0; j < collision.contacts.length; j++) {
                contact = collision.contacts[j];

                // warm start
                if(contact.normalImpulse !== 0 || contact.tangentImpulse !== 0) {
                    let p = _tempVector3;

                    p.x = normal.x * contact.normalImpulse + tangent.x * contact.tangentImpulse;
                    p.y = normal.y * contact.normalImpulse + tangent.y * contact.tangentImpulse;

                    bodyA.applyImpulse(p, contact.offsetA);
                    bodyB.applyImpulse(p.inv(p), contact.offsetB); 
                }
            }
        }

    }
    
    /**
     * 求解速度约束
     * 使用sequential impulse进行快速收敛
     * 参考：https://kevinyu.net/2018/01/17/understanding-constraint-solver-in-physics-engine/
     * @param manifolds
     * @private dt
     */
    solveVelocity(manifolds: Manifold[]) {
        let manifold: Manifold,
            collision: Collision,
            contact: Contact,
            bodyA: Body,
            bodyB: Body,
            normal: Vector,
            tangent: Vector,
            normalImpulse,
            tangentImpulse,
            maxFriction,
            velocityPointA, // 刚体A质心相对碰撞点的速度
            velocityPointB, // 刚体B质心相对碰撞点的速度
            relativeVelocity, // 相对速度
            relativeNormalVelocity,
            relativeTangentVelocity,
            impulse = _tempVector3,
            i, j;

        for (i = 0; i < manifolds.length; i++) {
            manifold = manifolds[i];

            if(!manifold.isActive) continue;

            collision = manifold.collision;
            normal = collision.normal;
            tangent = collision.tangent;
            bodyA = collision.bodyA;
            bodyB = collision.bodyB;

            for(j = 0; j < collision.contacts.length; j++) {
                contact = collision.contacts[j];

                contact.offsetA.croNum(bodyA.angularVelocity, _tempVector1);
                contact.offsetB.croNum(bodyB.angularVelocity, _tempVector2);
                velocityPointA = bodyA.velocity.add(_tempVector1, _tempVector1);
                velocityPointB = bodyB.velocity.add(_tempVector2, _tempVector2);
                relativeVelocity = velocityPointB.sub(velocityPointA, _tempVector1);

                // 计算法向相对速度
                relativeNormalVelocity = normal.dot(relativeVelocity);
                // 计算法向冲量
                normalImpulse = (relativeNormalVelocity + contact.velocityBias) * contact.shareNormal;

                let frictionNormalImpulse = contact.normalImpulse;
                if(collision.isReuse && relativeNormalVelocity < 0 && relativeNormalVelocity ** 2 > this.restFactor) {
                    contact.normalImpulse = 0;
                }
                else {
                    // sequential impulse方法，收敛法向冲量
                    let oldNormalImpulse = contact.normalImpulse;
                    contact.normalImpulse = Math.max(oldNormalImpulse + normalImpulse, 0);
                    normalImpulse = contact.normalImpulse - oldNormalImpulse;
                }

                frictionNormalImpulse += normalImpulse;
                

                // 应用冲量
                impulse.x = normal.x * normalImpulse;
                impulse.y = normal.y * normalImpulse;

                bodyA.applyImpulse(impulse, contact.offsetA);
                bodyB.applyImpulse(impulse.inv(impulse), contact.offsetB); 
                
                // --------------------------------------------------------------------------------------------

                contact.offsetA.croNum(bodyA.angularVelocity, _tempVector1);
                contact.offsetB.croNum(bodyB.angularVelocity, _tempVector2);
                velocityPointA = bodyA.velocity.add(_tempVector1, _tempVector1);
                velocityPointB = bodyB.velocity.add(_tempVector2, _tempVector2);
                relativeVelocity = velocityPointB.sub(velocityPointA, _tempVector1);

                // 计算切向相对速度
                relativeTangentVelocity = tangent.dot(relativeVelocity);
                // 计算切向冲量
                tangentImpulse = relativeTangentVelocity * contact.shareTangent;
                // 计算最大摩擦力
                maxFriction = manifold.friction * frictionNormalImpulse;

                // sequential impulse方法，收敛切向冲量
                let oldTangentImpulse = contact.tangentImpulse;
                contact.tangentImpulse = Util.clamp(oldTangentImpulse + tangentImpulse, -maxFriction, maxFriction);
                tangentImpulse = contact.tangentImpulse - oldTangentImpulse;

                // 应用冲量
                impulse.x = tangent.x * tangentImpulse;
                impulse.y = tangent.y * tangentImpulse;

                bodyA.applyImpulse(impulse, contact.offsetA);
                bodyB.applyImpulse(impulse.inv(impulse), contact.offsetB); 
            }
        }
    }
}








