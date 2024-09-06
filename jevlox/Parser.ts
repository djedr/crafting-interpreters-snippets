import * as Expr from "./Expr.js"
import { Jevlox } from "./Jevlox.js"
import { Block, Expression, Fun, If, Print, Return, Stmt, Var, While } from "./Stmt.js"
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
      statements.push(this.declaration())
    }
    return statements
  }

  private expression(): Expr.Expr {
    return this.assignment()
  }

  private declaration(): Stmt {
    try {
      if (this.match(TokenType.Fun)) return this.fun("function")
      if (this.match(TokenType.Var)) return this.varDeclaration()
      return this.statement()
    }
    catch (error) {
      if (error instanceof ParseError) {
        this.synchronize()
        return null
      }
      throw error
    }
  }

  private statement(): Stmt {
    if (this.match(TokenType.For)) return this.forStatement()
    if (this.match(TokenType.If)) return this.ifStatement()
    if (this.match(TokenType.Print)) return this.printStatement()
    if (this.match(TokenType.Return)) return this.returnStatement()
    if (this.match(TokenType.While)) return this.whileStatement()
    if (this.match(TokenType.LeftBrace)) return new Block(this.block())

    return this.expressionStatement()
  }

  private forStatement() {
    this.consume(TokenType.LeftParen, "Expect '(' after 'for'.")

    let initializer: Stmt
    if (this.match(TokenType.Semicolon)) {
      initializer = null
    }
    else if (this.match(TokenType.Var)) {
      initializer = this.varDeclaration()
    }
    else {
      initializer = this.expressionStatement()
    }

    let condition = null
    if (!this.check(TokenType.Semicolon)) {
      condition = this.expression()
    }
    this.consume(TokenType.Semicolon, "Expect ';' after loop condition.")

    let increment: Expr.Expr = null
    if (!this.check(TokenType.RightParen)) {
      increment = this.expression()
    }
    this.consume(TokenType.RightParen, "Expect ')' after for clauses.")
    let body = this.statement()

    if (increment !== null) {
      body = new Block([
        body,
        new Expression(increment)
      ])
    }

    if (condition === null) condition = new Expr.Literal(true)
    body = new While(condition, body)

    if (initializer !== null) {
      body = new Block([initializer, body])
    }
    
    return body
  }

  private ifStatement() {
    this.consume(TokenType.LeftParen, "Expect '(' after 'if'.")
    const condition: Expr.Expr = this.expression()
    this.consume(TokenType.RightParen, "Expect ')' after if condition.")

    const thenBranch: Stmt = this.statement()
    let elseBranch = null
    if (this.match(TokenType.Else)) {
      elseBranch = this.statement()
    }

    return new If(condition, thenBranch, elseBranch)
  }

  private printStatement(): Stmt {
    const value: Expr.Expr = this.expression()
    this.consume(TokenType.Semicolon, "Expect ';' after value.")
    return new Print(value)
  }

  private returnStatement(): Stmt {
    const keyword: Token = this.previous()
    let value: Expr.Expr = null
    if (!this.check(TokenType.Semicolon)) {
      value = this.expression()
    }
    
    this.consume(TokenType.Semicolon, "Expect ';' after return value.")
    return new Return(keyword, value)
  }

  private varDeclaration(): Stmt {
    const name = this.consume(TokenType.Identifier, "Expect variable name.")

    let initializer: Expr.Expr = null
    if (this.match(TokenType.Equal)) {
      initializer = this.expression()
    }

    this.consume(TokenType.Semicolon, "Expect ';' after variable declaration.")
    return new Var(name, initializer)
  }

  private whileStatement(): Stmt {
    this.consume(TokenType.LeftParen, "Expect '(' after 'while'.")
    const condition = this.expression()
    this.consume(TokenType.RightParen, "Expect ')' after while condition.")
    const body: Stmt = this.statement()
    return new While(condition, body)
  }

  private expressionStatement(): Stmt {
    const expr = this.expression()
    this.consume(TokenType.Semicolon, "Expect ';' after expression.")
    return new Expression(expr)
  }

  private fun(kind: string): Fun {
    const name: Token = this.consume(
      TokenType.Identifier,
      `Expect ${kind} name.`
    )
    this.consume(TokenType.LeftParen, `Expect '(' after ${kind} name.`)
    const parameters: Token[] = []
    if (!this.check(TokenType.RightParen)) {
      do {
        if (parameters.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 parameters.")
        }
        parameters.push(this.consume(
          TokenType.Identifier,
          "Expect parameter name.",
        ))
      } while (this.match(TokenType.Comma))
    }
    this.consume(TokenType.RightParen, "Expect ')' after parameters.")
    this.consume(TokenType.LeftBrace, `Expect '{' before ${kind} body.`)
    const body: Stmt[] = this.block()
    return new Fun(name, parameters, body)
  }

  private block(): Stmt[] {
    const statements: Stmt[] = []

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      statements.push(this.declaration())
    }

    this.consume(TokenType.RightBrace, "Expect '}' after block.")
    return statements
  }

  private assignment(): Expr.Expr {
    const expr = this.or()

    if (this.match(TokenType.Equal)) {
      const equals: Token = this.previous()
      const value: Expr.Expr = this.assignment()

      if (expr instanceof Expr.Variable) {
        const name: Token = expr.name
        return new Expr.Assign(name, value)
      }

      this.error(equals, "Invalid assignment target.")
    }

    return expr
  }

  private or(): Expr.Expr {
    let expr = this.and()

    while (this.match(TokenType.Or)) {
      const operator: Token = this.previous()
      const right: Expr.Expr = this.and()
      expr = new Expr.Logical(expr, operator, right)
    }

    return expr
  }

  private and(): Expr.Expr {
    let expr: Expr.Expr = this.equality()

    while (this.match(TokenType.And)) {
      const operator: Token = this.previous()
      const right = this.equality()
      expr = new Expr.Logical(expr, operator, right)
    }

    return expr
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

    return this.call()
  }

  private finishCall(callee: Expr.Expr): Expr.Expr {
    const args: Expr.Expr[] = []
    if (!this.check(TokenType.RightParen)) {
      do {
        if (args.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 arguments.")
        }
        args.push(this.expression())
      }
      while (this.match(TokenType.Comma))
    }

    const paren = this.consume(
      TokenType.RightParen,
      "Expect ')' after arguments.",
    )

    return new Expr.Call(callee, paren, args)
  }

  private call(): Expr.Expr {
    let expr = this.primary()

    while (true) {
      if (this.match(TokenType.LeftParen)) {
        expr = this.finishCall(expr)
      }
      else {
        break
      }
    }

    return expr
  }

  private primary(): Expr.Expr {
    if (this.match(TokenType.False)) return new Expr.Literal(false)
    if (this.match(TokenType.True)) return new Expr.Literal(true)
    if (this.match(TokenType.Nil)) return new Expr.Literal(null)

    if (this.match(TokenType.Number, TokenType.String)) {
      return new Expr.Literal(this.previous().literal)
    }

    if (this.match(TokenType.Identifier)) {
      return new Expr.Variable(this.previous())
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