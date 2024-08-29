import * as fs from 'node:fs'

import * as readline from 'node:readline';
import { Scanner } from './Scanner.js';
import { Token } from './Token.js';
import { TokenType } from './TokenType.js';
import { Parser } from './Parser.js';
import { RuntimeError } from './RuntimeError.js';
import { Interpreter } from './Interpreter.js';

// workaround for a bug in readline: https://github.com/nodejs/node/issues/53497
const readLine = (() => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  let _reject = (reason) => {}
  rl.on('close', () => _reject('close'))
  return () => new Promise((resolve, reject) => {
    _reject = reject
    rl.question('> ', resolve)
  }).catch((e) => {
    console.error('interrupted', e)
    return null
  }) as Promise<string | null>
})()

export class Jevlox {
  private static readonly interpreter: Interpreter = new Interpreter()
  static hadError: boolean = false
  static hadRuntimeError: boolean = false

  static async main(args: string[]) {
    if (args.length > 1) {
      console.log('Usage: jevlox [script]')
      process.exit(64)
    }
    else if (args.length === 1) {
      Jevlox.runFile(args[0])
    }
    else {
      await Jevlox.runPrompt()
    }
  }

  private static runFile(path: string) {
    Jevlox.run(fs.readFileSync(path, 'utf8'))

    // Indicate an error in the exit code
    if (this.hadError) process.exit(65)
    if (this.hadRuntimeError) process.exit(70)
  }

  private static async runPrompt() {
    for (;;) {
      const line = await readLine()
      if (line === null) break
      this.run(line)
      this.hadError = false
    }
  }

  private static run(source: string) {
    const scanner = new Scanner(source)
    const tokens = scanner.scanTokens()
    const parser = new Parser(tokens)
    const statements = parser.parse()

    // Stop if there was a syntax error.
    if (this.hadError) return

    this.interpreter.interpret(statements)
  }

  static error(line: number, message: string) {
    Jevlox.report(line, "", message)
  }

  private static report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error${where}: ${message}`)
    Jevlox.hadError = true
  }

  static errorToken(token: Token, message: string) {
    if (token.type === TokenType.Eof) {
      this.report(token.line, " at end", message)
    }
    else {
      this.report(token.line, ` at '${token.lexeme}'`, message)
    }
  }

  static runtimeError(error: RuntimeError) {
    console.error(`${error.message}\n[line ${error.token.line}]`)
    this.hadRuntimeError = true
  }
}
