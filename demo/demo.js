
const canvas = document.getElementById('canvas'),
      canvasWidth = canvas.offsetWidth,
      canvasHeight = canvas.offsetHeight;

    
const creator = new Creator(canvas, canvasWidth, canvasHeight, {
    gravity: Creator.v(0, 8)
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


createWall(canvasWidth, canvasHeight, 30, {
    fixed: true,
    friction: 0.3,
    fill: null,
    stroke: '#ddd'
});


creator.rect(canvasWidth / 2 - 50, canvasHeight / 2 - 50, 100, 100, {
    fixed: true,
    friction: 0.3,
    fill: null,
    stroke: '#ddd'
});


const options = {
    mass: 10,
    friction: 0.3,
    // textFill: '#000',
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

creator.polygon(600, 450, [[0, 0], [50, 0], [100, 50], [100, 100], [0, 100]], {
    fill: '#778beb',
    ...options
});


creator.polygon(300, 450, [[0, 0], [50, 50], [100, 0], [100, 100], [0, 100]], {
    fill: '#778beb',
    //fixed: true,
    friction: 0.3,
    ...options
});


canvas.addEventListener('click', e => {
    let x = e.offsetX, y = e.offsetY;

    creator.rect(x, y, getRandom(100, 40), getRandom(100, 20), {
        fill: '#f38181',
        ...options
    });

    creator.circle(x, y, getRandom(50, 10), {
        fill: '#fce38a',
        ...options
    });

    creator.tri(x, y, getRandom(100, 50), {
        fill: '#71c9ce',
        ...options
    });
});


creator.t.start();





