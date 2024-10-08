import * as Expr from './Expr.js'
import * as Stmt from './Stmt.js'
import { Literal, Token } from './Token.js'
import { TokenType } from './TokenType.js'
import { RuntimeError } from './RuntimeError.js'
import { Jevlox } from './Jevlox.js'
import { Environment } from './Environment.js'
import { Callable } from './Callable.js'
import { Fun } from './Fun.js'
import { Return } from './Return.js'
import { Class } from './Class.js'
import { Instance } from './Instance.js'

// todo: change accordingly
export type Value = Literal | Callable | Instance

export class Interpreter implements Expr.Visitor<Value>, Stmt.Visitor<void> {
  readonly globals: Environment = new Environment()
  private environment: Environment = this.globals
  private readonly locals: Map<Expr.Expr, number> = new Map()

  constructor() {
    this.globals.define("clock", <Callable>{
      arity() { return 0 },
      
      call(interpreter, args) {
        return Date.now() / 1000
      },

      toString() {
        return "<native fn>"
      }
    })
  }

  interpret(statements: Stmt.Stmt[]) {
    try {
      for (const statement of statements) {
        this.execute(statement)
      }
    }
    catch (error) {
      if (error instanceof RuntimeError) {
        Jevlox.runtimeError(error)
      }
      else throw error
    }
  }

  private evaluate(expr: Expr.Expr) {
    return expr.accept(this)
  }

  private execute(stmt: Stmt.Stmt) {
    stmt.accept(this)
  }

  resolve(expr: Expr.Expr, depth: number) {
    this.locals.set(expr, depth)
  }

  executeBlock(statements: Stmt.Stmt[], environment: Environment): void {
    const previous = this.environment
    try {
      this.environment = environment

      for (const statement of statements) {
        this.execute(statement)
      }
    }
    finally {
      this.environment = previous
    }
  }

  visitBlockStmt(stmt: Stmt.Block): void {
    this.executeBlock(stmt.statements, new Environment(this.environment))
    return null
  }
  visitClassStmt(stmt: Stmt.Class): void {
    let superclass: Class = null
    if (stmt.superclass !== null) {
      const superclassValue = this.evaluate(stmt.superclass)
      if (!(superclassValue instanceof Class)) {
        throw new RuntimeError(
          stmt.superclass.name,
          "Superclass must be a class",
        )
      }
      superclass = superclassValue
    }

    this.environment.define(stmt.name.lexeme, null)

    if (stmt.superclass !== null) {
      this.environment = new Environment(this.environment)
      this.environment.define("super", superclass)
    }

    const methods: Map<string, Fun> = new Map()
    for (const method of stmt.methods) {
      const fun = new Fun(method, this.environment, method.name.lexeme === "init")
      methods.set(method.name.lexeme, fun)
    }

    const klass: Class = new Class(stmt.name.lexeme, superclass, methods)

    if (superclass !== null) {
      this.environment = this.environment.enclosing
    }
    
    this.environment.assign(stmt.name, klass)
    return null
  }
  visitExpressionStmt(stmt: Stmt.Expression): void {
    this.evaluate(stmt.expression)
    return undefined
  }
  visitFunStmt(stmt: Stmt.Fun): void {
    const fun = new Fun(stmt, this.environment, false)
    this.environment.define(stmt.name.lexeme, fun)
    return null
  }
  visitIfStmt(stmt: Stmt.If): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch)
    }
    else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch)
    }
    return null
  }
  visitPrintStmt(stmt: Stmt.Print): void {
    const value = this.evaluate(stmt.expression)
    console.log(this.stringify(value))
    return undefined
  }
  visitReturnStmt(stmt: Stmt.Return): void {
    let value: Value = null
    if (stmt.value !== null) value = this.evaluate(stmt.value)
    
    throw new Return(value)
  }
  visitVarStmt(stmt: Stmt.Var): void {
    let value = null
    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer)
    }

    this.environment.define(stmt.name.lexeme, value)
    return null
  }
  visitWhileStmt(stmt: Stmt.While): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body)
    }
    return null
  }

  visitAssignExpr(expr: Expr.Assign): Value {
    const value = this.evaluate(expr.value)

    const distance = this.locals.get(expr)
    if (distance !== null) {
      this.environment.assignAt(distance, expr.name, value)
    }
    else {
      this.globals.assign(expr.name, value)
    }

    return value
  }
  visitLogicalExpr(expr: Expr.Logical): Value {
    const left = this.evaluate(expr.left)

    if (expr.operator.type === TokenType.Or) {
      if (this.isTruthy(left)) return left
    }
    else {
      if (!this.isTruthy(left)) return left
    }

    return this.evaluate(expr.right)
  }
  visitSetExpr(expr: Expr.Set): Value {
    const object = this.evaluate(expr.object)

    if (!(object instanceof Instance)) {
      throw new RuntimeError(
        expr.name,
        "Only instances have fields.",
      )
    }

    const value = this.evaluate(expr.value)
    object.set(expr.name, value)
    return value
  }
  visitSuperExpr(expr: Expr.Super): Value {
    const distance = this.locals.get(expr)
    const superclass = this.environment.getAt(distance, "super") as Class

    const object = this.environment.getAt(distance - 1, "this") as Instance

    const method = superclass.findMethod(expr.method.lexeme)

    if (method === null) {
      throw new RuntimeError(
        expr.method,
        `Undefined property '${expr.method.lexeme}'.`,
      )
    }

    return method.bind(object)
  }
  visitThisExpr(expr: Expr.This): Value {
    return this.lookUpVariable(expr.keyword, expr)
  }
  visitBinaryExpr(expr: Expr.Binary): Value {
    const left = this.evaluate(expr.left)
    const right = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.Greater:
        this.checkNumberOperands(expr.operator, left, right)
        return left > (right as number)
      case TokenType.GreaterEqual:
        this.checkNumberOperands(expr.operator, left, right)
        return left >= (right as number)
      case TokenType.Less:
        this.checkNumberOperands(expr.operator, left, right)
        return left < (right as number)
      case TokenType.LessEqual:
        this.checkNumberOperands(expr.operator, left, right)
        return left <= (right as number)
      case TokenType.BangEqual:
        return !this.isEqual(left, right)
      case TokenType.EqualEqual:
        return this.isEqual(left, right)
      case TokenType.Minus:
        this.checkNumberOperands(expr.operator, left, right)
        return left - (right as number)
      case TokenType.Plus:
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right
        }

        if (typeof left === 'string' && typeof right === 'string') {
          return left + right
        }

        throw new RuntimeError(
          expr.operator,
          "Operands must be two numbers or two strings.",
        )
      case TokenType.Slash:
        this.checkNumberOperands(expr.operator, left, right)
        return left / (right as number)
      case TokenType.Star:
        this.checkNumberOperands(expr.operator, left, right)
        return left * (right as number)
    }

    // Unreachable.
    return null
  }
  visitCallExpr(expr: Expr.Call): Value {
    const callee: Value = this.evaluate(expr.callee)

    const args: Value[] = []
    for (const argument of expr.args) {
      args.push(this.evaluate(argument))
    }

    if (!(typeof callee === 'object' && 'call' in callee)) {
      throw new RuntimeError(
        expr.paren,
        "Can only call functions and classes.",
      )
    }

    const fun: Callable = callee
    if (args.length != fun.arity()) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${fun.arity()} arguments but got ${args.length}.`
      )
    }

    return fun.call(this, args)
  }
  visitGetExpr(expr: Expr.Get): Value {
    const object = this.evaluate(expr.object)
    if (object instanceof Instance) {
      return object.get(expr.name)
    }

    throw new RuntimeError(
      expr.name,
      "Only instances have properties.",
    )
  }
  visitGroupingExpr(expr: Expr.Grouping): Value {
    return this.evaluate(expr.expression)
  }
  visitLiteralExpr(expr: Expr.Literal): Value {
    return expr.value
  }
  visitUnaryExpr(expr: Expr.Unary): Value {
    const right = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.Minus:
        this.checkNumberOperand(expr.operator, right)
        return -right
      case TokenType.Bang:
        return !this.isTruthy(right)
    }

    // Unreachable.
    return null
  }
  visitVariableExpr(expr: Expr.Variable): Value {
    return this.lookUpVariable(expr.name, expr)
  }

  private lookUpVariable(name: Token, expr: Expr.Expr): Value {
    const distance: number = this.locals.get(expr)
    if (distance !== undefined) {
      return this.environment.getAt(distance, name.lexeme)
    }
    else {
      return this.globals.get(name)
    }
  }

  private checkNumberOperand(operator: Token, operand: Value): asserts operand is number {
    if (typeof operand === 'number') return
    throw new RuntimeError(operator, "Operand must be a number.")
  }

  // note: TypeScript does not allow assertions on > 1 value
  private checkNumberOperands(operator: Token, left: Value, right: Value): asserts left is number {
    if (typeof left === 'number' && typeof right === 'number') return
    throw new RuntimeError(operator, "Operands must be numbers.")
  }

  private isTruthy(value: Value) {
    if (value === null) return false
    if (typeof value === 'boolean') return value
    return true
  }

  private isEqual(a: Value, b: Value) {
    // note: this is not like in Java:
    return a === b
  }

  private stringify(value: Value): string {
    if (value === null) return 'nil'

    if (typeof value === 'number') {
      let text = value.toString()
      if (text.endsWith(".0")) {
        text = text.slice(0, -2)
      }
      return text
    }

    return value.toString()
  }
}
