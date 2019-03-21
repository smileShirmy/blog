# JavaScript 装饰器模式

## 一、前言

在传统面向对象语言中，如果想为一个对象创建新的功能时，往往采用继承的方式，比如：

```javascript
class Shape {
  constructor(name) {
    this.name = name
  }

  draw() {
    console.log(`draw ${this.name}`)
  }
}

class ShapeColor extends Shape {
  constructor(name) {
    super(name)
  }

  setColor(color) {
    console.log(`color the ${this.name} ${color}`)
  }
}

const circle = new ShapeColor('triangle')
circle.setColor('blue')
circle.draw()
```

但是这样的方式会存在超类`Shape`和子类`ShapeColor`之间存在强耦合性的问题，一旦超类发生改变，那么子类也会随之发生改变，因此这种方式并不能灵活。紧接上面的例子，如果要设置边的颜色，边的宽度，是否空心等一系列问题时，如果都为他们创建相应的子类，显然是十分繁琐冗余的。

为了解决这些问题，我们需要**装饰器模式**，装饰器模式属于**结构型**的设计模式，其的特点是：

- 在**不改变对象**的基础上
- 在程序运行期间给对象动态的添加职责

## 二、JavaScript 中的装饰器模式

为了不改变原有的对象，我们可以把原对象放入到一个新的对象中以形成一个聚合对象。并且这些对象都有相同的接口。当我们使用这个装饰器对象时，会顺着请求链请求到上一个对象。对于用户来说，这个装饰器对象是透明的，用户可以依照这种方式一层一层的递归下去。

```javascript
class Shape {
  constructor(name) {
    this.name = name
  }

  draw() {
    console.log(`draw ${this.name}`)
  }
}

class ColorDecorator {
  constructor(shape) {
    this.shape = shape
  }

  draw() {
    this.setColor()
    this.shape.draw()
  }

  setColor() {
    console.log(`color the ${this.shape.name}`)
  }
}

let circle = new Shape('circle')
circle.draw()

let decorator = new ColorDecorator(circle)
decorator.draw()
```

如上例所示，通过`ColorDecorator`对象实现了一个相同的`draw()`方法，并在其中封装了`setColor()`这个额外的职责方法，用户同样在调用`draw()`方法时，也调用了上一个对象`Shape`的`draw()`方法。我们可以以此类推，给对象添加上色，设置边框的一系列职责。

实际上，装饰器也是一种**包装器**，把上个对象包装到某个对象中，层层包装。

## 三、ES7 中的装饰器模式

在ES7版本中引入了装饰器，但该方法仍未定案，不能贸然使用

### 装饰类

#### 简单示例

```javascript
@dec
class Shape { }

function dec(target) {
  target.isShape = true
}

console.log(Shape.isShape)
```

#### 参数传递

```javascript
@Dec(true)
class Shape {
  // ...
}

function Dec(isDec) {
  return function(target) {
    target.isDec = isDec
  }
}

console.log(Shape.isDec)
```

#### mixin

```javascript
function mixin(...list) {
  return function(target) {
    Object.assign(target.prototype, ...list)
  }
}

const Color = {
  setColor() {
    console.log('set color')
  }
}

@mixin(Color)
class Shape {}

let shape = new Shape()
shape.setColor()
```

在上面的示例中，通过`Object.assign()`把`setColor()`方法添加到`Shape`中。

### 装饰方法

```js
class Shape {
  @log
  setColor(color) {
    return color
  }
}

function log(target, name, descriptor) {
  var oldValue = descriptor.value

  descriptor.value = function() {
    console.log(`Calling ${name} width `, arguments)
    return oldValue.apply(this, arguments)
  }

  return descriptor
}

const shape = new Shape()
const color = shape.setColor('red')
console.log('color', color)
```

上面的示例中，添加了一个`log`的装饰器，当执行`setColor()`方法时，会自动打印日志。

## 四、设计原则

装饰器模式将现有对象和装饰器进行分离，两者独立存在，符合开放封闭原则。

## 参考

[修饰器](http://es6.ruanyifeng.com/#docs/decorator)