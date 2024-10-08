#ifndef tslox_object_h
#define tslox_object_h

#include "value.h"

#define OBJ_TYPE(value)        (AS_OBJ(value).type)

#define IS_BOUND_METHOD(value) isObjType(value, ObjType.BOUND_METHOD)
#define IS_CLASS(value)        isObjType(value, ObjType.CLASS)
#define IS_CLOSURE(value)      isObjType(value, ObjType.CLOSURE)
#define IS_FUN(value)          isObjType(value, ObjType.FUN)
#define IS_INSTANCE(value)     isObjType(value, ObjType.INSTANCE)
#define IS_NATIVE(value)       isObjType(value, ObjType.NATIVE)
#define IS_STRING(value)       isObjType(value, ObjType.STRING)

#define AS_BOUND_METHOD(value) (AS_OBJ(value) as ObjBoundMethod)
#define AS_CLASS(value)        (AS_OBJ(value) as ObjClass)
#define AS_CLOSURE(value)      (AS_OBJ(value) as ObjClosure)
#define AS_FUN(value)          (AS_OBJ(value) as ObjFun)
#define AS_INSTANCE(value)     (AS_OBJ(value) as ObjInstance)
#define AS_NATIVE(value)       ((AS_OBJ(value) as ObjNative).fun)
#define AS_STRING(value)       (AS_OBJ(value) as ObjString)
#define AS_TSSTRING(value)     ((AS_OBJ(value) as ObjString).chars)

#endif