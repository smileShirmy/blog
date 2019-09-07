# 如何优雅地操作DOM

在以前，操作DOM是一件非常麻烦的事情，虽然现在已经有类似React、Vue、Angular等框架帮助我们更容易地构建界面。但是我们仍然有必要学习原生DOM的操作方式，经过长时间的发展，现在的`DOM API`也变得更加优雅简洁了。

## 元素选择

### 单个元素

```javascript
// 返回一个 HTMLElement
document.querySelector(selectors)
```

它提供类似jQuery的`$()`选择器，非常方便，我们可以这样使用它：

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

```