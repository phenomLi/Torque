import { BroadPhase } from "./broadPhase";
import { NarrowPhase } from "./narrowPhase";
import { Engine, EngineOpt } from "../core/engine";

/**
 * 碰撞检测
 */



export class Detector {
    // 粗检查
    broadPhase: BroadPhase;
    // 细检测
    narrowPhase: NarrowPhase;   

    constructor(engine: Engine, opt: EngineOpt) {
        this.broadPhase = new BroadPhase(engine);
        this.narrowPhase = new NarrowPhase(engine);
    }
}