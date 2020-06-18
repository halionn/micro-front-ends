import { History } from 'history';
import { getMicroData, setMicroData, getGlobalData } from './data';
import { APP_MOUNT_NODE, APP_ENTER_PREFIX, APP_LEAVE_PREFIX, APP_PATH, APP_BASENAME, MICRO_CONFIG_PREFIX } from './constant';
import { checkConfig, MicroConfig } from './mainApp';

interface SubAppFuncs {
  getPath: () => string;
  isInMicro: () => boolean;
  getMountNode: () => HTMLDivElement | never;
  registerAppEnter: (callback: (history?: History) => void) => void | never;
  registerAppLeave: (callback: () => void) => void | never;
  getBasename: () => string;
}

/**
 * 获取子应用被分配的微前端路径
 * @param {string} microId 从属的主应用id, 若应用中不存在子应用嵌套, 则不传microId, 否则需传microId
 * @returns {string}
 */
export function getPath(microId = '001'): string {
  return getMicroData<string>(microId, APP_PATH) || '';
}

/**
 * 获取子应用的basename
 * @returns {string}
 */
export function getBasename(): string {
  return getGlobalData<string>(APP_BASENAME) || '/';
}

/**
 * 当前应用是否运行在微前端环境中
 * @param {string} microId 从属的主应用id, 若应用中不存在子应用嵌套, 则不传microId, 否则需传microId
 * @returns {boolean}
 */
export function isInMicro(microId = '001'): boolean {
  return !!getMicroData(microId, APP_MOUNT_NODE);
}

/**
 * 获取子应用在微前端环境中的渲染节点
 * @param {string} microId 从属的主应用id, 若应用中不存在子应用嵌套, 则不传microId, 否则需传microId
 * @returns {HTMLElement}
 */
export function getMountNode(microId = '001'): HTMLDivElement | never {
  const mountNode = getMicroData<HTMLDivElement | undefined>(microId, APP_MOUNT_NODE);
  if (mountNode) {
    return mountNode;
  }
  throw new Error('Micro page do not provide node to render son app');
}

/**
 * 注册当前应用加载前的回调
 * @param {function} callback 回调
 * @param {string} microId 从属的主应用id, 若应用中不存在子应用嵌套, 则不传microId, 否则需传microId
 */
export function registerAppEnter(callback: (history?: History) => void, microId = '001'): void | never {
  if (!callback || !microId) return;
  if (typeof callback !== 'function') {
    throw new Error('registerAppEnter must be function.');
  }
  setMicroData(microId, APP_ENTER_PREFIX, callback);
}

/**
 * 注册当前应用卸载前的回调
 * @param {function} callback 回调
 * @param {string} microId 从属的主应用id, 若应用中不存在子应用嵌套, 则不传microId, 否则需传microId
 */
export function registerAppLeave(callback: () => void, microId = '001'): void | never {
  if (!callback || !microId) return;
  if (typeof callback !== 'function') {
    throw new Error('registerAppLeave must be function.');
  }
  setMicroData(microId, APP_LEAVE_PREFIX, callback);
}

const getFuncsByParentId = (parentId = '001'): SubAppFuncs => ({
  getPath: () => getPath(parentId),
  isInMicro: () => isInMicro(parentId),
  getMountNode: () => getMountNode(parentId),
  registerAppEnter: callback => registerAppEnter(callback, parentId),
  registerAppLeave: callback => registerAppLeave(callback, parentId),
  getBasename,
});

const getMicroId = ({ id, children }: MicroConfig, curId: string): string | undefined => {
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      if (children[i].id === curId) {
        return id;
      }
      const nextId = getMicroId(children[i], curId);
      if (nextId) {
        return nextId;
      }
    }
  }
};

/**
 * 获取从属主应用的microId
 * @param {string} microId 当前应用的microId
 * @returns {string} 从属主应用的microId
 */
export function getParentId(microId: string): string | undefined {
  const config = getGlobalData<MicroConfig | undefined>(MICRO_CONFIG_PREFIX);
  if (config && checkConfig(config)) {
    return getMicroId(config, microId);
  }
}

/**
 * 在多级应用中，获取子应用的接入函数
 * @param {string} microId 当前应用的microId
 * @returns {object} 包含getPath、getBasename、isInMicro、getMountNode、registerAppEnter、registerAppLeave
 */
export function getSubAppFuncs(microId = '001'): SubAppFuncs {
  const parentId: string = getParentId(microId); // 从属的主应用id
  return getFuncsByParentId(parentId);
}
