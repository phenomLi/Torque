

type Option = {
    [key: string]: any;
};


// 常用工具函数
export const Util = {
    _id: 0,

    /**
     * 生成一个id（整数类型）
     */
    id(): number {
        return this._id++;
    },

    /**
     * 根据两个id生成一个复合id（字符串类型）: 'id1.id2'
     * @param id1 
     * @param id2 
     */
    compositeId(id1: number, id2: number): string {
        if (id1 < id2) {
            return id1 + '.' + id2;
        } else {
            return id2 + '.' + id1;
        }
    },

    /**
     * 对象合并
     * @param originOpt 源对象
     * @param destOpt 目标对象
     */
    merge(originOpt: Option, destOpt: Option) {
        if(!originOpt || !destOpt) return;

        for(let key in destOpt) {
            if(
                typeof destOpt[key] === 'object' && 
                !Array.isArray(destOpt[key]) && 
                originOpt[key] !== null && 
                originOpt[key] !== undefined
            ) {
                this.merge(originOpt[key], destOpt[key]);
            }
            else {
                if((destOpt[key] !== null || destOpt[key] !== undefined) && originOpt[key] !== undefined) {
                    originOpt[key] = destOpt[key];
                }
            }
        }
    },

    /**
     * 对象扩展
     * @param originOpt 源对象
     * @param extendOpt 扩展对象
     */
    extend(originOpt: Option, extendOpt: Option) {
        if(!originOpt || !extendOpt) return;

        for(let key in extendOpt) {
            if(
                typeof extendOpt[key] === 'object' && 
                !Array.isArray(extendOpt[key]) && 
                originOpt[key] !== null && 
                originOpt[key] !== undefined
            ) {
                this.extend(originOpt[key], extendOpt[key]);
            }
            else {
                if(extendOpt[key] !== null || extendOpt[key] !== undefined)
                    originOpt[key] = extendOpt[key];
            }
        }
    },

    /**
     * 从列表移除某个元素
     * @param list 列表
     * @param item 要移除的元素
     */
    remove<T>(list: T[], item: T) {
        list.splice(list.findIndex(i => i['id'] === item['id']), 1);
    },


    /**
     * 角度转弧度
     * @param angle 角度
     */
    angle2Radian(angle: number): number {
        return (angle/180)*Math.PI;
    },

    /**
     * 弧度转角度
     * @param radian 弧度
     */
    radian2Angle(radian: number): number {
        return radian/Math.PI*180;
    },

    /**
     * 返回页面加载完毕开始到当前的时间（微秒级，performance api）
     */
    now(): number {
        return window.performance.now();
    },

    /**
     * 直接插入排序
     * @param list 要排序的列表
     * @param fn 比较函数
     */
    insertSort<T>(list: T[], fn: (prev: T, cur: T) => number) {
        let len = list.length,
            i, j, temp;

        for(i = 1; i < len; i++) {
            temp = list[i];
            for(j = i - 1; j >= 0 && fn(list[j], temp) > 0; j--) {
                list[j + 1] = list[j];
            }
            list[j + 1] = temp;
        }
    },

    /**
     * 对给定的value，收窄在min和max范围内
     * @param value 
     * @param min 
     * @param max 
     */
    clamp(value: number, min: number, max: number): number {
        if (value < min)
            return min;
        if (value > max)
            return max;
        return value;
    },

    /**
     * 返回一个数的正负号
     * @param value 
     */
    sign(value: number): number {
        return value < 0 ? -1 : 1;
    }
}