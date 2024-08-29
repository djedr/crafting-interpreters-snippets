import * as Expr from "./Expr.js"
import { Jevlox } from "./Jevlox.js"
import { Expression, Print, Stmt } from "./Stmt.js"
import { Token } from "./Token.js"
import { TokenType } from "./TokenType.js"

class ParseError extends Error {}

export class Parser {
  private readonly tokens: Token[]
  private current = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  parse(): Stmt[] {
    const statements: Stmt[] = []
    while (!this.isAtEnd()) {
      statements.push(this.statement())
    }
    return statements
  }

  private expression(): Expr.Expr {
    return this.equality()
  }

  private statement(): Stmt {
    if (this.match(TokenType.Print)) return this.printStatement()

    return this.expressionStatement()
  }

  private printStatement(): Stmt {
    const value: Expr.Expr = this.expression()
    this.consume(TokenType.Semicolon, "Expect ';' after value.")
    return new Print(value)
  }

  private expressionStatement(): Stmt {
    const expr = this.expression()
    this.consume(TokenType.Semicolon, "Expect ';' after expression.")
    return new Expression(expr)
  }

  private equality(): Expr.Expr {
    let expr = this.comparison()
    while(this.match(TokenType.BangEqual, TokenType.EqualEqual)) {
      const operator = this.previous()
      const right = this.comparison()
      expr = new Expr.Binary(expr, operator, right)
    }

    return expr
  }

  private comparison(): Expr.Expr {
    let expr = this.term()

    while (this.match(TokenType.Greater, TokenType.GreaterEqual, TokenType.Less, TokenType.LessEqual)) {
      const operator = this.previous()
      const right = this.term()
      expr = new Expr.Binary(expr, operator, right)
    }

    return expr
  }

  private term(): Expr.Expr {
    let expr = this.factor()

    while (this.match(TokenType.Minus, TokenType.Plus)) {
      const operator = this.previous()
      const right = this.factor()
      expr = new Expr.Binary(expr, operator, right)
    }

    return expr
  }

  private factor(): Expr.Expr {
    let expr = this.unary()

    while (this.match(TokenType.Slash, TokenType.Star)) {
      const operator = this.previous()
      const right = this.unary()
      expr = new Expr.Binary(expr, operator, right)
    }

    return expr
  }

  private unary(): Expr.Expr {
    if (this.match(TokenType.Bang, TokenType.Minus)) {
      const operator = this.previous()
      const right = this.unary()
      return new Expr.Unary(operator, right)
    }

    return this.primary()
  }

  private primary(): Expr.Expr {
    if (this.match(TokenType.False)) return new Expr.Literal(false)
    if (this.match(TokenType.True)) return new Expr.Literal(true)
    if (this.match(TokenType.Nil)) return new Expr.Literal(null)

    if (this.match(TokenType.Number, TokenType.String)) {
      return new Expr.Literal(this.previous().literal)
    }

    if (this.match(TokenType.LeftParen)) {
      const expr = this.expression()
      this.consume(TokenType.RightParen, "Expect ')' after expression.")
      return new Expr.Grouping(expr)
    }

    throw this.error(this.peek(), "Expect expression.")
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }
    return false
  }

  private consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance()

      throw this.error(this.peek(), message)
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false
    return this.peek().type === type
  }

  private advance() {
    if (!this.isAtEnd()) this.current += 1
    return this.previous()
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.Eof
  }

  private peek(): Token {
    return this.tokens.at(this.current)
  }

  private previous(): Token {
    return this.tokens.at(this.current - 1)
  }

  private error(token: Token, message: string): ParseError {
    Jevlox.errorToken(token, message)
    return new ParseError()
  }

  private synchronize() {
    this.advance()
    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.Semicolon) return

      switch (this.peek().type) {
        case TokenType.Class: case TokenType.For: case TokenType.Fun:
        case TokenType.If: case TokenType.Print: case TokenType.Return:
        case TokenType.Var: case TokenType.While:
          return
      }

      this.advance()
    }
  }
}