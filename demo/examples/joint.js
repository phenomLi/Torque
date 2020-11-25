
function jointWorld(canvas) {

    const canvasWidth = canvas.offsetWidth,
          canvasHeight = canvas.offsetHeight,
          vector = Torque.vector,
          renderer = new Renderer(canvas, canvasWidth, canvasHeight, {
            gravity: vector(0, 9.8),
            enableSleeping: true,
            enableCache: true,
            enableSATBoost: true,
            backgroundColor: 0x555555
          }),
          options = renderer.defaultOptions;
    
    /**
     * 创建四面墙
     * @param {*} cWidth 
     * @param {*} cHeight 
     * @param {*} wallWidth 
     * @param {*} options 
     */
    function createWall(cWidth, cHeight, wallWidth, options) {
        // 顶墙壁
        renderer.createRect(0, 0, cWidth, wallWidth, options);
        // 底墙壁
        renderer.createRect(0, cHeight - wallWidth, cWidth, wallWidth, options);
        // 左墙壁
        renderer.createRect(0, 0, wallWidth, cHeight, options);
        // 右墙壁
        renderer.createRect(cWidth - wallWidth, 0, wallWidth, cHeight, options);
    }
    
    createWall(canvasWidth, canvasHeight, 30, {...options, static: true});
    

    let rect1 = renderer.createRect(200, 350, 300, 50, { ...options }),
        anchor1 = renderer.createAnchor(350, 375, null, { ...options });
    renderer.createJoint(anchor1, rect1, options);


    let rect2 = renderer.createRect(550, 250, 50, 50, { ...options }),
        anchor2 = renderer.createAnchor(600, 160, null, { ...options });
    renderer.createJoint(anchor2, rect2, options);


    let rect3 = renderer.createRect(650, 250, 50, 50, { ...options }),
        anchor3 = renderer.createAnchor(700, 160, null, { ...options }),
        anchor4 = renderer.createAnchor(0, 0, rect3, { ...options });
    renderer.createJoint(anchor3, anchor4, { stiffness: 0.6, ...options });


    let anchor5 = renderer.createAnchor(800, 160, null, { ...options }),
        circle1 = renderer.createCircle(850, 200, 25, { ...options }),
        circle2 = renderer.createCircle(850, 300, 25, { ...options });
    renderer.createJoint(anchor5, circle1, options);
    renderer.createJoint(circle1, circle2, options);


    let rect4 = renderer.createRect(350, 100, 50, 50, { ...options }),
        circle3 = renderer.createCircle(350, 200, 25, { ...options });
    renderer.createJoint(rect4, circle3, options);


    let circle4 = renderer.createCircle(1000, 200, 50, { ...options, kinetic: true }),
        rect5 = renderer.createRect(1000, 350, 50, 50, { ...options }),
        anchor6 = renderer.createAnchor(0, 40, circle4, { ...options }),
        anchor7 = renderer.createAnchor(20, 20, rect5, { ...options });
    circle4.setAngularVelocity(3);
    renderer.createJoint(anchor6, anchor7, options);

    return renderer;
}
    
    
    
    
    
    
    
    
    