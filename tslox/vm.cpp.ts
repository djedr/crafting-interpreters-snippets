import { Chunk, makeChunk, OpCode } from "./chunk.js"
import { Value } from "./common.js";
import { compile } from "./compiler.js";
import { disassembleInstruction } from "./debug.js";
import { printValue } from "./value.js";
/* eslint-disable */
#include "common.h" // eslint-disable-line

const STACK_MAX = 256

interface Vm {
  chunk: Chunk;
  ip: number;
  stack: Value[];
  stackTop: number;
}

enum InterpretResult {
  INTERPRET_OK,
  INTERPRET_COMPILE_ERROR,
  INTERPRET_RUNTIME_ERROR,
}

export const vm: Vm = {
  // dummy chunk to calm down typescript
  chunk: makeChunk(),
  ip: 0,
  stack: Array(STACK_MAX).fill(0),
  stackTop: 0,
}

const resetStack = () => {
  vm.stackTop = 0
}

export const initVm = () => {
  resetStack()
}

export const freeVm = () => {

}

export const push = (value: Value) => {
  vm.stack[vm.stackTop] = value
  vm.stackTop += 1
}

export const pop = () => {
  vm.stackTop -= 1
  return vm.stack[vm.stackTop]
}

const READ_BYTE = () => {
  return vm.chunk.code[vm.ip++]
}
const READ_CONSTANT = () => {
 return vm.chunk.constants[READ_BYTE()]
}
#define BINARY_OP(op) \
  do { \
    const b = pop(); \
    const a = pop(); \
    push(a op b); \
  } while (false)
const run = (): InterpretResult => {
  for (;;) {
#ifdef DEBUG_TRACE_EXECUTION
    process.stdout.write("        ")
    for (let i = 0; i < vm.stackTop; ++i) {
      process.stdout.write("[ ")
      printValue(vm.stack[i])
      process.stdout.write(" ]")
    }
    console.log()
    disassembleInstruction(vm.chunk, vm.ip)
#endif
    let instruction: number
    switch (instruction = READ_BYTE()) {
      case OpCode.OP_CONSTANT: {
        const constant: Value = READ_CONSTANT()
        push(constant)
        break
      }
      case OpCode.OP_ADD:      BINARY_OP(+); break
      case OpCode.OP_SUBTRACT: BINARY_OP(-); break
      case OpCode.OP_MULTIPLY: BINARY_OP(*); break
      case OpCode.OP_DIVIDE:   BINARY_OP(/); break
      case OpCode.OP_NEGATE: push(-pop()); break
      case OpCode.OP_RETURN: {
        printValue(pop())
        console.log()
        return InterpretResult.INTERPRET_OK
      }
    }
  }
}

export const interpret = (source: string): InterpretResult => {
  const chunk = makeChunk()

  if (!compile(source, chunk)) {
    // freeChunk(chunk)
    return InterpretResult.INTERPRET_COMPILE_ERROR
  }

  vm.chunk = chunk
  vm.ip = 0

  const result = run()

  // freeChunk(chunk)
  return result
}