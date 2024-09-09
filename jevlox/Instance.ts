import { Class } from "./Class.js";
import { Value } from "./Interpreter.js";
import { RuntimeError } from "./RuntimeError.js";
import { Token } from "./Token.js";

export class Instance {
  private klass: Class
  private readonly fields: Map<string, Value> = new Map()

  constructor(klass: Class) {
    this.klass = klass
  }

  get(name: Token) {
    if (this.fields.has(name.lexeme)) {
      return this.fields.get(name.lexeme)
    }

    const method = this.klass.findMethod(name.lexeme)
    if (method !== null) return method.bind(this)

    throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`)
  }

  set(name: Token, value: Value) {
    this.fields.set(name.lexeme, value)
  }

  toString(): string {
    return `${this.klass.name} instance`
  }
}