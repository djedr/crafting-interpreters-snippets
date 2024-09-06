import fs from 'node:fs';

export class GenerateAst {
  static main(args: string[]) {
    if (args.length !== 1) {
      console.error("Usage: generate_ast <output directory>")
      process.exit(64)
    }
    const outputDir = args[0]
    this.defineAst(outputDir, "Expr", [
      "Binary   : Expr left, Token operator, Expr right",
      "Grouping : Expr expression",
      "Literal  : Lit value",
      "Unary    : Token operator, Expr right",
      "Variable : Token name",
      "Assign   : Token name, Expr value",
      "Logical  : Expr left, Token operator, Expr right",
      "Call     : Expr callee, Token paren, Expr[] args",
    ], `import { Token } from "./Token.js"
import { Literal as Lit } from "./Token.js"`)

    this.defineAst(outputDir, "Stmt", [
      "Expression : Expr expression",
      "Print      : Expr expression",
      "Var        : Token name, Expr initializer",
      "Block      : Stmt[] statements",
      "If         : Expr condition, Stmt thenBranch, Stmt elseBranch",
      "While      : Expr condition, Stmt body",
      "Fun        : Token name, Token[] params, Stmt[] body",
      "Return     : Token keyword, Expr value",
    ], `import { Expr } from './Expr.js'
import { Token } from './Token.js'`)
  }

  private static defineAst(
    outputDir: string,
    baseName: string,
    types: string[],
    prepend: string = ''
  ) {
    const path = outputDir + "/" + baseName + ".ts"

    let output = 
`${prepend}

export abstract class ${baseName} {
  abstract accept<R>(visitor: Visitor<R>): R
}
${this.defineVisitor(baseName, types)}
${(() => {
  let ret = ''
  for (const type of types) {
    const className = type.split(':')[0].trim()
    const fields = type.split(':')[1].trim()
    ret += this.defineType(baseName, className, fields)
  }
  return ret
})()}`

    fs.writeFileSync(path, output)
  }

  private static defineVisitor(
    baseName: string,
    types: string[],
  ) {
    let output = 
`export interface Visitor<R> {
${(() => {
  let ret = ''
  for (const type of types) {
    const typeName = type.split(':')[0].trim()
    ret += `  visit${typeName}${baseName}(${baseName.toLocaleLowerCase()}: ${typeName}): R\n`
  }
  return ret
})()}}`

    return output
  }

  private static defineType(
    baseName: string,
    className: string,
    fieldList: string,
  ) {
    const fields = fieldList.split(', ')
    let output =
`export class ${className} extends ${baseName} {
  constructor(${
    fields.map(field => {
      const [type, name] = field.split(" ")
      return `${name}: ${type}`
    }).join(', ')
  }) {
    super()
${(() => {
  let ret = ''
  for (const field of fields) {
    const name = field.split(" ")[1]
    ret += `    this.${name} = ${name}\n`
  }
  return ret
})()}  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visit${className}${baseName}(this)
  }
${(() => {
  let ret = ''
  for (const field of fields) {
    const [type, name] = field.split(" ")
    ret += `  readonly ${name}: ${type}\n`
  }
  return ret
})()}}
` 
    return output
  }
}

GenerateAst.main(process.argv.slice(2))