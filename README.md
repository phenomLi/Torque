# Torque

 2D 刚体高性能物理引擎，不包含渲染。

## usage
初始化一个 torque 实例
```javascript
const torque = new Torque(width, height);
```

创建并添加一个矩形
```javascript
const rect = Torque.body.Rect(100, 100, 100, 200);      
torque.append(rect);
```
此时一个宽 100，高 200 的矩形被创建在物理世界中的(100，100)位置上。但是此时我们看不到任何画面。

Torque 仅包含物理计算，不包含渲染器，因此你需要选取一个渲染器进行图形绘制。以 [PIXI](https://github.com/pixijs/pixi.js) 为例，给这个矩形添加渲染器：
```javascript
const app = new PIXI.Application({
    width: 800, 
    height: 600,
    antialias: true,   
});

let rectangle = new PIXI.Graphics();

shape.lineStyle(0.8, 0x000000, 1);
shape.beginFill();
        
rectangle.position.x = 100 + 100 / 2;
rectangle.position.y = 100 + 100 / 2;
rectangle.drawRect(-100 / 2, -100 / 2, 100, 100);

rectangle.endFill();

rect.setRender(function(body) {
    rectangle.position.x = body.position.x;
    rectangle.position.y = body.position.y;
    rectangle.rotation = body.rotation;
});

app.stage.add(rectShape);
```
至此，由PIXI创建的矩形`rectangle`与Torque世界的矩形`rect`通过`setRender`函数绑定在了一起。刷新浏览器，可以看见一个黑色边框的，长宽都为100的矩形出现在(100, 100)的位置。


## feature
- **SATBoost技术**
- 休眠/唤醒技术
- Warm Start
- Sequential Impulses
- 基于SATBoost的碰撞缓存/复用技术
- 碰撞过滤
- 基于SATBoost的V-clip碰撞点求解方法
- 动态 dt
- 凹多边形
- 复合刚体
- 静态/运动的刚体
- 摩擦力，静摩擦力，恢复系数
- 事件（collisionStart/collisionEnd/sleepStart/sleepEnd...）

## Demo
（最新的DEMO已将渲染器从zrender替换至PIXI，因PIXI是基于WebGL渲染，具有更好的性能）
[戳这里](https://phenomli.github.io/Torque/)

## 关于SATBoost
SATBoost技术是本人研究得到的针对SAT（分离轴测试算法）的一个优化算法，能大幅提高碰撞检测的效率。在给定7 * 17个正16边形的静止碰撞（rest collision）条件下，与未经过优化的常规SAT对比结果如下（关闭碰撞复用和休眠功能）：
![](https://github.com/phenomLi/Torque/raw/master/images/微信图片_20200913174835.png)
![](https://github.com/phenomLi/Torque/raw/master/images/微信截图_20200913175522.png)

SATBoost主要针对SAT进行改进，但同时，SATBoost也优化了碰撞复用和碰撞点求解的性能。

## A.D.
想了解制作物理引擎相关技术细节，可以关注[我的博客](https://github.com/phenomLi/Blog)（不定时更新）
