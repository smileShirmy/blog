# 全栈开发—博客服务端(Koa2)

- 博客地址：[shirmy](https://www.shirmy.me)
- 项目地址：[smile-blog-koa](https://github.com/smileShirmy/smile-blog-koa)

## 主要技术

- Koa2
- MySQL
- Sequelize
- JWT
- Axios
- Validator.js

## 项目特点

- 封装权限控制中间件
- 清晰的项目结构
- 简洁易用的参数校验、异常处理
- 支持用户无感知刷新

## 技术总结

### 项目结构

```bash
├── app                     # 业务代码
│   ├── api                 # api
│   │   ├── blog            # 提供给博客前端API
│   │   └── v1              # 提供给博客管理系统API
│   ├── dao                 # 数据库操作层
│   ├── lib                 # 工具函数、工具类、常量
│   ├── models              # Sequelize model 层
│   └── validators          # 参数校验工具类
├── config                  # 全局项目配置
├── core                    # 核心库
│   ├── db.js               # Sequelize 全局配置
│   ├── http-exception.js   # 异常处理定义
│   ├── init.js             # 项目初始化
│   ├── lin-validator.js    # 参数校验插件
│   ├── multipart.js        # 文件上传处理
│   └── util.js             # 核心库工具函数
├── middleware              # 中间件
```

### 导入模块太多？

用`Koa2`写服务端代码，有一个体验就是文件导出来导出去，各种路径，这时我们可以使用别名：

```bash
npm install -S nodule-alias
```

```javascript
{
  // ...
  "_moduleAliases": {
    "@models": "app/models",
  }
}
```

```javascript
// app.js
require('module-alias/register')

// article.js
const { Article } = require('@models')
```

### 自动注册路由中间件

当路由模块很多时，在`app.js`中一个个导入岂不是越写越长，这时我们可以借助`require-directory`工具

```javascript
const requireDirectory = require('require-directory')
const Router = require('koa-router')

class InitManager {
  static initCore(app) {
    // 入口
    InitManager.app = app
    InitManager.initLoadRoutes()
  }

  static initLoadRoutes() {
    // process.cwd() 获取绝对路径
    const appDirectory = `${process.cwd()}/app/api`
    // 使用 require-directory 提供的方法导入自动导入路由文件
    requireDirectory(module, appDirectory, {
      visit: whenLoadingModule
    })

    // 注册所有检测到的 Koa 路由
    function whenLoadingModule(obj) {
      if (obj instanceof Router) {
        InitManager.app.use(obj.routes())
      }
    }
  }
}

module.exports = InitManager

// app.js
const Koa = require('koa')
const app = new Koa()

InitManager.initCore(app)
```

### 如何使用七牛云上传？

实际上官方文档就已经写得很清楚了：[Node.js SDKV6](https://developer.qiniu.com/kodo/sdk/3828/node-js-v6)，无非就是安装插件，照着文档搬运代码。

在这里要注意的是，如果上传多个文件，我们需要放在一个循环里逐一上传，而上传又是异步的，那么如何验证所有文件都已经上传成功，在这里我们可以使用`Promise.all()`方法进行封装，举个栗子：

```javascript
class UpLoader {
  async upload(files) {
    let promise = []
    
    for (const file of files) {
      // ...
      promise.push(new Promise((resolve, reject) => {
        // 执行上传逻辑
        // resolve() or reject()
      }))
    }

    Promise.all(promises).then(res => {
      // ... 全部成功
    }).catch(e => {
      // ... 有上传失败的
    })
  }
}
```

### 全局异常捕获中间件

```javascript
// http-exception.js
class HttpException extends Error {
  constructor(msg = '服务器异常', errorCode = 10000, code = 400) {
    super()
    this.msg = msg
    this.errorCode = errorCode
    this.code = code
  }
}

// exception.js
const { HttpException } = require('@exception')

const catchError = async (ctx, next) => {
  try {
    // 利用洋葱圈模型的特性，所有请求都会经过这里
    await next()
  } catch (error) {
    const isHttpException = error instanceof HttpException
    const isDev = global.config.environment = 'dev'
    if (isDev && !isHttpException) {
      throw error
    }
    // 已知错误
    if (isHttpException) {
      ctx.body = {
        msg: error.msg,
        errorCode: error.errorCode,
        request: `${ctx.method}: ${ctx.path}`
      }
      ctx.status = error.code
    } else {
      // 未知错误
      ctx.body = {
        msg: '服务器内部错误',
        errorCode: 999,
        request: `${ctx.method}: ${ctx.path}`
      }
      ctx.status = 500
    }
  }
}

module.exports = catchError

// app.js
const catchError = require('./middleware/exception')

app.use(catchError)
```

### 如何进行权限校验

权限校验是通过`JWT`实现的，使用`JWT`可以用用户ID、超时时间、权限级别给用户生成一个`Token`返回到客户端，客户端再把这个`Token`存储到`cookie`中，步骤如下：

1. 安装`jsonwebtoken`插件
2. 给用户颁发一个由用户id、用户权限级别、超时时间生成的`accessToken`
3. 客户端把`accessToken`保存到`cookie`中，然后以后的每次发送请求都会携带这个`token`
4. 使用koa中间件，在API处理前校验`token`是否合法，并且判断用户是否有权限访问该API

其它业务代码及框架的基本用法就不多说了，可以直接参考[smile-blog-koa](https://github.com/smileShirmy/smile-blog-koa)

> 参考文档
>
> - [Lin CMS](http://doc.cms.7yue.pro/)