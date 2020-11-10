
function kineticWorld(canvas) {

    const canvasWidth = canvas.offsetWidth,
          canvasHeight = canvas.offsetHeight,
          vector = Torque.vector,
          renderer = new Renderer(canvas, canvasWidth, canvasHeight, {
            gravity: vector(0, 9),
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
    
    let rotatePolygon = renderer.createPolygon(300, 390, [
        [0, 0], [20, 0], [20, 100], 
        [70, 150], [170, 150], [210, 100], [210, 0],
        [230, 0], [230, 100], [170, 170], 
        [70, 170], [0, 100], 
    ], {
        kinetic: true,
        ...options
    });
    
    rotatePolygon.setAngularVelocity(0.5);
    
    
    let moveRect = renderer.createRect(800, 500, 80, 30, {
        kinetic: true,
        ...options
    }),
        rotateRect = renderer.createRect(900, 200, 50, 50, {
        kinetic: true,
        ...options
    }),
        rotateCircle = renderer.createCircle(400, 200, 50, {
        kinetic: true,
        ...options
    });
    
    let counter = 0;
    renderer.torque.on('beforeUpdate', () => {
        counter += 0.014;
        moveRect.setVelocity(800 + 200 * Math.sin(counter) - moveRect.position.x, 0);
    });
    
    rotateRect.setAngularVelocity(5);
    rotateCircle.setAngularVelocity(3);
    
    return renderer;
}
    
    
    
    
    
    
    
    
    