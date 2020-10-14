import { Body } from "../body/body";
import { Vector } from "../math/vector";
import { Util } from "../common/util";
import { TimeStepper } from "./timeStepper";
import { Detector } from "../collision/detector";
import { Sleeping } from "./sleeping";
import { ManifoldTable } from "../collision/manifoldTable";
import { Collision, Manifold } from "../collision/manifold";
import { broadPhasePair } from "../collision/broadPhase";
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
        tickStart: () => void; 
        tickEnd: () => void;
        beforeUpdate: () => void;
        afterUpdate: () => void;
        beforeRender: () => void;
        afterRender: () => void;
        start: () => void;
        pause: () => void;
        collisionStart: (manifolds: Manifold[]) => void;
        collisionActive: (manifolds: Manifold[]) => void;
        collisionEnd: (manifolds: Manifold[]) => void;
    }
}


let TimeList = [],
    TestFlag = false;

let test = document.getElementById('test');

if(test) {
    test.addEventListener('click', () => {
        TestFlag = true;
    });
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
    // 引力缩放因子
    gravityScaler: number = 50;
    // 方法
    methods: EngineOpt['methods'];

    constructor(width: number, height: number, opt?: EngineOpt) {
        this.width = width || 0;
        this.height = height || 0;
        
        this.gravity = new Vector(0, 9);

        this.enableSleeping = true;
        this.enableCollisionDetection = true;
        this.enableCollisionResolve = true;

        this.methods = {
            tickStart: () => {},
            tickEnd: () => {},
            beforeUpdate: () => {},
            afterUpdate: () => {},
            beforeRender: () => {},
            afterRender: () => {},
            start: () => {},
            pause: () => {},
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
            let body = this.bodies[i];

            body.force.x += this.gravity.x * body.mass * this.gravityScaler;
            body.force.y += this.gravity.y * body.mass * this.gravityScaler;

            // 应用受力
            body.applyForce(body.force);
            // 积分受力
            body.integrateForces(dt);
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

            if(TestFlag) {
                if(TimeList.length < range) {
                    TimeList.push(end - start);
                }
                else {
                    let total = TimeList.reduce((t, cur) => {
                        return t + cur;
                    });
    
                    console.log(total / range);

                    TestFlag = false;
                    TimeList.length = 0;
                }
            }

            // console.log(collisions);
            
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
            this.bodies[i].reset();
        }

        this.manifoldTable.collisionStart.length && this.collisionStart();
        this.manifoldTable.collisionActive.length && this.collisionActive();
        this.manifoldTable.collisionEnd.length && this.collisionEnd();
    }

    /**
     * 渲染物理引擎
     * @param dt 
     */
    render(dt: number) {
        for(let i = 0; i < this.bodies.length; i++) {
            // 睡眠或者静态的刚体不用每一帧都渲染
            if(this.bodies[i].sleeping || this.bodies[i].static) {
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

    // ----------------------------------------------- hook --------------------------

    tickStart() { this.methods.tickStart(); } 

    tickEnd() { this.methods.tickEnd(); }

    beforeUpdate() { this.methods.beforeUpdate(); }

    afterUpdate() { this.methods.afterUpdate(); }

    beforeRender() { this.methods.beforeRender(); }

    afterRender() { this.methods.afterRender(); }

    start() { this.methods.start(); }

    pause() { this.methods.pause(); }

    collisionStart() { this.methods.collisionEnd(this.manifoldTable.collisionStart); }

    collisionActive() { this.methods.collisionEnd(this.manifoldTable.collisionActive); }

    collisionEnd() { this.methods.collisionEnd(this.manifoldTable.collisionEnd); }
}