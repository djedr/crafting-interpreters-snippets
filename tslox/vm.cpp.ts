import { Chunk, makeChunk, OpCode } from "./chunk.js"
import { Value, valuesEqual } from "./value.js";
import { compile } from "./compiler.js";
import { disassembleInstruction } from "./debug.js";
import { printValue } from "./value.js";
import { ObjString, ObjType, isObjType, Obj, takeString, ObjFun, IS_OBJ, NativeFn, copyString, newNative, ObjNative, ObjClosure, newClosure } from "./object.js";
import { freeObjects } from "./memory.js";
import { Table, tableDelete, tableGet, tableSet } from "./table.js";
import { freeTable, makeTable } from "./table.js";

#include "common.h"
#include "value.h"
#include "object.h"

const FRAMES_MAX = 64
const STACK_MAX = FRAMES_MAX * UINT8_COUNT

interface CallFrame {
  closure: ObjClosure;
  ip: number;
  slotsIndex: number;
  // slots: Value[];
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

const clockNative = (argCount: number, args: Value[]): Value => {
  return NUMBER_VAL(Date.now() / 1000)
}

const resetStack = () => {
  vm.stackTop = 0
  vm.frameCount = 0
}

const runtimeError = (...args: string[]) => {
  console.error(...args)

  for (let i = vm.frameCount - 1; i >= 0; --i) {
    const frame: CallFrame = vm.frames[i]
    const fun: ObjFun = frame.closure.fun
    const instruction = frame.ip - 1
    process.stderr.write(`[line ${fun.chunk.lines[instruction]}] in `)
    if (fun.name === null) {
      process.stderr.write(`script\n`)
    }
    else {
      process.stderr.write(`${fun.name.chars}()\n`)
    }
  }

  resetStack()
}

const defineNative = (name: string, fun: NativeFn) => {
  push(OBJ_VAL(copyString(name, 0, name.length)))
  push(OBJ_VAL(newNative(fun)))
  tableSet(vm.globals, AS_STRING(vm.stack[0]), vm.stack[1])
  pop()
  pop()
}

const makeFrames = (): CallFrame[] => {
  return Array.from({length: FRAMES_MAX}).map(() => ({
    closure: null,
    ip: 0,
    slotsIndex: 0,
    // slots: [],
  }))
}


export const initVm = () => {
  resetStack()
  vm.frames = makeFrames()
  vm.objects = null
  vm.globals = makeTable()
  vm.strings = makeTable()

  defineNative("clock", clockNative)
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

const call = (closure: ObjClosure, argCount: number): boolean => {
  if (argCount !== closure.fun.arity) {
    runtimeError(`Expected ${closure.fun.arity} arguments but got ${argCount}.`)
    return false
  }

  if (vm.frameCount === FRAMES_MAX) {
    runtimeError("Stack overflow.")
    return false
  }

  const frame: CallFrame = vm.frames[vm.frameCount++]
  frame.closure = closure
  // todo: maybe frame should have it's own .code pointer
  frame.ip = 0
  // note: slots is supposed to b a window into stack
  // frame.slots = vm.stackTop - argCount - 1
  frame.slotsIndex = vm.stackTop - argCount - 1
  return true
}

const callValue = (callee: Value, argCount: number): boolean => {
  if (IS_OBJ(callee)) {
    switch (OBJ_TYPE(callee)) {
      case ObjType.CLOSURE:
        return call(AS_CLOSURE(callee), argCount)
      case ObjType.NATIVE: {
        const native: NativeFn = AS_NATIVE(callee)
        // todo: make sure this slice is ok
        // todo2: better way?
        const args = vm.stack.slice(vm.stackTop, -argCount)
        const result: Value = native(argCount, args)
        vm.stackTop -= argCount + 1
        push(result)
        return true
      }
      default:
        break // Non-callable object type
    }
  }
  runtimeError("Can only call functions and classes.")
  return false
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
  let frame: CallFrame = vm.frames[vm.frameCount - 1]

#define READ_BYTE() (frame.closure.fun.chunk.code[frame.ip++])

#define READ_SHORT() \
  (frame.ip += 2, \
    ((frame.closure.fun.chunk.code[frame.ip - 2] << 8) | \
    frame.closure.fun.chunk.code[frame.ip - 1]))

#define READ_CONSTANT() \
    (frame.closure.fun.chunk.constants[READ_BYTE()])

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
      frame.closure.fun.chunk,
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
        push(vm.stack[frame.slotsIndex + slot])
        // push(frame.slots[slot])
        break
      }
      case OpCode.OP_SET_LOCAL: {
        const slot = READ_BYTE()
        vm.stack[frame.slotsIndex + slot] = peek(0)
        // frame.slots[slot] = peek(0)
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
      case OpCode.OP_CALL: {
        const argCount = READ_BYTE()
        if (!callValue(peek(argCount), argCount)) {
          return InterpretResult.INTERPRET_RUNTIME_ERROR
        }
        frame = vm.frames[vm.frameCount - 1]
        break
      }
      case OpCode.OP_CLOSURE: {
        const fun: ObjFun = AS_FUN(READ_CONSTANT())
        const closure: ObjClosure = newClosure(fun)
        push(OBJ_VAL(closure))
        break
      }
      case OpCode.OP_RETURN: {
        const result: Value = pop()
        vm.frameCount--
        if (vm.frameCount === 0) {
          pop()
          return InterpretResult.INTERPRET_OK
        }

        vm.stackTop = frame.slotsIndex
        push(result)
        frame = vm.frames[vm.frameCount - 1]
        break
      }
    }
  }
}

export const interpret = (source: string): InterpretResult => {
  const fun: ObjFun = compile(source)
  if (fun === null) return InterpretResult.INTERPRET_COMPILE_ERROR

  push(OBJ_VAL(fun))
  const closure: ObjClosure = newClosure(fun)
  pop()
  push(OBJ_VAL(closure))
  call(closure, 0)

  return run()
}