import { Body } from "../body/body";
import { Util } from "../common/util";
import { Matrix, _tempMatrix2 } from "../math/matrix";
import { Vector } from "../math/vector";
import { Anchor } from "./anchor";


export class Joint {
    id: number;
    bodyA: Body;
    bodyB: Body;

    globalPositionA: Vector;
    globalPositionB: Vector;

    offsetA: Vector;
    offsetB: Vector;

    anchors: Anchor[];

    stiffness: number;
    velocityBias: Vector;
    jointImpulse: Vector;
    jointMatrix: Matrix;

    rA: Vector;
    rB: Vector;

    // 挂载的数据
    data: any;
    // 是否需要渲染
    needRender: boolean;
    // 渲染函数
    render: Function;

    constructor(bodyA: Body, bodyB: Body, stiffness: number) {
        this.id = Util.id();
        this.stiffness = stiffness;
        this.velocityBias = new Vector();

        this.jointImpulse = new Vector();
        this.jointMatrix = new Matrix();
        this.rA = new Vector();
        this.rB = new Vector();

        this.anchors = [];
        this.render = () => {};

        this.bodyB = bodyB;
        this.bodyA = bodyA;
        
        this.globalPositionA = this.bodyA.position;
        this.globalPositionB = this.bodyB.position;
            
        let rotB = _tempMatrix2.rotate(this.bodyB.rotation);
        this.offsetA = new Vector();
        this.offsetB = rotB.multiplyVec(this.globalPositionA.sub(this.globalPositionB));

        this.bodyA.jointed = true;
        this.bodyB.jointed = true;

        this.needRender = true;
    }

    /**
     * 
     * @param needRender 
     */
    setNeedRender(needRender: boolean) {
        this.needRender = needRender;
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
    setRender(fn: (joint: Joint, dt: number, timeStamp: number) => void) {
        if(fn && typeof fn === 'function') this.render = fn;
    }
}