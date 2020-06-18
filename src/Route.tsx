import React, { FC, ReactElement } from 'react';
import { Route as ReactRoute, RouteProps as ReactRouteProps } from 'react-router-dom';
import AppLoader from './AppLoader';

export interface RouteProps extends ReactRouteProps {
  host?: string;
  path?: string;
}

/**
 * Route组件
 * @param {string} props.host 子应用资源映射文件url的host,比如资源映射文件的url为http://stgl.paic.com.cn/kyr/$kyr-manifest.json,则host设置为http://stgl.paic.com.cn/kyr/，可选。一旦使用该属性，表明Route加载的是子应用，否则Router的使用将参照react-router-dom的Route使用规则
 * @param {string} props.path 若Router使用了host属性，则path用来定义子应用匹配哪些路由，比如默认域名为www.pingan.com,path设置为/demo2，表示访问www.pingan.com/demo2时，渲染此应用，必填。若未使用host，则path的使用将参照react-router-dom的Route使用规则
 */
const Route: FC<RouteProps> = function Route(props) {
  const { host, path } = props;
  if (host) {
    // 加载微应用
    const appProps = { host, path, key: `${host}${path}` };
    return <ReactRoute render={(): ReactElement => <AppLoader {...appProps} />} />;
  }
  return <ReactRoute {...props} />;
};

export default Route;
