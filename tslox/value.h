#ifndef tslox_value_h
#define tslox_value_h

#define IS_BOOL(value)    (typeof (value) === 'boolean')
#define IS_NIL(value)     ((value) === null)
#define IS_NUMBER(value)  (typeof (value) === 'number')

#define AS_OBJ(value)     ((value) as Obj)
#define AS_BOOL(value)    ((value) as boolean)
#define AS_NUMBER(value)  ((value) as number)

#define BOOL_VAL(value)   (value)
#define NIL_VAL           (null)
#define NUMBER_VAL(value) (value)
#define OBJ_VAL(object)   (object)

#endif