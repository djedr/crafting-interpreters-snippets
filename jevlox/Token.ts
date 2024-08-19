import { TokenType } from "./TokenType.js";

export class Token {
  type: TokenType
  lexeme: string
  literal: object | null
  line: number

  constructor(
    type: TokenType,
    lexeme: string,
    literal: object | null,
    line: number,
  ) {
    this.type = type
    this.lexeme = lexeme
    this.literal = literal
    this.line = line
  }

  public toString() {
    return `${this.type} ${this.lexeme} ${this.literal}`
  }
}
