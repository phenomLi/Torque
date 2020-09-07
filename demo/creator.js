


class Creator {
    constructor(container, width, height, opt) {
        this.zr = zrender.init(container),
        this.t = new Torque(width, height, opt || {});
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
                    fill: opt.fill,
                    stroke: opt.stroke,
                    text: circle.id,
                    transformText: true,
                    textFill: opt.textFill
                }
            });

        circle.setRender(function(body) {
            circleShape.attr({
                rotation: -body.rotation,
                position: [body.position.x, body.position.y]
            });
        });

        this.t.append(circle);
        this.zr.add(circleShape);
        circle.setData(circleShape);
        circleShape.t = circle;
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
                    fill: opt.fill,
                    stroke: opt.stroke,
                    text: rect.id,
                    transformText: true,
                    textFill: opt.textFill
                }
            });

        rect.setRender(function(body) {
            rectShape.attr({
                rotation: -body.rotation,
                position: [body.position.x - w / 2, body.position.y - h / 2]
            });
        });

        this.t.append(rect);
        this.zr.add(rectShape);
        rect.setData(rectShape);
        rectShape.t = rect;
    }

    isogon(x, y, r, n, opt) {
        if (n < 2) {
            return false;
        }

        let PI = Math.PI,
            dStep = 2 * PI / n,
            deg = -PI / 2,
            localV = [[x + r * Math.cos(deg), y + r * Math.sin(deg)]];

        for (let i = 0, end = n - 1; i < end; i++) {
            deg += dStep;
            localV.push([x + r * Math.cos(deg), y + r * Math.sin(deg)]);
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
                    fill: opt.fill,
                    stroke: opt.stroke,
                    text: isogon.id,
                    transformText: true,
                    textFill: opt.textFill
                }
            });

            isogon.setRender(function(body) {
            isogonShape.attr({
                rotation: -body.rotation,
                position: [body.position.x, body.position.y]
            });
        });

        this.t.append(isogon);
        this.zr.add(isogonShape);
        isogon.setData(isogonShape);
        isogonShape.t = isogon;
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
                    fill: opt.fill,
                    stroke: opt.stroke,
                    text: poly.id,
                    transformText: true,
                    textFill: opt.textFill
                }
            });

        poly.setRender(function(body) {
            polyShape.attr({
                rotation: -body.rotation,
                position: [body.position.x - originX, body.position.y - originY]
            });
        });

        this.t.append(poly);
        this.zr.add(polyShape);
        poly.setData(polyShape);
        polyShape.t = poly;
    }
}

Creator.v = Torque.math.vector;