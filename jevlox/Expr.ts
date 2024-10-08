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
  visitAssignExpr(expr: Assign): R
  visitLogicalExpr(expr: Logical): R
  visitCallExpr(expr: Call): R
  visitGetExpr(expr: Get): R
  visitSetExpr(expr: Set): R
  visitThisExpr(expr: This): R
  visitSuperExpr(expr: Super): R
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
export class Assign extends Expr {
  constructor(name: Token, value: Expr) {
    super()
    this.name = name
    this.value = value
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitAssignExpr(this)
  }
  readonly name: Token
  readonly value: Expr
}
export class Logical extends Expr {
  constructor(left: Expr, operator: Token, right: Expr) {
    super()
    this.left = left
    this.operator = operator
    this.right = right
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLogicalExpr(this)
  }
  readonly left: Expr
  readonly operator: Token
  readonly right: Expr
}
export class Call extends Expr {
  constructor(callee: Expr, paren: Token, args: Expr[]) {
    super()
    this.callee = callee
    this.paren = paren
    this.args = args
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitCallExpr(this)
  }
  readonly callee: Expr
  readonly paren: Token
  readonly args: Expr[]
}
export class Get extends Expr {
  constructor(object: Expr, name: Token) {
    super()
    this.object = object
    this.name = name
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitGetExpr(this)
  }
  readonly object: Expr
  readonly name: Token
}
export class Set extends Expr {
  constructor(object: Expr, name: Token, value: Expr) {
    super()
    this.object = object
    this.name = name
    this.value = value
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitSetExpr(this)
  }
  readonly object: Expr
  readonly name: Token
  readonly value: Expr
}
export class This extends Expr {
  constructor(keyword: Token) {
    super()
    this.keyword = keyword
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitThisExpr(this)
  }
  readonly keyword: Token
}
export class Super extends Expr {
  constructor(keyword: Token, method: Token) {
    super()
    this.keyword = keyword
    this.method = method
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitSuperExpr(this)
  }
  readonly keyword: Token
  readonly method: Token
}
