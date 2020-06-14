


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

    tri(x, y, e, opt) {
        let hw = e / 2,
            h = Math.cos(Math.PI / 6) * e, 
            lh = hw / Math.cos(Math.PI / 6),
            sh = h - lh,
            localV = [[0, -lh], [hw, sh], [-hw, sh]];

        let tri = Torque.body.Polygon(x, y, localV, opt),
            triShape = new zrender.Isogon({
                position: [x, y],
                origin: [0, 0],
                rotation: -opt.rotation || 0,
                shape: {
                    x: 0, 
                    y: 0,
                    n: 3,
                    r: lh
                },
                style: {
                    fill: opt.fill,
                    stroke: opt.stroke,
                    text: tri.id,
                    transformText: true,
                    textFill: opt.textFill
                }
            });

        tri.setRender(function(body) {
            triShape.attr({
                rotation: -body.rotation,
                position: [body.position.x, body.position.y]
            });
        });

        this.t.append(tri);
        this.zr.add(triShape);
        tri.setData(triShape);
        triShape.t = tri;
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