export { default as BrowserRouter } from './BrowserRouter';
export { default as Router } from './Router';
export { default as Route } from './Route';
export { default as AuthRoute } from './AuthRoute';
export { default as event } from './Event';
export {
  HashRouter,
  MemoryRouter,
  StaticRouter,
  Link,
  NavLink,
  Prompt,
  Redirect,
  Switch,
  generatePath,
  matchPath,
  useHistory,
  useLocation,
  useParams,
  useRouteMatch,
  withRouter,
} from 'react-router-dom';

export { getPath, getBasename, isInMicro, getMountNode, registerAppEnter, registerAppLeave, getSubAppFuncs } from './utils/subApp';

export { setMicroConfig } from './utils/mainApp';
