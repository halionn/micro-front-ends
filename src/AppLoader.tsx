import React, { FC, useEffect, useRef, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { History } from 'history';
import { generateAppName, getManifest, cacheManifest, fetchManifest, appendStylesAndScripts, removeStylesAndScripts } from './utils/handleAssets';
import { SCRIPT_ID_PREFIX, STYLE_ID_PREFIX, APP_ENTER_PREFIX, APP_LEAVE_PREFIX, APP_MOUNT_NODE, APP_PATH } from './utils/constant';
import { getMicroData, setMicroData } from './utils/data';
import { RouterContext, routerData, RouterContextValue } from './utils/routersData';

interface RenderAppProps {
  microId: string;
  path: string;
  history: History;
  onAppEnter?: (path: string, history: History) => void;
  onAppRouteChange?: (lastApp: string) => void;
}

export interface AppLoaderProps {
  host: string;
  path: string;
}

// 渲染子应用
const renderApp = ({ microId, path, history, onAppEnter, onAppRouteChange }: RenderAppProps): void => {
  const handleAppEnter = getMicroData<(history?: History) => void | undefined>(microId, APP_ENTER_PREFIX);
  // 渲染并挂载至微前端容器
  try {
    // 调用主框架的onAppEnter回调;
    onAppEnter && onAppEnter(path, history);
    // 调用主框架的onRouteChange回调
    if (routerData.lastApp && routerData.lastApp !== path) {
      onAppRouteChange && onAppRouteChange(routerData.lastApp);
    }
    // 调用子应用注册的enter回调
    handleAppEnter && handleAppEnter(history);
  } catch (error) {
    console.log(`渲染${path}页面出错`, error);
  }
};

// 卸载子应用
const destroy = (microId: string, host: string, path: string): void => {
  const appName = generateAppName(path);
  const scriptId = `${SCRIPT_ID_PREFIX}${appName}`;
  const styleId = `${STYLE_ID_PREFIX}${appName}`;

  // 记录lastApp
  routerData.lastApp = path;

  // 卸载子应用渲染的内容
  const handleAppLeave = getMicroData<() => void | undefined>(microId, APP_LEAVE_PREFIX);
  handleAppLeave && handleAppLeave();

  // 清空子应用的渲染节点
  setMicroData(microId, APP_MOUNT_NODE, null);

  // 删除渲染函数，避免内存泄漏
  setMicroData(microId, APP_ENTER_PREFIX, null);

  // 清空子应用path
  setMicroData(microId, APP_PATH, null);

  // 清空子应用basename
  // setMicroData(microId, APP_BASENAME, null);

  // 移除子应用相关资源
  removeStylesAndScripts(host, scriptId, styleId);
};

const AppLoader: FC<AppLoaderProps> = function AppLoader({ host, path }: AppLoaderProps) {
  const history = useHistory<History>();

  const { microId, onAppEnter, onAppRouteChange } = useContext<RouterContextValue>(RouterContext);

  const appMountNode = useRef<HTMLDivElement>();

  useEffect(() => {
    const appName = generateAppName(path);
    const scriptId = `${SCRIPT_ID_PREFIX}${appName}`;
    const styleId = `${STYLE_ID_PREFIX}${appName}`;

    // 设置子应用mountNode
    setMicroData(microId, APP_MOUNT_NODE, appMountNode.current);

    // 设置子应用path
    setMicroData(microId, APP_PATH, path);

    // 设置子应用basename
    // setMicroData(microId, APP_BASENAME, basename? `${basename}${path}` : path);

    const handleManifest = (manifest: Record<string, any> | void): void => {
      if (manifest) {
        // webpack-manifest-plugin在Vue中，生成的json里入口key为app.js
        const scriptSrc: string = manifest['main.js'] || manifest['app.js'];
        const styleSrc: string = manifest['main.css'] || manifest['app.css'];
        // 向页面插入资源
        appendStylesAndScripts({ styleId, styleSrc, scriptId, scriptSrc }).then(() => {
          renderApp({ microId, path, history, onAppEnter, onAppRouteChange });
        });
      }
    };

    // 页面已存在子应用资源
    if (document.getElementById(scriptId) && document.getElementById(styleId)) {
      console.info('页面存在已渲染应用，重新渲染', scriptId);
      renderApp({ microId, path, history, onAppEnter, onAppRouteChange });
      return;
    }

    const cachedManifest: Record<string, any> | undefined = getManifest(microId, appName);
    if (cachedManifest) {
      // 有缓存manifest内容
      handleManifest(cachedManifest);
    } else {
      // 获取manifest内容
      fetchManifest(host).then(manifest => {
        cacheManifest(microId, appName, manifest); // 缓存manifest内容
        handleManifest(manifest);
      });
    }

    return (): void => {
      destroy(microId, host, path);
    };
  }, []);

  return <div ref={appMountNode} />;
};

export default AppLoader;
