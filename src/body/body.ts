/**
 * 刚体基类：所有刚体继承自Body
 */

import { Vector, _tempVector1 } from "../math/vector";
import { Bound } from "../common/bound";
import { Util } from "../common/util";
import { Engine } from "../core/engine";
import { Axis } from "../common/vertices";




/**
 * 刚体类型
 * 圆形：0
 * 多边形：1
 * 复合体：2
 */
export enum bodyType {
    circle = 0,
    polygon = 1,
    composite = 2
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
        // 发生了碰撞
        onCollide: (body: Body) => void;
    }
}


export class Body {
    // id
    id: number;
    // 字符串的id
    stringId: string;
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
    // 静态的
    static: boolean;
    // 运动的
    kinetic: boolean;
    // 无视重力
    ignoreGravity: boolean;
    // 休眠
    sleeping: boolean;
    // 休眠计数器
    sleepCounter: number;
    // 碰撞码
    mask: number;
    // 轴
    axes: Axis[];
    // 旋转中心
    rotateCenter: Vector;
    // 父图形
    parent: Body;
    // 包围盒
    bound: Bound;
    // 子图形
    parts: Body[];
    // 与该刚体碰撞的刚体列表
    contactBodies: { [key: string]: Body };
    // 方法
    methods: BodyOpt['methods'];
    // 渲染函数
    render: Function;

    constructor(opt: BodyOpt, type: number) {
        this.id = Util.id();
        this.stringId = this.id.toString();
        this.type = type;
        this.engine = null;
        this.data = null;
        this.origin = new Vector(0, 0);
        this.position = new Vector(0, 0);
        this.rotation = 0;
        this.velocity = new Vector(0, 0);
        this.angularVelocity = 0;
        this.motion = 0;
        this.mass = 10;
        this.area = 0;
        this.density = 1;
        this.inertia = 0;
        this.invInertia = 0;
        this.force = new Vector(0, 0);
        this.torque = 0;
        this.friction = 0.2;
        this.restitution = 0.8;
        this.static = false;
        this.kinetic = false
        this.ignoreGravity = false;
        this.sleeping = false;
        this.sleepCounter = 0;
        this.mask = 1;
        this.bound = null;
        this.contactBodies = {};
        this.parent = null;
        this.parts = [this];

        this.methods = {
            filter: (maskA: number, maskB: number) => { return true; },
            beforeAppend: (body: Body) => {},
            afterAppend: (body: Body) => {},
            beforeRemove: (body: Body) => {},
            afterRemove: (body: Body) => {},
            sleepStart: (body: Body) => {},
            sleepEnd: (body: Body) => {},
            onCollide: (body: Body) => {}
        }

        Util.extend(this, opt);

        this.beforeInitializeProperties(opt);
        this.area = this.getArea();
        this.density = this.getDensity();
        this.invMass = this.getInvMass();
        this.position = this.getCentroid();
        this.rotateCenter = this.position;
        this.inertia = this.getInertia();
        this.invInertia = this.getInvInertia();
        this.axes = this.getAxes();
        this.bound = this.getBound();
        this.motion = this.velocity.len() ** 2 + this.angularVelocity ** 2;
        this.afterInitializeProperties(opt);

        // 用户一开始便设置了旋转的情况
        if(this.rotation) {
            this.rotate(this.rotation);
        }

        // 设置渲染函数
        this.setRender(() => {});
    }

    /**
     * 初始化属性前
     */
    beforeInitializeProperties(opt: any) {}

    /**
     * 初始化属性后
     * @param opt 
     */
    afterInitializeProperties(opt: any) {}

    // ------------------------------------------- getter---------------------------------------

    /**
     * 计算质量倒数
     */
    getInvMass(): number {
        return (this.mass === 0 || this.static || this.kinetic)? 0: 1 / this.mass;
    }

    /**
     * 计算转动惯量倒数
     */
    getInvInertia(): number {
        return (this.inertia === 0 || this.static || this.kinetic)? 0: 1 / this.inertia;
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
     * @param position 转动中心
     */
    getInertia(position?: Vector): number {
        return 1;
    }

    /**
     * 获取轴
     */
    getAxes(): Axis[] {
        return [];
    }

    /**
     * 获取包围盒
     */
    getBound(): Bound {
        return null;
    }

    /**
     * 获取刚体类型
     */
    getBodyType(): string {
        if(this.type === 0) {
            return 'circle';
        }
        else if(this.type === 1) {
            return 'polygon';
        }
        else {
            return 'composite';
        }
    }

    /**
     * 获取复合刚体的子刚体
     */
    getChildren(): Body[] {
        return this.parts[0] !== this? this.parts: null;
    }

    // ------------------------------------------- setter ---------------------------------------
    
    /**
     * 设置线速度
     * @param x 
     * @param y 
     */
    setVelocity(x: number, y: number) {
        this.velocity.x = x;
        this.velocity.y = y;
    }

    /**
     * 设置角速度
     * @param angularVelocity 
     */
    setAngularVelocity(angularVelocity: number) {
        this.angularVelocity = angularVelocity;
    }

    /**
     * 设置位置
     * @param x 
     * @param y 
     */
    setPosition(x: number, y: number) {
        let dx = x - this.position.x,
            dy = y - this.position.y;

        this.position.x += dx;
        this.position.y += dy;

        this.translate(dx, dy);
    }

    /**
     * 设置旋转角度
     * @param rotation 
     */
    setRotation(rotation: number) {
        this.rotation = rotation;
        this.rotate(rotation);
    }

    /**
     * 设置是否静态 
     * @param static 
     */
    setStatic(sta: boolean) {
        this.static = sta;
    }

    /**
     * 设置是否运动
     * @param kin
     */
    setKinetic(kin: boolean) {
        this.kinetic = kin;
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
     * 设置渲染函数
     * @param fn 
     */
    setRender(fn: (body: Body, dt: number, timeStamp: number) => void) {
        if(fn && typeof fn === 'function') this.render = fn;
    }

    /**
     * 是否包含某个顶点
     * @override
     * @param x 
     * @param y 
     */
    isContains(x: number, y: number): boolean {
        return false;
    }

    // ------------------------------------------- 内部方法 ----------------------------------------

    /**
     * 位移刚体
     * @override
     * @param dx
     * @param dy
     */
    translate(dx: number, dy: number) {}

    /**
     * 旋转刚体
     * @override
     * @param angle 角度
     */
    rotate(angle: number) {}

    /**
     * 应用冲量
     * @param impulse 冲量
     * @param offset 作用点（本地坐标系）
     * @param dt 步长
     */
    applyImpulse(impulse: Vector, offset: Vector) {
        if(this.static || this.kinetic || this.sleeping) return;

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
        if(this.static || this.kinetic) return;

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
        if(this.static || this.kinetic || this.sleeping) {
            return;
        }

        let airFriction = (1 - this.engine.airFriction / 20);

        this.velocity.x = airFriction * this.velocity.x;
        this.velocity.y = airFriction * this.velocity.y;
        this.angularVelocity = airFriction * this.angularVelocity;

        this.velocity.x += this.force.x * this.invMass * dt;
        this.velocity.y += this.force.y * this.invMass * dt;
        this.angularVelocity += this.torque * this.invInertia * dt; 
    }

    /**
     * 积分速度
     * - 使用半隐式欧拉积分
     * @param dt 
     */
    integrateVelocities(dt: number) {
        if(this.static || this.sleeping) {
            return;
        }

        let dx = dt * this.velocity.x,
            dy = dt * this.velocity.y,
            dr = dt * this.angularVelocity;

        this.position.x += dx;
        this.position.y += dy;
        this.rotation += dr;
        this.rotation = this.rotation % (Math.PI * 2);

        //位移刚体
        this.translate(dx, dy);
        // 旋转刚体
        if(dr !== 0) {
            this.rotate(dr);
        }

        // 更新标量速度
        let speed = Math.hypot(dx, dy),
            angularSpeed = Math.abs(dr);

        //更新动量
        this.motion = speed * speed + angularSpeed * angularSpeed;
    }

    /**
     * 请客当前时刻受力
     */
    clearForce() {
        this.force.x = 0;
        this.force.y = 0;
        this.torque = 0;
    }

    // ------------------------------------------------ hook ------------------------------

    /**
     * 绑定沟子事件
     * @param eventName 
     * @param fn 
     */
    on(eventName: string, fn: (body: Body) => void) {
        this.methods[eventName] = fn;
    }

    beforeAppend(engine: Engine) {
        this.engine = engine;

        if(this.static) {
            this.sleeping = true;
            this.engine.sleeping.sleep(this);
        }

        this.methods.beforeAppend(this);
    }

    afterAppend() { this.methods.afterAppend(this); }

    beforeRemove() { 
        let sleeping = this.engine.sleeping,    
            keys = Object.keys(this.contactBodies),
            body: Body;

        // 在删除一个刚体前，唤醒与之有碰撞的刚体
        for(let i = 0; i < keys.length; i++) {
            body = this.contactBodies[keys[i]];
            body.sleeping && sleeping.wake(body);
        }

        this.methods.beforeRemove(this); 
    }

    afterRemove() { this.methods.afterRemove(this); }

    sleepStart() { this.methods.sleepStart(this); }

    sleepEnd() { this.methods.sleepEnd(this); }

    onCollide(target: Body) {
        this.contactBodies[target.stringId] = target;
        // 触发碰撞钩子
        this.methods.onCollide(this);
    }
} 