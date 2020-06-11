import { Vector } from "./vector";



/**
 * 二维矩阵
 * 
 *      col1 col2
 * row1 {x  ,  y}
 * row2 {x  ,  y}
 */
export class Matrix {
    public row1: Vector;
    public row2: Vector;

    public col1: Vector;
    public col2: Vector;

    constructor(row1?: Vector, row2?: Vector) {
        if(row1 === undefined && row2 === undefined) {
            row1 = new Vector(1, 0);
            row2 = new Vector(0, 1);
        }

        this.set(row1, row2);
    }

    //-----------------操作------------------

    /**
     * 设置值
     * @param row1 第一行
     * @param row2 第二行
     */
    set(row1: Vector, row2: Vector) {
        this.row1 = row1;
        this.row2 = row2;

        this.col1 = new Vector(this.row1.x, this.row2.x);
        this.col2 = new Vector(this.row1.y, this.row2.y);
    }

    /**
     * 旋转
     * @param angle 角度（弧度制）
     */
    rot(angle: number) {
        let cos = Math.cos(angle),
		    sin = Math.sin(angle);
        
        this.row1.set(cos, -sin);
        this.row2.set(sin, cos);
    }

    /**
     * 相乘
     * @param m 矩阵或向量 
     */
    mul(m: Matrix | Vector | number): Matrix | Vector {
        // 若相乘的对象是矩阵
        if(m instanceof Matrix) {
            let row1 = new Vector(this.row1.dot(m.col1), this.row1.dot(m.col2)),
                row2 = new Vector(this.row2.dot(m.col1), this.row2.dot(m.col2));

            return new Matrix(row1, row2);
        }
        // 若相乘的对象是向量
        else if(m instanceof Vector) {
            return new Vector(this.row1.dot(m), this.row2.dot(m));
        }
        else {
            return new Matrix(this.row1.scl(m), this.row2.scl(m));
        }
    }
    
    /**
     * 转置
     */
    trp(): Matrix {
        return new Matrix(this.col1, this.col2);
    }
};

