import { Chunk, OpCode } from "./chunk.js";
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
    case OpCode.OP_ADD:
      return simpleInstruction("OP_ADD", offset)
    case OpCode.OP_SUBTRACT:
      return simpleInstruction("OP_SUBTRACT", offset)
    case OpCode.OP_MULTIPLY:
      return simpleInstruction("OP_MULTIPLY", offset)
    case OpCode.OP_DIVIDE:
      return simpleInstruction("OP_DIVIDE", offset)
    case OpCode.OP_NEGATE:
      return simpleInstruction("OP_NEGATE", offset)
    case OpCode.OP_RETURN:
      return simpleInstruction("OP_RETURN", offset);
    default:
      console.error(`Unknown opcode ${instruction}`, instruction);
      return offset + 1;
  }
}

const simpleInstruction = (name: string, offset: number) => {
  console.log(name)
  return offset + 1
}
