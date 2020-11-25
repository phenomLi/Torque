
function ropeWorld(canvas) {

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
    

    let anchor1 = renderer.createAnchor(350, 50, null, { ...options }),
        offset = 10,
        ropeItemWidth = 10,
        ropeItemHeight = 20,
        ropeItem = null,
        lastRopeItem = anchor1;

    for(let i = 0; i < 20; i++) {
        ropeItem = renderer.createRect(350, 
            60 + offset * (i + 1) + ropeItemHeight * i, 
            ropeItemWidth, 
            ropeItemHeight, 
            options
        );

        renderer.createJoint(lastRopeItem, ropeItem, options);
        lastRopeItem = ropeItem;
    }
    
    let anchor2 = renderer.createAnchor(570, 150, null, options),
        rect1 = renderer.createRect(550, 140, 40, 120, { ...options });
        anchor3 = renderer.createAnchor(0, 50, rect1, options)
        rect2 = renderer.createRect(460, 230, 120, 40, { ...options }),
        anchor4 = renderer.createAnchor(50, 0, rect2, options);

    renderer.createJoint(anchor2, rect1, options);
    renderer.createJoint(anchor3, anchor4, options);
    
    return renderer;
}
    
    
    
    
    
    
    
    
    