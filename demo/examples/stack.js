
function stackWorld(canvas) {
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
    
    /**
     * 创建堆叠
     * @param {*} row 
     * @param {*} col 
     * @param {*} x 
     * @param {*} w 
     */
    function createStack(row, col, x, w) {
        for(let i = 0; i < row; i++) {
            for(let j = 0; j < col; j++) {
                renderer.createRect(x + j * w, canvasHeight - 30 - w * (i + 1), w, w, {
                    ...options
                });
            }
        }
    }

    function createPyramid(level, x, w) {
        for(let i = 0; i < level; i++) {
            for(let j = 0; j < level - i; j++) {
                renderer.createRect(x + i * (w / 2) + j * w, canvasHeight - 30 - w * (i + 1), w, w, {
                    ...options
                });
            }
        }
    }
    
    createWall(canvasWidth, canvasHeight, 30, {...options, static: true});
    createPyramid(8, 500, 40);
    createStack(7, 7, 100, 40);
    
    return renderer;
}
    
    
    
    
    
    
    
    
    