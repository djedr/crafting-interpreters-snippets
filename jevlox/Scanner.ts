import { Token } from "./Token.js"
import { TokenType } from "./TokenType.js"
import { Jevlox } from "./jevlox.js"

export class Scanner {
  private source: string
  private tokens: Token[] = []
  private start: number = 0
  private current = 0
  private line = 1

  constructor(source: string) {
    this.source = source
  }

  scanTokens() {
    while (!this.isAtEnd()) {
      // We are at the beginning of the next lexeme.
      this.start = this.current
      this.scanToken()
    }

    this.tokens.push(new Token(TokenType.Eof, "", null, this.line))
    return this.tokens
  }

  private isAtEnd() {
    return this.current >= this.source.length
  }

  private scanToken() {
    const c = this.advance()

    switch (c) {
      case '(': this.addToken(TokenType.LeftParen); break
      case ')': this.addToken(TokenType.RightParen); break
      case '{': this.addToken(TokenType.LeftBrace); break
      case '}': this.addToken(TokenType.RightBrace); break
      case ',': this.addToken(TokenType.Comma); break
      case '.': this.addToken(TokenType.Dot); break
      case '-': this.addToken(TokenType.Minus); break
      case '+': this.addToken(TokenType.Plus); break
      case ';': this.addToken(TokenType.Semicolon); break
      case '*': this.addToken(TokenType.Star); break
      case '!': this.addToken(this.match('=') ? TokenType.BangEqual : TokenType.Bang); break
      case '=': this.addToken(this.match('=') ? TokenType.EqualEqual : TokenType.Equal); break
      case '<': this.addToken(this.match('=') ? TokenType.LessEqual : TokenType.Less); break
      case '>': this.addToken(this.match('=') ? TokenType.GreaterEqual : TokenType.Greater); break
      case '/':
        if (this.match('/')) {
          // A comment goes until the end of the line.
          while (this.peek() !== '\n' && !this.isAtEnd()) this.advance()
        }
        else {
          this.addToken(TokenType.Slash)
        }
        break

      // Jevlox additions:
      case '[': this.addToken(TokenType.LeftBracket); break
      case ']': this.addToken(TokenType.RightBracket); break
      // TODO
      // ...

      default:
        Jevlox.error(this.line, "Unexpected character.")
        break
    }
  }

  private match(expected: string) {
    if (this.isAtEnd()) return false
    if (this.source.charAt(this.current) !== expected) return false

    this.current += 1
    return true
  }

  private peek() {
    if (this.isAtEnd()) return '\0'
    return this.source.charAt(this.current)
  }

  private advance() {
    return this.source.charAt(this.current++)
  }

  private addToken(type: TokenType, literal: object | null = null) {
    const text = this.source.slice(this.start, this.current)
    this.tokens.push(new Token(type, text, literal, this.line))
  }
}