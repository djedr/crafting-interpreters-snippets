import assert from 'assert'
import * as Expr from './Expr.js'
import { Literal, Token } from './Token.js'
import { TokenType } from './TokenType.js'
import { RuntimeError } from './RuntimeError.js'
import { Jevlox } from './jevlox.js'

// todo: change accordingly
type Value = Literal

export class Interpreter implements Expr.Visitor<Value> {
  interpret(expression: Expr.Expr) {
    try {
      const value = this.evaluate(expression)
      console.log(this.stringify(value))
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
