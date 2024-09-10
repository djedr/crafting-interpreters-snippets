import * as Expr from "./Expr.js";
import { Interpreter } from "./Interpreter.js";
import { Jevlox } from "./Jevlox.js";
import * as Stmt from "./Stmt.js"
import { Token } from "./Token.js";

enum FunType {
  None,
  Fun,
  Initializer,
  Method,
}

enum ClassType {
  None,
  Class,
  Subclass,
}

export class Resolver implements Expr.Visitor<void>, Stmt.Visitor<void> {
  private readonly interpreter: Interpreter
  private readonly scopes: Map<string, boolean>[] = []
  private currentFun: FunType = FunType.None
  private currentClass: ClassType = ClassType.None

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

  visitClassStmt(stmt: Stmt.Class): void {
    const enclosingClass = this.currentClass
    this.currentClass = ClassType.Class

    this.declare(stmt.name)
    this.define(stmt.name)
    if (
      stmt.superclass !== null &&
      stmt.name.lexeme === stmt.superclass.name.lexeme
    ) {
      Jevlox.errorToken(stmt.superclass.name, "A class can't inherit from itself.")
    }

    if (stmt.superclass !== null) {
      this.currentClass = ClassType.Subclass
      this.resolveExpression(stmt.superclass)
    }

    if (stmt.superclass !== null) {
      this.beginScope()
      this.scopes.at(-1).set("super", true)
    }

    this.beginScope()
    this.scopes.at(-1).set("this", true)

    for (const method of stmt.methods) {
      let declaration = FunType.Method
      if (method.name.lexeme === "init") {
        declaration = FunType.Initializer
      }

      this.resolveFun(method, declaration)
    }

    this.endScope()

    if (stmt.superclass !== null) this.endScope()

    this.currentClass = enclosingClass

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
      if (this.currentFun === FunType.Initializer) {
        Jevlox.errorToken(stmt.keyword, "Can't return a value from an initializer.")
      }

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

  visitGetExpr(expr: Expr.Get): void {
    this.resolveExpression(expr.object)
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

  visitSetExpr(expr: Expr.Set): void {
    this.resolveExpression(expr.value)
    this.resolveExpression(expr.object)
    return null
  }

  visitSuperExpr(expr: Expr.Super): void {
    if (this.currentClass === ClassType.None) {
      Jevlox.errorToken(
        expr.keyword,
        "Can't use 'super' outside of a class.",
      )
    }
    else if (this.currentClass !== ClassType.Subclass) {
      Jevlox.errorToken(
        expr.keyword,
        "Can't use 'super' in a class with no superclass."
      )
    }

    this.resolveLocal(expr, expr.keyword)
    return null
  }

  visitThisExpr(expr: Expr.This): void {
    if (this.currentClass === ClassType.None) {
      Jevlox.errorToken(expr.keyword, "Can't use 'this' outside of a class.")
      return null
    }

    this.resolveLocal(expr, expr.keyword)
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