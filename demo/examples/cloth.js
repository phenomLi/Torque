
function clothWorld(canvas) {
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
    
    let offset = 20,
        col = 20,
        row = 20,
        radius = 3,
        mass = 5,
        colStiffness = 0.8,
        rowStiffness = 0.5,
        rowClothItems = [],
        lastRowClothItems = [],
        lastColClothItem = null,
        circles = [];

    for(let i = 0; i < col; i++) {
        let circle = renderer.createCircle(300 + i * offset, 100, radius, { ...options, static: true });
        circles.push(circle);
    }

    for(let i = 0; i < row; i++) {
        for(let j = 0; j < col; j++) {
            let clothItem = renderer.createCircle(300 + j * offset, 100 + (i + 1) * offset, radius, { ...options, mass });
            
            if(i === 0) {
                renderer.createJoint(circles[j], clothItem, { stiffness: colStiffness, ...options });
            }
            else {
                renderer.createJoint(lastRowClothItems[j], clothItem, { stiffness: colStiffness, ...options });
            }

            if(lastColClothItem) {
                renderer.createJoint(lastColClothItem, clothItem, { stiffness: rowStiffness, ...options });
            }
            
            lastColClothItem = clothItem;
            rowClothItems.push(clothItem);
        }

        lastColClothItem = null;
        lastRowClothItems = rowClothItems;
        rowClothItems = [];
    }


    let circle = renderer.createCircle(500, 550, 50, { ...options, static: true }),
        rect = renderer.createRect(300, 500, 100, 50, { ...options, static: true });

    
    return renderer;
}
    
    
    
    
    
    
    
    
    