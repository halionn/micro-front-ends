import { getGlobalData, setGlobalData } from './utils/data';
import { EVENT_PREFIX } from './utils/constant';

interface Callback {
  (...cbParams: any[]): void;
}

interface EventHooks {
  emit(key: string, ...cbParams: any[]): void;
  on(key: string, callback: Callback): void;
  off(key: string, callback: Callback): void;
  has(key: string): boolean;
}

interface EventEmitter {
  [propName: string]: Callback[];
}

/**
 * 事件对象
 * @class
 */
class Event implements EventHooks {
  private eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = {};
  }

  /**
   * 触发已经注册的事件回调函数，支持入参
   * @param {string} key 事件名称
   * @param {function[]} cbParams 注册函数被调用时的入参
   * @memberof Event
   */
  emit(key, ...cbParams) {
    const callbacks: Callback[] | undefined = this.eventEmitter[key];
    if (!Array.isArray(callbacks) || (Array.isArray(callbacks) && callbacks.length === 0)) {
      console.warn(`event.emit: no callback is called for ${key}`);
      return;
    }
    callbacks.forEach(cb => {
      cb(...cbParams);
    });
  }

  /**
   * 注册事件回调函数
   * @param {string} key 事件名称
   * @param {function} callback 绑定的回调
   * @memberof Event
   */
  on(key, callback) {
    if (typeof key !== 'string') {
      console.warn('event.on: key should be string');
    }
    if (callback === undefined || typeof callback !== 'function') {
      console.warn('event.on: callback is required, should be function');
      return;
    }
    if (!this.eventEmitter[key]) {
      this.eventEmitter[key] = [];
    }
    this.eventEmitter[key].push(callback);
  }

  /**
   * 删除注册的事件回调
   * @param {string} key 事件名称
   * @param {function=} callback 事件回调，可选。不传则清空事件所有回调，传则只清空该回调
   * @memberof Event
   */
  off(key, callback) {
    if (typeof key !== 'string') {
      console.warn('event.off: key should be string');
      return;
    }
    // 清空key绑定的所有回调
    if (callback === undefined) {
      this.eventEmitter[key] = [];
      return;
    }
    // 仅去除绑定的callback
    this.eventEmitter[key] = this.eventEmitter[key].filter(cb => cb !== callback);
  }

  /**
   * 查看事件是否有被注册回调
   * @param {string} key 事件名称
   * @returns {boolean}
   * @memberof Event
   */
  has(key) {
    const keyEmitter: Callback[] | undefined = this.eventEmitter[key];
    return Array.isArray(keyEmitter) && keyEmitter.length > 0;
  }
}

// eslint-disable-next-line import/no-mutable-exports
let event = getGlobalData<Event | undefined>(EVENT_PREFIX);
if (!event) {
  event = new Event();
  setGlobalData(EVENT_PREFIX, event);
}

export default event;
