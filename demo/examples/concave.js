
function concaveWorld(canvas) {

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
    
    function fromPath(path) {
        var pathPattern = /L?\s*([\-\d\.e]+)[\s,]*([\-\d\.e]+)*/ig,
            points = [];
    
        path.replace(pathPattern, function(match, x, y) {
            points.push([parseFloat(x), parseFloat(y)]);
        });

        return points;
    };

    const arrowPath = '0 0 40 0 40 20 100 20 100 80 40 80 40 100 0 50',
        chevronPath = '100 0 75 50 100 100 25 100 0 50 25 0',
        starPath = '50 0 63 38 100 38 69 59 82 100 50 75 18 100 31 59 0 38 37 38',
        horseShoePath = '35 7 19 17 14 38 14 58 25 79 45 85 65 84 65 66 46 67 34 59 30 44 33 29 45 23 66 23 66 7 53 7';

    for(let i = 0; i < 4; i++) {
        renderer.createPolygon(100, i * 100, fromPath(arrowPath), { ...options });
        renderer.createPolygon(200, i * 100, fromPath(chevronPath), { ...options });
        renderer.createPolygon(300, i * 100, fromPath(starPath), { ...options });
        renderer.createPolygon(400, i * 100, fromPath(horseShoePath).reverse(), { ...options });
    }
    
    return renderer;
}
    
    
    
    
    
    
    
    
    