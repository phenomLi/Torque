/**
 * 刚体基类：所有刚体继承自Body
 */

import { Vector } from "../math/vector";
import { Bound } from "../collision/bound";
import { Util } from "../common/util";
import { Engine } from "../core/engine";
import { Event } from "../event/eventEmitter";
import { TimeStepper } from "../core/timeStepper";



/**
 * 刚体类型
 * 圆形：0
 * 多边形：1
 * 胶囊体：2
 * 平面：3
 * 复合体：4
 */
export enum bodyType {
    circle = 0,
    polygon = 1,
    capsule = 2,
    composite = 3
};




// body配置接口
export interface BodyOpt {
    // 定位原点
    origin: Vector;
    // 旋转角度
    rotation?: number;

    // 初始速度
    velocity?: Vector;
    // 初始角速度
    angularVelocity?: number;
    // 质量
    mass?: number;
    // 动摩擦力
    dynamicFriction?: number;
    // 静摩擦力
    staticFriction?: number;
    // 恢复系数
    restitution?: number;
    // 约束
    constraint?: Vector;
    // 是否固定
    fixed?: boolean;
    // 携带的数据
    data?: any;
    // 碰撞码
    mask?: number;

    // 方法
    methods?: {
        // 碰撞过滤器
        filter: (maskA: number, maskB: number) => boolean;
        // 挂载前
        beforeAppend: (body: Body) => void;
        // 挂载后
        afterAppend: (body: Body) => void;
        // 移除前
        beforeRemove: (body: Body) => void;
        // 移除后
        afterRemove: (body: Body) => void;
        // 开始休眠
        sleepStart: (body: Body) => void;
        // 结束休眠
        sleepEnd: (body: Body) => void;
    }
}


export class Body {
    // id
    id: number;
    // 类型
    type: number;
    // 引擎实例
    engine: Engine;
    // 携带的任意信息
    data: any;
    // 本地坐标原点
    origin: Vector;
    // 位置
    position: Vector;   
    // 方向 
    rotation: number;

    // 速度
    velocity: Vector;
    // 角速度
    angularVelocity: number;
    // 速度（无符号标量）
    speed: number;
    // 角速度（无符号标量）
    angularSpeed: number;
    // 动量
    motion: number;

    // 质量
    mass: number;
    // 质量倒数
    invMass: number;
    // 面积
    area: number;
    // 密度
    density: number;
    // 转动惯量
    inertia: number;
    // 转动惯量倒数
    invInertia: number;
    // 作用力
    force: Vector;
    // 扭矩
    torque: number;
    // 摩擦系数
    friction: number;
    // 恢复系数
    restitution: number;
    // 约束点
    constraint: Vector;
    // 固定
    fixed: boolean;
    // 休眠
    sleeping: boolean;
    // 休眠计数器
    sleepCounter: number;
    // 刚体所受的碰撞个数
    collisionNum: number;
    // 碰撞码
    mask: number;
    // 子图形
    parts;
    // 包围盒
    bound: Bound;

    // 方法
    methods: {
        // 碰撞过滤器
        filter: (maskA: number, maskB: number) => boolean;
        // 挂载前
        beforeAppend: (body: Body) => void;
        // 挂载后
        afterAppend: (body: Body) => void;
        // 移除前
        beforeRemove: (body: Body) => void;
        // 移除后
        afterRemove: (body: Body) => void;
        // 开始休眠
        sleepStart: (body: Body) => void;
        // 结束休眠
        sleepEnd: (body: Body) => void;
    }

    // 渲染函数
    render: Function;


    constructor(opt: BodyOpt, type: number) {
        this.id = Util.id();
        this.type = type;
        this.engine = null;
        this.data = null;
        this.origin = new Vector(0, 0);
        this.position = new Vector(0, 0);
        this.rotation = 0;
        this.velocity = new Vector(0, 0);
        this.angularVelocity = 0;
        this.speed = 0;
        this.angularSpeed = 0;
        this.motion = 0;
        this.mass = 10;
        this.area = 0;
        this.density = 1;
        this.inertia = 0;
        this.invInertia = 0;
        this.force = new Vector(0, 0);
        this.torque = 0;
        this.friction = 0.4;
        this.restitution = 1;
        this.constraint = null;
        this.fixed = false;
        this.sleeping = false;
        this.sleepCounter = 0;
        this.mask = 1;
        this.parts = [];
        this.bound = null;

        this.collisionNum = 0;
        this.methods = {
            filter: (maskA: number, maskB: number) => { return true; },
            beforeAppend: (body: Body) => {},
            afterAppend: (body: Body) => {},
            beforeRemove: (body: Body) => {},
            afterRemove: (body: Body) => {},
            sleepStart: (body: Body) => {},
            sleepEnd: (body: Body) => {}
        }

        Util.extend(this, opt);

        if(this.fixed) this.sleeping = true;

        this.area = this.getArea();
        this.density = this.getDensity();
        this.invMass = this.getInvMass();
        this.inertia = this.getInertia();
        this.invInertia = this.getInvInertia();
        this.position = this.getCentroid();
        this.speed = this.velocity.len();
        this.angularSpeed = Math.abs(this.angularVelocity);
        this.motion = this.speed * this.speed + this.angularSpeed * this.angularSpeed;

        // 设置渲染函数
        this.setRender(() => {});
    }

    /**
     * 计算质量倒数
     */
    getInvMass(): number {
        return (this.mass === 0 || this.fixed)? 0: 1 / this.mass;
    }

    /**
     * 计算转动惯量倒数
     */
    getInvInertia(): number {
        return (this.inertia === 0 || this.fixed)? 0: 1 / this.inertia;
    }

    /**
     * 计算密度
     */
    getDensity(): number {
        return this.mass / this.area;
    }

    /**
     * 计算面积
     * @override
     */
    getArea(): number {
        return 1;
    }

    /**
     * 计算质心
     * @override
     */
    getCentroid(): Vector {
        return null;
    }

    /**
     * 计算转动惯量
     * @override
     */
    getInertia(): number {
        return 1;
    }

    /**
     * 获取包围盒
     * @override
     */
    getBound(): Bound {
        return null;
    }

    /**
     * 设置用户想要携带的信息数据
     * @param data 数据
     */
    setData(data: any) {
        if(data !== null && data !== undefined) {
            this.data = data;
        }
    }

    /**
     * 设置刚体的引擎属性
     * @param engine 
     */
    setEngine(engine: Engine) {
        this.engine = engine;
    }

    /**
     * 设置渲染函数
     * @param fn 
     */
    setRender(fn: (body: Body, dt: number, timeStamp: number) => void) {
        if(fn && typeof fn === 'function') this.render = fn;
    }




    /**
     * 位移刚体
     * @override
     * @param distance 位移向量
     */
    translate(distance: Vector) {}

    /**
     * 旋转刚体
     * @override
     * @param angle 角度
     * @param point 绕点
     */
    rotate(angle: number, point: Vector) {}

    /**
     * 发生碰撞
     * @param body 
     */
    collide(body: Body) {
        this.collisionNum++;
        // 触发碰撞钩子
        Event.emit(this, 'collide', this, body);
    }

    /**
     * 发生分离
     */
    separate() {
        this.collisionNum--;

        // 触发分离钩子
        if(this.collisionNum === 0) {
            Event.emit(this, 'isolate', this)
        }
    }

    /**
     * 应用冲量
     * @param impulse 冲量
     * @param offset 作用点（本地坐标系）
     * @param dt 步长
     */
    applyImpulse(impulse: Vector, offset: Vector) {
        this.velocity.x += impulse.x * this.invMass;
        this.velocity.y += impulse.y * this.invMass;
        this.angularVelocity += this.invInertia * offset.cro(impulse);
    }


    /**
     * 应用力
     * @param force 力
     * @param offset 作用点（本地坐标系）
     */
    applyForce(force: Vector, offset?: Vector) {
        this.force.x += force.x;
        this.force.y += force.y;

        if(offset !== undefined) {
            this.torque += offset.cro(this.force);
        }
    }
    
    /**
     * 积分受力
     * @param dt 
     */
    integrateForces(dt: number) {
        if(this.fixed || this.sleeping) {
            return;
        }

        this.velocity.x += dt * this.force.x * this.invMass;
        this.velocity.y += dt * this.force.y * this.invMass;
        this.angularVelocity += dt * this.torque * this.invInertia; 
    }

    /**
     * 积分速度
     * - 使用隐式欧拉积分
     * @param dt 
     */
    integrateVelocities(dt: number) {
        if(this.fixed || this.sleeping) {
            return;
        }

        let dx = dt * this.velocity.x,
            dy = dt * this.velocity.y,
            dr = dt * this.angularVelocity;

        this.position.x += dx;
        this.position.y += dy;
        this.rotation += dr;

        //位移刚体
        this.translate(new Vector(dx, dy));
        // 旋转刚体
        if(this.angularVelocity !== 0) {
            this.rotate(dr, this.position);
        }

        // 更新标量速度
        this.speed = this.velocity.len();
        this.angularSpeed = Math.abs(this.angularVelocity);

        //更新动量
        this.motion = this.speed * this.speed + this.angularSpeed * this.angularSpeed;

        this.force.x = 0;
        this.force.y = 0;
        this.torque = 0;
    }
} 