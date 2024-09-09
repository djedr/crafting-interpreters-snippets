import { Expr } from './Expr.js'
import { Token } from './Token.js'

export abstract class Stmt {
  abstract accept<R>(visitor: Visitor<R>): R
}
export interface Visitor<R> {
  visitExpressionStmt(stmt: Expression): R
  visitPrintStmt(stmt: Print): R
  visitVarStmt(stmt: Var): R
  visitBlockStmt(stmt: Block): R
  visitIfStmt(stmt: If): R
  visitWhileStmt(stmt: While): R
  visitFunStmt(stmt: Fun): R
  visitReturnStmt(stmt: Return): R
  visitClassStmt(stmt: Class): R
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
export class Var extends Stmt {
  constructor(name: Token, initializer: Expr) {
    super()
    this.name = name
    this.initializer = initializer
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitVarStmt(this)
  }
  readonly name: Token
  readonly initializer: Expr
}
export class Block extends Stmt {
  constructor(statements: Stmt[]) {
    super()
    this.statements = statements
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBlockStmt(this)
  }
  readonly statements: Stmt[]
}
export class If extends Stmt {
  constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt) {
    super()
    this.condition = condition
    this.thenBranch = thenBranch
    this.elseBranch = elseBranch
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitIfStmt(this)
  }
  readonly condition: Expr
  readonly thenBranch: Stmt
  readonly elseBranch: Stmt
}
export class While extends Stmt {
  constructor(condition: Expr, body: Stmt) {
    super()
    this.condition = condition
    this.body = body
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitWhileStmt(this)
  }
  readonly condition: Expr
  readonly body: Stmt
}
export class Fun extends Stmt {
  constructor(name: Token, params: Token[], body: Stmt[]) {
    super()
    this.name = name
    this.params = params
    this.body = body
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitFunStmt(this)
  }
  readonly name: Token
  readonly params: Token[]
  readonly body: Stmt[]
}
export class Return extends Stmt {
  constructor(keyword: Token, value: Expr) {
    super()
    this.keyword = keyword
    this.value = value
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitReturnStmt(this)
  }
  readonly keyword: Token
  readonly value: Expr
}
export class Class extends Stmt {
  constructor(name: Token, methods: Fun[]) {
    super()
    this.name = name
    this.methods = methods
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitClassStmt(this)
  }
  readonly name: Token
  readonly methods: Fun[]
}
