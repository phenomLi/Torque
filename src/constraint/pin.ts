import { Body } from "../body/body";
import { Vector, _tempVector4 } from "../math/vector";
import { Constraint } from "./constraint";


export interface PinOptions {
    body: Body;
    position?: Vector;
    target: Vector;
    rotationRange?: [number, number];
};


export class Pin {
    body: Body;
    position: Vector;
    target: Vector;
    rotationRange: [number, number];

    constructor(opt: PinOptions) {
        this.body = opt.body;
        this.position = opt.position || new Vector(0, 0);
        this.target = opt.target;
        this.rotationRange = opt.rotationRange;

        if(Array.isArray(opt.rotationRange)) {
            this.rotationRange = [opt.rotationRange[0] % (Math.PI * 2), opt.rotationRange[1] % (Math.PI * 2)];
        }

        let targetBodyPosition = this.target.sub(this.position, _tempVector4),
            dx = targetBodyPosition.x - this.body.position.x,
            dy = targetBodyPosition.y - this.body.position.y;

        this.body.pinConstraint = this;
        this.body.rotateCenter = this.position;
        
        this.body.position.x += dx;
        this.body.position.y += dy;
        this.body.translate(dx, dy);
    }
}


export class PinConstraint extends Constraint {
    constructor() {
        super();
    }

    create(opt: PinOptions): Pin {
        return new Pin(opt);
    }

    solve(bodies: Body[], dt: number) {
        let body: Body, 
            pinConstraint: Pin;

        for(let i = 0; i < bodies.length; i++) {
            if(body.pinConstraint === null) continue;

            body = bodies[i];
            pinConstraint = body.pinConstraint;

            body.velocity.x = 0;
            body.velocity.y = 0;

            if(pinConstraint.rotationRange !== undefined) {
                
            } 
        }
    }
}




