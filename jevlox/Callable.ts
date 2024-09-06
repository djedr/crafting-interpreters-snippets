import { Interpreter, Value } from "./Interpreter.js";

export interface Callable {
  arity(): number
  call(interpreter: Interpreter, args: Value[]): Value
}