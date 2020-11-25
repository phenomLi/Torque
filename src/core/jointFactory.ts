import { Body } from "../body/body";
import { JointConstraint } from "../constraint/joint";
import { Anchor } from "../joint/anchor";
import { Vector } from "../math/vector";



export const JointFactory = {

    /**
     * 创造关节约束
     * @param target 
     * @param body 
     * @param stiffness 
     */
    create(targetA: Body | Anchor, targetB: Body | Anchor, stiffness: number = 1) {
    
        if(targetA instanceof Anchor && targetB instanceof Anchor) {
            if(targetA.position.x === targetB.position.x && targetA.position.y === targetB.position.y) {
                targetB.body.setMask(targetA.anchorBody.mask);
                let joint = JointConstraint.create(targetA.anchorBody, targetB.body, 1);
                joint.anchors.push(targetA);
                
                targetB.setDiscard(true);
                joint.setNeedRender(false);

                return joint;
            }
            else {
                let joint = JointConstraint.create(targetA.anchorBody, targetB.anchorBody, stiffness);
                joint.anchors.push(targetA, targetB);
                return joint;
            }
        }

        if(targetA instanceof Anchor && targetB instanceof Body) {
            let joint = JointConstraint.create(targetA.anchorBody, targetB, stiffness);

            if(targetB.isContains(targetA.position.x, targetA.position.y)) {
                if(targetB.mask !== 0) {
                    targetA.anchorBody.setMask(targetB.mask);
                }
                else {
                    targetB.setMask(targetA.anchorBody.mask);
                }
                
                joint.setNeedRender(false);
            }

            joint.anchors.push(targetA);
            return joint;
        }

        if(targetA instanceof Body && targetB instanceof Anchor) {
            let joint = JointConstraint.create(targetA, targetB.anchorBody, stiffness);
            joint.anchors.push(targetB);
            return joint;
        }

        if(targetA instanceof Body && targetB instanceof Body) {
            return JointConstraint.create(targetA, targetB, stiffness);
        }
    },

    /**
     * 创造锚点
     * @param position
     * @param body 
     */
    anchor(position: Vector, body: Body = null): Anchor {
        if(body) {
            position.x += body.position.x;
            position.y += body.position.y;
        }

        return new Anchor(position, body);
    }
};

