import { initScanner, scanToken, TokenType } from "./scanner.js"

export const compile = (source: string) => {
  initScanner(source)
  let line = -1
  for (;;) {
    const token = scanToken()
    if (token.line !== line) {
      process.stdout.write(`${token.line.toString().padStart(4)} `)
      line = token.line
    }
    else {
      process.stdout.write('   | ')
    }
    console.log(`${token.type.toString().padStart(2)} '${token.source.slice(token.start, token.start + token.length)}'`)

    if (token.type === TokenType.EOF) break
  }
}