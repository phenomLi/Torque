

// 二维向量 {x, y}
export class Vector {
    public x: number;
    public y: number;

    constructor(x?: number, y?: number) {
        this.x = 0;
        this.y = 0;

        if(x !== undefined && y !== undefined) {
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
    add(v: Vector, out?: Vector): Vector {
        out = out || new Vector();
        
        out.x = this.x + v.x;
        out.y = this.y + v.y;

        return out;
    }

    /**
     * 相减
     * @param v 
     */
    sub(v: Vector, out?: Vector): Vector {
        out = out || new Vector();
       
        out.x = this.x - v.x;
        out.y = this.y - v.y;

        return out;
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
    croNum(n: number, out?: Vector): Vector {
        out = out || new Vector();
        
        out.x = -n * this.y;
        out.y = n * this.x;

        return out;
       
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
    nor(out?: Vector): Vector {
        out = out || new Vector();
        
        out.x = this.y;
        out.y = -this.x;

        return out;
    }

    /**
     * 求模
     */
    len(): number {
        return Math.hypot(this.x, this.y);
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

        if(len === 0) {
            return new Vector();
        }

        this.x = this.x / len;
        this.y = this.y / len;

        return this;
    }

    /**
     * 缩放
     * @param n
     */
    scl(n: number, out?: Vector): Vector {
        out = out || new Vector();
        out.x = n * this.x;
        out.y = n * this.y;
        return out;
    }

    /**
     * 反向
     */
    inv(out?: Vector): Vector {
        out = out || new Vector();
        out.x = -this.x;
        out.y = -this.y;
        return out;
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
    rot(radian: number, point: Vector, out?: Vector): Vector {
        out = out || new Vector();

        let cos = Math.cos(radian),
            sin = Math.sin(radian),
            dx = this.x - point.x,
            dy = this.y - point.y;

        out.x = point.x + (dx * cos - dy * sin);
        out.y = point.y + (dx * sin + dy * cos);
        
        return out;
    }

    /**
     * 求一个向量（点）按照direction方向，延长len长度后的坐标
     * @param direction
     * @param len 
     */
    loc(direction: Vector, len: number, out?: Vector): Vector {
        out = out || new Vector();

        direction = direction.nol();
        out.x = this.x + direction.x * len;
        out.y = this.y + direction.y * len;

        return out;
    }
};


export const _tempVector1 = new Vector();
export const _tempVector2 = new Vector();
export const _tempVector3 = new Vector();
export const _tempVector4 = new Vector();

