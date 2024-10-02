import { freeChunk } from "./chunk.js"
import { markCompilerRoots } from "./compiler.js"
import { Obj, ObjClosure, ObjFun, ObjString, ObjType, IS_OBJ, ObjUpvalue } from "./object.js"
import { markTable, tableRemoveWhite } from "./table.js"
import { printValue, Value, ValueArray } from "./value.js"
import { vm } from "./vm.js"

#include "common.h"
#include "object.h"

const freeObject = (object: Obj) => {
#ifdef DEBUG_LOG_GC
  console.log(`[todo] free type ${object.type}`)
#endif

  switch (object.type) {
    case ObjType.CLOSURE: {
      // const closure: ObjClosure = object
      // FREE_ARRAY(ObjUpvalue, closure.upvalues, closure.upvalueCount)
      // FREE(ObjClosure, object)
      break
    }
    case ObjType.FUN: {
      // const fun: ObjFun = object as ObjFun
      // freeChunk(fun.chunk)
      // FREE(ObjFun, object)
      break
    }
    case ObjType.NATIVE:
      // FREE(ObjNative, object)
      break
    case ObjType.STRING:
      // const string: ObjString = object
      // FREE_ARRAY(char, string.chars, string.length + 1)
      // FREE(ObjString, object)
      break
    case ObjType.UPVALUE:
      // FREE(ObjUpvalue, object)
      break
  }
}

export const collectGarbage = () => {
#ifdef DEBUG_LOG_GC
  console.log(`-- gc begin`)
#endif

  markRoots()
  traceReferences()
  tableRemoveWhite(vm.strings)
  sweep()

#ifdef DEBUG_LOG_GC
  console.log(`-- gc end`)
#endif
}

const markRoots = () => {
  for (let i = 0; i < vm.stackTop; ++i) {
    markValue(vm.stack[i])
  }

  for (let i = 0; i < vm.frameCount; ++i) {
    markObject(vm.frames[i].closure)
  }

  for (let upvalue = vm.openUpvalues; upvalue !== null; upvalue = upvalue.next) {
    markObject(upvalue)
  }

  markTable(vm.globals)
  markCompilerRoots()
}

const traceReferences = () => {
  while (vm.grayCount > 0) {
    const object = vm.grayStack[--vm.grayCount]
    blackenObject(object)
  }
}

const sweep = () => {
  let previous: Obj = null
  let object: Obj = vm.objects

  while (object !== null) {
    if (object.isMarked) {
      object.isMarked = false
      previous = object
      object = object.next
    }
    else {
      const unreached: Obj = object
      object = object.next
      if (previous !== null) {
        previous.next = object
      }
      else {
        vm.objects = object
      }

      freeObject(unreached)
    }
  }
}

export const freeObjects = () => {
  let object = vm.objects
  while (object !== null) {
    const next = object.next
    freeObject(object)
    object = next
  }

  // free(vm.grayStack)
}

export const reallocate = (pointer: number, oldSize: number, newSize: number) => {
//   if (newSize > oldSize) {
// #ifdef DEBUG_STRESS_GC
//     collectGarbage()
// #endif
//   }

  // ...
}

export const markObject = (object: Obj) => {
  if (object === null) return
  if (object.isMarked) return

#ifdef DEBUG_LOG_GC
  process.stdout.write(`[todo] mark `)
  printValue(OBJ_VAL(object))
  process.stdout.write('\n')
#endif

  object.isMarked = true

  if (vm.grayCapacity < vm.grayCount + 1) {
    // vm.grayCapacity = vm.grayCapacity < 8 ? 8 : vm.grayCapacity * 2
    // vm.grayStack = realloc...

    // if (vm.grayStack === null) process.exit(1)
  }

  vm.grayStack[vm.grayCount++] = object
}

export const markValue = (value: Value) => {
  if (IS_OBJ(value)) markObject(AS_OBJ(value))
}

const markArray = (array: ValueArray) => {
  for (let i = 0; i < array.length; ++i) {
    markValue(array[i])
  }
}

const blackenObject = (object: Obj) => {
#ifdef DEBUG_LOG_GC
  process.stdout.write(`[todo] blacken `)
  printValue(OBJ_VAL(object))
  console.log()
#endif

  switch (object.type) {
    case ObjType.CLOSURE:
      const closure: ObjClosure = object as ObjClosure
      markObject(closure.fun)
      for (let i = 0; i < closure.upvalueCount; ++i) {
        markObject(closure.upvalues[i])
      }
      break
    case ObjType.FUN:
      const fun: ObjFun = object as ObjFun
      markObject(fun.name)
      markArray(fun.chunk.constants)
      break
    case ObjType.UPVALUE:
      markValue((object as ObjUpvalue).closed)
      break
    case ObjType.NATIVE:
    case ObjType.STRING:
      break
  }
}