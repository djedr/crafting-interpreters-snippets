import { Callable } from "./Callable.js";
import { Environment } from "./Environment.js";
import { Interpreter, Value } from "./Interpreter.js";
import { Return } from "./Return.js";
import * as Stmt from './Stmt.js'

export class Fun implements Callable {
  private readonly declaration: Stmt.Fun
  private readonly closure: Environment

  constructor(declaration: Stmt.Fun, closure: Environment) {
    this.closure = closure
    this.declaration = declaration
  }
  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`
  }
  arity(): number {
    return this.declaration.params.length
  }
  call(interpreter: Interpreter, args: Value[]): Value {
    const environment: Environment = new Environment(this.closure)
    for (let i = 0; i < this.declaration.params.length; ++i) {
      environment.define(
        this.declaration.params.at(i).lexeme,
        args.at(i),
      )
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment)
    }
    catch (e) {
      if (e instanceof Return) {
        return e.value
      }
      throw e
    }
    return null
  }
}