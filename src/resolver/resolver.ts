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
    // 法向冲量静止阈值（进入SI收敛）
    restingThresh;
    // 切向冲量静止阈值（进入SI收敛）
    restingThreshTangent;
    // 位置修正启动系数
    positionWarming: number;
    // 位置修正阻尼
    positionDampen;
    // 碰撞求解迭代次数
    velocityIterations: number;
    // 位置修正迭代次数
    positionIterations: number;
    // 约束求解迭代次数
    constraintIterations: number;
    // 穿透修正误差
    slop: number;

    constructor(engine: Engine, opt: EngineOpt) {
        this.engine = engine;

        this.restingThresh = 4;
        this.restingThreshTangent = 6;
        this.positionDampen = 0.85;
        this.positionWarming = 0.8;
        this.slop = 0.02;
        this.velocityIterations = 6;
        this.positionIterations = 6;
        this.constraintIterations = 6;

        this.collisionSolver = new CollisionSolver(this);

        Util.merge(this, opt);
    }

    
    solveCollision(manifolds: Manifold[], timeScale: number) {
        let i;

        this.collisionSolver.preSolvePosition(manifolds);
        for(i = 0; i < 10; i++) {
            this.collisionSolver.solvePosition(manifolds, this.engine.bodies, timeScale);
        }
        this.collisionSolver.postSolvePosition(this.engine.bodies);

        this.collisionSolver.preSolveVelocity(manifolds);
        for(i = 0; i < this.velocityIterations; i++) {
            this.collisionSolver.solveVelocity(manifolds, timeScale);
        }
    }

    solveConstraint() {

    }

}