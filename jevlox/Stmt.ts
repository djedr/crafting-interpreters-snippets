import {Expr} from './Expr.js'

export abstract class Stmt {
  abstract accept<R>(visitor: Visitor<R>): R
}
export interface Visitor<R> {
  visitExpressionStmt(stmt: Expression): R
  visitPrintStmt(stmt: Print): R
}
export class Expression extends Stmt {
  constructor(expression: Expr) {
    super()
    this.expression = expression
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitExpressionStmt(this)
  }
  readonly expression: Expr
}
export class Print extends Stmt {
  constructor(expression: Expr) {
    super()
    this.expression = expression
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitPrintStmt(this)
  }
  readonly expression: Expr
}
