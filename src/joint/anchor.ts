import { Body } from "../body/body";
import { JointConstraint } from "../constraint/joint";
import { BodiesFactory } from "../core/bodiesFactory";
import { Vector } from "../math/vector";
import { Joint } from "./joint";



export class Anchor {
    body: Body;
    anchorBody: Body;
    position: Vector;
    joint: Joint;
    discard: boolean;

    private anchorRadius = 3;
    private anchorMass = 5;

    constructor(position: Vector, body: Body = null) {
        this.body = body;
        this.joint = null;
        this.discard = false;

        this.anchorBody = BodiesFactory.Circle(position.x, position.y, this.anchorRadius, { 
            mass: this.anchorMass,
            static: this.body? false: true,
            mask: parseFloat(Math.random().toFixed(3)) 
        });

        this.position = this.anchorBody.position;

        if(this.body) {
            this.joint = JointConstraint.create(this.anchorBody, this.body, 1);
            this.joint.needRender = false;
            this.body.setMask(this.anchorBody.mask);
        }
    }

    setDiscard(discard: boolean) {
        this.discard = discard;
    }

    setRender(fn: (body: Body, dt: number, timeStamp: number) => void) {
        this.anchorBody.setRender(fn);
    }
}