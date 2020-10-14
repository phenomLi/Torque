




class Creator {
    constructor(container, width, height, opt) {
        this.zr = zrender.init(container),
        this.t = new Torque(width, height, opt || {});
        this.style = (opt) => ({
            fill: opt.fill,
            stroke: opt.stroke,
            transformText: true,
            textFill: opt.textFill
        });

        this.selectedBody = null;
        this.selectedShape = null;    

        this.init();
    }

    init() {
        this.zr.on('click', (e) => {
            this.selectedShape = e.topTarget;

            if(this.selectedShape) {
                this.selectedBody = this.selectedShape.tbody;
            }
        });
    }

    apply(body, shape, t, zr) {
        body.setData(shape);
        shape.t = body;
        t.append(body);
        zr.add(shape);

        return body;
    }

    remove(body) {
        this.t.remove(body);
        this.zr.remove(body.data);
    }

    circle(x, y, r, opt) {
        let circle = Torque.body.Circle(x, y, r, opt),
            circleShape = new zrender.Circle({
                position: [x, y],
                rotation: -opt.rotation || 0,
                shape: {
                    cx: 0,
                    cy: 0,
                    r: r
                },
                style: {
                    ...this.style(opt),
                    text: circle.id,
                }
            });

        circle.setRender(function(body) {
            circleShape.attr({
                rotation: body.rotation,
                position: [body.position.x, body.position.y]
            });
        });

        return this.apply(circle, circleShape, this.t, this.zr);
    }

    rect(x, y, w, h, opt) {
        let rect = Torque.body.Rect(x, y, w, h, opt),
            rectShape = new zrender.Rect({
                origin: [w / 2, h / 2],
                position: [x, y],
                rotation: -opt.rotation || 0,
                shape: {
                    x: 0,
                    y: 0,
                    width: w,
                    height: h
                },
                style: {
                    ...this.style(opt),
                    text: rect.id
                }
            });

        rect.setRender(function(body) {
            rectShape.attr({
                rotation: -body.rotation,
                position: [body.position.x - w / 2, body.position.y - h / 2]
            });
        });

        return this.apply(rect, rectShape, this.t, this.zr);
    }

    isogon(x, y, r, n, opt) {
        if (n < 2) {
            return false;
        }

        let PI = Math.PI,
            dStep = 2 * PI / n,
            deg = -PI / 2,
            localV = [[r * Math.cos(deg), r * Math.sin(deg)]];

        for (let i = 0, end = n - 1; i < end; i++) {
            deg += dStep;
            localV.push([r * Math.cos(deg), r * Math.sin(deg)]);
        }

        let isogon = Torque.body.Polygon(x, y, localV, opt),
            isogonShape = new zrender.Isogon({
                position: [x, y],
                origin: [0, 0],
                rotation: -opt.rotation || 0,
                shape: {
                    x: 0, 
                    y: 0,
                    n,
                    r
                },
                style: {
                    ...this.style(opt),
                    text: isogon.id
                }
            });

            isogon.setRender(function(body) {
            isogonShape.attr({
                rotation: -body.rotation,
                position: [body.position.x, body.position.y]
            });
        });

        return this.apply(isogon, isogonShape, this.t, this.zr);
    }

    polygon(x, y, points, opt) {
        let poly = Torque.body.Polygon(x, y, points, opt),
            originX = poly.position.x - x,
            originY = poly.position.y - y,
            polyShape = new zrender.Polygon({
                origin: [originX, originY],
                rotation: -opt.rotation || 0,
                position: [x, y],
                shape: {
                    points
                },
                style: {
                    ...this.style(opt),
                    text: poly.id
                }
            });

        poly.setRender(function(body) {
            polyShape.attr({
                rotation: -body.rotation,
                position: [body.position.x - originX, body.position.y - originY]
            });
        });

        return this.apply(poly, polyShape, this.t, this.zr);
    }
}

Creator.v = Torque.math.vector;