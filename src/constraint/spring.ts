import { Vector } from "../math/vector";
import { Body } from "../body/body";
import { Util } from "../common/util";



export interface SpringOptions {
    target?: [Vector, Vector];
    body?: [Body, Body];
    stiffness?: number;
    damping?: number;
}



export class Spring {
    id: number;
    body: [Body, Body];
    target: [Vector, Vector];
    stiffness: number;
    damping: number;
    length: number;

    constructor(options: SpringOptions) {
        this.body = options.body;
        this.target = options.target;

        // 若没有设定点却设定了物体，使用物体的质心（局部坐标）
        if (this.body[0] && !this.target[0])
            this.target[0] = new Vector(0, 0);
        if (this.body[1] && !this.target[1])
            this.target[1] = new Vector(0, 0);

        // 初始化目标点
        const initialPointA: Vector = this.body[0] ? this.body[0].position.add(this.target[0]) : this.target[0],
              initialPointB: Vector = this.body[1] ? this.body[1].position.add(this.target[1]) : this.target[1],
              length = initialPointA.sub(initialPointB).len();

        this.id = Util.id();
        this.length = length;
        this.stiffness = options.stiffness || (this.length > 0 ? 1 : 0.7);
        this.damping = options.damping || 0;
    }
}



/**
 * 弹簧（距离）约束
 */
export class SpringConstraint {
    create(opt: SpringOptions): Spring {
        return new Spring(opt);
    }

    solveVelocity(spring: Spring) {
        let bodyA = spring.body[0],
            bodyB = spring.body[1],
            targetA = spring.target[0],
            targetB = spring.target[1];

        if (!bodyA && !bodyB)
            return;

        let curPosA = targetA,
            curPosB = targetB;

        // 求当前目标点的世界坐标位置
        if(bodyA) curPosA = bodyA.position.add(curPosA);
        if(bodyB) curPosB = bodyB.position.add(curPosB);

        if (!curPosA || !curPosB)
            return;

        let delta = curPosA.sub(curPosB),
            curLength = delta.len();

        // solve distance constraint with Gauss-Siedel method
        let difference = (curLength - spring.length) / curLength,
            stiffness = spring.stiffness,
            force = delta.scl(-difference * stiffness),
            massTotal = (bodyA? bodyA.invMass: 0) + (bodyB? bodyB.invMass: 0),
            inertiaTotal = (bodyA? bodyA.invInertia: 0) + (bodyB? bodyB.invInertia: 0),
            resistanceTotal = massTotal + inertiaTotal,
            torque,
            share,
            normal = delta.scl(1 / curLength),
            normalVelocity,
            relativeVelocity;

        if (spring.damping) {
            let zero = new Vector(),
                vB = bodyB? bodyB.velocity: zero,
                vA = bodyA? bodyA.velocity: zero;
               
            relativeVelocity = vB.sub(vA);
            normalVelocity = normal.dot(relativeVelocity);
        }

        // if (bodyA && !bodyA.fixed) {
        //     share = bodyA.invMass / massTotal;

        //     // keep track of applied impulses for post solving
        //     bodyA.constraintImpulse.x -= force.x * share;
        //     bodyA.constraintImpulse.y -= force.y * share;

        //     // apply forces
        //     bodyA.position.x -= force.x * share;
        //     bodyA.position.y -= force.y * share;

        //     // apply damping
        //     if (spring.damping) {
        //         bodyA.positionPrev.x -= constraint.damping * normal.x * normalVelocity * share;
        //         bodyA.positionPrev.y -= constraint.damping * normal.y * normalVelocity * share;
        //     }

        //     // apply torque
        //     torque = (Vector.cross(pointA, force) / resistanceTotal) * Constraint._torqueDampen * bodyA.inverseInertia * (1 - constraint.angularStiffness);
        //     bodyA.constraintImpulse.angle -= torque;
        //     bodyA.angle -= torque;
        // }

        // if (bodyB && !bodyB.isStatic) {
        //     share = bodyB.inverseMass / massTotal;

        //     // keep track of applied impulses for post solving
        //     bodyB.constraintImpulse.x += force.x * share;
        //     bodyB.constraintImpulse.y += force.y * share;
            
        //     // apply forces
        //     bodyB.position.x += force.x * share;
        //     bodyB.position.y += force.y * share;

        //     // apply damping
        //     if (constraint.damping) {
        //         bodyB.positionPrev.x += constraint.damping * normal.x * normalVelocity * share;
        //         bodyB.positionPrev.y += constraint.damping * normal.y * normalVelocity * share;
        //     }

        //     // apply torque
        //     torque = (Vector.cross(pointB, force) / resistanceTotal) * Constraint._torqueDampen * bodyB.inverseInertia * (1 - constraint.angularStiffness);
        //     bodyB.constraintImpulse.angle += torque;
        //     bodyB.angle += torque;
        // }

    }
};