import { Vector } from "./vector";


/**
 * 2 * 2矩阵
 */
export class Matrix {
    public r1: Vector;
    public r2: Vector;

    constructor(r1?: Vector, r2?: Vector) {
        this.r1 = new Vector(1, 0);
        this.r2 = new Vector(0, 1);

        if(r1 !== undefined && r2 !== undefined) {
            this.set(r1, r2);
        }
    }
        
    /**
     * 设置矩阵值
     * @param r1 
     * @param r2 
     */
    set(r1: Vector, r2: Vector) {
        this.r1.x = r1.x;
        this.r1.y = r1.y;
        this.r2.x = r2.x;
        this.r2.y = r2.y;
    }

    /**
     * 矩阵相加
     * @param m
     * @param mOut 
     */
    add(m: Matrix, mOut?: Matrix): Matrix {
        let dest: Matrix;

        if(mOut !== undefined) {
            dest = mOut;
        }
        else {
            dest = new Matrix();
        }   

        dest.r1 = this.r1.add(m.r1, dest.r1);
        dest.r2 = this.r2.add(m.r2, dest.r2);

        return dest;
    }

    /**
     * 矩阵相减
     * @param m
     * @param mOut 
     */
    subtract(m: Matrix, mOut?: Matrix): Matrix {
        let dest: Matrix;

        if(mOut !== undefined) {
            dest = mOut;
        }
        else {
            dest = new Matrix();
        }   

        dest.r1 = this.r1.sub(m.r1, dest.r1);
        dest.r2 = this.r2.sub(m.r2, dest.r2);

        return dest;
    }

    /**
     * 矩阵相乘
     * @param m
     * @param mOut 
     */
    multiply(m: Matrix, mOut?: Matrix): Matrix {
        let dest: Matrix;

        if(mOut !== undefined) {
            dest = mOut;
        }
        else {
            dest = new Matrix();
        }   

        dest.r1.x = this.r1.x * m.r1.x + this.r1.y * m.r2.x;
        dest.r1.y = this.r1.x * m.r1.y + this.r1.y * m.r2.y;
        dest.r2.x = this.r2.x * m.r1.x + this.r2.y * m.r2.x;
        dest.r2.y = this.r2.x * m.r1.y + this.r2.y * m.r2.y;

        return dest;
    }

    /**
     * 矩阵与 2 维向量相乘
     * @param v 
     * @param vOut 
     */
    multiplyVec(v: Vector, vOut?: Vector): Vector {
        let dest: Vector;

        if(vOut !== undefined) {
            dest = vOut;
        }
        else {
            dest = new Vector();
        }

        dest.x = this.r1.x * v.x + this.r1.y * v.y;
        dest.y = this.r2.x * v.x + this.r2.y * v.y;

        return dest;
    }

    /**
     * 矩阵乘上一个数
     * @param n
     * @param mOut
     */
    multiplyNum(n: number, mOut?: Matrix): Matrix {
        let dest: Matrix;

        if(mOut !== undefined) {
            dest = mOut;
        }
        else {
            dest = new Matrix();
        }

        dest.r1 = this.r1.scl(n, dest.r1);
        dest.r2 = this.r2.scl(n, dest.r2);

        return dest;
    }

    /**
     * 矩阵转置
     */
    transpose(): Matrix {
        let r1y = this.r1.y,
            r2x = this.r2.x;

        this.r1.y = r2x;    
        this.r2.x = r1y;

        return this;
    }

    /**
     * 转换为单位矩阵
     */
    identity(): Matrix {
        this.r1.x = this.r2.y = 1;
        this.r1.y = this.r2.x = 0;

        return this;
    }

    /**
     *  求矩阵行列式
     */
    determinant(): number {
        return this.r1.x * this.r2.y - this.r1.y * this.r2.x;
    }

    /**
     * 矩阵求逆
     * @param mOut 
     */
    invert(mOut?: Matrix): Matrix {
        let dest: Matrix;

        if(mOut !== undefined) {
            dest = mOut;
        }
        else {
            dest = new Matrix();
        }   

        let det = this.determinant();

        if(det === 0) return null;

        let r1x = this.r1.x,
            r1y = this.r1.y,
            r2x = this.r2.x,
            r2y = this.r2.y;

        dest.r1.x = r2y;
        dest.r1.y = -r1y;
        dest.r2.x = -r2x;
        dest.r2.y = r1x;

        dest = dest.multiplyNum(1 / det);

        return dest;
    }

    /**
     * 拷贝矩阵
     */
    clone(): Matrix {
        let m = new Matrix();

        m.r1 = this.r1.col();
        m.r2 = this.r2.col();

        return m;
    }

    /**
     * 设置旋转矩阵
     * @param rad
     */
    rotate(rad: number): Matrix {
        let sin = Math.sin(rad),
            cos = Math.cos(rad);

        this.r1.x = cos;
        this.r1.y = -sin;

        this.r2.x = sin;
        this.r2.y = cos;

        return this;
    }
};


export const _tempMatrix1 = new Matrix();
export const _tempMatrix2 = new Matrix();
export const _tempMatrix3 = new Matrix();
export const _tempMatrix4 = new Matrix();