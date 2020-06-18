import React, { ComponentType, ReactElement, FC, useEffect, useState, createElement } from 'react';
import Route, { RouteProps } from './Route';

export interface AuthRouteProps extends RouteProps {
  authFunc: (props: RouteProps) => Promise<boolean>;
  unAuthorizedCom?: ComponentType;
  loadingCom?: ComponentType;
}

const Auth: FC<AuthRouteProps> = function Auth({ authFunc, unAuthorizedCom, loadingCom, ...props }) {
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isAuthorized, setAuthorized] = useState<boolean>(false);
  const [errMsg, setErrMsg] = useState<string>('');

  useEffect(() => {
    const callFunc = async (): Promise<any> => {
      if (authFunc) {
        let authorized = false;
        try {
          authorized = await authFunc(props);
        } catch (e) {
          setErrMsg(e.message);
        }
        setLoading(false);
        setAuthorized(authorized);
      }
    };
    callFunc();
  }, []);

  if (isLoading) {
    const loadingComProps = { key: 'loadingCom', isLoading };
    return loadingCom ? createElement(loadingCom, loadingComProps) : null;
  }

  const unAuthorizedComProps = { key: 'unAuthorizedCom', errMsg, ...props };
  return isAuthorized ? <Route {...props} /> : unAuthorizedCom ? createElement(unAuthorizedCom, unAuthorizedComProps) : null;
};

/**
 * AuthRoute路由鉴权组件
 * @param {function} props.authFunc 路由鉴权函数，返回Promise，该Promise resolve值为true则表示鉴权成功，必填
 * @param {React.Component | React.StatelessComponent} props.unAuthorizedCom 鉴权失败时渲染的组件，可选
 * @param {React.Component | React.StatelessComponent} props.loadingCom 加载效果函数，可选
 */
const AuthRoute: FC<AuthRouteProps> = function AuthRoute(props) {
  // eslint-disable-next-line no-unused-vars
  const { host, component, render, children, ...restProps } = props;

  const routeProps = {
    ...restProps,
    // eslint-disable-next-line react/display-name
    render: (): ReactElement => <Auth {...props} key={props.path} />,
  };

  return <Route {...routeProps} />;
};

export default AuthRoute;
