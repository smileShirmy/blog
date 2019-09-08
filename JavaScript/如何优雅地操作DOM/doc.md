# 如何优雅地操作DOM

在以前，操作DOM是一件非常麻烦的事情，虽然现在已经有类似React、Vue、Angular等框架帮助我们更容易地构建界面。但是我们仍然有必要学习原生DOM的操作方式来扩展我们的知识面，并且可以来应对一些不使用框架的场景，经过长时间的发展，现在的`DOM API`也变得更加优雅简洁了。

## 元素选择

### 单个元素

```javascript
// 返回一个 HTMLElement
document.querySelector(selectors)
```

它提供类似jQuery的`$()`选择器方法，非常方便，我们可以这样使用它：

```javascript
document.querySelector('.class-name') // 根据 class 选择
document.querySelector('#id') // 根据 id 选择   
document.querySelector('div') // 根据 标签 选择
document.querySelector('[data-test="input"]') // 根据属性来选择
document.querySelector('div + p > span')  // 多重选择器
```

### 多个元素

```javascript
// 返回一个 NodeList
document.querySelectorAll('li') // 选择所有标签为 <li> 的元素
```

如果要使用`Array`的数组方法，需要先转成普通数组，可以这样做：

```javascript
// 使用扩展运算符
const arr = [...document.querySelectorAll('li')]

// 使用 Array.from 方法
const arr = Array.from(document.querySelectorAll('li'))
```

但是它和`getElementsByTagName`或`getElementsByClassName`是有区别的，`getElementsByTagName`或`getElementsByClassName`返回的是一个`HTMLCollection`，它是动态的，比如当我们移除掉`document`中被选取的某个`li`标签，所返回的`HTMLCollection`中相应的`li`标签也会被移除，它**具有实时性**。

而`querySelectorAll`是静态的，移除`document`文档流中被选取的某个`li`标签，不会影响返回的`NodeList`，它**没有实时性**。

#### HTMLCollection 和 NodeList 的异同

- `HTMLCollection`是元素的集合（只包含元素）
- `NodeList`是文档节点的集合（包含元素也包含其它节点）
- `HTMLCollection`是**动态**集合，节点变化会反映到返回的集合中
- `NodeList`是**静态**集合，节点的变化不会影响返回的集合
- `HTMLCollection`实例对象可以通过`id`或`name`属性引用节点元素
- `NodeList`只能使用数字索引引用

### 选择范围

我们可以限制选择的范围，而不至于每次都在`document`上进行选择，可以这样做：

```javascript
// 只获取 #container 下的所有 li 标签
const container = document.querySelector('#container')
container.querySelectorAll('li')
```

### 进一步封装

我们可以封装成类似`jQuery`的写法，用`$`进行选择：

```javascript
const $ = document.querySelector.bind(document)
$('#container')

const $$ = document.querySelectorAll.bind(document)
$$('li')
```

这里注意，我们需要使用`bind`把`this`的指向绑定到`document`上，否则直接把函数赋值给变量获取到的是一个普通函数，会导致`this`指向`window`

### 向上选择DOM

我们还可以获取某个`Element`的最近父元素，通过使用`closest`方法

```javascript
// 获取距离 li 标签最近的上级 div 标签
document.querySelector('li').closest('div')

// 再更上一层，获取最近的上级名为 content 的元素
document.querySelector('li').closest('div').('.content')
```

## 添加元素

这里假设我们要添加这样一个元素

```html
<a href="/home" class="active">Home</a>
```

在过去，我们需要这样来添加元素

```javascript
const link = document.createElement('a')
a.setAttribute('href', '/home')
a.className = 'active'
a.textContent = 'Home'
document.body.appendChild(link)
```

在有了`jQuery`后，我们可以这样来添加元素

```javascript
// 一句就能搞定
$('body').append('<a href="/home" class="active">Home</a>')
```

现在，我们可以借助`insertAdjacentHTML`来实现类似`jQuery`的方法

```javascript
document.body.insertAdjacentHTML('beforeend', '<a href="/home" class="active">Home</a>')
```

这里需要传入两个参数，第一个参数是插入的位置，第二参数是插入的`HTML`片段，位置可选参数如下：

- `beforebegin` 插入某个元素之前
- `afterbegin` 插入到第一个子元素之前
- `beforeend` 插入到最后一个子元素之后
- `afterend` 插入到元素之后

```html
<!-- beforebegin -->
<div>
  <!-- afterbegin -->
  content
  <!-- beforeend -->
</div>
<!-- afterend -->
```

通过这个API，可以更方便地指定插入位置。假如要把`a`标签插入到`div`之前，我们以前需要这样做：

```javascript
const link = document.createElement('a')
const div = document.querySelector('div')
div.parentNode.insertBefore(link, div)
```

而现在直接指定位置就可以了

```javascript
const div = document.querySelector('div')
div.insertAdjacentHTML('beforebegin', '<a></a>')
```

还有两个相似的方法，但第二个元素传入的不是`HTML`字符串，而是传一个元素或文本

```javascript
const link = document.createElement('a')
const div = document.querySelector('div')
// 插入元素
div.insertAdjacentElement('beforebegin', link)
```

插入文本

```javascript
// 插入文本
div.insertAdjacentText('afterbegin', 'content')
```

## 移动元素

上面介绍的`insertAdjacentElement`也可以移动文档流上的一个元素，假如有这样的`HTML`片段：

```html
<div class="first">
  <h1>Title</h1>
</div>
<div class="second">
  <h2>Subtitle</h2>
</div>
```

我们需要把`h2`标签插入到`h1`标签下面

```javascript
// 分别获取两个元素
const h1 = document.querySelector('h1')
const h2 = document.querySelector('h2')

// 指定把 h2 插入到 h1 下面
h1.insertAdjacentElement('afterend', h2)
```

注意，这是**移动**，而非拷贝，此时的`HTML`变成：

```html
<div class="first">
  <h1>Title</h1>
  <h2>Subtitle</h2>
</div>
<div class="second">
  <!-- h2 标签被移动了  -->
</div>
```

## 元素替换

我们可以直接使用`replaceWith`方法，通过这个方法，可以创建一个元素来进行替换，也可以选择一个已有元素进行替换，后者会**移动**被选择的元素，而非拷贝。

```javascript
someElement.replaceWith(otherElement)
```

```html
<!-- 替换前 -->
<div class="first">
  <h1>Title</h1>
</div>
<div class="second">
  <h2>Subtitle</h2>
</div>
```

```javascript
// 选择 h1 和 h2
const h1 = document.querySelector('h1')
const h2 = document.querySelector('h2')

// 用 h2 替换掉 h1
h1.replaceWith(h2)
```

```html
<!-- 替换后 -->
<div class="first">
  <!-- h1 被 h2 替换 -->
  <h2>Subtitle</h2>
</div>
<div class="second">
  <!-- h2 被移动 -->
</div>
```

## 移除一个元素

只需要调用`remove()`方法就可以了

```javascript
const container = document.querySelector('#container')
container.remove()
```

```javascript
// 以前的移除方法
const container = document.querySelector('#container')
container.parentNode.removeChild(container)
```

## 使用原生HTML片段创建元素

从上面可以了解到`insertAdjacentHTML`方法可以帮助我们插入`HTML`字符串到指定的位置，假如我们要先创建元素，而不是需要立即插入。

这时就需要借助`DomParser`对象，它可以解析`HTML`和`XML`来创建一个`DOM`元素，它提供了`parseFromString`方法进行创建并返回解析后的元素。

```javascript
const createElement = domString => new DOMParser().parseFromString(domString, 'text/html').body.firstChild
const a = createElement('<a href="/home" class="active">Home</a>')
```

## 元素匹配

### matches

`matches`可以帮助我们判断某个元素是否和选择器相匹配。

```html
<p class="foo">Hello world</p>
```

```javascript
const p = document.querySelector('p')
p.matches('p')     // true
p.matches('.foo')  // true
p.matches('.bar')  // false, 不存在 class 名为 bar
```

### contains

也可以使用`contains`方法判断是否包含某个子元素：

```html
<div class="container">
  <h1 class="title">Foo</h1>
</div>
<h2 class="subtitle">Bar</h2>
```

```javascript
const container = document.querySelector('.container')
const h1 = document.querySelector('h1')
const h2 = document.querySelector('h2')
container.contains(h1)  // true
container.contains(h2)  // false
```

### compareDocumentPosition

使用`node.compareDocumentPosition(otherNode)`方法可以帮助我们确定某个元素的确切位置，它会返回数字来指示位置，返回值的意思如下，如果满足多个条件，会返回相加值：

- 1: 比较的元素不在同一个`document`上
- 2: `otherNode`在`node`之前
- 4: `otherNode`在`node`之后
- 8: `otherNode`包裹`node`
- 16: `otherNode`被`node`包裹

```html
<div class="container">
  <h1 class="title">Foo</h1>
</div>
<h2 class="subtitle">Bar</h2>
```

```javascript
const container = document.querySelector('.container')
const h1 = document.querySelector('h1')
const h2 = document.querySelector('h2')
// 20: h1 被 container 所包裹，并且在 container 之后 16 + 4 = 20
container.compareDocumentPosition(h1) 
// 10: container 包裹 h1，并且在 h1 之前 8 + 2 = 10
h1.compareDocumentPosition(container)
// 4: h2 在 h1 的后面
h1.compareDocumentPosition(h2)
// 2: h1 在 h2 的前面
h2.compareDocumentPosition(h1)
```

### MutationObserver

我们还可以使用`MutationObserver`来监听`DOM`树的变动

```javascript
// 当监听到元素的变动就会调动 callback 方法
const observer = new MutationObserver(callback)
```

然后我们需要使用`observer`方法监听某个`node`的变化，否则不会监听，它接收两个参数，第一个参数是监听目标，第二个参数是监听选项。

```javascript
const target = document.querySelector('#container')
const observer = new MutationObserver(callback)
observer.observe(target, options)
```

当发生变化时，就会调用`callback`方法，此时，我们就可以在`callback`中监听变化，并监听`callback`的`mutations`类型进行相应地处理：

具体的配置及其含义可以参考文档[MutationObserver](https://developer.mozilla.org/zh-TW/docs/Web/API/MutationObserver#MutationRecord)

```javascript
// step1: 获取元素
const target = document.querySelector('#container')

// step2: 编写回调函数，处理逻辑
const callback = (mutations, observer) => {
  mutations.forEach(mutation => {
    switch (mutation.type) {
      case 'attributes':
        // 通过 mutation.attribute 获取改变的 attribute
        // 通过 mutation.oldValue 获取旧值
        break
      case 'childList':
        // 通过 mutation.addedNodes 获取添加的节点
        // 通过 mutation.removedNodes 获取移除的节点
        break
    }
  })
}

// step3: 传入 callback 并实例化
const observer = new MutationObserver(callback)

// step4: 开始监听并根据需求设置监听选项
observer.observe(target, {
  attributes: true, // 监听 attribute 变化
  attributeFilter: ['foo'], // 只监听属性包含 foo，需要先把 attribute 设置为 true
  attributeOldValue: true,  // 发生改变时，记录 attribute 之前的值
  childList: true // 监听元素的添加和删除
})
```

当完成监听时，可以通过`observer.disconnect()`方法来中止监听，并且可以在之前通过`takeRecords()`来处理未传递的[MutationRecord](https://developer.mozilla.org/zh-CN/docs/Web/API/MutationRecord)。

```javascript
const mutations = observer.takeRecords()
callback(mutations)
observer.disconnect()
```

## 小结

通过上述这些强大的API，可以非常方便地对 DOM 进行操作，满足各种不同的需求，此外，还有一些没有介绍到的，比如`IntersectionObserver`可以监听目标元素和文档视窗的交叉状态来实现图片懒加载。所以，在使用框架进行开发时，我们也需要深入理解 DOM，这样才可以对整个 DOM 结构有更清晰的认识，更好地发挥它们的潜力，优雅地实现各种效果。

> 参考文档：
>
> - [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
> - [MutationRecord](https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord)
> - [Using the DOM like a Pro](https://itnext.io/using-the-dom-like-a-pro-163a6c552eba)