import { freeChunk } from "./chunk.js"
import { markCompilerRoots } from "./compiler.js"
import { Obj, ObjClosure, ObjFun, ObjString, ObjType, IS_OBJ } from "./object.js"
import { markTable } from "./table.js"
import { printValue, Value } from "./value.js"
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
