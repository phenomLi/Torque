
const canvas = document.getElementById('canvas'),
      canvasWidth = canvas.offsetWidth,
      canvasHeight = canvas.offsetHeight;

    
const creator = new Creator(canvas, canvasWidth, canvasHeight, {
    gravity: Creator.v(0, 11),
    enableSleeping: true,
    enableCache: true,
    enableSATBoost: true
});


function getRandom(number, min = 0) {
    let n;

    do {
        n = Math.floor(Math.random() * number);
    } while(n < min);

    return n;
}


function createWall(cWidth, cHeight, wallWidth, opt) {
    // 顶墙壁
    creator.rect(0, 0, cWidth, wallWidth, {
        ...opt
    });

    // 底墙壁
    creator.rect(0, cHeight - wallWidth, cWidth, wallWidth, {
        ...opt
    });
    
    // 左墙壁
    creator.rect(0, 0, wallWidth, cHeight, {
        ...opt
    });

    // 右墙壁
    creator.rect(cWidth - wallWidth, 0, wallWidth, cHeight, {
        ...opt
    });
}

function createStack(row, col, x, w) {
    for(let i = 0; i < row; i++) {
        for(let j = 0; j < col; j++) {
            creator.rect(x + j * w, canvasHeight - 30 - w * (i + 1), w, w, {
                fill: '#f38181',
                ...options
            });
        }
    }
}



createWall(canvasWidth, canvasHeight, 30, {
    fixed: true,
    friction: 0.3,
    fill: null,
    stroke: '#333'
});


const options = {
    mass: 100,
    friction: 0.3,
    // textFill: null,
    stroke: '#333',
    methods: {
        sleepStart(body) {
            body.data.attr('style', {
                opacity: 0.5
            });
        },
        sleepEnd(body) {
            body.data.attr('style', {
                opacity: 1
            });
        }
    }
};

creator.polygon(500, 250, [
    [0, 0], [20, 0], [20, 100], 
    [70, 150], [170, 150], [210, 100], [210, 0],
    [230, 0], [230, 100], [170, 170], 
    [70, 170], [0, 100], 
], {
    fixed: true,
    fill: '#778beb',
    ...options
});

createStack(14, 8, 100, 30);


canvas.addEventListener('click', e => {
    let x = e.offsetX, y = e.offsetY;

    creator.rect(x, y, getRandom(50, 10), getRandom(50, 10), {
        fill: '#f38181',
        ...options
    });

    creator.circle(x, y, getRandom(30, 10), {
        fill: '#fce38a',
        ...options
    });

    creator.isogon(x, y, getRandom(60, 30), getRandom(10, 4), {
        fill: '#778beb',
        ...options
    });
});








