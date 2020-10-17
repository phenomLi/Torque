
const canvas = document.getElementById('canvas'),
      canvasWidth = canvas.offsetWidth,
      canvasHeight = canvas.offsetHeight;

    
const creator = new Creator(canvas, canvasWidth, canvasHeight, {
    gravity: Creator.v(0, 9),
    enableSleeping: true,
    enableCache: true,
    enableSATBoost: true
});

const options = {
    mass: 100,
    friction: 0.3,
    fill: 'transparent',
    // textFill: '#333',
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
        ...opt,
        static: true
    });

    // 底墙壁
    creator.rect(0, cHeight - wallWidth, cWidth, wallWidth, {
        ...opt,
        static: true
    });
    
    // 左墙壁
    creator.rect(0, 0, wallWidth, cHeight, {
        ...opt,
        static: true
    });

    // 右墙壁
    creator.rect(cWidth - wallWidth, 0, wallWidth, cHeight, {
        ...opt,
        static: true
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




let concave = creator.polygon(300, 250, [
    [0, 0], [20, 0], [20, 100], 
    [70, 150], [170, 150], [210, 100], [210, 0],
    [230, 0], [230, 100], [170, 170], 
    [70, 170], [0, 100], 
], {
    kinetic: true,
    ...options
});

concave.setAngularVelocity(0.5);


let moveRect = creator.rect(800, 500, 80, 30, {
    kinetic: true,
    ...options
}),
    rotateRect = creator.rect(900, 200, 50, 50, {
    kinetic: true,
    ...options
});

let counter = 0;
creator.t.on('beforeUpdate', () => {
    counter += 0.014;
    moveRect.setVelocity(1000 + 300 * Math.sin(counter) - moveRect.position.x, 0);
});

rotateRect.setAngularVelocity(5);


let r1 = creator.rect(700, 500, 80, 30, {
    ...options
});
    r2 = creator.rect(725, 500, 30, 100, {
    ...options
});
    c1 = creator.circle(740, 600, 30, {
    ...options
});

creator.composite([c1, r1, r2]);



createStack(4, 4, 100, 30);
createWall(canvasWidth, canvasHeight, 30, options);




canvas.addEventListener('click', e => {
    let x = e.offsetX, y = e.offsetY;

    creator.circle(x, y, 14, {
        fill: '#fce38a',
        velocity: Creator.v(5, 0),
        ...options
    });

    creator.rect(x, y, getRandom(50, 10), getRandom(50, 10), {
        fill: '#f38181',
        ...options
    });

    creator.isogon(x, y, 20, getRandom(16, 4), {
        fill: '#778beb',
        ...options
    });
});


creator.t.start();





