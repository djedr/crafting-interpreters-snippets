import { Chunk, makeChunk } from "./chunk.js";
import { tableFindString, tableSet } from "./table.js";
import { Value } from "./value.js";
import { pop, push, vm } from "./vm.js";

#include "object.h"

export enum ObjType {
  CLASS,
  CLOSURE,
  FUN,
  NATIVE,
  STRING,
  UPVALUE,
}

export interface Obj {
  type: ObjType;
  isMarked: boolean;
  next: Obj;
}

export interface ObjFun extends Obj {
  type: ObjType.FUN;
  arity: number;
  upvalueCount: number;
  chunk: Chunk;
  name: ObjString;
}

export type NativeFn = (argCount: number, args: Value[]) => Value

export interface ObjNative extends Obj {
  fun: NativeFn;
}

export interface ObjString extends Obj {
  type: ObjType.STRING;
  length: number;
  chars: string;
  hash: number;
}

export interface ObjUpvalue extends Obj {
  type: ObjType.UPVALUE;
  location: Value;
  closed: Value;
  next: ObjUpvalue;
}

export interface ObjClosure extends Obj {
  type: ObjType.CLOSURE;
  fun: ObjFun;
  upvalues: ObjUpvalue[];
  upvalueCount: number;
}

export interface ObjClass extends Obj {
  type: ObjType.CLASS;
  name: ObjString;
}

export const IS_OBJ = (value: any): value is Obj => {
  return value !== null && 
    typeof value === 'object' &&
    "type" in value
}

const allocateObject = (type: ObjType): Obj => {
  const object: Obj = {
    type,
    isMarked: false,
    next: vm.objects,
  }
  vm.objects = object

#ifdef DEBUG_LOG_GC
  console.log(`[todo] allocate [todo] for ${type}`)
#endif

  return object
}

export const newClass = (name: ObjString): ObjClass => {
  const klass: ObjClass = {
    ...allocateObject(ObjType.CLASS),
    // to calm down typesctipt
    type: ObjType.CLASS,
    name,
  }
  return klass
}

const makeUpvalueObjs = (length: number): ObjUpvalue[] => {
  return Array.from({length}).map(() => null)
}

export const newClosure = (fun: ObjFun): ObjClosure => {
  const upvalues = makeUpvalueObjs(fun.upvalueCount)

  const closure: ObjClosure = {
    ...allocateObject(ObjType.CLOSURE),
    // to calm down typesctipt
    type: ObjType.CLOSURE,
    fun,
    upvalues,
    upvalueCount: fun.upvalueCount,
  }
  return closure
}

export const newFunction = (): ObjFun => {
  const fun: ObjFun = {
    ...allocateObject(ObjType.FUN),
    // to calm down typesctipt
    type: ObjType.FUN,
    arity: 0,
    upvalueCount: 0,
    name: null,
    chunk: makeChunk(),
  }
  return fun
}

export const newNative = (fun: NativeFn): ObjNative => {
  const native: ObjNative = {
    ...allocateObject(ObjType.NATIVE),
    // to calm down typesctipt
    type: ObjType.NATIVE,
    fun,
  }
  return native
}

const allocateString = (chars: string, length: number, hash: number): ObjString => {
  const string: ObjString = {
    ...allocateObject(ObjType.STRING),
    // to calm down typescript
    type: ObjType.STRING,
    length,
    chars,
    hash,
  }
  push(OBJ_VAL(string))
  tableSet(vm.strings, string, NIL_VAL)
  pop()
  return string
}

const hashString = (key: string, length: number): number => {
  let hash = 2166136261
  for (let i = 0; i < length; ++i) {
    hash ^= key.charCodeAt(i)
    hash *= 16777619
  }
  return hash >>> 0
}

export const takeString = (chars: string, length: number): ObjString => {
  const hash = hashString(chars, length)
  const interned = tableFindString(vm.strings, chars, length, hash)
  if (interned !== null) {
    // FREE_ARRAY(char, chars, length)
    return interned
  }
  return allocateString(chars, length, hash)
}

export const isObjType = (value: Value, type: ObjType): boolean => {
  return IS_OBJ(value) && AS_OBJ(value).type === type
}

export const copyString = (
  source: string,
  start: number,
  length: number,
): ObjString => {
  const chars = source.slice(start, start + length)
  const hash = hashString(chars, length)
  const interned = tableFindString(vm.strings, chars, length, hash)
  if (interned !== null) return interned
  return allocateString(chars, length, hash)
}

export const newUpvalue = (slot: Value): ObjUpvalue => {
  const upvalue: ObjUpvalue = {
    ...allocateObject(ObjType.UPVALUE),
    type: ObjType.UPVALUE,
    closed: NIL_VAL,
    location: slot,
    next: null,
  }
  return upvalue
}

const printFunction = (fun: ObjFun) => {
  if (fun.name === null) {
    process.stdout.write("<script>")
    return
  }
  process.stdout.write(`<fn ${fun.name.chars}>`)
}

export const printObject = (value: Obj) => {
  switch (OBJ_TYPE(value)) {
    case ObjType.CLASS:
      process.stdout.write(`${AS_CLASS(value).name.chars}`)
      break
    case ObjType.CLOSURE:
      printFunction(AS_CLOSURE(value).fun)
      break
    case ObjType.FUN:
      printFunction(AS_FUN(value))
      break
    case ObjType.NATIVE:
      process.stdout.write(`<native fn>`)
      break
    case ObjType.STRING:
      process.stdout.write(AS_TSSTRING(value))
      break
    case ObjType.UPVALUE:
      process.stdout.write("upvalue")
      break
  }
}
