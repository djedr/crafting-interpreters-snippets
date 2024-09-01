import * as Expr from './Expr.js'

export class AstPrinter implements Expr.Visitor<string> {
  print(expr: Expr.Expr) {
    return expr.accept(this)
  }

  visitBinaryExpr(expr: Expr.Binary): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
  }
  visitGroupingExpr(expr: Expr.Grouping): string {
    return this.parenthesize("group", expr.expression)
  }
  visitLiteralExpr(expr: Expr.Literal): string {
    if (expr.value === null) return "[nil]"
    return `[${expr.value.toString()}]`
  }
  visitUnaryExpr(expr: Expr.Unary): string {
    return this.parenthesize(expr.operator.lexeme, expr.right)
  }
  visitVariableExpr(expr: Expr.Variable): string {
    return this.parenthesize("", expr)
  }

  private parenthesize(name: string, ...exprs: Expr.Expr[]) {
    let output = ''

    output += `${name}[`
    for (const expr of exprs) {
      output += ' '
      output += expr.accept(this)
    }
    output += ' ]'

    return output
  }
}
