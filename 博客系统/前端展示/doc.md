# 全栈开发—博客前端展示（Nuxt.js）

这个开发的想法是这样来的，大概两个月前，腾讯云的工作人员打电话给我，说我的域名没有解析到腾讯云的服务器上，而且页脚也没有备案号。我当时就震惊了，居然会打电话给我，然而我的大学时代买的服务器已经过期了...于是为了拯救我的域名，拯救我申请了很久的备案号，决意要全栈打造一个属于自己的博客系统。

- 博客地址：[shirmy](https://www.shirmy.me)
- 项目地址：[smile-blog-nuxt](https://github.com/smileShirmy/smile-blog-nuxt)

## 主要技术

- Nuxt.js
- Axios
- marked + highlight.js
- scss

## 项目特点

- 适配多个分辨率，移动端到桌面端无缝切换
- 支持白昼黑夜主题切换（试试点击[shirmy](https://www.shirmy.me)的太阳或月亮）
- 文章图片懒加载
- 评论、留言、搜索、点赞、多个作者
- SSR服务端渲染（seo）

## 技术总结

### 什么是服务端渲染(server side render)？

服务端渲染则把`Ajax`请求放到服务端，页面加载到浏览器或客户端前就已经把数据填充到页面模板行程完整的页面。

#### 优势

- 减少首次`http`请求，在服务端请求首屏数据，直接渲染`html`
- 利于`SEO`，网络爬虫可以抓取到完整的页面信息

#### 劣势

- 服务端压力大
- 需要掌握从前端到服务端的开发

### 什么是客户端渲染(client side render)?

客户端渲染就是就是在客户端通过`Ajax`请求获取数据，然后在客户端生成`DOM`插入到`html`

#### CSR 优势

- 前后端分离，各司其职
- 局部刷新，无需重新刷新页面
- 服务器压力小
- 更好的实现各种前端效果的实现

#### CSR 劣势

- 首屏渲染慢，需要下载`JS`和`CSS`文件
- 不利于SEO，爬虫抓取不到完整的页面数据

### SSR vs CSR

门户网站、博客网站等需要`SEO`优化的网站使用服务端渲染，管理后台等内部系统或不需要`SEO`优化的网站使用客户端渲染

#### 对比图

![服务端渲染](https://resource.shirmy.me/blog/screenshot/2019-07-21/SSR-render.png)

![前端渲染](https://resource.shirmy.me/blog/screenshot/2019-07-21/frontend-render.png)

### 如何实现白昼黑夜主题切换？

在这里，要使用`CSS3`变量配合`scss`进行控制，通过控制`<body>`标签的`id`来约束白昼或黑夜的颜色值，再给相应的属性加上`transition`属性实现颜色切换时的过渡，请看下面的示例：

```scss
@mixin theme(
  $theme-primary
) {
  --theme-primary: #{$theme-primary}
}

body {
  &#light {
    @include theme(
      #theme-primary: #fff,
    )
  }

  &#dark {
    @include theme(
      #theme-primary: #000,
    )
  }
}
```

全局引入上面的`scss`文件，这样就可以直接通过设置`<body>`标签的`id`的值为`dark`或`light`给`--theme-primary`赋予不同的颜色值，此时就能直接在需要应用该颜色的元素上进行如下设置：

```css
.example-class {
  color: var(--theme-primary);
}
```

在我的博客[shirmy](https://www.shirmy.me)中点击月亮/太阳即可看到效果，亦可用同样的方式定义多套主题色。

### 切换页面改变页面title

`Nuxt`内置了`head`属性配置，`head`配置直接修改根目录下的`nuxt.config.js`文件就可以了，并且还内置`vue-meta`插件，因此想要在不同页面改变相应的`title`，请看以下做法：

```javascript
// nuxt.config.js
module.exports = {
  head: {
    // 组件中的 head() 方法返回的字符串会替换 %s
    titleTemplate: '%s | shirmy',
  }
}

// 文章详情页 pages/article/_id.vue
export default {
  head() {
    return {
      title: this.article.title
    }
  }
}
```

如此一来，当查看某篇文章详情的时候就会触发`head()`方法，`title`显示为`article title | shirmy`

### 切换页面让页面滚动保持在顶部

只要修改`nuxt.config.js`配置即可，并且可以根据传入的参数做一些自定义的配置。

```javascript
// nuxt.config.js
module.exports = {
  router: {
    scrollBehavior: function (to, from, savedPosition) {
      return { x: 0, y: 0 }
    }
  },
}
```

### Nuxt中的fetch()

`fetch()`是`Nuxt`中独有的方法，它会在组件初始化前被调用，因此无法通过`this`获取组件对象。比如进入首页或从首页切换到归档页，在进入页面前会先执行`fetch()`方法，为了异步获取数据，`fetch()`方法必须返回**Promise**，因此可以直接返回一个`Promise`或者使用`async await`(`async await`其本质就是返回`Promise`)。

该方法不会设置组件的数据，如果想要设置组件的数据，或者使用`context`上下文，可以使用[asyncData](https://nuxtjs.org/guide/async-data/)。

```javascript
export default {
  // 虽然无法通过 this.$nuxt.$route 获取路由参数，但是可以通过 params 来获取
  async fetch({ store, params }) {
    await store.dispatch('about/getAuthor', params.id)
    await store.dispatch('about/getArticles', {
      authorId: params.id,
      page: 0
    })
  }
}
```

这样就能确保内容已经渲染好再下载到浏览器，如果使用`mounted`等生命周期钩子，则是在页面下载到浏览器后再获取数据，起不到`SSR`服务端渲染的效果。

### style-resource

为了方便统一管理`scss`变量，通常会在目录中创建`variables.scss`和`mixin.scss`，但是我们写的`vue`文件这么多，如果都要一个个导入岂不是吃力不讨好，这时可以借助`style-resource`：

```bash
npm install -S @nuxtjs/style-resources
```

修改`nuxt.config.js`文件：

```javascript
// nuxt.config.js
module.exports = {
  styleResources: {
    scss: ['./assets/scss/variables.scss', './assets/scss/mixin.scss']
  }
},
```

### 图片懒加载

图片懒加载的关键是使用[IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver)，IE浏览器不兼容，需要使用`polyfill`。该`WebAPI`用于监听元素是否出现在顶级文档视窗中。

通过这个`WebAPI`，我们可以把`<img>`标签的`src`属性地址先挂在`data-src`属性上，当该元素出现在视窗时就会触发`IntersectionObserver`的的回调方法，此时再给`<img>`标签的`src`属性赋予先前挂在`data-src`上的地址

### 复制时携带转载声明

监听`copy`事件，然后通过`getSelection()`方法获取复制的内容，在通过`clipboardData`的`setData()`方法在复制内容上加上转载信息：

```javascript
if (process.env.NODE_ENV === 'production') {
  const copyText = `

---------------------
作者：shirmy
链接：${location.href}
来源：https://www.shirmy.me
商业转载请联系作者获得授权，非商业转载请注明出处。`

  document.addEventListener('copy', e => {
    if (!window.getSelection) {
      return
    }
    const content = window.getSelection().toString()

    e.clipboardData.setData('text/plain', content + copyText)
    e.clipboardData.setData('text/html', content + copyText)
    e.preventDefault()
  })
}
```

## 参考文档

- [Nuxt.js](https://nuxtjs.org/)