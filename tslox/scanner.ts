export enum TokenType {
  // Single-character tokens.
  LEFT_PAREN, RIGHT_PAREN,
  LEFT_BRACE, RIGHT_BRACE,
  COMMA, DOT, MINUS, PLUS,
  SEMICOLON, SLASH, STAR,
  // One or two character tokens.
  BANG, BANG_EQUAL,
  EQUAL, EQUAL_EQUAL,
  GREATER, GREATER_EQUAL,
  LESS, LESS_EQUAL,
  // Literals.
  IDENTIFIER, STRING, NUMBER,
  // Keywords.
  AND, CLASS, ELSE, FALSE,
  FOR, FUN, IF, NIL, OR,
  PRINT, RETURN, SUPER, THIS,
  TRUE, VAR, WHILE,

  ERROR, EOF
}

export interface Scanner {
  source: string;
  start: number;
  current: number;
  line: number;
}

export interface Token {
  type: TokenType;
  source: string;
  start: number;
  length: number;
  line: number;
}

const scanner: Scanner = {
  source: '',
  start: 0,
  current: 0,
  line: 1,
}

export const initScanner = (source: string) => {
  scanner.source = source
  scanner.current = 0
  scanner.line = 1
}

const isAlpha = (c: string): boolean => {
  return (c >= 'a' && c <= 'z') ||
         (c >= 'A' && c <= 'Z') ||
          c === '_'
}

const isDigit = (c: string): boolean => {
  return c >= '0' && c <= '9'
}

const isAtEnd = (): boolean => {
  return scanner.current >= scanner.source.length
}

const advance = (): string => {
  scanner.current += 1
  return scanner.source[scanner.current - 1]
}

const peek = (): string => {
  return scanner.source[scanner.current]
}

const peekNext = (): string => {
  if (isAtEnd()) return '\0'
  return scanner.source[scanner.current + 1]
}

const match = (expected: string): boolean => {
  if (isAtEnd()) return false
  if (scanner.source[scanner.current] !== expected) return false
  scanner.current += 1
  return true
}

const makeToken = (type: TokenType): Token => {
  const token: Token = {
    type,
    source: scanner.source,
    start: scanner.start,
    length: scanner.current - scanner.start,
    line: scanner.line,
  }
  return token
}

const errorToken = (message: string): Token => {
  return {
    type: TokenType.ERROR,
    source: message,
    start: 0,
    length: message.length,
    line: scanner.line,
  }
}

const skipWhitespace = () => {
  for (;;) {
    const c = peek()
    switch (c) {
      case ' ':
      case '\r':
      case '\t':
        advance()
        break
      case '\n':
        scanner.line += 1
        advance()
        break
      case '/':
        if (peekNext() === '/') {
          // A comment goes until the end of the line.
          while (peek() !== '\n' && !isAtEnd()) advance()
        }
        else {
          return
        }
      default:
        return
    }
  }
}

const checkKeyword = (start: number, rest: string, type: TokenType): TokenType => {
  if (scanner.current - scanner.start === start + rest.length && scanner.source.startsWith(rest, scanner.start + start)) {
    return type
  }

  return TokenType.IDENTIFIER
}

const identifierType = (): TokenType => {
  switch (scanner.source[scanner.start]) {
    case 'a': return checkKeyword(1, "nd", TokenType.AND)
    case 'c': return checkKeyword(1, "lass", TokenType.CLASS)
    case 'e': return checkKeyword(1, "lse", TokenType.ELSE)
    case 'f':
      if (scanner.current - scanner.start > 1) {
        switch (scanner.source[scanner.start + 1]) {
          case 'a': return checkKeyword(2, "lse", TokenType.FALSE)
          case 'o': return checkKeyword(2, "r", TokenType.FOR)
          case 'u': return checkKeyword(2, "n", TokenType.FUN)
        }
      }
    case 'i': return checkKeyword(1, "f", TokenType.IF)
    case 'n': return checkKeyword(1, "il", TokenType.NIL)
    case 'o': return checkKeyword(1, "r", TokenType.OR)
    case 'p': return checkKeyword(1, "rint", TokenType.PRINT)
    case 'r': return checkKeyword(1, "eturn", TokenType.RETURN)
    case 's': return checkKeyword(1, "uper", TokenType.SUPER)
    case 't':
      if (scanner.current - scanner.start > 1) {
        switch (scanner.source[scanner.start + 1]) {
          case 'h': return checkKeyword(2, "is", TokenType.THIS)
          case 'r': return checkKeyword(2, "ue", TokenType.TRUE)
        }
      }
    case 'v': return checkKeyword(1, "ar", TokenType.VAR)
    case 'w': return checkKeyword(1, "hile", TokenType.WHILE)
  }

  return TokenType.IDENTIFIER
}

const identifier = (): Token => {
  while (isAlpha(peek()) || isDigit(peek())) advance()
  return makeToken(identifierType()) 
}

const number = (): Token => {
  while (isDigit(peek())) advance()

  // Look for a fractional part.
  if (peek() === '.' && isDigit(peekNext())) {
    // Consume the ".".
    advance()

    while (isDigit(peek())) advance()
  }

  return makeToken(TokenType.NUMBER)
}

const string = (): Token => {
  while (peek() !== '"' && !isAtEnd()) {
    if (peek() === '\n') scanner.line += 1
    advance()
  }

  if (isAtEnd()) return errorToken("Unterminated string.")

  // The closing quote.
  advance()
  return makeToken(TokenType.STRING)
}

export const scanToken = (): Token => {
  skipWhitespace()
  scanner.start = scanner.current

  if (isAtEnd()) return makeToken(TokenType.EOF)

  const c = advance()
  if (isAlpha(c)) return identifier()
  if (isDigit(c)) return number()

  switch (c) {
    case '(': return makeToken(TokenType.LEFT_PAREN)
    case ')': return makeToken(TokenType.RIGHT_PAREN)
    case '{': return makeToken(TokenType.LEFT_BRACE)
    case '}': return makeToken(TokenType.RIGHT_BRACE)
    case ';': return makeToken(TokenType.SEMICOLON)
    case ',': return makeToken(TokenType.COMMA)
    case '.': return makeToken(TokenType.DOT)
    case '-': return makeToken(TokenType.MINUS)
    case '+': return makeToken(TokenType.PLUS)
    case '/': return makeToken(TokenType.SLASH)
    case '*': return makeToken(TokenType.STAR)
    case '!':
      return makeToken(
        match('=') ? TokenType.BANG_EQUAL : TokenType.BANG
      )
    case '=':
      return makeToken(
        match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL
      )
    case '<':
      return makeToken(
        match('=') ? TokenType.LESS_EQUAL : TokenType.LESS
      )
    case '>':
      return makeToken(
        match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER
      )
    case '"': return string()
  }

  return errorToken("Unexpected character.")
}