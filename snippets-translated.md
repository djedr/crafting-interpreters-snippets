# Snippets from the book Crafting Interpreters by Robert Nystrom translated into an imaginary programming language based on Jevko that is designed while doing the translation

Sections are numbered according to pages in the book.

The lanugage is codenamed Jevlox -- Jevko + Lox.

## 6

```
[Jevlox].error[ [line] ['Unexpected character.] ]
```

## 15

```
[pennyArea].set![ [3.14159] .* [[0.75]./[2]] .* [[0.75]./[2]] ]
```

```
[pennyArea].set![0.4417860938]
```

## 22

```
Your first Jevlox program!
print['Hello, world!]
```

## 23

```
[true]     Not false
[false]    Not *not* false.
```

```
[1234]     An integer.
[12.34]    A decimal number.
```

```
['I am a string]
[']       The empty string.
['123]    This is a string, not a number.

There are also raw strings:
[`''raw string'`]
```

## 24

```
[add].+[me]
[subtract].-[me]
[multiply].*[me]
[divide]./[me]
```

```
-[negate me]
```

```
[less].<[than]
[less than].<=[or equal]
[greater].>[than]
[greater than].>=[or equal]
```

## 25

```
[1].=[2]           false.
['cat].!=['dog]    true.
```

```
[314].=['pi]    false.
```

```
[123].=['123]    false.
```

```
not[true]     false.
not[false]    true.
```

```
[true].and[false]    false.
[true].and[true]     true.
```

```
[false].or[false]    false.
[true].or[false]     true.
```

```
[average].const[ [[min].+[max]] ./ [2] ]
```

## 26

```
print['Hello, world!]
```

```
['some expression]
```

```
[
  print['One statement.]
  print['Two statements.]
]
```

```
[im a variable].let['here is my value]
[i am nil].let[]
```

```
[breakfast].let['bagels]
print[breakfast]             bagels.
[breakfast].set!['beignets]
print[breakfast]             beignets.
```

## 27

```
if[
  [condition] [
    print['yes]
  ]
  else[
    print['no]
  ]
]
```

```
[a].let[1]
while[
  [a] .< [10]

  print[a]
  [a].set![ [a] .+ [1] ]
]
```

```
for[
  [a].let[1]
  [a] .< [10]
  [a].set![ [a] .+ [1] ]

  print[a]
]
```

```
make breakfast[ [bacon] [eggs] [toast] ]
```

```
make breakfast[]
```

## 28

```
[print sum].const: [ [a] [b] ].fn[
  print[ [a].+[b] ]
]
```

```
[return sum].const: [ [a] [b] ].fn[
  return[ [a].+[b] ]
]
```

```
[add pair].const: [ [a] [b] ].fn[
  return[ [a].+[b] ]
]

[identity].const: [a].fn[
  return[a]
]

print[  identity[add pair]..[ [1] [2] ]  ]    Prints "3".
```

Jevlox actually compiles to a simpler language, let's call it Jevlox1, by performing at least the following transformations (spaces for clarity):

1. 

```
[a].b[c]
```

translates into

```
b[ [a] [c] ]
```

2. 

```
[a].b:[c].d[e]
```

translates into

```
b[ [a] d[[c][e]] ]
```

3. 

```
f[a]..[b]
```

translates into

```
@call[ f[a] [b] ]
```

which is equivalent to JavaScript:

```
f(a)(b)
```

Jevlox1 is easily translatable at least to JavaScript.