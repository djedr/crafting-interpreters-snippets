import { tableFindString, tableSet } from "./table.js";
import { Value } from "./value.js";
import { vm } from "./vm.js";

#include "object.h"

export enum ObjType {
  STRING,
}

export interface Obj {
  type: ObjType;
  next: Obj;
}

export interface ObjString extends Obj {
  type: ObjType.STRING;
  length: number;
  chars: string;
  hash: number;
}

export const IS_OBJ = (value: any): value is Obj => {
  return value !== null && 
    typeof value === 'object' &&
    "type" in value
}

const allocateObject = (type: ObjType): Obj => {
  const object = {
    type,
    next: vm.objects,
  }
  vm.objects = object
  return object
}

const allocateString = (chars: string, length: number, hash: number): ObjString => {
  const string = {
    ...allocateObject(ObjType.STRING),
    length,
    chars,
    hash,
  }
  tableSet(vm.strings, string, NIL_VAL)
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

export const printObject = (value: Obj) => {
  switch (OBJ_TYPE(value)) {
    case ObjType.STRING:
      process.stdout.write(AS_TSSTRING(value))
      break
  }
}
