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
