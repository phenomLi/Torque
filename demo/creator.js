


class Creator {
    constructor(container, width, height, opt) {
        this.zr = zrender.init(document.getElementById(container)),
        this.t = new Torque(width, height, opt || {});
    }

    circle(x, y, r, opt) {
        let circle = Torque.body.Circle(x, y, r, opt),
            circleShape = new zrender.Circle({
            shape: {
                cx: x,
                cy: y,
                r: r
            },
            style: {
                fill: opt.color,
                stroke: '#333',
                text: circle.id
            }
        });

        circle.setRender(function(body) {
            circleShape.attr('origin', [body.position.x, body.position.y]);
            circleShape.attr('rotation', -body.rotation);
            circleShape.attr('shape', {
                cx: body.origin.x,
                cy: body.origin.y
            });
        });

        circle.setData(circleShape);
        this.t.append(circle);
        this.zr.add(circleShape);
    }

    rect(x, y, w, h, opt) {
        let rect = Torque.body.Rect(x, y, w, h, opt),
            rectShape = new zrender.Rect({
            origin: [rect.position.x, rect.position.y],
            shape: {
                x: x,
                y: y,
                width: w,
                height: h
            },
            style: {
                fill: opt.color,
                stroke: '#333',
                text: rect.id
            }
        });

        rect.setRender(function(body) {
            rectShape.attr('origin', [body.position.x, body.position.y]);
            rectShape.attr('rotation', -body.rotation);
            rectShape.attr('shape', {
                x: body.origin.x,
                y: body.origin.y
            });
        });

        rect.setData(rectShape);
        this.t.append(rect);
        this.zr.add(rectShape);
    }

    polygon() {

    }
}

Creator.v = Torque.math.vector;