import React, { FC, useState, useEffect } from 'react';
import { BrowserRouterProps as ReactBrowserRouterProps } from 'react-router-dom';
import { createBrowserHistory, History } from 'history';
import Router from './Router';
import { APP_BASENAME } from './utils/constant';
import { setGlobalData } from './utils/data';

export interface BrowserRouterProps extends ReactBrowserRouterProps {
  onAppEnter?: (path: string, history: History) => void;
  onAppRouteChange?: (lastApp: string) => void;
  isTop?: boolean;
  microId?: string;
}

/**
 * BrowserRouter组件
 * @param { function } props.onAppEnter 子应用渲染前的回调，可选
 * @param { function } props.onAppRouteChange 子应用间路由切换时的回调，可选
 * @param { string } props.microId 主应用id 若应用中不存在子应用嵌套，则不传microId，否则需传microId
 * @param { boolean } props.isTop 是否为顶层主应用 在多层应用中，若存在多个vue子应用，顶层主应用需要传递isTop为true，且整个系统中其它应用不可传递isTop为true
 */
const BrowserRouter: FC<BrowserRouterProps> = function BrowserRouter(props) {
  const [history] = useState<History>(createBrowserHistory(props));

  const { basename } = props;

  useEffect(() => {
    // 规范约束只有顶层主应用才可设置basename
    setGlobalData<string>(APP_BASENAME, basename || '/');
  }, []);

  const routerProps = {
    history,
    ...props,
  };

  return <Router {...routerProps} />;
};

export default BrowserRouter;
