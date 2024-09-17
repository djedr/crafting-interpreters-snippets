import { IS_OBJ, Obj, printObject, ObjString, isObjType } from "./object.js"
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
  if ((typeof (value) === 'boolean')) {
    process.stdout.write(((value) as boolean) ? "true" : "false")
  }
  else if (((value) === null)) {
    process.stdout.write("nil")
  }
  else if ((typeof (value) === 'number')) {
    process.stdout.write(`${((value) as number)}`)
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
  if ((typeof (a) === 'boolean')) {
    return ((a) as boolean) === ((b) as boolean)
  }
  else if (((a) === null)) {
    // todo: this will blow up if b is object, but not null
    // return true
    // so, to be safe from JS:
    return ((b) === null)
  }
  else if ((typeof (a) === 'number')) {
    return ((a) as number) === ((b) as number)
  }
  else if (IS_OBJ(a)) {
    return ((a) as Obj) === ((b) as Obj)
  }
  else {
    return false // Unreachable.
  }
}
