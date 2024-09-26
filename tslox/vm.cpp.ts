import { Chunk, makeChunk, OpCode } from "./chunk.js"
import { Value, valuesEqual } from "./value.js";
import { compile } from "./compiler.js";
import { disassembleInstruction } from "./debug.js";
import { printValue } from "./value.js";
import { ObjString, ObjType, isObjType, Obj, takeString, ObjFun } from "./object.js";
import { freeObjects } from "./memory.js";
import { Table, tableDelete, tableGet, tableSet } from "./table.js";
import { freeTable, makeTable } from "./table.js";

#include "common.h"
#include "value.h"
#include "object.h"

const FRAMES_MAX = 64
const STACK_MAX = FRAMES_MAX * UINT8_COUNT

interface CallFrame {
  fun: ObjFun;
  ip: number;
  slots: Value[];
}

interface Vm {
  frames: CallFrame[];
  frameCount: number;

  stack: Value[];
  stackTop: number;
  globals: Table;
  strings: Table;
  objects: Obj;
}

enum InterpretResult {
  INTERPRET_OK,
  INTERPRET_COMPILE_ERROR,
  INTERPRET_RUNTIME_ERROR,
}

export const vm: Vm = {
  frames: [],
  frameCount: 0,
  stack: Array(STACK_MAX).fill(0),
  stackTop: 0,
  globals: null,
  strings: null,
  objects: null,
}

const resetStack = () => {
  vm.stackTop = 0
  vm.frameCount = 0
}

const runtimeError = (...args: string[]) => {
  console.error(...args)

  const frame: CallFrame = vm.frames[vm.frameCount - 1]
  const instruction = frame.ip - 1
  const line = frame.fun.chunk.lines[instruction]
  console.error(`[line ${line}] in script`)
  resetStack()
}

const makeFrames = (): CallFrame[] => {
  return Array.from({length: FRAMES_MAX}).map(() => ({
    fun: null,
    ip: 0,
    slots: [],
  }))
}


export const initVm = () => {
  resetStack()
  vm.frames = makeFrames()
  vm.objects = null
  vm.globals = makeTable()
  vm.strings = makeTable()
}

export const freeVm = () => {
  freeTable(vm.globals)
  freeTable(vm.strings)
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
  const frame: CallFrame = vm.frames[vm.frameCount - 1]

#define READ_BYTE() (frame.fun.chunk.code[frame.ip++])

#define READ_SHORT() \
  (frame.ip += 2, \
    ((frame.fun.chunk.code[frame.ip - 2] << 8) | \
    frame.fun.chunk.code[frame.ip - 1]))

#define READ_CONSTANT() \
    (frame.fun.chunk.constants[READ_BYTE()])

#define READ_STRING() AS_STRING(READ_CONSTANT())

  for (;;) {
#ifdef DEBUG_TRACE_EXECUTION
    process.stdout.write("        ")
    for (let i = 0; i < vm.stackTop; ++i) {
      process.stdout.write("[ ")
      printValue(vm.stack[i])
      process.stdout.write(" ]")
    }
    console.log()
    disassembleInstruction(
      frame.fun.chunk,
      frame.ip,
    )
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
      case OpCode.OP_POP: pop(); break
      case OpCode.OP_GET_LOCAL: {
        const slot = READ_BYTE()
        push(frame.slots[slot])
        break
      }
      case OpCode.OP_SET_LOCAL: {
        const slot = READ_BYTE()
        frame.slots[slot] = peek(0)
        break
      }
      case OpCode.OP_GET_GLOBAL: {
        const name: ObjString = READ_STRING()
        const value = tableGet(vm.globals, name)
        if (value === undefined) {
          runtimeError(`Undefined variable '${name.chars}'.`)
          return InterpretResult.INTERPRET_RUNTIME_ERROR
        }
        push(value)
        break
      }
      case OpCode.OP_DEFINE_GLOBAL: {
        const name: ObjString = READ_STRING()
        tableSet(vm.globals, name, peek(0))
        pop()
        break
      }
      case OpCode.OP_SET_GLOBAL: {
        const name: ObjString = READ_STRING()
        if (tableSet(vm.globals, name, peek(0))) {
          tableDelete(vm.globals, name)
          runtimeError(`Undefined variable '${name.chars}'.`)
          return InterpretResult.INTERPRET_RUNTIME_ERROR
        }
        break
      }
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
      case OpCode.OP_PRINT: {
        printValue(pop())
        console.log()
        break
      }
      case OpCode.OP_JUMP: {
        const offset = READ_SHORT()
        frame.ip += offset
        break
      }
      case OpCode.OP_JUMP_IF_FALSE: {
        const offset = READ_SHORT()
        if (isFalsey(peek(0))) frame.ip += offset
        break
      }
      case OpCode.OP_LOOP: {
        const offset = READ_SHORT()
        frame.ip -= offset
        break
      }
      case OpCode.OP_RETURN: {
        // Exit interpreter.
        return InterpretResult.INTERPRET_OK
      }
    }
  }
}

export const interpret = (source: string): InterpretResult => {
  const fun: ObjFun = compile(source)
  if (fun === null) return InterpretResult.INTERPRET_COMPILE_ERROR

  push(OBJ_VAL(fun))
  const frame: CallFrame = vm.frames[vm.frameCount++]
  frame.fun = fun
  // todo: maybe frame should have it's own .code pointer
  frame.ip = 0
  frame.slots = vm.stack

  return run()
}