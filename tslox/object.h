#ifndef tslox_object_h
#define tslox_object_h

#include "value.h"

#define OBJ_TYPE(value)    (AS_OBJ(value).type)

#define IS_STRING(value)   isObjType(value, ObjType.STRING)

#define AS_STRING(value)   (AS_OBJ(value) as ObjString)
#define AS_TSSTRING(value) ((AS_OBJ(value) as ObjString).chars)

#endif