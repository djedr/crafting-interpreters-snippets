import { Token } from "./Token.js"
import { Literal as Lit } from "./Token.js"

export abstract class Expr {
  abstract accept<R>(visitor: Visitor<R>): R
}
export interface Visitor<R> {
  visitBinaryExpr(expr: Binary): R
  visitGroupingExpr(expr: Grouping): R
  visitLiteralExpr(expr: Literal): R
  visitUnaryExpr(expr: Unary): R
  visitVariableExpr(expr: Variable): R
}
export class Binary extends Expr {
  constructor(left: Expr, operator: Token, right: Expr) {
    super()
    this.left = left
    this.operator = operator
    this.right = right
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBinaryExpr(this)
  }
  readonly left: Expr
  readonly operator: Token
  readonly right: Expr
}
export class Grouping extends Expr {
  constructor(expression: Expr) {
    super()
    this.expression = expression
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitGroupingExpr(this)
  }
  readonly expression: Expr
}
export class Literal extends Expr {
  constructor(value: Lit) {
    super()
    this.value = value
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLiteralExpr(this)
  }
  readonly value: Lit
}
export class Unary extends Expr {
  constructor(operator: Token, right: Expr) {
    super()
    this.operator = operator
    this.right = right
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitUnaryExpr(this)
  }
  readonly operator: Token
  readonly right: Expr
}
export class Variable extends Expr {
  constructor(name: Token) {
    super()
    this.name = name
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitVariableExpr(this)
  }
  readonly name: Token
}
