## 原文

- [Currying in JS](https://hackernoon.com/currying-in-js-d9ddc64f162e)

## 函数柯里化

函数柯里化以Haskell Brooks Curry命名，**柯里化**是指将一个函数分解为一系列函数的过程，每个函数都只接收**一个参数**。（译注：这些函数不会立即求值，而是通过闭包的方式把传入的参数保存起来，直到真正需要的时候才会求值）

***

### 柯里化例子

以下是一个简单的柯里化例子。我们写一个接收三个数字并返回它们总和的函数`sum3`。
  

```javascript
function sum3(x, y, z) {
  return x + y + z;
}

console.log(sum3(1, 2, 3))  // 6
```

`sum3`的柯里化版本的结构不一样。它接收**一个参数**并返回一个函数。返回的函数。返回的函数中又接收一个餐你输，返回另一个仍然只接收一个参数的函数...（以此往复）

直到返回的函数接收到最后一个参数时，这个循环才结束。这个最后的函数将会返回数字的总和，如下所示。

```javascript
function sum(x) {
  return (y) => {
    return (z) => {
      return x + y + z
    }
  } 
}

console.log(sum(1)(2)(3)) // 6
```
以上的代码能跑起来，是因为JavaScript支持**闭包**

> 一个闭包是由函数和声明这个函数的词法环境组成的
> -- [MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Closures)

注意函数链中的最后一个函数只接收一个`z`，但它同时也对外层的变量进行操作，在这个例子中，这些外层的变量对于最后一个函数来说类似于全局变量。实际上只是相当于不同函数下的局部变量

```javascript
// 相当于全局变量
let x = ...?
let y = ...?

// 只接收一个参数 z 但也操作 x 和 y
return function(z) {
  return x + y + z;
}
```

***

## 通用的柯里化

写一个柯里化函数还好，但如果要编写多个函数时，这就不够用了，因此我们需要一种更加通用的编写方式。

在大多数函数式编程语言中，比如haskell，我们所要做的就是定义函数，它会自动地进行柯里化。

```javascript
let sum3 x y z = x + y + z

sum3 1 2 3
-- 6

:t sum3 -- print the type of sum3()
-- sum3 :: Int -> Int -> Int -> Int

(sum3) :: Int -> Int -> Int -> Int -- 函数名 括号中的部分
sum3 :: (Int -> Int -> Int) -> Int -- 定义柯里化函数 括号中的部分
sum3 :: Int -> Int -> Int -> (Int) -- 最后返回 括号中的部分
```

我们不能JS引擎重写为curry-ify所有函数，但是我们可以使用一个策略来实现。

***

### 柯里化策略

通过上述两种`sum3`的形式发现，实际上处理加法逻辑的函数被移动到闭包链的最后一个函数中。在到达最后一级之前，我们不会在执行环境中获得所有需要的参数。

这意味着我们可以创建一个包装哈数来收集这些参数，然后把它们传递给实际要执行的函数 （sum3）。所有中间嵌套的函数都称为**累加器**函数 - 至少我们可以这样称呼它们。

```javascript
function _sum3(x, y, z) {
  return x + y + z;
}

function sum3(x) {
  return (y) => {
    return (z) => {
      return _sum3(x, y, z);  // 把参数都传给这个最终执行的函数
    }
  }
}

sum3(1)(2)(3)  // 6
```

***

## 用柯里化包裹之

由于我们要使用一个包装后的函数来替代实际的函数，因此我们可以创建另一个函数来包裹。我们将这个新生成的函数称之为**curry** —— 一个更高阶的函数，它的作用是返回一系列嵌套的累加器函数，最后调用回调函数`fn`

```javascript
function curry(fn) {     // 定义一个包裹它们的柯里化函数
  return (x) => { 
    return (y) => { 
      return (z) => { 
        return fn(x, y, z);  // 调用回调函数
      };
    };
  };
}

const sum = curry((x, y, z) => {   // 传入回调函数
  return x + y + z;
});

sum3(1)(2)(3) // 6
```

现在我们需要满足有不同参数的柯里化函数：它可能有0个参数，1个参数，2个参数等等....

***

### 递归的柯里化

实际上我们并不是真的要编写多个满足不同参数的柯里化函数，而是应当编写一个适用于多个参数的柯里化函数。

如果我们真的写多个`curry`函数，那将会如下所示...:

```javascript
function curry0(fn) {
  return fn();
}
function curry1(fn) {
  return (a1) => {
    return fn(a1);
  };
}
function curry2(fn) {
  return (a1) => {
    return (a2) => {
      return fn(a1, a2);
    };
  };
}
function curry3(fn) {
  return (a1) => {
    return (a2) => {
      return (a3) => {
        return fn(a1, a2, a3);
      };
    };
  };
}
...
function curryN(fn){
  return (a1) => {
    return (a2) => {
      ...
      return (aN) => {
        // N 个嵌套函数
        return fn(a1, a2, ... aN);
      };
    };
  };
}
```

以上函数有以下特征：

1. 第 `i` 个累加器返回另一个函数（也就是第(`i+1`)个累加器），也可以称它为第`j`个累加器。
2. 第`i`个累加器接收`i`个参数，同时把之前的`i-1`个参数都保存其闭包环境中。
3. 将会有`N`个嵌套函数，其中`N`是函数`fn`
4. 第`N`个函数总是会调用`fn`函数

根据以上的特征，我们可以看到柯里化函数返回一个拥有多个相似的累加器的嵌套函数。因此我们可以使用递归轻松生成这样的结构。

```javascript
function nest(fn) {
  return (x) => {
    // accumulator function
    return nest(fn);
  };
}

function curry(fn) {
  return nest(fn);
}
```

为了避免无限嵌套下去，需要一个让嵌套中断的情况。我们将当前嵌套深度存储在变量`i`中，那么此条件是`i === N`

```javascript
function nest(fn, i) {
  return (x) => {
    if (i === fn.length) {    // 当执行到第 i 个时返回 fn
      return fn(...);
    }
    return nest(fn, i + 1);
  };
}
function curry(fn) {
  return nest(fn, 1);
}
```

接下来，我们需要存储所有参数，并把它们传递给`fn()`。最简单的解决方案就是在`curry`中年创建一个数组`args`并将其传递给`nest`

```javascript
function nest(fn, i, args) {
  return (x) => {
    args.push(x);      // 存储每一个参数
    if (i === fn.length) {
      return fn(...args);      // 最后把参数都传递给 fn()
    }
    return nest(fn, i + 1, args);
  };
}
function curry(fn) {
  const args = [];      // 需要传入的参数列表

  return nest(fn, 1, args);
}
```

然后再添加一个没有参数时的临界处理：

```javascript
function curry(fn) {
  if (fn.length === 0) {  // 当没有参数时直接返回
    return fn;
  }
  const args = [];

  return nest(fn, 1, args);
}
```

此时来测试一下我们的代码：

```javascript
const log1 = curry((x) => console.log(x));
log1(10); // 10
const log2 = curry((x, y) => console.log(x, y));
log2(10)(20); // 10 20
```

你可以在[codepen](https://codepen.io/zhirzh/pen/opJJQd?editors=0010)上运行测试

***

### 优化

对于初学者，我们可以在把`nest`放到`curry`中，从而可以通过在闭包中读取`fn`和`args`来，以此减少传给`nest`的参数数量。

```javascript
function curry(fn) {
  if (fn.length === 0) {
    return fn;
  }
  const args = [];
  function nest(i) {        // 相比于之前，不用传递 fn 和 args
    return (x) => {
      args.push(x);
      if (i === fn.length) {
        return fn(...args);
      }
      return nest(i + 1);
    };
  }
  return nest(1);
}
```

让我们把这个新的`curry`变得更加函数式，而不是依赖于闭包变量。我们通过提供`args`和`fn.length`作为参数嵌套来实现。此外，我们把**剩余的递归深度**（译注：也就是除最后一层的函数），而不是传递目标深度（`fn.length`）进行比较。

```javascript
function curry(fn) {
  if (fn.length === 0) {
    return fn;
  }
  function nest(N, args) {
    return (x) => {
      if (N - 1 === 0) {
        return fn(...args, x);
      }
      return nest(N - 1, [...args, x]);    // 根据fn.length - 1 递归那些嵌套的中间函数
    };
  }
  return nest(fn.length, []);  // 传入 fn 的参数个数
}
```

***

## 可变的柯里化

让我们来比较`sum3`和`sum5`

```javascript
const sum3 = curry((x, y, z) => {
  return x + y + z;
});
const sum5 = curry((a, b, c, d, e) => {
  return a + b + c + d + e;
});
sum3(1)(2)(3)       // 6   <--  It works!
sum5(1)(2)(3)(4)(5) // 15  <--  It works!
```

毫无意外，它是正确的，但这个代码是有点恶心。

在haskell和许多其他函数式语言中，它们的设计更为简洁，和上面恶心的相比，我们来看看haskell是如何处理它的：

```
let sum3 x y z = x + y + z
let sum5 a b c d e = a + b + c + d + e
sum3 1 2 3
> 6
sum5 1 2 3 4 5
> 15
sum5 1 2 3 (sum3 1 2 3) 5
> 17
```

如果你问我，JavaScript以下面的使用方式来调用会更好：

```javascript
sum5(1, 2, 3, 4, 5) // 15
```

但这并不意味着我们不得不放弃currying。我们能做到的是找到一个两全其美的方式。一个即是“柯里化”又不是“柯里化”的调用方式。

```javascript
sum3(1, 2, 3) // 清晰的
sum3(1, 2)(3)
sum3(1)(2, 3)
sum3(1)(2)(3) // 柯里化的
```

因此我们需要做一个简单的修改——用[可变函数](https://en.wikipedia.org/wiki/Variadic_function)替换累加器函数。

当第`i`个累加器接收`k`个参数时，下一个累加器将不是`N-1`的深度，而是`N-k`的深度。使用`N-1`是由于所有的累加器都只接收一个参数，这也意味着我们不再需要判断参数为0的情况（Why?）。

由于我们现在每个层级都收集多个参数，我们需要检查参数的数量来判断是否超过`fn`的参数个数，然后再调用它。

```javascript
function curry(fn) {
  function nest(N, args) {
    return (...xs) => {
      if (N - xs.length <= 0) {
        return fn(...args, ...xs);
      }
      return nest(N - xs.length, [...args, ...xs]);
    };
  }
  return nest(fn.length, []);
}
```

接下来是测试时间，你可以在[codepen](https://codepen.io/zhirzh/pen/OzrdaR/?editors=0010)上运行测试。

```javascript
function curry(){...}
const sum3 = curry((x, y, z) => x + y + z);
console.log(
  sum3(1, 2, 3),
  sum3(1, 2)(3),
  sum3(1)(2, 3),
  sum3(1)(2)(3),
);
// 6 6 6 6
```

### 调用空的累加器

当使用可变参数的柯里化时，我们可以不向它传递任何参数来调用累加器函数。这将返回另一个与前一个累加器相同的累加器。

```javascript
const sum3 = curry((x, y, z) => x + y + z);
sum3(1,2,3) // 6
sum3()()()(1,2,3) // 6
sum3(1)(2,3) // 6
sum3()()()(1)()()(2,3) // 6
```

这种调用十分恶心，有一系列的空括号。虽然技术上没有问题，但这个写法是很糟糕的，因此需要有一个避免这种糟糕写法的方式。

```javascript
function curry(fn) {
  function nest(N, args) {
    return (...xs) => {
      if (xs.length === 0) {    // 避免空括号
        throw Error('EMPTY INVOCATION');
      }
      // ...
    };
  }
  return nest(fn.length, []);
}
```

## 另一种柯里化的方式

我们成功了！我们创造了一个`curry`函数，它接收多个函数参数并返回带有可变参数的柯里化函数。但我想展示JavaScript中的另一种柯里化方法

在JavaScript中，我们可以将参数[bind](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_objects/Function/bind)(绑定)到函数并创建绑定副本。返回的函数是只是“部分应用”，因为函数已经拥有它所需的一些参数，但在调用之前需要更多。

到目前为止，`curry`将返回一个函数，该函数在收到所有参数之前在不停地累积参数，然后使用这些参数来调用`fn`。通过将参数绑（译注：bind方法）定到函数，我们可以消除对多个嵌套累加器函数。

因此可以得到：

```javascript
function curry(fn) {
  return (...xs) => {
    if (xs.length === 0) {
      throw Error('EMPTY INVOCATION');
    }
    if (xs.length >= fn.length) {
      return fn(...xs);
    }
    return curry(fn.bind(null, ...xs));
  };
}
```

以上是它的工作原理。`curry`采用多个参数的函数并返回累加器函数。当用`k`个参数调用累加器时，我们检查`k>=N`，即判断是否满足函数所需的参数个数。

如果满足，我们传入参数并调用fn，如果没满足，则创建一个fn的副本，它具有绑定调用fn前的那些累加器的`k`个参数，并将其作为下一个`fn`传递给`curry`，以达到减少`N-k`的目的。

***

## 最后

我们通过累加器的方式编写了通用的柯里化方法。这种方法适用于函数是一等公民的语言。我们看到了严格的柯里化和可变参数的柯里化之间的区别。感谢JavaScript中提供了bind方法，用bind方法实现柯里化是非常容易的。

如果您对源代码感兴趣，请戳[codepen](https://codepen.io/zhirzh/pen/baOZGr?editors=0010)。

***

## 后记

### 给柯里化添加静态类型检查

在2018年，人们喜欢JavaScript中的静态类型。而且我认为现在是时候添加一些类型约束以保证类型安全了。

让我们从基础开始：`curry()`接收一个函数并返回一个值或另一个函数。我们可以这样写：

```ts
type Curry = <T>(Function) => T | Function;
const curry: Curry = (fn) => {
  ...
}
// function declaration
function curry<T>(fn: Function): T | Function {
  ...
}
```

好了。但是这并没有什么用。但这是能做到最好的程度了，Flow只增加了静态类型的安全性，而实际上我们有很多运行时的依赖性。此外，Flow不支持Haskell具有的跟更高阶类型。这意味着没有为这种通用的柯里化添加更紧密的类型检查。

If you still want a typed curry, here’s a gist by [zerobias](https://gist.github.com/zerobias) that show a 2-level and a 3-level curry function with static types: [zerobias/92a48e1](https://gist.github.com/zerobias/92a48e1db12f3127c2a2b2d9893a3172).

If you want to read more about curry and JS, here’s [an article on **2ality**](https://2ality.com/2017/11/currying-in-js.html).

* * *

## 严格意义上的柯里化

可变参数的柯里化是一个很好的东西，因为它为我们提供了一些空间。但是，我们不要忘记，严格意义上的柯里化应该只接收一个参数。

> ... 柯里化是将函数分解为一系列函数的过程，每个函数都接收一个参数

让我们编写一个严格的柯里化函数——一种只允许单个参数传递个柯里化函数。

```javascript
function strictCurry(fn) {
  return (x) => {
    if (fn.length <= 1) {
      return fn(x);
    }
  return strictCurry(fn.bind(null, x));
  };
}

const ten = () => 10;
const times10 = (x) => 10 * x;
const multiply = (x, y) => x * y;
console.log(strictCurry(ten)())             // 10
console.log(strictCurry(times10)(123))      // 1230
console.log(strictCurry(multiply)(123)(10)) // 1230
```