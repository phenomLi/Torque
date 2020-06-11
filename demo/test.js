

function getRandom(number, min = 0) {
    let n;

    do {
        n = Math.floor(Math.random() * number);
    } while(n < min);

    return n;
}


const creator = new Creator('canvas', 1000, 600, {
    gravity: Creator.v(0, 900),
    enableSleeping: false
});



creator.rect(0, 550, 1000, 50, {
    color: '#778beb',
    fixed: true,
    friction: 0.1
});
creator.rect(0, 0, 50, 600, {
    color: '#778beb',
    fixed: true,
    friction: 0.1
});
creator.rect(950, 0, 50, 600, {
    color: '#778beb',
    fixed: true,
    friction: 0.1
});
creator.rect(0, 0, 1000, 50, {
    color: '#778beb',
    fixed: true,
    friction: 0.1
});


document.getElementById('canvas').addEventListener('click', e => {
    for(let i = 0; i < 1; i ++) {
        creator.rect(e.clientX, e.clientY, getRandom(100, 40), getRandom(100, 20), {
            color: '#fdcb6e',
            mass: 1000,
            friction: 0.3,
            methods: {
                sleepStart(body) {
                    body.data.attr('style', {
                        fill: '#999'
                    });
                },
                sleepEnd(body) {
                    body.data.attr('style', {
                        fill: '#fdcb6e'
                    });
                }
            }
        });
    }

    for(let j = 0; j < 1; j++) {
        // creator.circle(e.clientX, e.clientY, getRandom(50, 10), {
        //     color: '#fdcb6e',
        //     mass: 10,
        //     airFriction: 0.02,
        //     friction: 0.3,
        //     methods: {
        //         sleepStart(body) {
        //             body.data.attr('style', {
        //                 fill: '#999'
        //             });
        //         },
        //         sleepEnd(body) {
        //             body.data.attr('style', {
        //                 fill: '#fdcb6e'
        //             });
        //         }
        //     }
        // });
    }
});


creator.t.start();





