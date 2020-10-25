import { Circle, CircleOpt } from "../body/circle";
import { Polygon, PolygonOpt } from "../body/polygon";
import { Rect, RectOpt } from "../body/rect";
import { Vector } from "../math/vector";
import { Util } from "../common/util";
import { Composite, CompositeOpt } from "../body/composite";
import { Body } from "../body/body";
import { Vertices } from "../common/vertices";



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
    Polygon(x: number, y: number, v: Array<number[]>, opt?: PolygonOpt & CompositeOpt): Polygon | Composite {
        let vertices = v.map(vertex => new Vector(vertex[0], vertex[1])),
            options = opt || <PolygonOpt & CompositeOpt>{ origin: new Vector(x, y) };

        Vertices.filterCollinearVertex(vertices);

        // 若输入的顶点列表是凹多边形，则将其拆分为由凸多边形组合成的组合图形
        if(Vertices.isConcave(vertices)) {
            let vertexLists = Vertices.split(vertices),
                polygons: Polygon[] = [],
                composite: Composite;

            for(let i = 0; i < vertexLists.length; i++) {
                polygons.push(new Polygon({
                    origin: new Vector(x, y),
                    vertices: vertexLists[i]
                }));
            }

            composite = new Composite({
                ...options,
                bodies: polygons,
                useParentProps: true
            });

            return composite;
        }
        else {
            Util.extend(options, {
                origin: new Vector(x, y),
                vertices
            });
    
            return new Polygon(options);
        }
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

    /**
     * 创造复合图形
     * @param bodies 
     */
    Composite(bodies: Body[], opt?: CompositeOpt): Composite {
        opt = opt || <CompositeOpt>{};
        opt.bodies = bodies;
        return new Composite(opt);
    }
}