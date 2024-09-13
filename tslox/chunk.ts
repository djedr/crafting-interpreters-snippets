import { Value } from "./common.js";
import { makeValueArray, ValueArray, writeValueArray } from "./value.js";

interface ArrayBufferConstructor {
  new (byteLength: number, opt: {maxByteLength: number}): ArrayBuffer;
}
interface ArrayBuffer {
  resize(n: number): void
}
declare var ArrayBuffer: ArrayBufferConstructor;

export enum OpCode {
  OP_CONSTANT,
  OP_RETURN,
}

export interface Chunk {
  count: number;
  code: Uint8Array;
  lines: number[];
  constants: ValueArray;
}

export const makeChunk = (): Chunk => {
  const buf = new ArrayBuffer(8, {maxByteLength: 8})
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