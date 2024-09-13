import { addConstant, makeChunk, OpCode, writeChunk } from "./chunk.js"
import { disassembleChunk } from "./debug.js"

const chunk = makeChunk()

const constant = addConstant(chunk, 1.2)
writeChunk(chunk, OpCode.OP_CONSTANT, 123)
writeChunk(chunk, constant, 123)

writeChunk(chunk, OpCode.OP_RETURN, 123)
disassembleChunk(chunk, "test chunk")
