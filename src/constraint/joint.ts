import { Vector, _tempVector1, _tempVector2, _tempVector4 } from "../math/vector";
import { _tempMatrix1, _tempMatrix2, _tempMatrix3 } from "../math/matrix";
import { Joint } from "../joint/joint";
import { Body } from "../body/body";




/**
 * 弹簧（距离）约束
 */
export class JointConstraint {
    private biasFactor: number;

    constructor() {
        this.biasFactor = 0.2;
    }

    static create(bodyA: Body, bodyB: Body, stiffness: number): Joint {
        return new Joint(bodyA, bodyB, stiffness);
    }

    preSolveVelocity(joints: Joint[], dt: number) {
        for(let i = 0; i < joints.length; i++) {
            let joint = joints[i],
                bodyA = joint.bodyA,
                bodyB = joint.bodyB,
                rotationA = bodyA? bodyA.rotation: 0,
                rotationB = bodyB.rotation,
                invMassA = bodyA? bodyA.invMass: 0,
                invMassB = bodyB.invMass,
                invInertiaA = bodyA? bodyA.invInertia: 0,
                invInertiaB = bodyB.invInertia,
                rotA = _tempMatrix1.rotate(rotationA),
                rotB = _tempMatrix2.rotate(rotationB);
            
            joint.rA = rotA.multiplyVec(joint.offsetA, joint.rA);
            joint.rB = rotB.multiplyVec(joint.offsetB, joint.rB);

            let K1 = _tempMatrix1;
            K1.r1.x = invMassA + invMassB;
            K1.r1.y = 0;                                    
            K1.r2.x = 0;                                       
            K1.r2.y = invMassA + invMassB;
            
            let K2 = _tempMatrix2;
            K2.r1.x =  invInertiaA * joint.rA.y * joint.rA.y;
            K2.r1.y = -invInertiaA * joint.rA.x * joint.rA.y;
            K2.r2.x = -invInertiaA * joint.rA.x * joint.rA.y; 
            K2.r2.y =  invInertiaA * joint.rA.x * joint.rA.x;
        
            let K3 = _tempMatrix3;
            K3.r1.x =  invInertiaB * joint.rB.y * joint.rB.y;
            K3.r1.y = -invInertiaB * joint.rB.x * joint.rB.y;
            K3.r2.x = -invInertiaB * joint.rB.x * joint.rB.y; 
            K3.r2.y =  invInertiaB * joint.rB.x * joint.rB.x;
            
            let K = K1.add(K2, _tempMatrix1).add(K3, _tempMatrix1);
            K.r1.x += (1 - joint.stiffness);
            K.r2.y += (1 - joint.stiffness);

            joint.jointMatrix = K.invert();
            
            let p1 = joint.globalPositionA.add(joint.rA, _tempVector1),
                p2 = joint.globalPositionB.add(joint.rB, _tempVector2),
                dp = p2.sub(p1);

            joint.velocityBias.x = dp.x * (1 / dt) * -this.biasFactor;
            joint.velocityBias.y = dp.y * (1 / dt) * -this.biasFactor;

            bodyA.applyImpulse(joint.jointImpulse.inv(_tempVector4), joint.rA);
            bodyB.applyImpulse(joint.jointImpulse, joint.rB);
        }
    }

    solveVelocity(joints: Joint[]) {
        for(let i = 0; i < joints.length; i++) {
            let joint = joints[i],
                bodyA = joint.bodyA,
                bodyB = joint.bodyB,
                velocityA = bodyA? bodyA.velocity: new Vector(),
                velocityB = bodyB.velocity,
                angularVelocityA = bodyA? bodyA.angularVelocity: 0,
                angularVelocityB = bodyB.angularVelocity;

            joint.rA.croNum(angularVelocityA, _tempVector1);
            joint.rB.croNum(angularVelocityB, _tempVector2);

            let velocityPointA = velocityA.add(_tempVector1, _tempVector1),
                velocityPointB = velocityB.add(_tempVector2, _tempVector2),
                relativeVelocity = velocityPointB.sub(velocityPointA, _tempVector1),
                velocityBias = joint.velocityBias.sub(relativeVelocity),
                stiffnessImpulse = joint.jointImpulse.scl(1 - joint.stiffness),
                impulse = joint.jointMatrix.multiplyVec(velocityBias.sub(stiffnessImpulse));
            
            joint.jointImpulse.x += impulse.x;
            joint.jointImpulse.y += impulse.y;

            bodyA.applyImpulse(impulse.inv(_tempVector4), joint.rA);
            bodyB.applyImpulse(impulse, joint.rB);
        }
    }
};