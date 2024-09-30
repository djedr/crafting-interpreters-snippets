import { freeChunk } from "./chunk.js"
import { Obj, ObjClosure, ObjFun, ObjString, ObjType } from "./object.js"
import { vm } from "./vm.js"

const freeObject = (object: Obj) => {
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

export const freeObjects = () => {
  let object = vm.objects
  while (object !== null) {
    const next = object.next
    freeObject(object)
    object = next
  }
}
