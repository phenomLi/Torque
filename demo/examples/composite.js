
function compositeWorld(canvas) {

    const canvasWidth = canvas.offsetWidth,
          canvasHeight = canvas.offsetHeight,
          vector = Torque.math.vector,
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

    function createComposite() {
        let rect1 = renderer.createRect(700, 500, 80, 30, {
            ...options
        });
            rect2 = renderer.createRect(725, 500, 30, 100, {
            ...options
        });
            circle1 = renderer.createCircle(740, 600, 30, {
            ...options
        });
        
        renderer.createComposite([circle1, rect1, rect2]);
    }
    
    for(let i = 0; i < 20; i++) {
        createComposite();
    }
    
    return renderer;
}
    
    
    
    
    
    
    
    
    