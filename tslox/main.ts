import { addConstant, freeChunk, makeChunk, OpCode, writeChunk } from "./chunk.js"
import { freeVm, initVm, interpret } from "./vm.js"

initVm()

const chunk = makeChunk()

let constant = addConstant(chunk, 1.2)
writeChunk(chunk, OpCode.OP_CONSTANT, 123)
writeChunk(chunk, constant, 123)

constant = addConstant(chunk, 3.4)
writeChunk(chunk, OpCode.OP_CONSTANT, 123)
writeChunk(chunk, constant, 123)

writeChunk(chunk, OpCode.OP_ADD, 123)

constant = addConstant(chunk, 5.6)
writeChunk(chunk, OpCode.OP_CONSTANT, 123)
writeChunk(chunk, constant, 123)

writeChunk(chunk, OpCode.OP_DIVIDE, 123)
writeChunk(chunk, OpCode.OP_NEGATE, 123)

writeChunk(chunk, OpCode.OP_RETURN, 123)
interpret(chunk)
// freeVm()
// freeChunk(chunk)