import React, { FC, useEffect } from 'react';
import { RouterProps as ReactRouterProps } from 'react-router';
import { Router as ReactRouter } from 'react-router-dom';
import { History } from 'history';
import { RouterContext } from './utils/routersData';
import { VueMicroData, findVueMicroData } from './utils/mainApp';
import { VUE_ROUTER_PREFIX } from './utils/constant';

export interface RouterProps extends ReactRouterProps {
  onAppEnter?: (path: string, history: History) => void;
  onAppRouteChange?: (lastApp: string) => void;
  isTop?: boolean;
  microId?: string;
}

const Router: FC<RouterProps> = function Router({ onAppEnter, onAppRouteChange, isTop, microId = '001', ...props }) {
  const contextValue = {
    microId,
    onAppEnter,
    onAppRouteChange,
  };

  useEffect(() => {
    if (isTop) {
      props.history.listen(({ pathname, search }) => {
        const vueMicroData: VueMicroData | undefined = findVueMicroData(pathname);
        if (vueMicroData) {
          const vueRouter = vueMicroData[VUE_ROUTER_PREFIX] as { push: (location: string) => void };
          vueRouter.push(`${pathname}${search}`);
        }
      });
    }
  }, []);

  return (
    <RouterContext.Provider value={contextValue}>
      <ReactRouter {...props} />
    </RouterContext.Provider>
  );
};

export default Router;
