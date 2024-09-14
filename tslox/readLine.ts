import * as readline from 'node:readline';
import { interpret } from './vm.js';

// workaround for a bug in readline: https://github.com/nodejs/node/issues/53497
export const readLine = (() => {
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

// export class Jevlox {
  
//   static async main(args: string[]) {
//     if (args.length > 1) {
//       console.log('Usage: jevlox [script]')
//       process.exit(64)
//     }
//     else if (args.length === 1) {
//       Jevlox.runFile(args[0])
//     }
//     else {
//       await Jevlox.runPrompt()
//     }
//   }


//   private static run(source: string) {
//     const scanner = new Scanner(source)
//     const tokens = scanner.scanTokens()
//     const parser = new Parser(tokens)
//     const statements = parser.parse()

//     // Stop if there was a syntax error.
//     if (this.hadError) return

//     const resolver: Resolver = new Resolver(this.interpreter)
//     resolver.resolve(statements)

//     // Stop if there was a resolution error.
//     if (this.hadError) return

//     this.interpreter.interpret(statements)
//   }

//   static error(line: number, message: string) {
//     Jevlox.report(line, "", message)
//   }

//   private static report(line: number, where: string, message: string) {
//     console.error(`[line ${line}] Error${where}: ${message}`)
//     Jevlox.hadError = true
//   }

//   static errorToken(token: Token, message: string) {
//     if (token.type === TokenType.Eof) {
//       this.report(token.line, " at end", message)
//     }
//     else {
//       this.report(token.line, ` at '${token.lexeme}'`, message)
//     }
//   }

//   static runtimeError(error: RuntimeError) {
//     console.error(`${error.message}\n[line ${error.token.line}]`)
//     this.hadRuntimeError = true
//   }
// }
