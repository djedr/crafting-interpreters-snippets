import { freeChunk } from "./chunk.js"
import { markCompilerRoots } from "./compiler.js"
import { Obj, ObjClosure, ObjFun, ObjString, ObjType, IS_OBJ, ObjUpvalue, ObjClass, ObjInstance, ObjBoundMethod } from "./object.js"
import { freeTable, markTable, tableRemoveWhite } from "./table.js"
import { printValue, Value, ValueArray } from "./value.js"
import { vm } from "./vm.js"

#include "common.h"
#include "object.h"

#define GC_HEAP_GROW_FACTOR 2

const freeObject = (object: Obj) => {
#ifdef DEBUG_LOG_GC
  console.log(`[todo] free type ${object.type}`)
#endif

  switch (object.type) {
    case ObjType.BOUND_METHOD: {
      // FREE(ObjBoundMethod, object)
      break
    }
    case ObjType.CLASS: {
      // const klass: ObjClass = object as ObjClass
      // freeTable(klass.methods)
      // FREE(ObjClass, object)
      break
    }
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
    case ObjType.INSTANCE: {
      // const instance: ObjInstance = object as ObjInstance
      // freeTable(instance.fields)
      // FREE(ObjInstance, object)
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
  const before = vm.bytesAllocated
#endif

  markRoots()
  traceReferences()
  tableRemoveWhite(vm.strings)
  sweep()

  vm.nextGc = vm.bytesAllocated * GC_HEAP_GROW_FACTOR

#ifdef DEBUG_LOG_GC
  console.log(`-- gc end`)
  console.log(`    collected ${before - vm.bytesAllocated} bytes (from ${before} to ${vm.bytesAllocated}) next at ${vm.nextGc}`)
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
  markObject(vm.initString)
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
  vm.bytesAllocated += newSize - oldSize
//   if (newSize > oldSize) {
// #ifdef DEBUG_STRESS_GC
//     collectGarbage()
// #endif
//   }

  if (vm.bytesAllocated > vm.nextGc) {
    collectGarbage()
  }

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
    case ObjType.BOUND_METHOD: {
      const bound: ObjBoundMethod = object as ObjBoundMethod
      markValue(bound.receiver)
      markObject(bound.method)
      break
    }
    case ObjType.CLASS: {
      const klass: ObjClass = object as ObjClass
      markObject(klass.name)
      markTable(klass.methods)
      break
    }
    case ObjType.CLOSURE: {
      const closure: ObjClosure = object as ObjClosure
      markObject(closure.fun)
      for (let i = 0; i < closure.upvalueCount; ++i) {
        markObject(closure.upvalues[i])
      }
      break
    }
    case ObjType.FUN: {
      const fun: ObjFun = object as ObjFun
      markObject(fun.name)
      markArray(fun.chunk.constants)
      break
    }
    case ObjType.INSTANCE: {
      const instance: ObjInstance = object as ObjInstance
      markObject(instance.klass)
      markTable(instance.fields)
      break
    }
    case ObjType.UPVALUE:
      markValue((object as ObjUpvalue).closed)
      break
    case ObjType.NATIVE:
    case ObjType.STRING:
      break
  }
}