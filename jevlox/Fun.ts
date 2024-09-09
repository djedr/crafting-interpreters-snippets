import { Callable } from "./Callable.js";
import { Environment } from "./Environment.js";
import { Instance } from "./Instance.js";
import { Interpreter, Value } from "./Interpreter.js";
import { Return } from "./Return.js";
import * as Stmt from './Stmt.js'

export class Fun implements Callable {
  private readonly declaration: Stmt.Fun
  private readonly closure: Environment

  private readonly isInitializer: boolean

  constructor(declaration: Stmt.Fun, closure: Environment, isInitializer: boolean) {
    this.isInitializer = isInitializer
    this.closure = closure
    this.declaration = declaration
  }
  bind(instance: Instance): Fun {
    const environment = new Environment(this.closure)
    environment.define("this", instance)
    return new Fun(this.declaration, environment, this.isInitializer)
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
        if (this.isInitializer) return this.closure.getAt(0, "this")

        return e.value
      }
      throw e
    }

    if (this.isInitializer) return this.closure.getAt(0, "this")
    return null
  }
}