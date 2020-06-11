import { Circle, CircleOpt } from "../body/circle";
import { Polygon, PolygonOpt } from "../body/polygon";
import { Rect, RectOpt } from "../body/rect";
import { Vector } from "../math/vector";
import { Util } from "../common/util";



export class BodiesFactory {

    /**
     * 创造圆形
     * @param x x
     * @param y y
     * @param radius 半径 
     * @param opt 配置项
     */
    Circle(x: number, y: number, radius: number, opt?: CircleOpt): Circle {
        opt = opt || <CircleOpt>{};

        Util.extend(opt, {
            origin: new Vector(x, y),
            radius: radius
        });

        return new Circle(opt);;
    }   

    /**
     * 创造多边形
     * @param x x
     * @param y y
     * @param v 顶点集 
     * @param opt 配置项
     */
    Polygon(x: number, y: number, v: Array<number[]>, opt?: PolygonOpt): Polygon {
        opt = opt || <PolygonOpt>{};

        let vertices = v.map(vertex => new Vector(vertex[0], vertex[1]));

        Util.extend(opt, {
            origin: new Vector(x, y),
            vertices
        });

        return new Polygon(opt);
    }

    /**
     * 创造矩形
     * @param x x 
     * @param y y
     * @param width 宽 
     * @param height 高
     * @param opt 配置项
     */
    Rect(x: number, y: number, width: number, height: number, opt?: RectOpt): Rect {
        opt = opt || <RectOpt>{};

        Util.extend(opt, {
            origin: new Vector(x, y),
            width,
            height
        });

        return new Rect(opt);
    }
}