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
- **SATBoost技术**
- 休眠/唤醒技术
- Warm Start
- Sequential Impulses
- 基于NFSP-SAT的碰撞缓存/复用技术
- 碰撞过滤
- 基于NFSP-SAT的V-clip碰撞点求解方法
- 动态 dt
- 凹多边形
- 复合刚体
- 静态/运动的刚体
- 摩擦力，静摩擦力，恢复系数
- 事件（collisionStart/collisionEnd/sleepStart/sleepEnd...）

## demo
[戳这里](https://phenomli.github.io/Torque/)

## 关于SATBoost
SATBoost技术是本人研究得到的针对SAT（分离轴测试算法）的一个优化算法，能大幅提高碰撞检测的效率。在给定7 * 17个正16边形的静止碰撞（rest collision）条件下，与未经过优化的常规SAT对比结果如下（关闭碰撞复用和休眠功能）：
![](https://github.com/phenomLi/Torque/raw/master/images/微信图片_20200913174835.png)
![](https://github.com/phenomLi/Torque/raw/master/images/微信截图_20200913175522.png)

SATBoost主要针对SAT进行改进，但同时，NFSP-SAT也优化了碰撞复用和碰撞点求解的性能。
## A.D.
想了解制作物理引擎相关技术细节，可以关注[我的博客](https://github.com/phenomLi/Blog)（不定时更新）
