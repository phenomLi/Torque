import { Body } from "../body/body";
import { Util } from "../common/util";
import { Engine, EngineOpt } from "./engine";
import { Event } from "../event/eventEmitter";






// Torque主类
export class TorqueWorld {
    private engine: Engine;

    constructor(width: number, height: number, opt?: EngineOpt) {
        this.engine = new Engine(width, height, opt);
    }

    /**
     * 增加刚体
     * @param body 
     */
    append(body: Body | Body[]) {
        if(Array.isArray(body)) {
            body.map(b => this.append(b));
        }
        else {
            Event.emit(body, 'beforeAppend', body);
            body.setEngine(this.engine);
            this.engine.bodies.push(body);
            Event.emit(body, 'afterAppend', body);
        }
    }
    /**
     * 移除刚体
     * @param body 
     */
    remove(body: Body) {
        Event.emit(body, 'beforeRemove', body);
        Util.remove(this.engine.bodies, body);
        Event.emit(body, 'afterRemove', body);
    }

    /**
     * 清空引擎
     */
    clear() {
        this.engine.bodies.map(body => this.remove(body));
        this.engine.manifoldTable.clear();
    }

    /**
     * 克隆刚体
     * @param body 
     */
    clone(body: Body): Body {
        return null;
    }

    /**
     * 设置引擎参数
     * @param opt 
     */
    setEngineOption(opt: EngineOpt) {
        this.engine.setOption(opt);
    }

    /**
     * 添加时间步函数
     * @param fn 
     */
    step(fn: (dt: number) => void) {
        this.engine.timeStepper.addStep(fn);
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
}




















