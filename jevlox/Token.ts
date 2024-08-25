import { TokenType } from "./TokenType.js";

export type Literal = string | number | null | true | false

export class Token {
  type: TokenType
  lexeme: string
  literal: Literal
  line: number

  constructor(
    type: TokenType,
    lexeme: string,
    literal: Literal,
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
