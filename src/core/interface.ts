import { Body } from "../body/body";
import { Util } from "../common/util";
import { Joint } from "../joint/joint";
import { Matrix } from "../math/matrix";
import { Vector } from "../math/vector";
import { Engine, EngineOpt } from "./engine";



// Torque主类
export class TorqueWorld {
    public static body;
    public static joint;
    public static vector: (x: number, y: number) => Vector;
    public static matrix: (r1: Vector, r2: Vector) => Matrix;

    private engine: Engine;

    constructor(width: number, height: number, opt?: EngineOpt) {
        this.engine = new Engine(width, height, opt);
    }

    /**
     * 增加刚体
     * @param body 
     */
    append(...arg: (Body | Joint)[]) {
        for(let i = 0; i < arg.length; i++) {
            if(arg[i] instanceof Body) {
                let body: Body = arg[i] as Body;

                body.beforeAppend(this.engine);
                this.engine.bodies.push(body);
                body.afterAppend();
            }

            if(arg[i] instanceof Joint) {
                let joint: Joint = arg[i] as Joint;

                this.engine.joints.push(joint);
                joint.anchors.map(item => this.append(item.joint, item.anchorBody));
            }
        }
    }

    /**
     * 移除刚体
     * @param body 
     */
    remove(body: Body | Joint) {
        if(body instanceof Body) {
            if(body.parent) {
                body = body.parent;
            }
    
            body.beforeRemove();
            Util.remove(this.engine.bodies, body);
            body.afterRemove();
        }
         
        if(body instanceof Joint) {
            Util.remove(this.engine.joints, body);
            body.anchors.map(item => {
                this.remove(item.joint);
                this.remove(item.anchorBody);
            });
        }
    }

    /**
     * 销毁引擎
     */
    destroy() {
        this.engine.bodies.map(body => this.remove(body));
        this.engine.joints.map(Joint => this.remove(Joint));
        this.engine.manifoldTable.clear();
    }

    /**
     * 设置引擎参数
     * @param opt 
     */
    setEngineOption(opt: EngineOpt) {
        this.engine.setOption(opt);
    }

    /**
     * 绑定沟子事件
     * @param eventName 
     * @param fn 
     */
    on(eventName: string, fn: (engine: Engine) => void) {
        this.engine.methods[eventName] = fn;
    }

    /**
     * 开始运行
     * @param frameNumLimit 限制运行多少帧停下
     */
    start(frameNumLimit?: number) {
        this.engine.timeStepper.start(frameNumLimit);
    }

    /**
     * 暂停运行
     */
    pause() {
        this.engine.timeStepper.pause();
    }

    /**
     * 获取帧率
     */
    getFPS(): number {
        return this.engine.timeStepper.fps;
    }

    /**
     * 获取所有刚体
     */
    getBodies(): Body[] {
        return this.engine.bodies;
    }
}




















