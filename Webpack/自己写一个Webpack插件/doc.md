# 自己写一个 Webpack 插件

## 需求分析

当我们使用 Jest 进行自动化测试时，我们可能会需要在测试文件中获取某个 DOM 节点，这时就会在相应的 DOM 上加一个 `data-test` 属性来获取，比如：

```html
<button class="button-class" data-test="button"><button>
```

在测试文件中判断 `button` 是否存在

```javascript
it('页面上存在 button', () => {
  const button = document.querySelector('[data-test="button"]')
  expect(button).toBeDefined()
})
```

因此 `data-test` 实际上只是用于测试文件，并没有其它实质性的作用，因此希望在打包时把该属性去掉，这时就可以通过 webpack 插件来清除它，如：

```html
<!-- 未使用移除 data-test 属性插件编译前 -->
<button class="button-class" data-test="button"><button>
<!-- 使用插件后 -->
<button class="button-class"><button>
```

## 编写插件

参考官方文档 [Writing a Plugin](https://webpack.js.org/contribute/writing-a-plugin/) 可知，一个插件由以下几个部分组成：

- 一个具名的 JavaScript 函数或一个 Class
- 在它的原型上定义 `apply` 方法
- 通过 `apply` 函数中传入 compiler 并插入指定的事件钩子，在钩子回调中取到 compilation 对象
- 通过 compilation 处理 webpack 内部特定的实例数据
- 如果是插件是异步的，在插件的逻辑编写完后调用 webpack 提供的 callback

编写插件

```javascript
// step1: 创建 plugins/RemoveDataTest.js
class RemoveDataTestPlugin {
  constructor(options) {
    this.options = options
  }

  // step2: 需要定义 apply 方法，并传入 compiler
  apply(compiler) {
    // 匹配所有 data-test 属性的正则
    const reg = /\s*data-test="(.*?)"/g

    // step3: 插入事件钩子，在回调中取到 compilation
    compiler.hooks.emit.tap('RemoveDataTest', (compilation) => {
      Object.keys(compilation.assets).forEach(filename => {
        // step4: 得到资源内容
        let content = compilation.assets[filename].source()
        // step5: 清除 html 文件中的 data-test 属性
        if (/\.html$/.test(filename)) {
          content = content.replace(reg, '')
        }
        // step6: 更新 compilation.assets[filename] 对象
        compilation.assets[filename] = {
          source() {
            return content
          },
          size() {
            return content.length
          }
        }
      })
    })
  }
}

module.exports = RemoveDataTestPlugin
```

### 过程分析

#### compiler 中的 emit 钩子

emit 钩子可以把编译好的代码发射到指定的 stream 中触发，在执行这个钩子的时候，我们能从回调函数返回的 compilation 对象上拿到已经编译好的 stream

```javascript
compiler.hooks.emit.tap('自定义事件名', (compilation) => {
  // ...
})
```

#### 访问 compilation 对象

在每一次编译时，都会拿到最新的 compilation 对象，所有的资源都会以 key-value 的形式存在 compilation 对象下的 `compilation.assets` 中

#### 遍历 assets

通过遍历 assets，我们可以拿到 main.js 和 index.html 文件，通过 `compilation.assets[filename].source()` 取得资源内容，最后用正则 `replace` 方法去掉 `data-test`

#### 更新 assets

```javascript
compilation.assets[filename] = {
  source() {
    return content
  },
  size() {
    return content.length
  }
}
```

### 使用插件

```javascript
// webpack.dev.config.js
const RemoveDataTestPlugin = require('./plugins/RemoveDataTestPlugin')

module.exports = {
  // ...
  plugins: [
    // ...
    new RemoveDataTestPlugin()
  ],
  // ...
}
```

[源码地址](https://github.com/smileShirmy/RemoveDataTestPlugin)