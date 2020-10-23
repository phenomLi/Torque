import { Body } from "../body/body";
import { EngineOpt } from "./engine";
import { Util } from "../common/util";
import { Manifold } from "../collision/manifold";


/**
 * 休眠管理器
 */

export class Sleeping {

    // 判定休眠的时间阈值
    sleepDelayThreshold: number;
    // 判定休眠动量阈值
    sleepMotionThreshold: number;
    // 判定唤醒动量阈值
    wakeMotionThreshold: number;
    // 偏差系数
    minBias: number;

    constructor(opt: EngineOpt) {
        this.sleepDelayThreshold = 60;
        this.sleepMotionThreshold = 0.0008;
        this.wakeMotionThreshold = 0.7;

        Util.merge(this, opt);
    }

    /**
     * 使刚体睡眠
     * @param body 
     */
    sleep(body: Body) {
        if(body.kinetic) return;

        body.sleeping = true;
        body.sleepCounter = this.sleepDelayThreshold;

        body.velocity.x = 0;
        body.velocity.y = 0;
        body.angularVelocity = 0;
        body.motion = 0;

        body.sleepStart();

        if(body.parts[0] !== body) {
            for(let i = 0; i < body.parts.length; i++) {
                this.sleep(body.parts[i]);
            }
        }
    }

    /**
     * 唤醒刚体
     * @param body 
     */
    wake(body: Body) {
        if(body.static) return;

        body.sleeping = false;
        body.sleepCounter = 0;

        body.sleepEnd();

        if(body.parts[0] !== body) {
            for(let i = 0; i < body.parts.length; i++) {
                this.wake(body.parts[i]);
            }
        }
    }

    /**
     * 改变刚体的状态，使其唤醒或休眠
     * @param bodies
     */
    update(bodies: Body[]) {
        let body: Body,
            i;

        for(i = 0; i < bodies.length; i++) {
            body = bodies[i];

            let motion = body.motion;

            // 若刚体合外力不为0，则唤醒
            if (body.force.x !== 0 || body.force.y !== 0) {
                this.wake(body);
                continue;
            }

            // 若刚体已经休眠，则返回
            if(body.sleeping) continue;

            // 若刚体动量 < 休眠阈值，则刚体休眠计算 + 1
            if (motion < this.sleepMotionThreshold) {
                body.sleepCounter += 1;

                // 若刚体休眠计数器达到休眠阈值，则进行休眠
                if (body.sleepCounter >= this.sleepDelayThreshold) {
                    this.sleep(body);
                }
            } 
            else {
                if (body.sleepCounter > 0) {
                    body.sleepCounter -= 1;
                }
            }
        }
    }

    /**
     * 刚体碰撞后，判断是否需要唤醒
     * @param manifolds
     */
    afterCollision(manifolds: Manifold[]) {
        let manifold: Manifold,
            bodyA: Body, bodyB: Body;

        // wake up bodies involved in collisions
        for (var i = 0; i < manifolds.length; i++) {
            manifold = manifolds[i];
            bodyA = manifold.bodyA;
            bodyB = manifold.bodyB;

            // 若A为休眠状态且B的动量大于休眠阈值，唤醒A
            if(bodyB.kinetic || bodyA.sleeping && bodyB.motion > this.wakeMotionThreshold) {
                this.wake(bodyA);
                continue;
            }

            // B同理上面
            if(bodyA.kinetic || bodyB.sleeping && bodyA.motion > this.wakeMotionThreshold) {
                this.wake(bodyB);
                continue;
            }
        }
    }
}