import { Value } from "./value.js";
import { makeValueArray, ValueArray, writeValueArray } from "./value.js";

interface ArrayBufferConstructor {
  new (byteLength: number, opt: {maxByteLength: number}): ArrayBuffer;
}
interface ArrayBuffer {
  resize(n: number): void
  transfer(n: number): ArrayBuffer
}
declare var ArrayBuffer: ArrayBufferConstructor;

export enum OpCode {
  OP_CONSTANT,
  OP_NIL,
  OP_TRUE,
  OP_FALSE,
  OP_POP,
  OP_GET_LOCAL,
  OP_SET_LOCAL,
  OP_GET_GLOBAL,
  OP_DEFINE_GLOBAL,
  OP_SET_GLOBAL,
  OP_EQUAL,
  OP_GREATER,
  OP_LESS,
  OP_ADD,
  OP_SUBTRACT,
  OP_MULTIPLY,
  OP_DIVIDE,
  OP_NOT,
  OP_NEGATE,
  OP_PRINT,
  OP_JUMP,
  OP_JUMP_IF_FALSE,
  OP_LOOP,
  OP_CALL,
  OP_RETURN,
}

export interface Chunk {
  count: number;
  code: Uint8Array;
  lines: number[];
  constants: ValueArray;
}

export const makeChunk = (): Chunk => {
  const buf = new ArrayBuffer(8, {maxByteLength: 1024*1024*1024})
  const arr = new Uint8Array(buf as unknown as ArrayBufferLike)
  return {
    count: 0,
    code: arr,
    lines: [],
    constants: makeValueArray(),
  }
}

export const writeChunk = (chunk: Chunk, byte: number, line: number) => {
  if (chunk.count >= chunk.code.byteLength) {
    // todo?: likely this should use transfer rather than resize -- that is equivalent to realloc
    //    sth like chunk.code.buffer = chunk.code.buffer.transfer(chunk.code.byteLength * 2) -- freeing the old buffer is left for gc, but maybe could be forced?
    (chunk.code.buffer as unknown as ArrayBuffer).resize(chunk.code.byteLength * 2)
    // todo: maybe more optimized array for line info, to be resized here
  }
  chunk.code[chunk.count] = byte
  chunk.lines[chunk.count] = line
  chunk.count += 1
}

export const addConstant = (chunk: Chunk, value: Value): number => {
  writeValueArray(chunk.constants, value)
  return chunk.constants.length - 1
}

export const freeChunk = (chunk: Chunk) => {
  throw Error('todo?')
}