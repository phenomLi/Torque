import { Body } from "../body/body";
import { Vector } from "../math/vector";
import { Util } from "../common/util";
import { TimeStepper } from "./timeStepper";
import { Detector } from "../collision/detector";
import { Resolver } from "../resolver/resolver";
import { Sleeping } from "./sleeping";
import { ManifoldTable } from "../collision/manifoldTable";
import { Collision, Manifold } from "../collision/manifold";
import { broadPhasePair } from "../collision/broadPhase";
import { Event } from "../event/eventEmitter";


/**
 * 主引擎
 */



// 引擎相关配置项
export interface EngineOpt {
    // 帧率
    fps: number;
    // 是否固定步长
    deltaFixed: boolean;
    // 时间缩放
    timeScale: number;

    // 是否开启碰撞检测
    enableColllisionDetection: boolean;
    // 是否开启碰撞求解
    enableCollisionResolve: boolean;
    // 是否开启休眠
    enableSleeping: boolean;
    // 是否开启粗检查
    enableBroadPhase: boolean;
    // 是否开启缓存
    enbaleCache: boolean;
    // 是否开启缓存移除
    enableCacheRemove: boolean;

    // 重力
    gravity: Vector;
    
    // 判定休眠帧树阈值
    sleepThreshold: number;
    // 判定休眠动量阈值
    sleepMotionThreshold: number;
    // 判定唤醒动量阈值
    wakeMotionThreshold: number;
    // 缓存移除时间阈值
    cacheRemoveThreshold: number;

    // 允许穿透深度
    slop: number;
    // 位置修正因子
    correctionFactor: number;
    // 碰撞求解迭代次数
    collisionIterations: number;
    // 约束求解迭代次数
    constraintIterations: number;
    // 热启动
    enableWarmStart: boolean;

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
    // 模拟窗口宽度
    width: number;
    // 模拟窗口高度
    height: number;

    // 是否开启休眠机制
    enableSleeping: boolean;
    // 是否开启碰撞检测
    enableColllisionDetection: boolean;
    // 是否开启碰撞求解
    enableCollisionResolve: boolean;
    // 是否开启粗检查
    enableBroadPhase: Boolean;

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
    // 约束求解器
    resolver: Resolver;
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
        
        this.gravity = new Vector(0, 8);

        this.enableSleeping = true;
        this.enableColllisionDetection = true;
        this.enableCollisionResolve = true;
        this.enableBroadPhase = true;

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
        this.resolver = new Resolver(this, opt);
        this.sleeping = new Sleeping(opt);
    }

    
    /**
     * 引擎更新
     * @param dt 步长
     * @param timeScale 时间缩放系数
     * @param timeStamp 时间戳
     */
    update(dt: number, timeScale: number, timeStamp: number) {
        let broadPhasePair: broadPhasePair[] = [],
            collisions: Collision[] = [];

        if(this.enableSleeping) {
            // 更新刚体的休眠/唤醒状态
            this.sleeping.update(this.bodies, timeScale);
        }

        // 更新所有刚体
        this.updateBodies(dt, timeScale);

        // 解决所有约束
        this.resolver.solveConstraint();

        // 是否开启碰撞检测
        if(this.enableColllisionDetection) {
            
            // 粗阶段检测
            broadPhasePair = this.detector.broadPhase.detect(this.bodies);
            // 细阶段检测
            collisions = this.detector.narrowPhase.detect(broadPhasePair);
            
            this.manifoldTable.update(collisions, timeStamp);
            // 移除缓存表超时的碰撞对
            this.manifoldTable.filter(timeStamp);

            console.log(collisions);

            // 是否开启了碰撞求解
            if(this.enableCollisionResolve) {
                // 若发现有休眠的刚体发生碰撞，则唤醒
                if (this.enableSleeping)
                   this.sleeping.afterColiision(this.manifoldTable.list, timeScale);

                // 求解碰撞约束
                this.resolver.solveCollision(this.manifoldTable.list, timeScale);
            }
        }

        this.manifoldTable.collisionStart.length && 
        Event.emit(this, 'collisionStart', this.manifoldTable.collisionStart);

        this.manifoldTable.collisionActive.length && 
        Event.emit(this, 'collisionActive', this.manifoldTable.collisionActive);

        this.manifoldTable.collisionEnd.length && 
        Event.emit(this, 'collisionEnd', this.manifoldTable.collisionEnd);

        // 清除所有刚体受力
        this.clearForce();
    }

    /**
     * 更新所有刚体
     * @param dt 
     * @param timeScale 
     * @param correction 
     */
    updateBodies(dt: number, timeScale: number) {
        for(let i = 0; i < this.bodies.length; i++) {
            // 应用重力
            this.bodies[i].applyForce(this.gravity.scl(this.bodies[i].mass * 0.001));
            // 不更新固定或者休眠的刚体
            if(this.bodies[i].fixed || this.bodies[i].sleeping) continue;
            // 更新物理属性
            this.bodies[i].updatePhysics(dt, timeScale);
        }
    }

    /**
     * 渲染物理引擎
     * @param dt 
     * @param timeScale 
     * @param correction 
     */
    render(dt: number, timeScale: number, correction: number) {
        for(let i = 0; i < this.bodies.length; i++) {
            // 渲染刚体
            this.bodies[i].render(this.bodies[i], dt, timeScale, correction);
        }
    }

    /**
     * 清除刚体的所有作用力
     */
    clearForce() {
        for(let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].force.set(0, 0);
            this.bodies[i].torque = 0;
        }
    }

    /**
     * 设置引擎参数
     * @param opt 
     */
    setOption(opt: EngineOpt) {
        Util.merge(this, opt);
        Util.merge(this.timeStepper, opt);
        Util.merge(this.manifoldTable, opt);
        Util.merge(this.resolver, opt);
    }
}