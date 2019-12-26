import { Body } from "../body/body";
import { EngineOpt } from "./engine";
import { Util } from "../common/util";
import { Event } from "../event/eventEmitter";
import { Manifold } from "../collision/manifold";


/**
 * 休眠管理器
 */

export class Sleeping {

    // 判定休眠帧树阈值
    sleepThreshold: number;
    // 判定休眠动量阈值
    sleepMotionThreshold: number;
    // 判定唤醒动量阈值
    wakeMotionThreshold: number;
    // 偏差系数
    minBias: number;

    constructor(opt: EngineOpt) {
        this.sleepThreshold = 60;
        this.sleepMotionThreshold = 0.00001;
        this.wakeMotionThreshold = 0.008;

        Util.merge(this, opt);
    }

    /**
     * 使刚体睡眠
     * @param body 
     */
    sleep(body: Body) {
        body.sleeping = true;
        body.sleepCounter = this.sleepThreshold;

        body.prevPositionImpulse.x = 0;
        body.prevPositionImpulse.y = 0;
        body.positionImpulse.x = 0;
        body.positionImpulse.y = 0;

        body.velocity.x = 0;
        body.velocity.y = 0;
        body.angularVelocity = 0;

        body.speed = 0;
        body.angularSpeed = 0;
        body.motion = 0;

        Event.emit(body, 'sleepStart', body);
    }

    /**
     * 唤醒刚体
     * @param body 
     */
    wake(body: Body) {
        body.sleeping = false;
        body.sleepCounter = 0;
        Event.emit(body, 'sleepEnd', body);
    }

    /**
     * 改变刚体的状态，使其唤醒或休眠
     * @param bodies
     * @param timeScale 
     */
    update(bodies: Body[], timeScale: number) {
        let body: Body,
            i;

        for(i = 0; i < bodies.length; i++) {
            body = bodies[i];

            if(body.fixed) continue;

            let timeFactor = timeScale * timeScale * timeScale,
                motion = body.velocity.len() * body.velocity.len() + Math.abs(body.angularVelocity) * Math.abs(body.angularVelocity);

            // 若刚体合外力不为0，则唤醒
            if (body.force.x !== 0 || body.force.y !== 0) {
                this.wake(body);
                continue;
            }

            // 若刚体已经休眠，则返回
            if(body.sleeping) continue;

            // 若刚体动量 < 休眠阈值，则刚体休眠计算 + 1
            if (motion < this.sleepMotionThreshold * timeFactor) {
                body.sleepCounter += 1;

                // 若刚体休眠计数器达到休眠阈值，则进行休眠
                if (body.sleepCounter >= this.sleepThreshold) {
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
     * @param timeScale 
     */
    afterColiision(manifolds: Manifold[], timeScale: number) {
        let timeFactor = timeScale * timeScale * timeScale,
            manifold: Manifold,
            bodyA: Body, bodyB: Body;

        // wake up bodies involved in collisions
        for (var i = 0; i < manifolds.length; i++) {
            manifold = manifolds[i];
            bodyA = manifold.bodyA;
            bodyB = manifold.bodyB;
            
            // 若A为休眠状态且B的动量大于休眠阈值，唤醒A
            if(!bodyA.fixed && bodyA.sleeping && bodyB.motion > this.wakeMotionThreshold * timeFactor) {
                this.wake(bodyA);
                continue;
            }

            // B同理上面
            if(!bodyB.fixed && bodyB.sleeping && bodyA.motion > this.wakeMotionThreshold * timeFactor) {
                this.wake(bodyB);
                continue;
            }
        }
    }
}