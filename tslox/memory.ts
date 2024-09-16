import { Obj, ObjString, ObjType } from "./object.js"
import { vm } from "./vm.js"

const freeObject = (object: Obj) => {
  switch (object.type) {
    case ObjType.STRING:
      // const string: ObjString = object
      // FREE_ARRAY(char, string.chars, string.length + 1)
      // FREE(ObjString, object)
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
