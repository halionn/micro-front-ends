import { PREFIX, MICRO_CONFIG_PREFIX, VUE_ROUTER_PREFIX, APP_PATH } from './constant';
import { setGlobalData, getGlobalData } from './data';

export interface MicroConfig {
  id: string;
  children: MicroConfig[] | void;
}

export interface VueMicroData {
  'vue-router': Record<string, any>;
  'app-path': string;
}

const find = (config: MicroConfig, microId: string): MicroConfig | undefined => {
  const { id, children } = config;
  if (id === microId) {
    return config;
  }
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      const res: MicroConfig | undefined = find(children[i], microId);
      if (res) {
        return res;
      }
    }
  }
};

export const checkConfig = ({ id, children }: MicroConfig): boolean => {
  if (!id || (typeof id !== 'string' && typeof id !== 'number')) {
    return false;
  }
  if (children) {
    if (Array.isArray(children)) {
      return !children.find(child => !checkConfig(child));
    }
    return false;
  }
  return true;
};

/**
 * 设置微前端从属关系配置，只在顶层主应用中调用
 * @param {object} config 从属关系配置对象，json格式
 */
export function setMicroConfig(config: MicroConfig): void {
  if (!checkConfig(config)) {
    throw new Error('micro config is invalid');
  }

  const tree = getGlobalData<MicroConfig | undefined>(MICRO_CONFIG_PREFIX);
  if (tree) {
    const node: MicroConfig | undefined = find(tree, config.id);
    if (node) {
      node.id = config.id;
      node.children = config.children;
    }
  }
  setGlobalData(MICRO_CONFIG_PREFIX, tree || config);
}

export const findVueMicroData = (path: string): VueMicroData | undefined => {
  let matched: VueMicroData[] = Object.values(window[PREFIX]).filter(
    item => item.constructor === Object && item[VUE_ROUTER_PREFIX] && item[APP_PATH] && path.includes(item[APP_PATH])
  ) as VueMicroData[];

  if (matched.length > 1) {
    matched = matched.sort((prev, next) => next[APP_PATH].length - prev[APP_PATH].length);
  }

  return matched[0];
};
