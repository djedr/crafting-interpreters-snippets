import { Callable } from "./Callable.js"
import { Fun } from "./Fun.js"
import { Instance } from "./Instance.js"
import { Interpreter, Value } from "./Interpreter.js"

export class Class implements Callable {
  readonly name: string
  readonly superclass: Class
  private readonly methods: Map<string, Fun>

  constructor(name: string, superclass: Class, methods: Map<string, Fun>) {
    this.superclass = superclass
    this.name = name
    this.methods = methods
  }

  findMethod(name: string): Fun {
    if (this.methods.has(name)) {
      return this.methods.get(name)
    }

    if (this.superclass !== null) {
      return this.superclass.findMethod(name)
    }

    return null
  }

  toString(): string {
    return this.name
  }

  call(interpreter: Interpreter, args: Value[]): Value {
    const instance = new Instance(this)
    const initializer = this.findMethod("init")
    if (initializer !== null) {
      initializer.bind(instance).call(interpreter, args)
    }

    return instance
  }

  arity(): number {
    const initializer = this.findMethod("init")
    if (initializer === null) return 0
    return initializer.arity()
  }
}