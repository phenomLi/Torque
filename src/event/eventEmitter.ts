
/**
 * 事件管理器
 */



class EventEmitter {

    /**
     * 绑定事件
     * @param obj 
     * @param eventName 
     * @param fn 
     */
    bind(obj: any, eventName: string, fn: Function) {
        obj.methods[eventName] = fn;
    }

    /**
     * 解绑事件
     * @param obj 
     * @param eventName 
     */
    unBind(obj: any, eventName: string) {
        obj.methods[eventName] = null;
    }


    /**
     * 事件发射
     * @param obj 
     * @param eventName 事件名称 
     */
    emit<T>(obj: any, eventName: string, ...para: any) {
        obj.methods[eventName] && typeof obj.methods[eventName] === 'function' && obj.methods[eventName](...para);
    }
}


export const Event = new EventEmitter();