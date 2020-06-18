import { createContext } from 'react';
import { History } from 'history';

export interface RouterContextValue {
  onAppEnter?: (path: string, history: History) => void;
  onAppRouteChange?: (lastApp: string) => void;
  microId?: string;
}

export const RouterContext = createContext({});

export const routerData: {
  lastApp: string | null;
} = {
  lastApp: null,
};
