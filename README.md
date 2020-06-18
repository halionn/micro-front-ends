# @pare/micro

## 关于@pare/micro
@pare/micro 是多应用的微前端解决方案，包含以下特征

- 子应用同时支持react、vue
- 子应用还可以作为主应用包含其他子应用

## 一些概念

### 框架应用/主应用
通常情况，一个系统只有一个主应用或称为框架应用，主应用负责子应用的管理与注册。（子应用本身也可作为一个主应用管理自身的子应用）

### 子应用
子应用通常是一个单页应用，负责自身相关的页面代码

## 使用

### 应用webpack配置
1. 每个应用需配置唯一的 `output.jsonpFunction` 值
2. 关闭同步代码分割，同时关闭 `runtimeChunk`
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
/demoB路由，getPath的结果为"/demoB"。getPath适用于子应用会被多个主应用加载，且被分配了不同路由的情况。若子应用仅被一个主应用加载，可适当写死。
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
import App from './App.vue'
import VueRouter from 'vue-router'
import { isInMicro, getMountNode, registerAppEnter, registerAppLeave, getPath, getBasename } from '@pare/micro-vue'

Vue.use(VueRouter)

const router = new VueRouter({
    mode: 'history',
    routes: [
        { path: `${getPath()}/a`, name: `${getPath()}/a`, component: () => import('./components/A.vue') },
        { path: `${getPath()}/b`, name: `${getPath()}/b`, component: () => import('./components/B.vue') },
    ],
    base: getBasename()
})

if (isInMicro()) {
    let vue
    const mountNode = getMountNode()
    registerAppEnter(() => {
        vue = new Vue({
            render: h => h(App),
            router
        }).$mount()
        mountNode.innerHTML = ''
        mountNode.appendChild(vue.$el)
    })
    registerAppLeave(() => {
        vue && vue.$destroy()
    })
} else {
    new Vue({
        render: h => h(App),
        router
    }).$mount('#app')
}
```

### 多级应用
子应用仍可作为主应用包含子应用。在多级应用中，作为主应用的子应用也需基于react开发。

在多级应用中，所有主应用都需通过setMicroConfig声明自身所见的子应用配置。所有应用需同一分配microId。

子应用使用的isInMicro, registerAppEnter, registerAppLeave, getMountNode不再直接从@pare/micro引入，而是通过getSubAppFuncs获取

#### 顶层主应用开发
```jsx
// src/index.js
import React from 'react'
import ReactDOM from 'react-dom'
import { setMicroConfig } from '@pare/micro'
import App from './App'

// 当前应用的microId
const MICRO_ID = 'demo1'
// const { MICRO_ID } = process.env // 若项目使用@pare/cli-service，会注入process.env.MICRO_ID到项目中

setMicroConfig({
    id: MICRO_ID,
    children: [
        { id: 'demo2' },
        { id: 'demo4' }
    ]
})

ReactDOM.render(<App />, document.getElementById('root'))

// src/app.js
import React from 'react'
import { BrowserRouter, Route, Switch } from '@pare/micro'
import ComponentA from './ComponentA'

const MICRO_ID = 'demo1'
// const { MICRO_ID } = process.env

export default function App() {
    // 子应用渲染前的回调
    const onAppEnter = (path, history) => {}

    /* 在多层应用中，若存在多个vue子应用，顶层主应用需要传递isTop为true, 且整个系统中其它应用不可传递
    isTop为true
        此例中，仅存在一个vue子应用，不需要传递isTop属性*/
    return (
        <BrowserRouter onAppEnter={onAppEnter} microId={MICRO_ID}>
            <Switch>
                <Route path="/demo2" host="http://d2-manifest.paic.com.cn" />
                <Route path="/demo4" host="http://d4-manifest.paic.com.cn" />
                <Route path="/a" component={ComponentA} />
            </Switch>
        </BrowserRouter>
    )
}
```

#### 作为主应用的子应用开发
```jsx
// src/index.js
import React from 'react'
import ReactDOM from 'react-dom'
import { setMicroConfig, getSubAppFuncs } from '@pare/micro'
import App from './App'

const MICRO_ID = 'demo2'
// const { MICRO_ID } = process.env 

setMicroConfig({
    id: MICRO_ID,
    children: [
        { id: 'demo3' }
    ]
})

const { isInMicro, registerAppEnter, registerAppLeave, getMountNode } = getSubAppFuncs(MICRO_ID)

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
import { Router, Route, Switch, getSubAppFuncs } from '@pare/micro'
import ComponentA from './ComponentA'

const MICRO_ID = 'demo2'
// const { MICRO_ID } = process.env

export default function App({ history }) {
    const { getPath } = getSubAppFuncs(MICRO_ID)
    const onAppEnter = (path, history) => {}

    return (
        <Router
            history={ history || createBrowserHistory() }
            onAppEnter={onAppEnter} 
            microId={MICRO_ID}
        >
            <Switch>
                <Route path={`${getPath()}/demo3`} host="http://d3-manifest.paic.com.cn" />
                <Route path={`${getPath()}/a`} component={ComponentA} />
            </Switch>
        </Router>
    )
}
```

#### 子应用开发
```jsx
// src/index.js
import React from 'react'
import ReactDOM from 'react-dom'
import { getSubAppFuncs } from '@pare/micro'
import App from './App'

const MICRO_ID = 'demo3'
// const { MICRO_ID } = process.env

const { isInMicro, registerAppEnter, registerAppLeave, getMountNode } = getSubAppFuncs(MICRO_ID)

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
import { Router, Route, Switch, getSubAppFuncs } from '@pare/micro'
import ComponentA from './ComponentA'

const MICRO_ID = 'demo3'
// const { MICRO_ID } = process.env 

export default function App({ history }) {
    const { getPath } = getSubAppFuncs(MICRO_ID)
    return (
        <Router history={history || createBrowserHistory()}>
            <Switch>
                <Route path={`${getPath()}/a`} component={ComponentA} />
            </Switch>
        </Router>
    )
}
```
#### vue 子应用开发
vue子应用不能再包含子应用，采用@pare/micro-vue包

安装依赖:
```bash
$ npm i @pare/micro-vue --save
```

```js
// src/main.js
import Vue form 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'
import { getSubAppFuncs } from '@pare/micro-vue'

const MICRO_ID = 'demo4'

const { isInMicro, getMountNode, registerAppEnter, registerAppLeave, getPath } = getSubAppFuncs(MICRO_ID)

Vue.use(VueRouter)

const router = new VueRouter({
    mode: 'history',
    routes: [
        { path: `${getPath()}/a`, name: `${getPath()}/a`, component: () => import('./components/A.vue') },
        { path: `${getPath()}/b`, name: `${getPath()}/b`, component: () => import('./components/B.vue') },
    ],
    base: getBasename()
})

if (isInMicro()) {
    let vue
    const mountNode = getMountNode()
    registerAppEnter(() => {
        vue = new Vue({
            render: h => h(App),
            router
        }).$mount()
        mountNode.innerHTML = ''
        mountNode.appendChild(vue.$el)
    })
    registerAppLeave(() => {
        vue && vue.$destroy()
    })
} else {
    new Vue({
        render: h => h(App),
        router
    }).$mount('#app')
}
```

##  应用间通信
应用间通过事件监听和响应进行通信， `@pare/micro`、`@pare/mciro-vue` 都提供event对象。

### event
#### API

- `on(key, callback)` **注册回调函数，回调函数的入参通过 emit注入**
- `has(key)` **查看事件是否有被注册回调**
- `off(key, callback)` **删除已经注册的回调函数**
- `emit(key, callback)` **触发已经注册的函数，支持入参**

#### 示例

在主应用中监听事件
```js
import { event } from '@pare/micro'

event.on('saveData', data => {
    // 使用主应用的状态管理库保存数据
})

```
在子应用中触发事件
```js
import { event } from '@pare/micro'

const data = {}
event.emit('saveData', data)
```



### API

### Router/BrowserRouter
#### onAppEnter
- 子应用渲染前的回调，选填
- 类型 `function`

#### onRouteChange
- 子应用间路由切换时的回调，选填
- 类型 `function`

#### microId
- 当前应用的microId, 在多级应用中必填，两级应用中不填
- 类型 `string`

#### isTop
- 当前应用是否为顶层主应用。在多层应用中，若存在多个vue子应用，顶层主应用需要传递isTop为true，且整个系统中其它应用不可传递isTop为true
- 类型 `boolean`

#### 其它
其它属性分别继承自 `react-router-dom` 的 `Router` 和 `BrowserRouter`

### Route
#### host
- 子应用资源映射文件url的host，比如资源映射文件的url为 `http://stg1.paic.com.cn/kyr/$kyr-manifest.json`，则host设置为 `http://stg1.paic.com.cn/kyr`，可选。一旦使用该属性，表明 `Route` 加载的是子应用，否则 `Route` 的使用将参照 `react-router-dom` 的 `Route` 使用规则
- 类型 `string`

#### path
- 若 `Route` 使用了 `host` 属性， 则 `path` 用来定义子应用匹配哪些路由，比如默认域名为 `www.pingan.com`， `path` 设置为 `/demo2` ,表示访问 `www.pingan.com/demo2` 时，渲染此应用，必填。若未使用host，则 `path` 的使用将参照 `react-router-dom` 的 `Route` 使用规则
- 类型 `string` 

#### 其它
其它属性分别继承自 `react-router-dom` 的 `Route`

### AuthRoute
#### authFunc
- 鉴权函数，应当返回Promise。当返回的Promise为fulfilled状态且resolve的值为true时，渲染配置的component，或调用render，或渲染children
- 类型 `function`

#### loadingCom
- 用于异步查询路由权限的过程中展示loading效果，可选
- 类型 `React.Component`
  
#### 示例
```js
// src/app.js
import React from 'react'
import { BrowserRouter, Route, Switch, AuthRoute } from '@pare/micro'
import ComponentA from './ComponentA'

const authFunc = () => new Promise(resolve => {
    setTimeout(() => { // 模拟鉴权查询
        resolve(true)
    }, 4000)
})

export default function App() {
    return (
        <BrowserRouter onAppEnter={onAppEnter}>
            <Switch>
                <AuthRoute 
                    path="/a"
                    authFunc={authFunc}
                    loadingCom={() => <div>loading ........</div>}
                    unAuthorizedCom={() => <div>unAuthorized component</div>}
                    component={ComponentA}
                />
                <AuthRoute 
                    path="/demo2"
                    authFunc={authFunc}
                    loadingCom={() => <div>loading ........</div>}
                    unAuthorizedCom={() => <div>unAuthorized component</div>}
                    host="http://d2-manifest.paic.com.cn"
                />
            </Switch>
        </BrowserRouter>
    )
}
```

### 子应用接入
#### isInMicro
判断当前应用是否运行在为前端环境中
- 类型 `function`

#### getBasename
获取子应用的basename
- 类型 `function`

#### getPath
获取子应用被分配的微前端路径
- 类型 `function`

#### getMountNode
获取子应用在微前端环境中的渲染节点
- 类型 `function`

#### registerAppEnter
注册当前应用加载前的回调
- 类型 `function`

#### registerAppLeave
注册当前应用卸载前的回调
- 类型 `function`

#### getSubAppFuncs
在多级应用中，获取子应用的接入函数
- 类型 `function`
- 入参 microId
  - 当前应用的microId
  - 类型 `string`
- 返回
  - 接入函数映射对象
  - 类型 `object`









