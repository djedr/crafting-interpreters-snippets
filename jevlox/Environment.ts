import { Value } from "./Interpreter.js";
import { RuntimeError } from "./RuntimeError.js";
import { Token } from "./Token.js";

export class Environment {
  private readonly values = new Map<string, Value>()

  get(name: Token): Value {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme)
    }

    throw new RuntimeError(
      name,
      `Undefined variable '${name.lexeme}'.`,
    )
  }

  define(name: string, value: Value): void {
    this.values.set(name, value)
  }
}