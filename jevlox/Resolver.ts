import * as Expr from "./Expr.js";
import { Interpreter } from "./Interpreter.js";
import { Jevlox } from "./Jevlox.js";
import * as Stmt from "./Stmt.js"
import { Token } from "./Token.js";

enum FunType {
  None,
  Fun,
}

export class Resolver implements Expr.Visitor<void>, Stmt.Visitor<void> {
  private readonly interpreter: Interpreter
  private readonly scopes: Map<string, boolean>[] = []
  private currentFun: FunType = FunType.None

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
  }

  resolve(statements: Stmt.Stmt[]): void {
    for (const statement of statements) {
      this.resolveStatement(statement)
    }
  }

  visitBlockStmt(stmt: Stmt.Block): void {
    this.beginScope()
    this.resolve(stmt.statements)
    this.endScope()
    return null
  }

  visitExpressionStmt(stmt: Stmt.Expression): void {
    this.resolveExpression(stmt.expression)
    return null
  }

  visitFunStmt(stmt: Stmt.Fun): void {
    this.declare(stmt.name)
    this.define(stmt.name)

    this.resolveFun(stmt, FunType.Fun)
    return null
  }

  visitIfStmt(stmt: Stmt.If): void {
    this.resolveExpression(stmt.condition)
    this.resolveStatement(stmt.thenBranch)
    if (stmt.elseBranch !== null) this.resolveStatement(stmt.elseBranch)
    return null
  }

  visitPrintStmt(stmt: Stmt.Print): void {
    this.resolveExpression(stmt.expression)
    return null
  }

  visitReturnStmt(stmt: Stmt.Return): void {
    if (this.currentFun === FunType.None) {
      Jevlox.errorToken(
        stmt.keyword,
        "Can't return from top-level code."
      )
    }

    if (stmt.value !== null) {
      this.resolveExpression(stmt.value)
    }

    return null
  }

  visitVarStmt(stmt: Stmt.Var): void {
    this.declare(stmt.name)
    if (stmt.initializer !== null) {
      this.resolveExpression(stmt.initializer)
    }
    this.define(stmt.name)
    return null
  }

  visitWhileStmt(stmt: Stmt.While): void {
    this.resolveExpression(stmt.condition)
    this.resolveStatement(stmt.body)
    return null
  }

  visitAssignExpr(expr: Expr.Assign): void {
    this.resolveExpression(expr.value)
    this.resolveLocal(expr, expr.name)
    return null
  }

  visitBinaryExpr(expr: Expr.Binary): void {
    this.resolveExpression(expr.left)
    this.resolveExpression(expr.right)
    return null
  }

  visitCallExpr(expr: Expr.Call): void {
    this.resolveExpression(expr.callee)

    for (const argument of expr.args) {
      this.resolveExpression(argument)
    }

    return null
  }

  visitGroupingExpr(expr: Expr.Grouping): void {
    this.resolveExpression(expr.expression)
    return null
  }

  visitLiteralExpr(expr: Expr.Literal): void {
    return null
  }

  visitLogicalExpr(expr: Expr.Logical): void {
    this.resolveExpression(expr.left)
    this.resolveExpression(expr.right)
    return null
  }

  visitUnaryExpr(expr: Expr.Unary): void {
    this.resolveExpression(expr.right)
    return null
  }

  visitVariableExpr(expr: Expr.Variable): void {
    if (
      this.scopes.length > 0 &&
      this.scopes.at(-1).get(expr.name.lexeme) === false
    ) {
      Jevlox.errorToken(
        expr.name,
        "Can't read local variable in its own initializer."
      )
    }

    this.resolveLocal(expr, expr.name)
    return null
  }

  private resolveStatement(stmt: Stmt.Stmt): void {
    stmt.accept(this)
  }

  private resolveExpression(expr: Expr.Expr): void {
    expr.accept(this)
  }

  private beginScope(): void {
    this.scopes.push(new Map<string, boolean>())
  }

  private endScope(): void {
    this.scopes.pop()
  }

  private declare(name: Token): void {
    if (this.scopes.length === 0) return
    const scope = this.scopes.at(-1)
    if (scope.has(name.lexeme)) {
      Jevlox.errorToken(
        name,
        "Already a variable with this name is this scope."
      )
    }

    scope.set(name.lexeme, false)
  }

  private define(name: Token): void {
    if (this.scopes.length === 0) return
    this.scopes.at(-1).set(name.lexeme, true)
  }

  private resolveLocal(expr: Expr.Expr, name: Token): void {
    for (let i = this.scopes.length - 1; i >= 0; --i) {
      if (this.scopes.at(i).has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i)
        return
      }
    }
  }

  private resolveFun(fun: Stmt.Fun, type: FunType): void {
    const enclosingFun: FunType = this.currentFun
    this.currentFun = type

    this.beginScope()
    for (const param of fun.params) {
      this.declare(param)
      this.define(param)
    }
    this.resolve(fun.body)
    this.endScope()
    this.currentFun = enclosingFun
  }
}