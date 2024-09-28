#ifndef tslox_object_h
#define tslox_object_h

#include "value.h"

#define OBJ_TYPE(value)    (AS_OBJ(value).type)

#define IS_FUN(value)      isObjType(value, ObjType.FUN)
#define IS_NATIVE(value)   isObjType(value, ObjType.NATIVE)
#define IS_STRING(value)   isObjType(value, ObjType.STRING)

#define AS_FUN(value)      (AS_OBJ(value) as ObjFun)
#define AS_NATIVE(value)   ((AS_OBJ(value) as ObjNative).fun)
#define AS_STRING(value)   (AS_OBJ(value) as ObjString)
#define AS_TSSTRING(value) ((AS_OBJ(value) as ObjString).chars)

#endif