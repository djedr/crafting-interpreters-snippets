import { Value } from "./Interpreter.js";

export class Return extends Error {
  readonly value: Value

  constructor(value: Value) {
    super()
    this.value = value
  }
}