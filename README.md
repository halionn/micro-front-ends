# @pare/micro

## 关于@pare/micro
@pare/micro 是多应用的微前端解决方案，包含以下特征

- 子应用同时支持react、vue
- 框架应用只需以来 npm 包 `@pare/micro`， 不耦合任何工程体系
- 子应用还可以作为主应用包含其他子应用

## 一些概念

### 框架应用/主应用
通常情况，一个系统只有一个主应用或称为框架应用，主应用负责子应用的管理与注册。（子应用本身也可作为一个主应用管理自身的子应用）

### 子应用
子应用通常是一个单页应用，负责自身相关的页面代码

## 使用

### 应用webpack配置
1. 每个应用需配置唯一的 `output.jsonpFunction` 值
2. 应用打包时关闭同步代码分割，同时关闭 `runtimeChunk` 的使用
3. 需通过 `webpack-manifest-plugin` 生成的名为 asset-manifest.json 的资源映射文件
4. 应用资源需统一通过webpack-html-plugin写入html页面，在webpack html模板页面手动添加的其他js和css在微前端环境中将被忽略

### 两级应用
存在一个主应用和多个子应用，子应用不再作为主应用加载子应用

#### 主应用开发
主应用必须基于React开发

安装依赖:
```bash
$ npm i @pare/micro --save
```
通过@pare/micro的`Route`来管理注册子应用：
```jsx
// src/index.js
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

ReactDOM.render(<App/>, document.getElementById('root'))

// src/app.js
import React from 'react'
import { BrowserRouter, Route, Switch } from '@pare/micro'
import ComponentA from './ComponentA'

export default function App() {
    // 子应用渲染前的回调
    const onAppEnter = (path, history) => {}

    return (
        <>
            <h3>main app page</h3>
            <BrowserRouter onAppEnter={onAppEnter}>
                <Switch>
                    <Route path="/demo2" host="http://d2-manifest.paic.com.cn" />
                    <Route path="/demo4" host="http://d4-manifest.paic.com.cn" />
                    <Route path="/a" component={ComponentA} />
                </Switch>
            </BrowserRouter>
        </>
    )
}
```

##### Route配置字段

###### 基准路由 path
类型为string, 通过path约束每个子应用的路由定义，建立路由和子应用的映射关系

###### host
指定子应用资源映射文件asset-manifest.json的域名

#### 子应用开发
当应用在微前端环境里渲染时，需要关注两个点：
1. 通过 `getMountNode` 动态获取渲染节点
2. 注册应用自身的渲染和卸载生命周期

##### react项目
```jsx
// src/index.js
import React from 'react'
import ReactDOM from 'react-dom'
import { isInMicro, registerAppEnter, registerAppLeave, getMountNode } from '@pare/micro'
import App from './App'

if (isInMicro()) {
    registerAppEnter(history => {
        ReactDOM.render(<App history={history} />, getMountNode())
    })
    registerAppLeave(() => {
        ReactDOM.unmountComponentAtNode(getMountNode())
    })
} else {
    ReactDOM.render(<App />, document.getElementById('root'))
}

// src/app.js
import React from 'react'
import { createBrowserHistory } from 'history'
import { Router, Route, Switch, getPath } from '@pare/micro'
import ComponentA from './coms/A'
import ComponentB from './coms/B'

export default function App({ history }) {
    return (
        <Router history={history || createBrowserHistory()}>
            <Switch>
                <Route path={`${getPath()}/a`} component={ComponentA} />
                <Route path={`${getPath()}/b`} component={ComponentB} />
            </Switch>
        </Router>
    )
}
```
getPath用于动态获取子应用在主应用中被分配的路由，若子应用从于主应用分配的/demo2路由，getPath的结果为"/demo2"，若从属主应用分配的
/demoB路由，getPath的结果为"/demoB"。getPath适用于子应用会被多个主应用加载，且被分配了不同路由的情况。若子应用仅被一个主应用加载，
可适当写死
```jsx
// src/app.js 项目在主应用中被分配了路由/demo2
import React from 'react'
import { createBrowserHistory } from 'history'
import { Router, Route, Switch, getPath } from '@pare/micro'
import ComponentA from './coms/A'
import ComponentB from './coms/B'

export default function App({ history }) {
    return (
        <Router history={history || createBrowserHistory()}>
            <Switch>
                <Route path="/demo2/a" component={ComponentA} />
                <Route path="/demo2/b" component={ComponentB} />
            </Switch>
        </Router>
    )
}
```

##### vue项目
vue 子应用采用@pare/micro-vue包

安装依赖：
```bash
$ npm i @pare/micro-vue --save
```

```js
// src/main.js
import Vue form 'vue'















