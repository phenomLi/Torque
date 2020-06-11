import { Matrix } from "./matrix";


// 二维向量 {x, y}
export class Vector {
    public x: number;
    public y: number;

    constructor(x?: number, y?: number) {
        if(x === undefined && y === undefined) {
            this.set(0, 0);
        }
        else {
            this.set(x, y);
        }
    }

    //-------------操作----------------

    /**
     * 设置值
     * @param x 
     * @param y 
     */
    set(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * 相加
     * @param v 
     */
    add(v: Vector): Vector {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    /**
     * 相减
     * @param v 
     */
    sub(v: Vector): Vector {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    /**
     * 点积
     * @param v 
     */
    dot(v: Vector): number {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * 叉积
     * @param v 
     */
    cro(v: Vector): number {
        return this.x * v.y - v.x * this.y;
    }

    /**
     * 与标量进行叉积
     * @param n
     */
    croNum(n: number): Vector {
        return new Vector(-n * this.y, n * this.x)
    }

    /**
     * 投影
     * @param v 
     */
    pro(v: Vector): number {
        return this.dot(v) / v.len();
    }

    /**
     * 法向
     */
    nor(): Vector {
        return new Vector(-this.y, this.x);
    }

    /**
     * 求模
     */
    len(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * 平方模（节省求平方根操作）
     */
    len_s(): number {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * 单位化
     */
    nol(): Vector {
        let len = this.len();
        return len !== 0? new Vector(this.x / len, this.y / len): new Vector(0, 0);
    }

    /**
     * 缩放
     */
    scl(n: number): Vector {
        return new Vector(n * this.x, n * this.y);
    }

    /**
     * 反向
     */
    inv(): Vector {
        return new Vector(-this.x, -this.y);
    }

    /**
     * 判断两向量是否相等
     * @param v 
     */
    eql(v: Vector): boolean {
        return this.x === v.x && this.y === v.y;
    }

    /**
     * 求两向量夹角(弧度制)
     * @param v 
     */
    ang(v: Vector): number {
        return Math.acos(this.dot(v) / (this.len() * v.len()));
    }

    /**
     * 克隆向量
     */
    col(): Vector {
        return new Vector(this.x, this.y);
    }

    /**
     * 绕某点旋转向量
     * @param radian 角度（弧度制）
     * @param point 绕的点
     */
    rot(radian: number, point?: Vector): Vector {
        point = point || new Vector(0, 0);

        let cos = Math.cos(radian),
            sin = Math.sin(radian),
            dv = this.sub(point),
            v = new Vector(0, 0);
                
            v.x = point.x + (dv.x * cos - dv.y * sin);
            v.y = point.y + (dv.x * sin + dv.y * cos);
        
        return v;
    }

    /**
     * 求一个向量（点）按照direction方向，延长len长度后的坐标
     * @param direction
     * @param len 
     */
    loc(direction: Vector, len: number): Vector {
        return this.add(direction.nol().scl(len));
    }
};


