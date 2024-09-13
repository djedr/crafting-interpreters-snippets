import { Value } from "./common.js"

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
  process.stdout.write(`${value}`)
}