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

const allocateString = (chars: string, length: number): ObjString => {
  return {
    ...allocateObject(ObjType.STRING),
    length,
    chars,
  }
}

export const takeString = (chars: string, length: number): ObjString => {
  return allocateString(chars, length)
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
  return allocateString(chars, length)
}

export const printObject = (value: Obj) => {
  switch (OBJ_TYPE(value)) {
    case ObjType.STRING:
      process.stdout.write(AS_TSSTRING(value))
      break
  }
}
