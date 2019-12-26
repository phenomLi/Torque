import { Engine, EngineOpt } from "./engine";
import { Util } from "../common/util";
import { Event } from "../event/eventEmitter";


/**
 * 时间步迭代器
 */
export class TimeStepper {
    // 主引擎
    private engine: Engine;
    // requestAnimationFrame的id
    private raf: number;
    // 额外的处理函数列表
    private tickProcessorList: Function[];
    // 运行状态（开始/暂停）
    private status: boolean;

    // 帧率
    private fps: number;
    // 步长 （1000/fps）
    private dt: number;
    // 允许最小步长
    private dtMin: number;
    // 允许最大步长
    private dtMax: number;
    // 是否固定步长
    private deltaFixed: boolean;
    // 时间缩放系数
    private timeScale: number;
    // 上一次时间缩放系数
    private prevTimeScale: number;
    // 时间修正系数
    private correction: number;
    // 上次tick执行时间
    private prevTime: number;
    // 步长记录器
    private deltaRecorder: number[];
    // 步长记录数量上限
    private deltaRecordLimit: number;
    // 帧计数器
    private frameCounter: number;
    // 帧时间
    private frameStamp: number;
    // 总帧计算器
    private frameTotal: number
    // 帧限制
    private frameNumLimit: number;

    constructor(engine: Engine, opt: EngineOpt) {
        this.engine = engine;

        this.status = false;
        this.tickProcessorList = [];

        this.fps = 60;
        this.deltaFixed = true;
        this.timeScale = 1;
        this.deltaRecordLimit = 60;

        Util.merge(this, opt);

        this.dt = 1000 / this.fps;
        this.dtMin = this.dt;
        this.dtMax = this.dt * 2;
        this.prevTimeScale = this.timeScale;
        this.correction = this.timeScale / this.prevTimeScale;
        this.frameCounter = 0;
        this.frameStamp = 0;
        this.prevTime = 0;
        this.frameTotal = 0;
        this.frameNumLimit = -1;
        this.deltaRecorder = [];
    }

    /**
     * 一次tick，也就是一次模拟
     * @param timeStamp 当前时间戳
     */
    tick(timeStamp: number = 0) {
        let dt: number;

        // 固定dt
        if (this.deltaFixed) {
            dt = this.dt;
        } else {
            // 动态计算dt
            dt = (timeStamp - this.prevTime) || this.dt;
            this.prevTime = timeStamp;

            // 根据过去的变化步长情况，优化当前步长，使引擎稳定
            this.deltaRecorder.push(dt);
            this.deltaRecorder = this.deltaRecorder.slice(-this.deltaRecordLimit);
            dt = Util.clamp(Math.min.apply(Math, this.deltaRecorder), this.dtMin, this.dtMax);

            // 更新修正系数
            this.correction = dt / this.dt;

            // 更新dt
            this.dt = dt;
        }

        // 更新修正系数
        if (this.prevTimeScale)
            this.correction *= this.timeScale / this.prevTimeScale;

        if (this.timeScale === 0)
            this.correction = 0;

        this.prevTimeScale = this.timeScale;

        // 动态计算fps
        this.frameCounter += 1;
        if (timeStamp - this.frameStamp >= 1000) {
            this.fps = this.frameCounter * ((timeStamp - this.frameStamp) / 1000);
            this.frameStamp = timeStamp;
            this.frameCounter = 0;
        }

        Event.emit(this.engine, 'onTickStart');

        Event.emit(this.engine, 'beforeUpdate');
        // 更新物理引擎
        this.engine.update(this.dt, this.timeScale, timeStamp);
        Event.emit(this.engine, 'afterUpdate');

        
        Event.emit(this.engine, 'beforeRender');
        // 渲染物理引擎
        this.engine.render(this.dt, this.timeScale, timeStamp);
        Event.emit(this.engine, 'afterRender');

        // 执行用户自定义函数
        this.tickProcessorList.map(fn => fn(timeStamp));

        Event.emit(this.engine, 'onTickEnd');
        
        this.frameTotal++;

        if(this.frameNumLimit > 0 && this.frameTotal >= this.frameNumLimit) {
            this.pause();
            return;
        }

        this.raf = window.requestAnimationFrame(this.tick.bind(this));
    }

    /**
     * 在一次tick中增加额外自定义的处理函数
     * @param fn 要增加的处理函数
     */
    addStep(fn: (dt: number, timeScale: number, correction: number) => void) {
        typeof fn === 'function' && this.tickProcessorList.push(fn);
    }


    /**
     * 开始模拟
     * @param frameNumLimit 限制运行多少帧停下
     */
    start(frameNumLimit?: number) {
        if(this.status) return;

        if(frameNumLimit && frameNumLimit > 0) {
            this.frameNumLimit = frameNumLimit;
        }

        this.status = true;
        Event.emit(this.engine, 'onStart');
        this.tick();
    }

    /**
     * 暂停模拟
     */
    pause() {
        if(!this.status) return;

        this.status = false;
        this.frameTotal = 0;
        Event.emit(this.engine, 'pause');
        window.cancelAnimationFrame(this.raf);
    }
}