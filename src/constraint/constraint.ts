




export class Constraint {
    // 速度求解迭代次数
    protected velocitySolverIterations: number;
    // 位置求解迭代次数
    protected positionSolverIterations: number;

    constructor() { }

    /**
     * 创建一个约束 
     */
    create(...arg) {
        return null;
    }

    /**
     * 求解接触约束
     * @param constraints 
     * @param dt 
     */
    solve(constraints: any[], dt: number) { }

    /**
     * 修正位置约束预处理
     * @param constraints 
     * @param dt 
     */
    initSolver(constraints: any[], dt: number) { }
}