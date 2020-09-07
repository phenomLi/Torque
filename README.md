# Torque

一个 2D 刚体物理引擎，不包含渲染。

![](https://github.com/phenomLi/Torque/raw/master/images/GIF.gif)

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
此时一个宽 100，高 200 的矩形被创建在物理世界中的（100，100）位置上。但是此时我们看不到任何画面。

Torque 仅包含物理计算，不包含渲染器，因此你需要选取一个渲染器进行图形绘制。以 [zrender](https://ecomfe.github.io/zrender-doc/public/) 为例，给这个矩形添加渲染器：
```javascript
const rectShape = new zrender.Rect({
    origin: [w / 2, h / 2],
    position: [x, y],
    rotation: -rect.rotation || 0,
    shape: {
        x: 0,
        y: 0,
        width: w,
        height: h
    },
    style: {
        fill: '#f38181',
        text: rect.id,
        transformText: true
    }
});

rect.setRender(function(body) {
    rectShape.attr({
        rotation: -body.rotation,
        position: [body.position.x - w / 2, body.position.y - h / 2]
    });
});

zr.add(rectShape);
```
刷新浏览器，享受 torque 创建的物理事件把！


## feature
- 休眠/唤醒技术
- Sequential Impulses
- 碰撞缓存
- 碰撞过滤
- 动态 dt
- 凹多边形
- 固定的刚体
- 摩擦力，恢复系数
- 事件（collisionStart/collisionEnd/sleepStart/sleepEnd...）
- 经过轴过滤优化的 SAT
- 复合刚体（TODO） 

## demo
[戳这里](https://phenomli.github.io/Torque/)

## A.D.
想了解制作物理引擎相关技术细节，可以关注[我的博客](https://github.com/phenomLi/Blog)（不定时更新）