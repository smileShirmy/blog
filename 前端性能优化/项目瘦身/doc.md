# 前端性能优化 —— 项目瘦身

在我们的日常开发中，我们经常需要引入各种各样的第三方模块来帮助我们提升开发速度。但是有时候这些模块里面又包含了许多我们用不到的模块，在打包的时候又一并打包进去了，这就造成了没必要的带宽浪费。这里以Vue项目为例。

## 一、准备工作

### 1. 使用 Vue Cli 3

这时我们就要掏出我们的Vue项目利器 —— [Vue cli 3](https://cli.vuejs.org/zh/)

在 CLI 服务中的 vue-cli-service build的文档中可以看到：

> --report 和 --report-json 会根据构建统计生成报告，它会帮助你分析包中包含的模块们的大小。

> 在一个 Vue CLI 项目中，@vue/cli-service 安装了一个名为 vue-cli-service 的命令。你可以在 npm scripts 中以 vue-cli-service、或者从终端中以 ./node_modules/.bin/vue-cli-service 访问这个命令。

因此我们在`build`项目的时候就可以这么做：

```
vue-cli-service build --report
```

```
./node_modules/.bin/vue-cli-service build --report
```

这两种方式都可以帮我们生成报告，运行其中一个命令(第一个命令不行的小伙伴可以直接运行第二个命令)后我们可以看到`dist`目录下多出了一个`report.html`文件：

![dist目录](https://resource.shirmy.me/blog/covers/2019-05-09/dist.png)

这样，我们只要直接在浏览器中打开report.html就能看到模块分析了，如下图：

![analyzers](https://resource.shirmy.me/blog/covers/2019-05-09/build-report.png)

### 2. Angular 项目

`Angular`项目的`ng-cli`同样有类似的功能，我们只需要在编译时加上`--stats-json`选项即可。然后再通过[https://webpack.github.io/analyse/](https://webpack.github.io/analyse/)对生成的`json`文件进行分析，或者使用`webpack-bundle-analyzer`插件。

### 3. 其它方式

如果是其它用户，则需要安装`webpack-bundle-analyzer`

```
# NPM 
npm install --save-dev webpack-bundle-analyzer
# Yarn 
yarn add -D webpack-bundle-analyzer
```

webpack 配置：

```js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
 
module.exports = {
  plugins: [
    new BundleAnalyzerPlugin()
  ]
}
```

编译完成后同样可以生成分析报告。

## 二、echarts 按需加载

### 1. 新建按需引入配置文件

在项目中，我们可能不会用到所有的 echart 模块，只会用到个别图表或组件，这样我们就可以只引入用到的，能有效减少资源的加载时间。

我们先新建一个专门的 echart 配置文件来引入相关代码：

```js
// 路径：@/lib/echarts.js

// 引入主模块
const echarts = require('echarts/lib/echarts');

// 引入柱状图
require('echarts/lib/chart/bar');

// 引入相关组件
require("echarts/lib/component/dataZoom");

export default echarts
```

当然也可以使用`import`：

```js
// 路径：@/lib/echarts.js

// 引入主模块
import echarts from 'echarts/lib/echarts'
 
// 引入柱状图
import 'echarts/lib/chart/bar'

// 引入相关组件
import 'echarts/lib/component/dataZoom'

export default echarts
```

具体有哪些选项，可以直接查看`node_modules`目录下的`echarts/index.js`

### 2. 在用到的组件中引入 echarts

```js
import echarts from '@/lib/echarts'
```

如果这个图表仅仅针对这个组件，或者说用户使用到频率很低，我们可以使用懒加载的方式进一步优化，等到用户使用到这个组件的时候才去加载`echart`图表：

```js
methods: {
  init() {
    import("../../lib/echarts").then(Echarts => {
      // ...
    }
  }
}
```

这时我们再通过`vue-cli`工具来重新`build`项目，打开`report.html`分析对比优化前后的`echart`大小：

![echart优化前](https://resource.shirmy.me/blog/covers/2019-05-09/echart-before.png)

![echart优化后](https://resource.shirmy.me/blog/covers/2019-05-09/moment-after.png)

结果一目了然。

## 三、crypto-js 按需加载

除了`echart`可以使用这种方式，别的第三方库也能使用这些方法来加载。

我们经常会这样使用：

```js
import crypto from 'crypto-js'

// ...
crypto.HmacSHA1()
// ...
```

上面这种方式会引入整个`crypto-js`

显然除了`HmacSHA1`方法之外，我们不会使用到别的方法，那样就非常得不偿失了，因此我们可以像下面这样做：

```js
import HmacSHA1 from 'crypto-js/hmac-sha1'

// 如果要引入 Base64
import Base64 from 'crypto-js/enc-base64'
```

具体有哪些可以单独引入的，可以直接查看`node_modules`目录下的`crypto-js`目录

现在，我们再`build`来看看优化后的对比：

![crypto优化前](https://resource.shirmy.me/blog/covers/2019-05-09/crypto-before.png)

![crypto优化后](https://resource.shirmy.me/blog/covers/2019-05-09/crypto-after.png)

简直天差地别。

## 四、UI库 按需加载

如果我们为了快速开发一些公司内部的后台项目，或者是自己想做点东西来玩玩，但是不想写一些重复的样式，我们就会采用一些UI库。一些知名的UI库都是十分完善的，几乎包含所有日常所需的组件，因此它们的体积也是十分庞大的。如果我们只用到部分组件，但引入了所有组件，这样就不值得了。

以`Element-ui`为例，UI框架通过借助[babel-plugin-component](https://github.com/ElementUI/babel-plugin-component)来按需引入组件。这里我就不再如何进行按需引入了，官方文档已经写得十分详细了，[Element-ui官方文档](https://element.eleme.cn/#/zh-CN/component/quickstart)。

## 五、懒加载

上面`echarts`优化中就已经使用过懒加载了，相信各位熟悉`Vue`的小伙伴都知道这种加载方式，我们可以在使用到该组件的时候再把组件下载下来。依我的经验来说，一般不常用的、单独的模块可以使用这种方式，通过`import`引入。注意，这实际上是由`webpack`提供的方法，而非`Vue`自身提供的方法。

`Vue Router`路由懒加载：

```js
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

const AsyncComponent = () => import('components/async-component/async-component')

export default new Router({
  routes: [
    {
      path: '/',
      component: 'AsyncComponent'
    },
  ]
})
```

异步组件：

```js
components: {
  AsyncComponent: () => import('./async-component')
}
```

## 六、Moment.js 和 IgnorePlugin

常用的日期处理类库`Moment.js`居然有`540.76kb`，真是让人难以置信。见下图：

![moment.js](https://resource.shirmy.me/blog/covers/2019-05-09/moment-before.png)

它如此巨大的原因是因为有很多语言资源文件，用于转化能成多国时间格式，见[GitHub issue](https://github.com/moment/moment/issues/2373)。大多数情况下，我们并不需要用到这么多的格式，但是我们不能像上面的`echart`和`crypto`那样按需加载，因此我们需要借助[IgnorePlugin](https://www.webpackjs.com/plugins/ignore-plugin/)。

在Vue根目录下新建`vue.config.js`文件，然后在里面添加配置：

```js
const webpack = require('webpack')

module.exports = {
  configureWebpack: {
    plugins: [
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ]
  }
}
```

这时我们就可以按需引入语言包：

```js
const moment = require('moment');
require('moment/locale/zh-cn');
 
moment.locale('zh-cn');
```

这时我们再来看看它的大小：

![moment.js优化后](https://resource.shirmy.me/blog/covers/2019-05-09/moment-after.png)

## 七、总结

通过上面的例子，我想大家也能感受到许多第三方库因为要照顾到绝大部分情况，因此会比较大，但是我们可以通过一些方式只获取我们需要的部分。上面的对比图也显而易见了，减肥的效果是非常明显的，通过上面的方式，能够较大的提升用户体验，减少项目加载时间。