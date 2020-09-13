import { Body } from "../body/body";
import { Vector } from "../math/vector";
import { Util } from "../common/util";
import { TimeStepper } from "./timeStepper";
import { Detector } from "../collision/detector";
import { Sleeping } from "./sleeping";
import { ManifoldTable } from "../collision/manifoldTable";
import { Collision, Manifold } from "../collision/manifold";
import { broadPhasePair } from "../collision/broadPhase";
import { Event } from "../event/eventEmitter";
import { ContactConstraint } from "../constraint/contact";


/**
 * 主引擎
 */



// 引擎相关配置项
export interface EngineOpt {
    // 帧率
    fps: number;
    // 是否固定步长
    deltaFixed: boolean;

    // 是否开启碰撞检测
    enableColllisionDetection: boolean;
    // 是否开启碰撞求解
    enableCollisionResolve: boolean;
    // 是否开启休眠
    enableSleeping: boolean;
    // 是否开启缓存
    enableCache: boolean;

    // 重力
    gravity: Vector;

    // 方法
    methods: {
        onTickStart: () => void; 
        onTickEnd: () => void;
        beforeUpdate: () => void;
        afterUpdate: () => void;
        beforeRender: () => void;
        afterRender: () => void;
        onStart: () => void;
        onPause: () => void;
        collisionStart: (manifolds: Manifold[]) => void;
        collisionActive: (manifolds: Manifold[]) => void;
        collisionEnd: (manifolds: Manifold[]) => void;
    }
}


// 主引擎
export class Engine {

    testFlag: boolean = false;
    timeList: number[] = [];

    // 模拟窗口宽度
    width: number;
    // 模拟窗口高度
    height: number;

    // 是否开启休眠机制
    enableSleeping: boolean;
    // 是否开启碰撞检测
    enableCollisionDetection: boolean;
    // 是否开启碰撞求解
    enableCollisionResolve: boolean;

    // 重力
    gravity: Vector;

    // 刚体列表
    bodies: Body[];
    // 时间步迭代器
    timeStepper: TimeStepper;
    // 碰撞检测器
    detector: Detector;
    // 流形表
    manifoldTable: ManifoldTable;
    // 接触约束
    contactConstraint: ContactConstraint;
    // 休眠管理器
    sleeping: Sleeping;
    // 方法
    methods: {
        onTickStart: () => void; 
        onTickEnd: () => void;
        beforeUpdate: () => void;
        afterUpdate: () => void;
        beforeRender: () => void;
        afterRender: () => void;
        onStart: () => void;
        onPause: () => void;
        collisionStart: (manifolds: Manifold[]) => void;
        collisionActive: (manifolds: Manifold[]) => void;
        collisionEnd: (manifolds: Manifold[]) => void;
    }

    constructor(width: number, height: number, opt?: EngineOpt) {
        this.width = width || 0;
        this.height = height || 0;
        
        this.gravity = new Vector(0, 9);

        this.enableSleeping = true;
        this.enableCollisionDetection = true;
        this.enableCollisionResolve = true;

        this.methods = {
            onTickStart: () => {},
            onTickEnd: () => {},
            beforeUpdate: () => {},
            afterUpdate: () => {},
            beforeRender: () => {},
            afterRender: () => {},
            onStart: () => {},
            onPause: () => {},
            collisionStart: (manifolds: Manifold[]) => {},
            collisionActive: (manifolds: Manifold[]) => {},
            collisionEnd: (manifolds: Manifold[]) => {}
        }

        Util.merge(this, opt);

        this.bodies = [];
        this.timeStepper = new TimeStepper(this, opt);
        this.detector = new Detector(this, opt);
        this.manifoldTable = new ManifoldTable(opt);
        this.contactConstraint = new ContactConstraint();
        this.sleeping = new Sleeping(opt);
    }

    
    /**
     * 引擎更新
     * @param dt 步长
     * @param timeStamp 时间戳
     */
    update(dt: number, timeStamp: number) {
        let broadPhasePair: broadPhasePair[] = [],
            collisions: Collision[] = [];

        if(this.enableSleeping) {
            // 更新刚体的休眠/唤醒状态
            this.sleeping.update(this.bodies);
        }

        for(let i = 0; i < this.bodies.length; i++) {
            let force = this.gravity.scl(this.bodies[i].mass * 50);

            // 应用受力
            this.bodies[i].applyForce(force);
            // 积分受力
            this.bodies[i].integrateForces(dt);
        }

        // 解决所有约束
        // this.resolver.solveConstraint();

        // 是否开启碰撞检测
        if(this.enableCollisionDetection) {
            
            // 粗阶段检测
            broadPhasePair = this.detector.broadPhase.detect(this.bodies);

            let start = performance.now();

            // 细阶段检测
            collisions = this.detector.narrowPhase.detect(broadPhasePair);

            let end = performance.now(),
                range = 60;

            if(this.testFlag) {
                if(this.timeList.length < range) {
                    this.timeList.push(end - start);
                }
                else {
                    let total = this.timeList.reduce((t, cur) => {
                        return t + cur;
                    });
    
                    console.log(total / range);
                    this.testFlag = false;
                    this.timeList.length = 0;
                }
            }

            //console.log(collisions);
            
            this.manifoldTable.update(collisions, timeStamp);
            // 移除缓存表超时的碰撞对
            this.manifoldTable.filter(timeStamp);

            // 是否开启了碰撞求解
            if(this.enableCollisionResolve) {
                // 若发现有休眠的刚体发生碰撞，则唤醒
                if (this.enableSleeping)
                   this.sleeping.afterCollision(this.manifoldTable.list);

                // 求解碰撞约束
                this.contactConstraint.solve(this.manifoldTable.list, dt);
            }
        }

        for(let i = 0; i < this.bodies.length; i++) {
            // 积分速度
            this.bodies[i].integrateVelocities(dt);
        }

        this.manifoldTable.collisionStart.length && 
        Event.emit(this, 'collisionStart', this.manifoldTable.collisionStart);

        this.manifoldTable.collisionActive.length && 
        Event.emit(this, 'collisionActive', this.manifoldTable.collisionActive);

        this.manifoldTable.collisionEnd.length && 
        Event.emit(this, 'collisionEnd', this.manifoldTable.collisionEnd);
    }

    /**
     * 渲染物理引擎
     * @param dt 
     */
    render(dt: number) {
        for(let i = 0; i < this.bodies.length; i++) {
            if(this.bodies[i].sleeping || this.bodies[i].fixed) {
                continue;
            }

            // 渲染刚体
            this.bodies[i].render(this.bodies[i], dt);
        }
    }

    /**
     * 设置引擎参数
     * @param opt 
     */
    setOption(opt: EngineOpt) {
        Util.merge(this, opt);
        Util.merge(this.timeStepper, opt);
    }

    test() {
        this.testFlag = true;
    }
}