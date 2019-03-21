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
