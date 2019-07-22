# 全栈开发—博客后台管理系统

- 项目地址： [smile-blog-admin](https://github.com/smileShirmy/smile-blog-admin)

## 主要技术

- Vue.js + Vue Router + Vuex
- Axios
- Element UI

## 项目特点

- 权限控制
- 用户无感知token刷新
- 支持用户头像上传
- 简洁易用的菜单配置
- 丰富的文章条件筛选

## screenshot

![文章筛选](https://resource.shirmy.me/blog/screenshot/2019-07-20/smile-blog-admin-01.png)

![新增作者](https://resource.shirmy.me/blog/screenshot/2019-07-20/smile-blog-admin-02.png)

## 技术总结

### 如何实现菜单配置？

我们知道，菜单栏是分为多级的，其实它是和`router`对应上的。因此我们可以把一级每个一级菜单抽出来，作为单独的一个对象，然后导入这些配置项，通过对数据结构的整理和重组，组合成我们所需要的路由文件。

```javascript
// article.js
export const articleRouter = {
  // ...路由配置（名称，路径，是否显示，图标，子路由等属性）
}
// author.js
export const authorRouter = {
  // ...路由配置
}
// index.js
let homeRouter = [
  {
    // ...路由配置
  },
  articleRouter,
  authorRouter
]
// step1: 根据自己定义的配置进行处理，并供菜单栏遍历使用
// step2: 深度遍历构建路由
// step3: 插入到 Vue Router 中
// routes.js
const routes = [
  {
    path: '',
    name: 'Home',
    redirect: '/about',
    component: Home,
    children: [
      // 这里就是与菜单相对应的路由数组
      ...homeRouter
    ]
  },
  // 这里可以额外配置一些非菜单路由
]
```

通过这种方式，就可以更加灵活的给每个路由添加特定的配置，实现个性化的定制，实现不同页面的解耦。

### 限制上传图片大小

通过`<input type="file">`获取到图片后，通过使用`URL.createObjectURL()`静态方法创建`DOMString`。然后赋值给`Image`对象，再根据该`Image`对象进行判断

```javascript
fileChange(e) {
  const imgFile = e.target.files[0]
  // 图标大小大于 1M
  if (imgFile.size > 1024 * 1024 * 1) {
    // ...
  }

  const imgSrc = window.URL.createObjectURL(imgFile)
  const image = new Image()
  image.src = imgSrc
  image.onload = () => {
    // 图片加载后获取图片宽度
    const w = image.width
    // 图片加载后获取图片高度
    const h = image.height
    // ... 后续处理
  }
}
```

### 用户无感知刷新

1. 服务端生成两个Token，一个**accessToken**，一个**refreshToken**，`accessToken`是普通的访问token，通常设置为一两个小时，`refreshToken`用于验证用户是否可以再获取一个新的`accessToken`，可以设置为一个月。
2. 当用户停留在管理系统页面没有退出，但`accessToken`过期了，在进行操作时，先把这个失败的请求保存起来，然后再向服务器验证`refreshToken`，如果通过，则颁发一个新的`accessToken`，再通过这个新的`accessToken`去请求刚刚缓存起来的请求。
3. 如果`refreshToken`验证不通过，则请求失败，直接调用相关的`loginOut()`方法

### 按需加载

比如我们要使用`lodash`中的`throttle`方法，我们可以这样做：

```javascript
// 只导入 throttle 相关模块
import throttle from 'lodash/throttle'
```

这样能极大减少打包后的体积，这种方式非常有用，常用的，包括ECharts也是如此。

### 编码相关

1. 在文章列表的级联筛选中，我们通常通过`targetId === id`来判断是否选中某个对象，当有多个筛选条件时，我们可以通过以下方式把多个相同的逻辑进行如下封装：

```javascript
selectFilter(id, target) {
  // 如果和当前选择一样则不必再选中了
  if (id === this[target]) {
    return
  }
  // 只需要额外传入和组件data相同的字符串名就不用再写多个函数了
  this[target] = id
  this.getArticles()
}
```

2. 全局过滤器注册

```javascript
// filter/index.js
export default {
  format(value, format) {},
  filter(value) {}
}

// filters 中包含多个过滤器
import filters from '@/services/filter'
import Vue from 'vue'

// main.js
// 全局过滤器，不要一个个注册，全局组件同理
Object.keys(filters).forEach(k => Vue.filter(k, filters[k]))
```

> 参考文档
>
> - [Vue.js](https://vuejs.org/)
> - [MDN](https://developer.mozilla.org/zh-US/docs/Web/API/URL/createObjectURL)
> - [Lin CMS](http://doc.cms.7yue.pro/)