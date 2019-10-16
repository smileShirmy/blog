# Koa2框架原理及实现

[Koa2](https://koa.bootcss.com/)是一个基于Node实现的Web框架，特点是优雅、简洁、健壮、体积小、表现力强。它所有的功能通过插件的形式来实现。

本文主要介绍如何自己实现一个简单的Koa，通过这种方式来深入理解Koa原理，尤其是中间件部分的理解。Koa的具体实现可以看的[koa的源码](https://github.com/koajs/koa)。

```javascript
// koa 的简单使用
const Koa = require('koa')
const app = new Koa()

app.use(async ctx => {
  ctx.body = 'Hello World';
})

app.listen(3000)
```

通过上面的代码，如果要实现koa，我们需要实现三个模块，分别是http的封装，ctx对象的构建，中间件机制的实现，当然koa还实现了错误捕获和错误处理。

## 封装http模块

通过阅读Koa2的[源码](https://github.com/koajs/koa)可知Koa是通过封装原生的node http模块。

```javascript
// server.js
const http = require('http')

const server = http.createServer((req, res) => {
  res.writeHead(200)
  res.end('hello world')
})

server.listen(3000, () => {
  console.log('server running on port 3000')
})
```

以上是使用Node.js创建一个HTTP服务的代码片段，关键是使用http模块中的`createServer()`方法，接下来我们对上面这面这部分过程进行一个封装，首先创建application.js，并创建一个Application类用于创建Koa实例。通过创建`use()`方法来注册中间件和回调函数。并通过`listen()`方法开启服务服务监听实例，并传入`use()`方法注册的回调函数，如下代码所示：

```javascript
// application.js
let http = require('http')

class Application {
  constructor () {
    this.callback = () => {}
  }
  listen(...args) {
    const server = http.createServer((req, res) => {
      this.callback(req, res)
    })
    server.listen(...args)
  }
  use(callback){
    this.callback = callback
  }
}

module.exports = Application
```

接下来创建一个test.js，引入application.js进行测试

```javascript
// server.js
const Koa = require('./application')
const app = new Koa()

app.use((req, res) => {
  res.writeHead(200)
  res.end('hello world')
})
app.listen(3000, () => {
  console.log('server running on port 3000')
})
```

启动后，在浏览器中输入localhost:3000就能看到显示"hello world"。这样就完成http server的简单封装了。

## 构造ctx对象

Koa 的 Context 把 Node 的 Request 对象和 Response 对象封装到单个对象中，并且暴露给中间件等回调函数。比如获取 url，封装之前通过`req.url`的方式获取，封装之后只需要`ctx.url`就可以获取。因此我们需要达到以下效果：

```javascript
app.use(async ctx => {
  ctx // 这是 Context
  ctx.request // 这是 koa Request
  ctx.response // 这是 koa Response
});
```

### JavaScript 的 getter 和 setter

在此之前，需要了解 setter 和 getter 属性，通过 setter 和 getter 属性，我们可以自定义属性的特性。

```javascript
// test.js
let person = {
  _name: 'old name',
  get name () {
    return this._name
  },
  set name (val) {
    console.log('new name is: ' + val)
    this._name = val
  }
}

console.log(person.name)
person.name = 'new name'
console.log(person.name)

// 输出：
// old name
// new name is: new name
// new name
```

上面的代码在每次给`name`属性赋值的时会打印`new name is: new name`，添加了`console.log`这个行为，当然还可以做许多别的操作

### 构造 context



## Koa中间件及洋葱圈模型的理解与实现