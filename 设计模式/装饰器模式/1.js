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