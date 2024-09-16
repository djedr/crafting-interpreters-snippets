import { IS_OBJ, Obj, printObject, ObjString, isObjType } from "./object.js"

#include "value.h"
#include "object.h"

export type Value = number | boolean | null | Obj

export type ValueArray = Value[]

export const makeValueArray = (): ValueArray => {
  return []
}

export const writeValueArray = (array: ValueArray, value: Value) => {
  // to be optimized if need be
  array.push(value)
}

export const freeValueArray = (array: ValueArray) => {
  throw Error('todo?')
}

export const printValue = (value: Value) => {
  if (IS_BOOL(value)) {
    process.stdout.write(AS_BOOL(value) ? "true" : "false")
  }
  else if (IS_NIL(value)) {
    process.stdout.write("nil")
  }
  else if (IS_NUMBER(value)) {
    process.stdout.write(`${AS_NUMBER(value)}`)
  }
  else if (IS_OBJ(value)) {
    printObject(value)
  }
  else {
    throw Error('not implemented')
  }
}

export const valuesEqual = (a: Value, b: Value): boolean => {
  if (typeof a !== typeof b) return false
  if (IS_BOOL(a)) {
    return AS_BOOL(a) === AS_BOOL(b)
  }
  else if (IS_NIL(a)) {
    // todo: this will blow up if b is object, but not null
    // return true
    // so, to be safe from JS:
    return IS_NIL(b)
  }
  else if (IS_NUMBER(a)) {
    return AS_NUMBER(a) === AS_NUMBER(b)
  }
  else if (IS_OBJ(a)) {
    const aString = AS_STRING(a)
    const bString = AS_STRING(b)
    return aString.length === bString.length &&
      aString.chars === bString.chars
  }
  else {
    return false // Unreachable.
  }
}