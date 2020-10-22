const examples = [
    ['基础例子', basicWorld],
    ['堆叠', stackWorld],
    ['运动刚体', kineticWorld],
    ['复合刚体', compositeWorld]
];

let renderer = null,
    engine = null,
    selectedBody = null,
    options = null;

const vm = new Vue({
    el: '#container',
    data: {
        engineStatus: true,
        actionsListIcon: ['mouse-pointer', 'circle', 'square', 'play'],
        selectedActionIndex: 0,
        mouseStatus: 'mouse-pointer',
        selectedBodyInfo: [
            { title: 'ID', value: -1 },
            { title: '位置', value: '(0,0)' },
            { title: '旋转', value: 0 },
            { title: '线速度', value: '(0,0)' },
            { title: '角速度', value: 0 }
        ],
        position: { x: 0, y: 0 },
        fps: 0,
        bodyNumber: 0,
        showBodyInfo: false,
        examples: examples,
        curWorldIndex: 0
    },
    mounted() {
        this.createWorld(this.curWorldIndex);
    },
    methods: {
        createWorld(index) {
            let canvas = document.getElementById('canvas');
            
            if(renderer) {
                renderer.app.destroy(true, { children: true });
            }

            if(engine) {
                engine.destroy();
            }

            renderer = this.examples[index][1](canvas);
            engine = renderer.torque;
            options = renderer.defaultOptions,
            engine.start();
            this.engineStatus = true;

            engine.on('tickEnd', () => {
                this.fps = engine.getFPS().toFixed(1);
                this.bodyNumber = engine.getBodies().length;
                this.updateSelectedBodyInfo(selectedBody);
            });
        },
        toggleEngineStatus() {
            this.engineStatus = !this.engineStatus;
            if(this.engineStatus) {
                engine.start();
            }
            else {
                engine.pause();
            }
        },
        selectAction(iconName, index) {
            this.mouseStatus = iconName;
            this.selectedActionIndex = index;
        },
        stageClick(event) {
            let x = event.offsetX, y = event.offsetY;

            if(this.mouseStatus === 'mouse-pointer') {
                selectedBody = this.getTargetBody(x, y);
            }
            else {
                switch (this.mouseStatus) {
                    case 'circle': {
                        renderer.createCircle(x, y, renderer.getRandom(30, 20), { 
                            ...options
                        });
                        break;
                    }
                    case 'square': {
                        renderer.createRect(x, y, renderer.getRandom(60, 20), renderer.getRandom(60, 20), { 
                            ...options
                            });
                        break;
                    }
                    case 'play': {
                        renderer.createIsogon(x, y, renderer.getRandom(40, 20), renderer.getRandom(20, 4), { 
                            ...options
                            });
                        break;
                    }
                }
            }
        },
        removeBody() {
            if(selectedBody) {
                renderer.remove(selectedBody);
                selectedBody = null;
                this.showBodyInfo = false;
            }
        },
        updatePosition(event) {
            this.position.x = event.offsetX;
            this.position.y = event.offsetY;
        },
        getTargetBody(x, y) {
            let bodies = engine.getBodies();

            for(let i = 0; i < bodies.length; i++) {
                if(bodies[i].isContains(x, y)) {
                    return bodies[i];
                }
            }

            return null;
        },
        updateSelectedBodyInfo(body) {
            if(body === null) {
                this.showBodyInfo = false;
                return;
            }

            this.selectedBodyInfo[0].value = body.id;
            this.selectedBodyInfo[1].value = `(${body.position.x.toFixed(1)}, ${body.position.y.toFixed(1)})`;
            this.selectedBodyInfo[2].value = body.rotation.toFixed(1);
            this.selectedBodyInfo[3].value = `(${body.velocity.x.toFixed(1)}, ${body.velocity.y.toFixed(1)})`;
            this.selectedBodyInfo[4].value = body.angularVelocity.toFixed(1);

            this.showBodyInfo = true;
        }
    },
    watch: {
        curWorldIndex(index) {
            this.createWorld(index);
        }
    }
});