import assert from 'assert'
import * as Expr from './Expr.js'
import { Literal } from './Token.js'
import { TokenType } from './TokenType.js'

// todo: change accordingly
type Value = Literal

export class Interpreter implements Expr.Visitor<Value> {
  private evaluate(expr: Expr.Expr) {
    return expr.accept(this)
  }

  visitBinaryExpr(expr: Expr.Binary): Value {
    const left = this.evaluate(expr.left)
    const right = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.Greater:
        assert(typeof left === 'number' && typeof right === 'number')
        return left > right
      case TokenType.GreaterEqual:
        assert(typeof left === 'number' && typeof right === 'number')
        return left >= right
      case TokenType.Less:
        assert(typeof left === 'number' && typeof right === 'number')
        return left < right
      case TokenType.LessEqual:
        assert(typeof left === 'number' && typeof right === 'number')
        return left <= right
      case TokenType.BangEqual:
        return !this.isEqual(left, right)
      case TokenType.EqualEqual:
        return this.isEqual(left, right)
      case TokenType.Minus:
        assert(typeof left === 'number' && typeof right === 'number')
        return left - right
      case TokenType.Plus:
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right
        }

        if (typeof left === 'string' && typeof right === 'string') {
          return left + right
        }

        break
      case TokenType.Slash:
        assert(typeof left === 'number' && typeof right === 'number')
        return left / right
      case TokenType.Star:
        assert(typeof left === 'number' && typeof right === 'number')
        return left * right
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
        assert(typeof right === 'number')
        return -right
      case TokenType.Bang:
        return !this.isTruthy(right)
    }

    // Unreachable.
    return null
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
}