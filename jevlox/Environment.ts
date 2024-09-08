import { Value } from "./Interpreter.js";
import { RuntimeError } from "./RuntimeError.js";
import { Token } from "./Token.js";

export class Environment {
  readonly enclosing: Environment | null
  private readonly values = new Map<string, Value>()

  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing
  }

  get(name: Token): Value {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme)
    }

    if (this.enclosing !== null) return this.enclosing.get(name)

    throw new RuntimeError(
      name,
      `Undefined variable '${name.lexeme}'.`,
    )
  }

  assign(name: Token, value: Value): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value)
      return
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(name, value)
      return
    }

    throw new RuntimeError(
      name,
      `Undefined variable '${name.lexeme}'.`
    )
  }

  define(name: string, value: Value): void {
    this.values.set(name, value)
  }

  ancestor(distance: number): Environment {
    let environment: Environment = this
    for (let i = 0; i < distance; ++i) {
      environment = environment.enclosing
    }

    return environment
  }

  getAt(distance: number, name: string): Value {
    return this.ancestor(distance).values.get(name)
  }

  assignAt(distance: number, name: Token, value: Value): void {
    this.ancestor(distance).values.set(name.lexeme, value)
  }
}