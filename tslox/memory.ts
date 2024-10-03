import { freeChunk } from "./chunk.js"
import { markCompilerRoots } from "./compiler.js"
import { Obj, ObjClosure, ObjFun, ObjString, ObjType, IS_OBJ, ObjUpvalue } from "./object.js"
import { markTable, tableRemoveWhite } from "./table.js"
import { printValue, Value, ValueArray } from "./value.js"
import { vm } from "./vm.js"

















const freeObject = (object: Obj) => {
  console.log(`[todo] free type ${object.type}`)

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
  console.log(`-- gc begin`)
  const before = vm.bytesAllocated

  markRoots()
  traceReferences()
  tableRemoveWhite(vm.strings)
  sweep()

  vm.nextGc = vm.bytesAllocated * 2

  console.log(`-- gc end`)
  console.log(`    collected ${before - vm.bytesAllocated} bytes (from ${before} to ${vm.bytesAllocated}) next at ${vm.nextGc}`)
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
  vm.bytesAllocated += newSize - oldSize
//   if (newSize > oldSize) {
// #ifdef 
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

  process.stdout.write(`[todo] mark `)
  printValue((object))
  process.stdout.write('\n')

  object.isMarked = true

  if (vm.grayCapacity < vm.grayCount + 1) {
    // vm.grayCapacity = vm.grayCapacity < 8 ? 8 : vm.grayCapacity * 2
    // vm.grayStack = realloc...

    // if (vm.grayStack === null) process.exit(1)
  }

  vm.grayStack[vm.grayCount++] = object
}

export const markValue = (value: Value) => {
  if (IS_OBJ(value)) markObject(((value) as Obj))
}

const markArray = (array: ValueArray) => {
  for (let i = 0; i < array.length; ++i) {
    markValue(array[i])
  }
}

const blackenObject = (object: Obj) => {
  process.stdout.write(`[todo] blacken `)
  printValue((object))
  console.log()

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
