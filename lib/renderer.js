


class Renderer {
    constructor(canvas, width, height, opt) {
        this.torque = new Torque(width, height, opt || {});
        this.app = new PIXI.Application({
            width: width, 
            height: height,
            antialias: true,   
        });

        this.defaultOptions = {
            mass: 100,
            friction: 0.3,
            stroke: 0xffffff,
            methods: {
                sleepStart(body) {
                    body.data.alpha = 0.4;
                },
                sleepEnd(body) {
                    body.data.alpha = 1;
                }
            }
        }

        this.colors = [
            0xf38181, 
            0x11999e, 
            0x3d84a8, 
            0xffb6b9,
            0xfecea8,
            0xf2c6b4,
            0x625772,
            0xca82f8,
            0x95a792,
            0xe3d9ca,
            0xfd94b4,
            0xc4c1e0
        ];

        this.app.renderer.backgroundColor = opt.backgroundColor;
        canvas.appendChild(this.app.view);
    }

    /**
     * 移除刚体
     * @param {*} body 
     */
    remove(body) {
        this.torque.remove(body);
        this.app.stage.removeChild(body.data);
        
        if(body.getBodyType() === 'composite') {
            body.getChildren().map(item => {
                this.app.stage.removeChild(item.data);
            });
        }
    }

    /**
     * 执行渲染
     * @param {*} body 
     * @param {*} shape 
     */
    render(body, shape) {
        body.setData(shape);
        shape.body = body;

        this.torque.append(body);
        this.app.stage.addChild(shape);

        return body;
    }

    /**
     * 创建矩形
     * @param {*} x 
     * @param {*} y 
     * @param {*} width 
     * @param {*} height 
     * @param {*} options
     */
    createRect(x, y, width, height, options) {
        let rectangle = new PIXI.Graphics(),
            rectBody = Torque.body.Rect(x, y, width, height, options);
        
        this.strokeAndFill(rectangle, options);
        rectangle.position.x = x + width / 2;
        rectangle.position.y = y + height / 2;
        rectangle.drawRect(-width / 2, -height / 2, width, height);
        
        rectangle.endFill();

        rectBody.setRender(function(body) {
            rectangle.position.x = body.position.x;
            rectangle.position.y = body.position.y;
            rectangle.rotation = body.rotation;
        });

        return this.render(rectBody, rectangle);
    }

    /**
     * 创建圆形
     * @param {*} x 
     * @param {*} y 
     * @param {*} radius 
     * @param {*} options 
     */
    createCircle(x, y, radius, options) {
        let circle = new PIXI.Graphics(),
            circleBody = Torque.body.Circle(x, y, radius, options);

        this.strokeAndFill(circle, options);
        circle.position.x = x;
        circle.position.y = y;    
        circle.drawCircle(0, 0, radius);
            
        circleBody.setRender(function(body) {
            circle.position.x = body.position.x;
            circle.position.y = body.position.y;
            circle.rotation = body.rotation;
        });

        return this.render(circleBody, circle);
    }

    /**
     * 创建正多边形
     * @param {*} x 
     * @param {*} y 
     * @param {*} radius 
     * @param {*} edges 
     * @param {*} options 
     */
    createIsogon(x, y, radius, edges, options) {
        if (edges < 2) {
            return false;
        }

        let PI = Math.PI,
            dStep = 2 * PI / edges,
            deg = -PI / 2,
            vertices = [[radius * Math.cos(deg), radius * Math.sin(deg)]];

        for (let i = 0, end = edges - 1; i < end; i++) {
            deg += dStep;
            vertices.push([radius * Math.cos(deg), radius * Math.sin(deg)]);
        }

        let isogon = new PIXI.Graphics(),
            isogonBody = Torque.body.Polygon(x, y, vertices, options);

        this.strokeAndFill(isogon, options);
        isogon.position.x = x;
        isogon.position.y = y;    
        isogon.drawPolygon(vertices.flat());

        isogonBody.setRender(function(body) {
            isogon.position.x = body.position.x;
            isogon.position.y = body.position.y;
            isogon.rotation = body.rotation;
        });

        return this.render(isogonBody, isogon);
    }

    /**
     * 创建多边形
     * @param {*} x 
     * @param {*} y 
     * @param {*} vertices 
     * @param {*} options 
     */
    createPolygon(x, y, vertices, options) {
        let polygon = new PIXI.Graphics(),
            polygonBody = Torque.body.Polygon(x, y, vertices, options);

        this.strokeAndFill(polygon, options);
        polygon.position.x = polygonBody.position.x;
        polygon.position.y = polygonBody.position.y;

        let offsetX = x - polygonBody.position.x,
            offsetY = y - polygonBody.position.y;

        polygon.drawPolygon(vertices.map(item => [item[0] + offsetX, item[1] + offsetY]).flat());

        polygonBody.setRender(function(body) {
            polygon.position.x = body.position.x;
            polygon.position.y = body.position.y;
            polygon.rotation = body.rotation;
        });

        return this.render(polygonBody, polygon);
    }   

    /**
     * 创建复合刚体
     * @param {*} bodies 
     * @param {*} options 
     */
    createComposite(bodies, options) {
        for(let i = 0; i < bodies.length; i++) {
            this.torque.remove(bodies[i]);
        }

        const compositeBody = Torque.body.Composite(bodies, options);

        this.torque.append(compositeBody);

        return compositeBody;
    }

    /**
     * 对图形进行描边和填充
     * @param {*} shape 
     * @param {*} options 
     */
    strokeAndFill(shape, options) {
        if(options.stroke !== undefined && options.stroke !== null) {
            shape.lineStyle(0.8, options.stroke, 1);
        }

        if(options.fill !== undefined && options.fill !== null) {
            shape.beginFill(options.fill, 1);
        }
    }

    /**
     * 获取某个范围的随机数
     * @param {*} max 
     * @param {*} min 
     */
    getRandom(max, min = 0) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
     * 获取随机颜色
     */
    getRandomColor() {
        return this.colors[this.getRandom(this.colors.length)];
    }
}