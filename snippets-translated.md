# Snippets from the book Crafting Interpreters by Robert Nystrom translated into an imaginary programming language based on Jevko that is designed while doing the translation

Sections are numbered according to pages in the book.

The lanugage is codenamed Jevlox -- Jevko + Lox.

## 6

```
[Jevlox].[error]\[ [line] ['Unexpected character.] ]
```

## 15

```
[pennyArea]./set[ [3.14159] .* [[0.75]./[2]] .* [[0.75]./[2]] ]
```

```
[pennyArea]./set[0.4417860938]
```

## 22

```
Your first Jevlox program!
[console].[log]\['Hello, world!]
```

## 23

```
[true]     Not false
[false]    Not *not* false.
```

```
[1234]     An integer.
[12.34]    A decimal number.
```

```
['I am a string]
[']       The empty string.
['123]    This is a string, not a number.

There are also raw strings:
[`''raw string'`]
```

## 24

```
[add].+[me]
[subtract].-[me]
[multiply].*[me]
[divide]./[me]
```

```
-[negate me]
```

```
[less].<[than]
[less than].<=[or equal]
[greater].>[than]
[greater than].>=[or equal]
```

## 25

```
[1].=[2]           false.
['cat].!=['dog]    true.
```

```
[314].=['pi]    false.
```

```
[123].=['123]    false.
```

```
not[true]     false.
not[false]    true.
```

```
[true].and[false]    false.
[true].and[true]     true.
```

```
[false].or[false]    false.
[true].or[false]     true.
```

```
[average].const[ [[min].+[max]] ./ [2] ]
```

## 26

```
[console].[log]\['Hello, world!]
```

equivalent:

```
/print['Hello, world!]
```

```
['some expression]
```

```
[
  /print['One statement.]
  /print['Two statements.]
]
```

```
[im a variable].let['here is my value]
[i am nil].let[]
```

```
[breakfast].let['bagels]
/print[breakfast]             bagels.
[breakfast]./set['beignets]
/print[breakfast]             beignets.
```

## 27

```
if[condition]./do[
  /print['yes]
].else[
  /print['no]
]
```

```
[a].let[1]
while[ [a] .< [10] ]./do[
  /print[a]
  [a]./set[ [a] .+ [1] ]
]
```

```
for[
  [a].let[1]
  [a] .< [10]
  [a]./set[ [a] .+ [1] ]
]./do[
  [console].[log]\[a]
]
```

```
make breakfast[ [bacon] [eggs] [toast] ]
```

```
make breakfast[]
```

## 28

```
[print sum].const: [ [a] [b] ]./fn[
  /print[ [a].+[b] ]
]
```

```
[return sum].const: [ [a] [b] ]./fn[
  return[ [a].+[b] ]
]
```

```
[add pair].const: [ [a] [b] ]./fn[
  return[ [a].+[b] ]
]

[identity].const: [a]./fn[
  return[a]
]

/print[  identity[add pair]\[ [1] [2] ]  ]    Prints "3".
```

Jevlox actually compiles to a simpler language, let's call it Jevlox1, by performing at least the following transformations (spaces for clarity):

1. 

```
[a].b[c]
```

translates into

```
b[ [a] [c] ]
```

2. 

```
[a].b:[c].d[e]
```

translates into

```
b[ [a] d[[c][e]] ]
```

3. 

```
f[a]\[b]
```

translates into

```
/call[ f[a] [b] ]
```

which is equivalent to JavaScript:

```
f(a)(b)
```

Jevlox1 is easily translatable at least to JavaScript.

## 29

```
[outer function].const:[]./fn[
  [local function].const:[]./fn[
    /print['I'm local!]
  ]

  local function[]
]
```

```
[return function].const:[]./fn[
  [outside].let['outside]

  [inner].const:[]./fn[
    /print[outside]
  ]

  return[inner]
]

[fn].let[return function[]]

fn[]
```

## 31

```
[Breakfast].class[
  cook[] [
    /print['Eggs a-fryin'!]
  ]

  serve[who] [
    /print[['Enjoy your breakfast, ].+[who].+['.]]
  ]
]
```

Not sure about this syntax.

## 32

```
Store it in variables.
[some variable].let[Breakfast]

Pass it to functions.
some function[Breakfast]
```

```
[breakfast].let[Breakfast[].new[]]
/print[breakfast]                    "Breakfast instance".
```

```
[breakfast].[meat]./set['sausage]
[breakfast].[bread]./set['sourdough]
```

or

```
[breakfast].[meat]./set['sausage]
[breakfast].[bread]./set['sourdough]
```

```
[Breakfast].class[
  serve[who] [
    /print[ ['Enjoy your '].+[[this].[meat]].+[' and '].+
      [[this].[bread]].+[', '].+[who].+['.]
    ]
  ]

  ...
]
```

## 33

```
[Breakfast].class[
  constructor[ [meat] [bread] ]  [
    [this].[meat]./set[meat]
    [this].[bread]./set[bread]
  ]

  ...
]

[bacon and toast].let[  Breakfast[ ['bacon] ['toast] ].new[]  ]
[bacon and toast].[serve]\['Dear Reader]
"Enjoy your bacon and tast, Dear Reader.
```

```
[Brunch].extends[Breakfast].class[
  drink[] [
    /print['How about a Bloody Mary?]
  ]
]
```

```
[benedict].let[  Brunch[ ['ham] ['English muffin] ].new[]  ]
[benedict].[serve]\['Noble reader]
```

```
[Brunch].extends[Breakfast].class[
  constructor[ [meat] [bread] [drink] ]  [
    super[ [meat] [bread] ]
    [this].[drink]./set[drink]
  ]
]
```

## 35

```
/print[ [1] .+ [[true]./if[2]./else[3]] .+ [4] ]
```

## 40

Gonna port the Java code to TypeScript and adjust to Jevlox.

```
import fs from 'node:fs'

import * as readline from 'node:readline';

// workaround for a bug in readline: https://github.com/nodejs/node/issues/53497
const readLine = (() => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  let _reject = () => {}
  rl.on('close', () => _reject('close'))
  return () => new Promise((resolve, reject) => {
    _reject = reject
    rl.question('> ', resolve)
  }).catch((e) => {
    console.error('interrupted', e)
    return null
  })
})()

class Jevlox {
  static async main(args: string[]) {
    if (args.length > 1) {
      console.log('Usage: jevlox [script]')
      process.exit(64)
    }
    else if (args.length === 1) {
      runFile(args[0])
    }
    else {
      await runPrompt()
    }
  }
}
```

```
private static runFile(path: string) {
  run(fs.readFileSync(path, 'utf8'))
}
```

```
private static async runPrompt() {
  for (;;) {
    const line = await readLine()
    if (line === null) break
    run(line)
  }
}
```

## 41

```
private static run(source: string) {
  const scanner = new Scanner(source)
  const tokens = scanner.scanTokens()

  // For now, just print the tokens.
  for (const token of tokens) {
    console.log(token)
  }
}
```

```
static error(line: number, message: string) {
  Jevlox.report(line, "", message)
}

private static report(line: number, where: string, message: string) {
  console.error(`[line ${line}] Error${where}: ${message}`)
  Jevlox.hadError = true
}
```

## 42

```
static hadError: boolean = false
```

```
// Indicate an error in the exit code
if (this.hadError) process.exit(65)
```

```
this.hadError = false
```

## 43

```
[language].let['jevlox]
```

```
export enum TokenType {
  // Single-character tokens.
  LeftParen, RightParen, LeftBrace, RightBrace,
  Comma, Dot, Minus, Plus, Semicolon, Slash, Star,

  // One or two character tokens.
  Bang, BangEqual, Equal, EqualEqual,
  Greater, GreaterEqual, Less, LessEqual,
```

## 44

```
  // Literals.
  Identifier, String, Number,

  // Keywords.
  And, Class, Else, False, Fun, For, If, Nil, Or,
  Print, Return, Super, This, True, Var, While,

  Eof
}
```

```
export class Token {
  type: TokenType
  lexeme: string
  literal: object
  line: number

  constructor(
    type: TokenType,
    lexeme: string,
    literal: object,
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
```

## 46

```
import { Token } from "./Token"
import { TokenType } from "./TokenType"

export class Scanner {
  private source: string
  private tokens: Token[] = []

  constructor(source: string) {
    this.source = source
  }
}
```

```
  scanTokens() {
    while (!this.isAtEnd()) {
      // We are at the beginning of the next lexeme.
      this.start = this.current
      this.scanToken()
    }

    this.tokens.push(new Token(TokenType.Eof, "", null, this.line))
    return this.tokens
  }
```

```
  private start: number = 0
  private current = 0
  private line = 1
```

## 47

```
  private isAtEnd() {
    return this.current >= this.source.length
  }
```

```
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
    }
  }
```

```
  private advance() {
    return this.source.charAt(this.current++)
  }

  private addToken(type: TokenType, literal: object | null = null) {
    const text = this.source.slice(this.start, this.current)
    this.tokens.push(new Token(type, text, literal, this.line))
  }
```

## 48

```
      default:
        Jevlox.error(this.line, "Unexpected character.")
        break
```

```
      case '!': this.addToken(this.match('=') ? TokenType.BangEqual : TokenType.Bang); break
      case '=': this.addToken(this.match('=') ? TokenType.EqualEqual : TokenType.Equal); break
      case '<': this.addToken(this.match('=') ? TokenType.LessEqual : TokenType.Less); break
      case '>': this.addToken(this.match('=') ? TokenType.GreaterEqual : TokenType.Greater); break
```

## 49

```
  private match(expected: string) {
    if (this.isAtEnd()) return false
    if (this.source.charAt(this.current) !== expected) return false

    this.current += 1
    return true
  }
```

```
      case '/':
        if (this.match('/')) {
          // A comment goes until the end of the line.
          while (this.peek() !== '\n' && !this.isAtEnd()) this.advance()
        }
        else {
          this.addToken(TokenType.Slash)
        }
        break
```

```
  private peek() {
    if (this.isAtEnd()) return '\0'
    return this.source.charAt(this.current)
  }
```

The current plan is to port jlox to TypeScript without much change, except that its syntax tree will be serialized to a Jevko format. This format will also be deserializable.

In parallel I intend to develop Jevlox to something like a minimal human-writable serialization of JavaScript in that it will parse into a tree that should be straightforward to translate into JavaScript.

These should lend themselves nicely to further experiments.

## 50

```
      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace.
        break

      case '\n':
        this.line += 1
        break
```

```
// this is a comment
(( )){} // grouping stuff
!*+-/=<> <= == // operators
```

```
      case '"': this.string(); break
```

---

A list of tokens serialized to a Jevko format could look like this:

```
line comment[ this is a comment]
left paren[] left paren[] space[ ] right paren[] right paren[]
left brace[] right brace[] line comment[ grouping stuff]
bang[] star[] plus[] minus[] slash[] equals[] less[] greater[]
less equal[] equal equal[] line comment[ operators]
```

Or like this, with position information:

```
line comment[
  value[ this is a comment] 
  from[index[0] line[1] column[1]] 
  thru[index[...] ...]
]
left paren[at[index[...] line[...] column[...]]] 
left paren[at[...]] 
space[value[ ] from[...] thru[...]] 
right paren[at[...]] 
right paren[at[...]]
left brace[at[...]] 
right brace[at[...]] 
line comment[value[ grouping stuff] from[...] thru[...]]
bang[at[...]] 
star[at[...]]
plus[at[...]]
minus[at[...]]
slash[at[...]]
equals[at[...]]
less[at[...]]
greater[at[...]]
less equal[at[...] length[2]]
equal equal[at[...] length[2]]
line comment[value[ operators] from[...] thru[...]]
```

## 51

```
  private string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') this.line += 1
      this.advance()
    }

    if (this.isAtEnd()) {
      Jevlox.error(this.line, "Unterminated string.")
      return
    }

    this.advance() // The closing "

    // Trim the surrounding quotes.
    const value = this.source.slice(this.start + 1, this.current - 1)
    this.addToken(TokenType.String, value)
  }
```

```
1234
12.34
```

```
.1234
1234.
```

```
print -123.abs();
```

```
var n = 123;
print -n.abs();
```

---

This is how the above may look like in Jevlox:

```
[1234]
[12.34]
```

```
[.1234]
[1234.]
```

```
/print[-[123].[abs]\[]]
```

```
[n].let[123]
/print[-[n].[abs]\[]]
```

---

This is how Lox AST serialization may look like:

```
/number[1234]
/number[12.34]
/print[
  /call[
    /dot[
      /minus[/number[123]]
      /identifier[abs]
    ]
  ]
]
```

## 52

```
        if (this.isDigit(c)) {
          this.number()
        }
        else {
          Jevlox.error(this.line, "Unexpected character.")
        }
```

```
  private isDigit(c: string) {
    return c >= '0' && c <= '9'
  }
```

```
  private number() {
    while (this.isDigit(this.peek())) this.advance()
    
    // Look for a fractional part.
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance()

      while (this.isDigit(this.peek())) this.advance() 
    }

    this.addToken(
      TokenType.Number, 
      Number.parseFloat(this.source.slice(this.start, this.current)),
    )
  }
```

```
  private peekNext() {
    if (this.current + 1 >= this.source.length) return '\0'
    return this.source.charAt(this.current + 1)
  }
```

## 53

```
case 'o':
  if (this.match('r)) {
    this.addToken(TokenType.Or)
  }
  break
```

```
        else if (this.isAlpha(c)) {
          this.identifier()
        }
```

```
  private identifier() {
    while (this.isAlphaNumeric(this.peek())) this.advance()

    this.addToken(TokenType.Identifier)
  }
```

```
  private isAlpha(c: string) {
    return (c >= 'a' && c <= 'z') ||
           (c >= 'A' && c <= 'Z') ||
            c == '_'
  }
```

## 54

```
  private isAlphaNumeric(c: string) {
    return this.isAlpha(c) || this.isDigit(c)
  }
```

```
  private static keywords = new Map([
    ["and", TokenType.And],
    ["class", TokenType.Class],
    ["else", TokenType.Else],
    ["false", TokenType.False],
    ["for", TokenType.For],
    ["fun", TokenType.Fun],
    ["if", TokenType.If],
    ["nil", TokenType.Nil],
    ["or", TokenType.Or],
    ["print", TokenType.Print],
    ["return", TokenType.Return],
    ["super", TokenType.Super],
    ["this", TokenType.This],
    ["true", TokenType.True],
    ["var", TokenType.Var],
    ["while", TokenType.While],
  ])
```

```
    const text = this.source.slice(this.start, this.current)
    const type = Scanner.keywords.get(text) ?? TokenType.Identifier
    this.addToken(type)
```

## 56

```
if[condition]./[
  return
  ['value]
]
```

```
func
[parenthesized]
```

```
[first]
.-[second]
```

```
[a]./set[1] [b]./set[2]
```

## 57

```
[console].[log]\[function[]./[
  statement[]
]]
```

## 59

```
[1].+[2].*[3].-[4]
```

## 64

```
[1].-[[2].*[3]].<[4].=[false]
```

## 65

```ts
abstract class Expr {}
class Binary extends Expr {
  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left
    this.operator = operator
    this.right = right
  }

  readonly left: Expr
  readonly operator: Token
  readonly right: Expr
}
// Other expressions...
```

## 66

```
import fs from 'node:fs';
```

## 67

```
class GenerateAst {
  static main(args: string[]) {
    if (args.length !== 1) {
      console.error("Usage: generate_ast <output directory>")
      process.exit(64)
    }
    const outputDir = args[0]
  }
}
GenerateAst.main(process.argv.slice(2))
```

```
    this.defineAst(outputDir, "Expr", [
      "Binary   : Expr left, Token operator, Expr right",
      "Grouping : Expr expression",
      "Literal  : Lit value",
      "Unary    : Token operator, Expr right",
    ])
```

```
  private static defineAst(
    outputDir: string,
    baseName: string,
    types: string[],
  ) {
    const path = outputDir + "/" + baseName + ".ts"

    let output = 
`import { Token } from "./Token.js"
import { Literal as Lit } from "./Token.js"

export abstract class ${baseName} {}
`

    fs.writeFileSync(path, output)
  }
```

## 68

```
${(() => {
  let ret = ''
  for (const type of types) {
    const className = type.split(':')[0].trim()
    const fields = type.split(':')[1].trim()
    ret += this.defineType(baseName, className, fields)
  }
  return ret
})()}
`
```

```
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
})()}
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
```

## 69

```
if (expr instanceof Expr.Binary) {
  // ...
}
else if (expr instanceof Expr.Grouping) {
  // ...
}
else {
  // ...
}
```

## 71

```
abstract class Pastry {
}

class Beignet extends Pastry {
}

class Cruller extends Pastry {
}
```

```
interface PastryVisitor {
  visitBeignet(beignet: Beignet): void
  visitCruller(cruller: Cruller): void
}
```

```
abstract accept(visitor: PastryVisitor): void
```

## 72

```
accept(visitor: PastryVisitor): void {
  visitor.visitBeignet(this)
}
```

```
accept(visitor: PastryVisitor): void {
  visitor.visitCruller(this)
}
```

## 73

```
${this.defineVisitor(baseName, types)}
```

```
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
```

```
export abstract class ${baseName} {
  abstract accept<R>(visitor: Visitor<R>): R
}
```

The previous definitions of Expr, etc. should be updated. Maybe later. Maybe never. Anyway GenerateAst.ts and Expr.ts are always up-to-date.

```
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visit${className}${baseName}(this)
  }
```

## 74

```
/star[ /minus[123] /group[45.67] ]
```

```
import * as Expr from './Expr.js'

export class AstPrinter implements Expr.Visitor<string> {
  print(expr: Expr.Expr) {
    return expr.accept(this)
  }
}
```

## 75

```
  visitBinaryExpr(expr: Expr.Binary): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
  }

  visitGroupingExpr(expr: Expr.Grouping): string {
    return this.parenthesize("group", expr.expression)
  }

  visitLiteralExpr(expr: Expr.Literal): string {
    if (expr.value === null) return "nil"
    return expr.value.toString()
  }
  
  visitUnaryExpr(expr: Expr.Unary): string {
    return this.parenthesize(expr.operator.lexeme, expr.right)
  }
```

Parenthesizing to a Jevko format:

```
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
```

```
/plus[ [1] [2] ]
```

## 76

In a separate file, e.g. `runAstPrinter.ts`:

```
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
```

```
/star[ /minus[123] /group[45.67] ]
```

## 85

```
import * as Expr from "./Expr.js"
import { Jevlox } from "./jevlox.js"
import { Token } from "./Token.js"
import { TokenType } from "./TokenType.js"

export class Parser {
  private readonly tokens: Token[]
  private current = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }
}
```

```
  private expression(): Expr.Expr {
    return this.equality()
  }
```

```
  private equality(): Expr.Expr {
    let expr = this.comparison()
    while(this.match(TokenType.BangEqual, TokenType.EqualEqual)) {
      const operator = this.previous()
      const right = this.comparison()
      expr = new Expr.Binary(expr, operator, right)
    }

    return expr
  }
```

## 86

```
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }
    return false
  }
```

```
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false
    return this.peek().type === type
  }
```

```
  private advance() {
    if (!this.isAtEnd()) this.current += 1
    return this.previous()
  }
```

```
  private isAtEnd(): boolean {
    return this.peek().type === TokenType.Eof
  }

  private peek(): Token {
    return this.tokens.at(this.current)
  }

  private previous(): Token {
    return this.tokens.at(this.current - 1)
  }
```

## 87

```
  private comparison(): Expr.Expr {
    let expr = this.term()

    while (this.match(TokenType.Greater, TokenType.GreaterEqual, TokenType.Less, TokenType.LessEqual)) {
      const operator = this.previous()
      const right = this.term()
      expr = new Expr.Binary(expr, operator, right)
    }

    return expr
  }
```

## 88

```
  private term(): Expr.Expr {
    let expr = this.factor()

    while (this.match(TokenType.Minus, TokenType.Plus)) {
      const operator = this.previous()
      const right = this.factor()
      expr = new Expr.Binary(expr, operator, right)
    }

    return expr
  }
```

```
  private factor(): Expr.Expr {
    let expr = this.unary()

    while (this.match(TokenType.Slash, TokenType.Star)) {
      const operator = this.previous()
      const right = this.unary()
      expr = new Expr.Binary(expr, operator, right)
    }

    return expr
  }
```

```
  private unary(): Expr.Expr {
    if (this.match(TokenType.Bang, TokenType.Minus)) {
      const operator = this.previous()
      const right = this.unary()
      return new Expr.Unary(operator, right)
    }

    return this.primary()
  }
```

## 89

```
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
  }
```

## 91

```
  private consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance()

      throw this.error(this.peek(), message)
  }
```

```
  private error(token: Token, message: string): ParseError {
    Jevlox.errorToken(token, message)
    return new ParseError()
  }
```

```
  static errorToken(token: Token, message: string) {
    if (token.type === TokenType.Eof) {
      this.report(token.line, " at end", message)
    }
    else {
      this.report(token.line, ` at '${token.lexeme}'`, message)
    }
  }
```

## 92

At the top of the `Parser.ts` module instead of a static inner class:

```
class ParseError extends Error {}
```

```
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
```

## 93

```
    throw this.error(this.peek(), "Expect expression.")
```

```
  parse(): Expr.Expr {
    try {
      return this.expression()
    }
    catch (error) {
      if (error instanceof ParseError) return null
      throw error
    }
  }
```

## 94

```
    const parser = new Parser(tokens)
    const expression = parser.parse()

    // Stop if there was a syntax error.
    if (this.hadError) return

    console.log(new AstPrinter().print(expression))
```

## 99

```
import assert from 'assert'
import * as Expr from './Expr.js'
import { Literal } from './Token.js'
import { TokenType } from './TokenType.js'

type Value = Literal

export class Interpreter implements Expr.Visitor<Value> {
}
```

```
  visitLiteralExpr(expr: Expr.Literal): Value {
    return expr.value
  }
```

## 100

```
  visitGroupingExpr(expr: Expr.Grouping): Value {
    return this.evaluate(expr.expression)
  }
```

```
  private evaluate(expr: Expr.Expr) {
    return expr.accept(this)
  }
```

```
  visitUnaryExpr(expr: Expr.Unary): Value {
    const right = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.Minus:
        assert(typeof right === 'number')
        return -right
    }

    // Unreachable.
    return null
  }
```

## 101

```
      case TokenType.Bang:
        return !this.isTruthy(right)
```

```
  private isTruthy(value: Value) {
    if (value === null) return false
    if (typeof value === 'boolean') return value
    return true
  }
```

```
  visitBinaryExpr(expr: Expr.Binary): Value {
    const left = this.evaluate(expr.left)
    const right = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.Minus:
        assert(typeof left === 'number' && typeof right === 'number')
        return left - right
      case TokenType.Slash:
```

## 102

```
        assert(typeof left === 'number' && typeof right === 'number')
        return left / right
      case TokenType.Star:
        assert(typeof left === 'number' && typeof right === 'number')
        return left * right
    }

    // Unreachable.
    return null
  }
```

```
      case TokenType.Plus:
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right
        }

        if (typeof left === 'string' && typeof right === 'string') {
          return left + right
        }

        break
```

```
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
```

```
      case TokenType.BangEqual: return !this.isEqual(left, right)
      case TokenType.EqualEqual: return this.isEqual(left, right)
```

## 103


```
  private isEqual(a: Value, b: Value) {
    // note: this is not like in Java:
    return a === b
  }
```

```
[2].*[[3]./[-['muffin]]]
```

## 104

```
        this.checkNumberOperand(expr.operator, right)
```

```
  private checkNumberOperand(operator: Token, operand: Value): asserts operand is number {
    if (typeof operand === 'number') return
    throw new RuntimeError(operator, "Operand must be a number.")
  }
```

```
import { Token } from "./Token.js";

export class RuntimeError extends Error {
  readonly token: Token

  constructor(token: Token, message: string) {
    super(message)
    this.token = token
  }
}
```

## 105


```
        this.checkNumberOperands(expr.operator, left, right)
        return left > (right as number)
```

```
        this.checkNumberOperands(expr.operator, left, right)
        return left >= (right as number)
```

```
        this.checkNumberOperands(expr.operator, left, right)
        return left < (right as number)
```

```
        this.checkNumberOperands(expr.operator, left, right)
        return left <= (right as number)
```

```
        this.checkNumberOperands(expr.operator, left, right)
        return left - (right as number)
```

```
        this.checkNumberOperands(expr.operator, left, right)
        return left / (right as number)
```

```
        this.checkNumberOperands(expr.operator, left, right)
        return left * (right as number)
```

```
  private checkNumberOperands(operator: Token, left: Value, right: Value): asserts left is number {
    if (typeof left === 'number' && typeof right === 'number') return
    throw new RuntimeError(operator, "Operands must be numbers.")
  }
```

TypeScript does not allow type assertions on > 1 value. This is why in the above `right` had to be casted to `number` in all cases.

## 106

```
        throw new RuntimeError(
          expr.operator,
          "Operands must be two numbers or two strings.",
        )
```

```
  interpret(expression: Expr.Expr) {
    try {
      const value = this.evaluate(expression)
      console.log(this.stringify(value))
    }
    catch (error) {
      if (error instanceof RuntimeError) {
        Jevlox.runtimeError(error)
      }
      else throw error
    }
  }
```

```
  private stringify(value: Value): string {
    if (value === null) return 'nil'

    if (typeof value === 'number') {
      let text = value.toString()
      if (text.endsWith(".0")) {
        text = text.slice(0, -2)
      }
      return text
    }

    return value.toString()
  }
```

## 107

```
  static runtimeError(error: RuntimeError) {
    console.error(`${error.message}\n[line ${error.token.line}]`)
    this.hadRuntimeError = true
  }
```

```
  static hadRuntimeError: boolean = false
```

```
    if (this.hadRuntimeError) process.exit(70)
```

## 108

```
  private static readonly interpreter: Interpreter = new Interpreter()
```

```
    this.interpreter.interpret(expression)
```

## 113

```
    this.defineAst(outputDir, "Stmt", [
      "Expression : Expr expression",
      "Print      : Expr expression"
    ], "import { Expr } from './Expr.js'")
```

```
  parse(): Stmt[] {
    const statements: Stmt[] = []
    while (!this.isAtEnd()) {
      statements.push(this.statement())
    }
    return statements
  }
```

## 114

```
  private statement(): Stmt {
    if (this.match(TokenType.Print)) return this.printStatement()

    return this.expressionStatement()
  }
```

```
  private printStatement(): Stmt {
    const value: Expr.Expr = this.expression()
    this.consume(TokenType.Semicolon, "Expect ';' after value.")
    return new Print(value)
  }
```

```
  private expressionStatement(): Stmt {
    const expr = this.expression()
    this.consume(TokenType.Semicolon, "Expect ';' after expression.")
    return new Expression(expr)
  }
```

## 115

```
import * as Stmt from './Stmt.js'
// ...

export class Interpreter implements Expr.Visitor<Value>, Stmt.Visitor<void>
```

```
  visitExpressionStmt(stmt: Stmt.Expression): void {
    this.evaluate(stmt.expression)
    return undefined
  }
```

```
  visitPrintStmt(stmt: Stmt.Print): void {
    const value = this.evaluate(stmt.expression)
    console.log(this.stringify(value))
    return undefined
  }
```

```
  interpret(statements: Stmt.Stmt[]) {
    try {
      for (const statement of statements) {
        this.execute(statement)
      }
    }
    catch (error) {
      if (error instanceof RuntimeError) {
        Jevlox.runtimeError(error)
      }
      else throw error
    }
  }
```

```
  private execute(stmt: Stmt.Stmt) {
    stmt.accept(this)
  }
```

## 116

```
    const statements = parser.parse()
```

```
    this.interpreter.interpret(statements)
```

```
print['one]
print[true]
print[[2].+[1]]
```

```
[beverage].let['espresso]
```

```
/print[beverage]  espresso
```

## 117

```
if[monday]./[/print['Ugh, already?]]
```

```
if[monday]./[[beverage].let['espresso]]
```

## 118

```
      "Var        : Token name, Expr initializer"
```

```
      "Variable : Token name",
```

```
      statements.push(this.declaration())
```

```
  private declaration(): Stmt {
    try {
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
```

## 119

```
  private varDeclaration(): Stmt {
    const name = this.consume(TokenType.Identifier, "Expect variable name.")

    let initializer: Expr.Expr = null
    if (this.match(TokenType.Equal)) {
      initializer = this.expression()
    }

    this.consume(TokenType.Semicolon, "Expect ';' after variable declaration.")
    return new Var(name, initializer)
  }
```

```
    if (this.match(TokenType.Identifier)) {
      return new Expr.Variable(this.previous())
    }
```

## 120

```
import { Value } from "./Interpreter.js";
import { RuntimeError } from "./RuntimeError.js";
import { Token } from "./Token.js";

export class Environment {
  private readonly values = new Map<string, Value>()
}
```

```
  define(name: string, value: Value): void {
    this.values.set(name, value)
  }
```

```
[a].let['before]
/print[a]  "before".
[a].let['after]
print[a]  "after".
```

## 121

```
  get(name: Token): Value {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme)
    }

    throw new RuntimeError(
      name,
      `Undefined variable '${name.lexeme}'.`,
    )
  }
```

```
[isOdd].function[[n]
  if[[n].=[0]]./[return[false]]
  return[isEven[[n].-[1]]]
]

[isEven].function[[n]
  if[[n].=[0]]./[return[true]]
  return[isOdd[[n].-[1]]]
]
```

## 122

```
print[a]
[a].let['too late!]
```

```
  private environment: Environment = new Environment()
```

```
  visitVarStmt(stmt: Stmt.Var): void {
    let value = null
    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer)
    }

    this.environment.define(stmt.name.lexeme, value)
    return null
  }
```

## 123

```
[a].let[]
/print[a]
```

```
  visitVariableExpr(expr: Expr.Variable): Literal {
    return this.environment.get(expr.name)
  }
```

```
[a].let[1]
[b].let[2]
/print[[a].+[b]]
```

## 124

```
[instance].[field]./set['value]
```

```
      "Assign   : Token name, Expr value",
```

```
    return assignment()
```

```
[a].let['before]
[a]./set['value]
```

```
makeList[].[head].[next]./set[node]
```

## 125

```
  private assignment(): Expr.Expr {
    const expr = this.equality()

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
```

```
newPoint[ [x].+[2] [0] ].[y]./set[3]
```

```
newPoint[ [x].+[2] [0] ].[y]
```

```
[a].+[b]./set[c]
```

## 126

```
  visitAssignExpr(expr: Expr.Assign): Literal {
    const value = this.evaluate(expr.value)
    this.environment.assign(expr.name, value)
    return value
  }
```

```
  assign(name: Token, value: Value): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value)
      return
    }

    throw new RuntimeError(
      name,
      `Undefined variable '${name.lexeme}'.`
    )
  }
```

```
[a].let[1]
/print[[a]./set[2]]  "2".
```

## 127

```
[
  [a].let['first]
  /print[a]  "first".
]


[
  [a].let['second]
  /print[a]  "second".
]
```

```
[Saxophone].class[
  play[]  [
    /print['Careless Whisper]
  ]
]

[GolfClub].class[
  play[]  [
    /print['Fore!]
  ]
]

[playIt].function[[thing]
  [thing].[play]\[]
]
```

## 128

```
[
  [a].let['in block]
]
/print[a]  Error! No more "a".
```

```
How loud?
[volume].let[11]

Silence.
[volume]./set[0]

Calculate size of 3x4x5 cuboid.
[
  [volume].let[[3].*[4].*[5]]
  print[volume]
]
```

## 129

```
[global].let['outside]
[
  [local].let['inside]
  /print[[global].+[local]]
]
```

```
  readonly enclosing: Environment | null
```

```
  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing
  }
```

```
    if (this.enclosing !== null) return this.enclosing.get(name)
```

```
    if (this.enclosing !== null) {
      this.enclosing.assign(name, value)
      return
    }
```

```
      "Block      : Stmt[] statements",
```

## 131

```
    if (this.match(TokenType.LeftBrace)) return new Block(this.block())
```

```
  private block(): Stmt[] {
    const statements: Stmt[] = []

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      statements.push(this.declaration())
    }

    this.consume(TokenType.RightBrace, "Expect '}' after block.")
    return statements
  }
```

```
  visitBlockStmt(stmt: Stmt.Block): void {
    this.executeBlock(stmt.statements, new Environment(this.environment))
    return null
  }
```

```
  executeBlock(statements: Stmt.Stmt[], environment: Environment): void {
    const previous = this.environment
    try {
      this.environment = environment

      for (const statement of statements) {
        this.execute(statement)
      }
    }
    finally {
      this.environment = previous
    }
  }
```

## 132

```
[a].let['global a]
[b].let['global b]
[c].let['global c]
[
  [a].let['outer a]
  [b].let['outer b]
  [
    [a].let['inner a]
    /print[a]
    /print[b]
    /print[c]
  ]
  /print[a]
  /print[b]
  /print[c]
]
/print[a]
/print[b]
/print[c]
```

## 133

```
No initializers.
[a].let[]
[b].let[]

[a]./set['assigned]
/print[a]  OK, was assigned first

/print[b]  Error!
```

```
[a].let[1]
[
  [a].let[[a].+[2]]
  /print[a]
]
```

## 139

```
      "If         : Expr condition, Stmt thenBranch, Stmt elseBranch",
```

```
    if (this.match(TokenType.If)) return this.ifStatement()
```

## 140

```
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
```

## 141

```
  visitIfStmt(stmt: Stmt.If): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch)
    }
    else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch)
    }
    return null
  }
```

```
[false].&&[sideEffect[]]
```

or

```
[false]./and[sideEffect[]]
```

## 142

```
      "Logical  : Expr left, Token operator, Expr right",
```

```
    const expr = this.or()
```

```
  private or(): Expr.Expr {
    let expr = this.and()

    while (this.match(TokenType.Or)) {
      const operator: Token = this.previous()
      const right: Expr.Expr = this.and()
      expr = new Expr.Logical(expr, operator, right)
    }

    return expr
  }
```

```
  private and(): Expr.Expr {
    let expr: Expr.Expr = this.equality()

    while (this.match(TokenType.And)) {
      const operator: Token = this.previous()
      const right = this.equality()
      expr = new Expr.Logical(expr, operator, right)
    }

    return expr
  }
```

## 143

```
  visitLogicalExpr(expr: Expr.Logical): Literal {
    const left = this.evaluate(expr.left)

    if (expr.operator.type === TokenType.Or) {
      if (this.isTruthy(left)) return left
    }
    else {
      if (!this.isTruthy(left)) return left
    }

    return this.evaluate(expr.right)
  }
```

```
/print[['hi]./or[2]]  "hi".
/print[[null]./or['yes]]  "yes".
```

## 144

```
      "While      : Expr condition, Stmt body",
```

```
    if (this.match(TokenType.While)) return this.whileStatement()
```

```
  private whileStatement(): Stmt {
    this.consume(TokenType.LeftParen, "Expect '(' after 'while'.")
    const condition = this.expression()
    this.consume(TokenType.RightParen, "Expect ')' after while condition.")
    const body: Stmt = this.statement()
    return new While(condition, body)
  }
```

```
  visitWhileStmt(stmt: Stmt.While): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body)
    }
    return null
  }
```

```
[i].let[0].for[[i].<[10]]./incr[[i]./set[[i].+[1]]]./[/print[i]]
```

## 145

```
[
  [i].let[0]
  [i].<[10].while[
    /print[i]
    [i]./set[[i].+[1]]
  ]
]
```

## 146

```
    if (this.match(TokenType.For)) return this.forStatement()
```

```
  private forStatement() {
    this.consume(TokenType.LeftParen, "Expect '(' after 'for'.")

    // More here...
  }
```

```
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
```

## 147

```
    let condition = null
    if (!this.check(TokenType.Semicolon)) {
      condition = this.expression()
    }
    this.consume(TokenType.Semicolon, "Expect ';' after loop condition.")
```

```
    let increment: Expr.Expr = null
    if (!this.check(TokenType.RightParen)) {
      increment = this.expression()
    }
    this.consume(TokenType.RightParen, "Expect ')' after for clauses.")
```

```
    let body = this.statement()

    return body
```

```
    if (increment !== null) {
      body = new Block([
        body,
        new Expression(increment)
      ])
    }
```

## 148

```
    if (condition === null) condition = new Expr.Literal(true)
    body = new While(condition, body)
```

```
    if (initializer !== null) {
      body = new Block([initializer, body])
    }
```

```
[a].let[0]
[temp].let[]

[b].let[1].for[[a].<[10000]]./incr[[b]./set[[temp].+[b]]]./[
  /print[a]
  [temp]./set[a]
  [a]./set[b]
]
```

## 152

```
average[[1][2]]
```

```
getCallback[]\[]
```

```
      "Call     : Expr callee, Token paren, Expr[] args",
```

```
    return this.call()
```

## 153

```
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
```

```
  private finishCall(callee: Expr.Expr): Expr.Expr {
    const args: Expr.Expr[] = []
    if (!this.check(TokenType.RightParen)) {
      do {
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
```

## 154

```
        if (args.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 arguments.")
        }
```

```
  visitCallExpr(expr: Expr.Call): Value {
    const callee: Value = this.evaluate(expr.callee)

    const args: Value[] = []
    for (const argument of expr.args) {
      args.push(this.evaluate(argument))
    }

    const fun: Callable = callee
    return fun.call(this, args)
  }
```

## 155

```
import { Interpreter, Value } from "./Interpreter.js";

export interface Callable {
  call(interpreter: Interpreter, args: Value[]): Value
}
```

```
['totally not a function]\[]
```

```
    if (!(typeof callee === 'object' && 'call' in callee)) {
      throw new RuntimeError(
        expr.paren,
        "Can only call functions and classes.",
      )
    }
```

## 156

```
[add].function[[a][b][c]]./[
  /print[[a].+[b].+[c]]
]
```

```
add[[1][2][3][4]]  Too many.
add[[1][2]]        Too few.
```

```
    if (args.length != fun.arity()) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${fun.arity()} arguments but got ${args.length}.`
      )
    }
```

```
  arity(): number
```

## 158

2024-10-14: gonna skip the TypeScript/Java/C code snippets, as that is all written under [./jevlox](./jevlox/) (jlox ported to TypeScript) and [./tslox](./tslox/) (clox ported to TypeScript). Just gonna play around with the Lox snippets.

On the margin:

```
[add].const[[[a][b]].function[
  /print[[a].+[b]]
]]
```

## 161

```
[count].function[n]./[
  if[[n].>[1]]./[count[[n].-[1]]]
  /print[n]
]

count[3]
```

## 162

```
[add].function[[a][b][c]]./[
  /print[[a].+[b].+[c]]
]

add[[1][2][3]]
```

## 163

```
[add].function[[a][b]]./[
  /print[[a].+[b]]
]

/print[add]   "<fn add>".
```

```
[sayHi].function[[first][last]]./[
  /print['Hi, [first] [last]!]
]

sayHi[['Dear]['Reader]]
```

## 164

```
[procedure].function[]./[
  /print['don't return anything]
]

[result].const[procedure[]]
/print[result]   ?
```

```
return[null]
```

## 165

```
[count].function[n]./[
  while[[n].<[100]]./[
    if[[n].=[3]]./[return[n]]   <--
    /print[n]
    /set[ [n] [n].+[1] ]
  ]
]

count[1]
```

## 167

```
[fib].function[n]./[
  if[[n].<=[1]]./[return[n]]
  return[[[n].-[2].fib[]].+[[n].-[1].fib[]]]
]

for[ [i].const[0] [i].<[20] [i]./set[[i].+[1]] ]./[
  /print[fib[i]]
]
```

```
[makeCounter].function[]./[
  [i].const[0]
  [count].function[]./[
    [i]./set[[i].+[1]]
    /print[i]
  ]

  return[count]
]

[counter].const[makeCounter[]]
counter[]   "1".
counter[]   "2".
```

## 170

```
[thrice].function[fn]./[
  for[ [i].const[1] [i].<=[3] [i]./set[[i].+[1]] ]./[
    fn[i]
  ]
]

thrice[function[a]./[
  /print[a]
]]

"1".
"2".
"3".
```

```
function[]./[]
```

```
[scope].function[a]./[
  [a].const['local]
]
```

## 172

```
[a].const['outer]
[
  [a].const['inner]
  /print[a]
]
```

```
[a].const['outer]
[
  /print[a]
  [a].const['inner]
]
```

```

[a].const['outer]
[
  [a].const['inner]
  /print[a]
]
```

## 173

```
[a].const['global]
[
  [showA].function[]./[
    /print[a]
  ]

  showA[]
  [a].const['block]
  showA[]
]
```

## 175

```
[
  [a].let[]
  1.
  [b].let[]
  2.
]
```

## 180

```
[a].const['outer]
[
  [a].const[a]
]
```

```
[temp].let[a]     Run the initializer.
[a].let[]         Declare the variable.
[a]./set[temp]    Initialize it.
```

```
[a].let[]    Define the variable.
[a]./set[a]  Run the initializer.
```

## 189

```
[bad].function[]./[
  [a].const['first]
  [a].const['second]
]
```

```
/return['at top level]
```

## 191

```
[a].const['outer]
[
  [a].const[a]
]
```

## 195

```
[Breakfast].class[
  cook[]./[
    /print['Eggs a-fryin'!]
  ]

  serve[who]./[
    /print['Enjoy your breakfast, [who].]
  ]
]
```

## 197

```
[DevonshireCream].class[
  serveOn[]./[
    return['Scones]
  ]
]

/print[DevonshireCream]   Prints "DevonshireCream".
```

```
[Bagel].class[]
Bagel[]
```

## 198

```
[Bagel].class[]
[bagel].const[Bagel[]]

/print[bagel]   Prints "Bagel instance",
```

## 199

```
[someObject].[someProperty]
```

## 201

```
[someObject].[someProperty]./set[value]
```
