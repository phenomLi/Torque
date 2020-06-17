import { EngineOpt, Engine } from "../core/engine";
import { Util } from "../common/util";
import { CollisionSolver } from "./collision";
import { Manifold } from "../collision/manifold";


/**
 * 碰撞求解器
 */


export class Resolver {
    // 引擎实例
    engine: Engine;
    // 碰撞求解实例
    collisionSolver: CollisionSolver;
    // 碰撞求解迭代次数
    velocityIterations: number;
    // 约束求解迭代次数
    constraintIterations: number;
    // 穿透修正误差
    slop: number;
    // 偏移因子
    biasFactor: number;

    constructor(engine: Engine, opt: EngineOpt) {
        this.engine = engine;

        this.velocityIterations = 15;
        this.constraintIterations = 6;
        this.slop = 0.02;
        this.biasFactor = 0.17;
        this.collisionSolver = new CollisionSolver(this);

        Util.merge(this, opt);
    }

    /**
     * 
     * @param manifolds 
     * @param dt 
     */
    solveCollision(manifolds: Manifold[], dt: number) {
        this.collisionSolver.preSolveVelocity(manifolds, dt);
        for(let i = 0; i < this.velocityIterations; i++) {
            this.collisionSolver.solveVelocity(manifolds, dt);
        }
    }

    solveConstraint() {

    }

}