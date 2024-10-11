import { Chunk, OpCode } from "./chunk.js";
import { ObjFun, Obj } from "./object.js";
import { printValue } from "./value.js";











export const disassembleChunk = (chunk: Chunk, name: string) => {
  console.log(`== ${name} ==`)
  for (let offset = 0; offset < chunk.count;) {
    offset = disassembleInstruction(chunk, offset)
  }
}

const constantInstruction = (name: string, chunk: Chunk, offset: number): number => {
  const constant = chunk.code[offset + 1]
  // todo: format
  process.stdout.write(`${name.padEnd(16)} ${constant.toString().padStart(4)} '`)
  printValue(chunk.constants[constant])
  console.log("'")
  return offset + 2
}

const invokeInstruction = (name: string, chunk: Chunk, offset: number): number => {
  const constant = chunk.code[offset + 1]
  const argCount = chunk.code[offset + 2]
  process.stdout.write(`${name.padEnd(16)} (${argCount} args) ${constant.toString().padStart(4)} '`)
  printValue(chunk.constants[constant])
  console.log("'")
  return offset + 3
}

export const disassembleInstruction = (chunk: Chunk, offset: number) => {
  process.stdout.write(offset.toString().padStart(4, '0') + ' ')
  if (offset > 0 && chunk.lines[offset] === chunk.lines[offset - 1]) {
    process.stdout.write('   | ')
  }
  else {
    process.stdout.write(`${chunk.lines[offset].toString().padStart(4)} `)
  }
  
  const instruction = chunk.code[offset]
  
  switch (instruction) {
    case OpCode.OP_CONSTANT:
      return constantInstruction("OP_CONSTANT", chunk, offset)
    case OpCode.OP_NIL:
      return simpleInstruction("OP_NIL", offset)
    case OpCode.OP_TRUE:
      return simpleInstruction("OP_TRUE", offset)
    case OpCode.OP_FALSE:
      return simpleInstruction("OP_FALSE", offset)
    case OpCode.OP_GET_LOCAL:
      return byteInstruction("OP_GET_LOCAL", chunk, offset)
    case OpCode.OP_SET_LOCAL:
      return byteInstruction("OP_SET_LOCAL", chunk, offset)
    case OpCode.OP_GET_GLOBAL:
      return constantInstruction("OP_GET_GLOBAL", chunk, offset)
    case OpCode.OP_DEFINE_GLOBAL:
      return constantInstruction("OP_DEFINE_GLOBAL", chunk, offset)
    case OpCode.OP_SET_GLOBAL:
      return constantInstruction("OP_SET_GLOBAL", chunk, offset)
    case OpCode.OP_GET_UPVALUE:
      return byteInstruction("OP_GET_UPVALUE", chunk, offset)
    case OpCode.OP_SET_UPVALUE:
      return byteInstruction("OP_SET_UPVALUE", chunk, offset)
    case OpCode.OP_GET_PROPERTY:
      return constantInstruction("OP_GET_PROPERTY", chunk, offset)
    case OpCode.OP_SET_PROPERTY:
      return constantInstruction("OP_SET_PROPERTY", chunk, offset)
    case OpCode.OP_EQUAL:
      return simpleInstruction("OP_EQUAL", offset)
    case OpCode.OP_POP:
      return simpleInstruction("OP_POP", offset)
    case OpCode.OP_GREATER:
      return simpleInstruction("OP_GREATER", offset)
    case OpCode.OP_LESS:
      return simpleInstruction("OP_LESS", offset)
    case OpCode.OP_ADD:
      return simpleInstruction("OP_ADD", offset)
    case OpCode.OP_SUBTRACT:
      return simpleInstruction("OP_SUBTRACT", offset)
    case OpCode.OP_MULTIPLY:
      return simpleInstruction("OP_MULTIPLY", offset)
    case OpCode.OP_DIVIDE:
      return simpleInstruction("OP_DIVIDE", offset)
    case OpCode.OP_NOT:
      return simpleInstruction("OP_NOT", offset)
    case OpCode.OP_NEGATE:
      return simpleInstruction("OP_NEGATE", offset)
    case OpCode.OP_PRINT:
      return simpleInstruction("OP_PRINT", offset)
    case OpCode.OP_JUMP:
      return jumpInstruction("OP_JUMP", 1, chunk, offset)
    case OpCode.OP_JUMP_IF_FALSE:
      return jumpInstruction("OP_JUMP_IF_FALSE", 1, chunk, offset)
    case OpCode.OP_LOOP:
      return jumpInstruction("OP_LOOP", -1, chunk, offset)
    case OpCode.OP_CALL:
      return byteInstruction("OP_CALL", chunk, offset)
    case OpCode.OP_INVOKE:
      return invokeInstruction("OP_INVOKE", chunk, offset)
    case OpCode.OP_CLOSURE: {
      offset += 1
      const constant = chunk.code[offset++]
      process.stdout.write(`${"OP_CLOSURE".padEnd(16)} ${constant.toString().padStart(4)} `)
      printValue(chunk.constants[constant])
      console.log()

      const fun: ObjFun = (((chunk.constants[constant]) as Obj) as ObjFun)
      for (let j = 0; j < fun.upvalueCount; ++j) {
        const isLocal = chunk.code[offset++]
        const index = chunk.code[offset++]
        console.log(`${(offset - 2).toString().padStart(4, '0')}      |                     ${isLocal ? "local" : "upvalue"} ${index}`)
      }

      return offset
    }
    case OpCode.OP_CLOSE_UPVALUE:
      return simpleInstruction("OP_CLOSE_UPVALUE", offset)
    case OpCode.OP_RETURN:
      return simpleInstruction("OP_RETURN", offset)
    case OpCode.OP_CLASS:
      return constantInstruction("OP_CLASS", chunk, offset)
    case OpCode.OP_METHOD:
      return constantInstruction("OP_METHOD", chunk, offset)
    default:
      console.error(`Unknown opcode ${instruction}`, instruction);
      return offset + 1;
  }
}

const simpleInstruction = (name: string, offset: number) => {
  console.log(name)
  return offset + 1
}

const byteInstruction = (name: string, chunk: Chunk, offset: number) => {
  const slot = chunk.code[offset + 1]
  console.log(`${name.padEnd(16)} ${slot.toString().padStart(4)}`)
  return offset + 2
}

const jumpInstruction = (name: string, sign: number, chunk: Chunk, offset: number) => {
  let jump = chunk.code[offset + 1] << 8
  jump |= chunk.code[offset + 2]
  console.log(`${name.padEnd(16)} ${offset.toString().padStart(4)} -> ${offset + 3 + sign * jump}`)
  return offset + 3
}
