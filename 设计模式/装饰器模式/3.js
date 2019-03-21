// @dec
// class Shape { }

// function dec(target) {
//   target.isShape = true
// }

// console.log(Shape.isShape)



// @Dec(true)
// class Shape {
//   // ...
// }

// function Dec(isDec) {
//   return function(target) {
//     target.isDec = isDec
//   }
// }

// console.log(Shape.isDec)



// function mixin(...list) {
//   return function(target) {
//     Object.assign(target.prototype, ...list)
//   }
// }

// const Color = {
//   setColor() {
//     console.log('set color')
//   }
// }

// @mixin(Color)
// class Shape {}

// let shape = new Shape()
// shape.setColor()
