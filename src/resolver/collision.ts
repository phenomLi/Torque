import { Resolver } from "./resolver";
import { Body } from "../body/body";
import { Vector } from "../math/vector";
import { Util } from "../common/util";
import { Manifold, Collision, Contact } from "../collision/manifold";



/**
 * 碰撞求解器
 */

export class CollisionSolver {
    private resolver: Resolver;

    constructor(resolver: Resolver) {
        this.resolver = resolver;
    }

    /**
     * 预求解位置修正
     * 主要工作：计算刚体的碰撞点个数
     * @param manifolds
     */
    preSolvePosition(manifolds: Manifold[]) {
        var i,
            manifold: Manifold,
            count;

        // 保存碰撞点个数
        for (i = 0; i < manifolds.length; i++) {
            manifold = manifolds[i];
            
            if(!manifold.isActive) continue;

            count = manifold.contacts.length;
            manifold.bodyA.totalContacts += count;
            manifold.bodyB.totalContacts += count;
        }
    };

    /**
     * 求解位置修正
     * 主要工作：计算修正位置穿透的冲量大小
     * @param manifolds
     * @param bodies 
     * @param timeScale 
     */
    solvePosition(manifolds: Manifold[], bodies: Body[], timeScale: number) {
        let body: Body,
            manifold: Manifold,
            collision: Collision,
            bodyA: Body,
            bodyB: Body,
            normal: Vector,
            separation: number,
            penetration: Vector,
            positionImpulseBtoA,
            positionImpulseA,
            positionImpulseB,
            positionImpulse,
            contactShare,
            impulseCoefficient = timeScale * this.resolver.positionDampen,
            i;

        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];
            body.prevPositionImpulse.x = body.positionImpulse.x;
            body.prevPositionImpulse.y = body.positionImpulse.y;
        }

        // 求解位置修正的冲量
        for (i = 0; i < manifolds.length; i++) {
            manifold = manifolds[i];

            if(!manifold.isActive) continue;

            collision = manifold.collision;
            bodyA = collision.bodyA;
            bodyB = collision.bodyB;
            normal = collision.normal;

            positionImpulseA = bodyA.prevPositionImpulse;
            positionImpulseB = bodyB.prevPositionImpulse;

            penetration = collision.normal.scl(collision.depth);

            positionImpulseBtoA = positionImpulseB.sub(positionImpulseA).add(penetration);

            separation = normal.dot(positionImpulseBtoA);

            positionImpulse = (separation - this.resolver.slop);

            if (bodyA.fixed || bodyB.fixed)
                positionImpulse *= 2;
            
            if (!(bodyA.fixed || bodyA.sleeping)) {
                contactShare = 0.9 * positionImpulse / bodyA.totalContacts;
                bodyA.positionImpulse.x += normal.x * contactShare;
                bodyA.positionImpulse.y += normal.y * contactShare;
            }

            if (!(bodyB.fixed || bodyB.sleeping)) {
                contactShare = 0.9 * positionImpulse / bodyB.totalContacts;
                bodyB.positionImpulse.x -= normal.x * contactShare;
                bodyB.positionImpulse.y -= normal.y * contactShare;
            }
        }
    };

    /**
     * 后求解位置修正
     * 主要工作：应用位置修正冲量
     * @param bodies 
     * @param dt
     */
    postSolvePosition(bodies: Body[]) {
        let body: Body,
            i;

        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];

            // 重置碰撞点计数器
            body.totalContacts = 0;

            if (body.positionImpulse.x !== 0 || body.positionImpulse.y !== 0) {
                body.translate(body.positionImpulse);

                body.position.x += body.positionImpulse.x;
                body.position.y += body.positionImpulse.y;

                //body.velocity = body.velocity.add(body.positionImpulse.scl(0.001));

                if (body.positionImpulse.dot(body.velocity) <= 0) {
                    body.positionImpulse.x = 0;
                    body.positionImpulse.y = 0;
                } else {
                    body.positionImpulse.x *= this.resolver.positionWarming;
                    body.positionImpulse.y *= this.resolver.positionWarming;
                }
            }
        }
    };



    /**
     * 预处理
     * @param manifolds 碰撞流形
     * @param dt 步长
     * @param timeScale 缩放系数
     */
    preSolveVelocity(manifolds: Manifold[]) {
        let manifold: Manifold,
            collision: Collision,
            contact: Contact,
            bodyA: Body,
            bodyB: Body,
            normal: Vector,
            tangent: Vector,
            contactNum, i, j;

        for (i = 0; i < manifolds.length; ++i) {
            manifold = manifolds[i];

            if(!manifold.isActive) continue;

            collision = manifold.collision;
            normal = collision.normal;
            tangent = collision.tangent;
            bodyA = collision.bodyA;
            bodyB = collision.bodyB;
            contactNum = manifold.contacts.length;

            for(j = 0; j < collision.contacts.length; j++) {
                contact = collision.contacts[j];

                // 接触点到刚体A质心的距离
                contact.offsetA = contact.vertex.sub(bodyA.position),
                // 接触点到刚体B质心的距离
                contact.offsetB = contact.vertex.sub(bodyB.position);
                
                let invMassNormal = manifold.inverseMass,
                    invMassTangent = manifold.inverseMass,
                    offsetCorssNormalA = contact.offsetA.cor(normal),
                    offsetCorssNormalB = contact.offsetB.cor(normal),
                    offsetCorssTangentA = contact.offsetA.cor(tangent),
                    offsetCorssTangentB = contact.offsetB.cor(tangent);

                // 计算 J(M^-1)(J^T).
                invMassNormal += (bodyA.invInertia * offsetCorssNormalA**2 + bodyB.invInertia * offsetCorssNormalB**2);
                invMassTangent += (bodyA.invInertia * offsetCorssTangentA**2 + bodyB.invInertia * offsetCorssTangentB**2);

                // 保存 J(M^-1)(J^T)得倒数
                contact.shareNormal = 1 / (invMassNormal * contactNum);
                contact.shareTangent = 1 / (invMassTangent * contactNum);

                let normalImpulse = contact.vertex.normalImpulse,
                    tangentImpulse = contact.vertex.tangentImpulse,
                    impulse = new Vector();

                if (normalImpulse !== 0 || tangentImpulse !== 0) {
                    // total impulse from contact
                    impulse.x = (normal.x * normalImpulse) + (tangent.x * tangentImpulse);
                    impulse.y = (normal.y * normalImpulse) + (tangent.y * tangentImpulse);
                    
                    // apply impulse from contact
                    !bodyA.sleeping && bodyA.applyImpulse(impulse, contact.offsetA);
                    !bodyB.sleeping && bodyB.applyImpulse(impulse.inv(), contact.offsetB); 
                }
            }
        }

    }
    
    /**
     * 正式处理
     * 使用sequential impulse进行快速收敛
     * 参考：https://kevinyu.net/2018/01/17/understanding-constraint-solver-in-physics-engine/
     * @param manifolds
     * @param timeScale 
     */
    solveVelocity(manifolds: Manifold[], timeScale: number) {
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
            relativeNormal,
            relativeTangent,
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

                let velocityPointA = bodyA.velocity.add(contact.offsetA.nor().scl(bodyA.angularVelocity)),
                    // 接触点相对B的速度
                    velocityPointB = bodyB.velocity.add(contact.offsetB.nor().scl(bodyB.angularVelocity)),
                    // 相对速度
                    relativeVelocity = velocityPointA.sub(velocityPointB);

                // 计算法向速度
                relativeNormal = normal.dot(relativeVelocity);
                // 计算法向冲量
                normalImpulse = -(1 + manifold.restitution) * relativeNormal * contact.shareNormal;

                // sequential impulse方法，收敛法向冲量
                let oldNormalImpulse = contact.vertex.normalImpulse;
                contact.vertex.normalImpulse = Math.max(contact.vertex.normalImpulse + normalImpulse, 0);
                normalImpulse = contact.vertex.normalImpulse - oldNormalImpulse;

                // // 应用冲量
                !bodyA.sleeping && bodyA.applyImpulse(normal.scl(normalImpulse), contact.offsetA);
                !bodyB.sleeping && bodyB.applyImpulse(normal.scl(-normalImpulse), contact.offsetB); 
                
                velocityPointA = bodyA.velocity.add(contact.offsetA.nor().scl(bodyA.angularVelocity));
                // 接触点相对B的速度
                velocityPointB = bodyB.velocity.add(contact.offsetB.nor().scl(bodyB.angularVelocity));
                // 相对速度
                relativeVelocity = velocityPointA.sub(velocityPointB);
                // 计算切向速度
                relativeTangent = tangent.dot(relativeVelocity);
                // 计算切向冲量
                tangentImpulse = -relativeTangent * contact.shareTangent;
                // 计算最大摩擦力
                maxFriction = manifold.friction * contact.vertex.normalImpulse;

                // sequential impulse方法，收敛切向冲量
                let oldTangentImpulse = contact.vertex.tangentImpulse;
                contact.vertex.tangentImpulse = Util.clamp(contact.vertex.tangentImpulse + tangentImpulse, -maxFriction, maxFriction);
                tangentImpulse = contact.vertex.tangentImpulse - oldTangentImpulse;

                // 应用冲量
                !bodyA.sleeping && bodyA.applyImpulse(tangent.scl(tangentImpulse), contact.offsetA);
                !bodyB.sleeping && bodyB.applyImpulse(tangent.scl(-tangentImpulse), contact.offsetB); 
            }
        }
    }
    
}



