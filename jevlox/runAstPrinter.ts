import { AstPrinter } from "./AstPrinter.js"
import * as Expr from "./Expr.js"
import { Token } from "./Token.js"
import { TokenType } from "./TokenType.js"

const expression = new Expr.Binary(
  new Expr.Unary(
    new Token(TokenType.Minus, "-", null, 1),
    new Expr.Literal(123),
  ),
  new Token(TokenType.Star, "*", null, 1),
  new Expr.Grouping(new Expr.Literal(45.67))
)

console.log(new AstPrinter().print(expression))

console.log(new AstPrinter().print(new Expr.Binary(
  new Expr.Literal(1),
  new Token(TokenType.Star, "+", null, 1),
  new Expr.Literal(2)
)))