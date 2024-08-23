import { Token } from "./Token.js"
import { Literal as Lit } from "./Token.js"

export abstract class Expr {
static Binary = class extends Expr {
  constructor(left: Expr, operator: Token, right: Expr) {
    super()
    this.left = left
    this.operator = operator
    this.right = right

  }
  readonly left: Expr
  readonly operator: Token
  readonly right: Expr
}
static Grouping = class extends Expr {
  constructor(expression: Expr) {
    super()
    this.expression = expression

  }
  readonly expression: Expr
}
static Literal = class extends Expr {
  constructor(value: Lit) {
    super()
    this.value = value

  }
  readonly value: Lit
}
static Unary = class extends Expr {
  constructor(operator: Token, right: Expr) {
    super()
    this.operator = operator
    this.right = right

  }
  readonly operator: Token
  readonly right: Expr
}

}
