import { Chunk, makeChunk, OpCode } from "./chunk.js"
import { Value, valuesEqual } from "./value.js";
import { compile } from "./compiler.js";
import { disassembleInstruction } from "./debug.js";
import { printValue } from "./value.js";
import { ObjString, ObjType, isObjType, Obj, takeString } from "./object.js";
import { freeObjects } from "./memory.js";

#include "common.h"
#include "value.h"
#include "object.h"

const STACK_MAX = 256

interface Vm {
  chunk: Chunk;
  ip: number;
  stack: Value[];
  stackTop: number;
  objects: Obj;
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
  objects: null,
}

const resetStack = () => {
  vm.stackTop = 0
}

const runtimeError = (...args: string[]) => {
  console.error(...args)

  const instruction = vm.ip - 1
  const line = vm.chunk.lines[instruction]
  console.error(`[line ${line}] in script`)
  resetStack()
}

export const initVm = () => {
  resetStack()
  vm.objects = null
}

export const freeVm = () => {
  freeObjects()
}

export const push = (value: Value) => {
  vm.stack[vm.stackTop] = value
  vm.stackTop += 1
}

export const pop = () => {
  vm.stackTop -= 1
  return vm.stack[vm.stackTop]
}

const peek = (distance: number): Value => {
  return vm.stack[vm.stackTop - 1 - distance]
}

const isFalsey = (value: Value): boolean => {
  return IS_NIL(value) || (IS_BOOL(value) && !AS_BOOL(value))
}

const concatenate = () => {
  const b = AS_STRING(pop())
  const a = AS_STRING(pop())

  const length = a.length + b.length
  const chars = a.chars + b.chars
  const result: ObjString = takeString(chars, length)
  push(OBJ_VAL(result))
}

const READ_BYTE = () => {
  return vm.chunk.code[vm.ip++]
}
const READ_CONSTANT = () => {
 return vm.chunk.constants[READ_BYTE()]
}
#define BINARY_OP(valueType, op) \
  do { \
    if (!IS_NUMBER(peek(0)) || !IS_NUMBER(peek(1))) { \
      runtimeError("Operands must be numbers."); \
      return InterpretResult.INTERPRET_RUNTIME_ERROR; \
    } \
    const b = AS_NUMBER(pop()); \
    const a = AS_NUMBER(pop()); \
    push(valueType(a op b)); \
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
      case OpCode.OP_NIL:   push(NIL_VAL); break
      case OpCode.OP_TRUE:  push(BOOL_VAL(true)); break
      case OpCode.OP_FALSE: push(BOOL_VAL(false)); break
      case OpCode.OP_EQUAL: {
        const b = pop()
        const a = pop()
        push(BOOL_VAL(valuesEqual(a, b)))
        break
      }
      case OpCode.OP_GREATER:  BINARY_OP(BOOL_VAL, >); break
      // to prevent vscode syntax highlighting from completely breaking:
      #define LT <
      case OpCode.OP_LESS:     BINARY_OP(BOOL_VAL, LT); break
      #undef LT
      case OpCode.OP_ADD: {
        if (IS_STRING(peek(0)) && IS_STRING(peek(1))) {
          concatenate()
        }
        else if (IS_NUMBER(peek(0)) && IS_NUMBER(peek(1))) {
          const b = AS_NUMBER(pop())
          const a = AS_NUMBER(pop())
          push(NUMBER_VAL(a + b))
        }
        else {
          runtimeError(
            "Operands must be two numbers or two strings.",
          )
          return InterpretResult.INTERPRET_RUNTIME_ERROR
        }
        break
      }
      case OpCode.OP_SUBTRACT: BINARY_OP(NUMBER_VAL, -); break
      case OpCode.OP_MULTIPLY: BINARY_OP(NUMBER_VAL, *); break
      case OpCode.OP_DIVIDE:   BINARY_OP(NUMBER_VAL, /); break
      case OpCode.OP_NOT:
        push(BOOL_VAL(isFalsey(pop())))
        break
      case OpCode.OP_NEGATE: 
        if (!IS_NUMBER(peek(0))) {
          runtimeError("Operand must be a number.")
          return InterpretResult.INTERPRET_RUNTIME_ERROR
        }
        push(NUMBER_VAL(-AS_NUMBER(pop()))) 
        break
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