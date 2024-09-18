import { addConstant, Chunk, OpCode, writeChunk } from "./chunk.js"
import { Value } from "./value.js";
import { disassembleChunk } from "./debug.js";
import { initScanner, scanToken, Token, TokenType } from "./scanner.js"
import { copyString } from "./object.js";

#include "common.h"
#include "value.h"

interface Parser {
  current: Token;
  previous: Token;
  hadError: boolean;
  panicMode: boolean;
}

enum Precedence {
  NONE,
  ASSIGNMENT, // =
  OR,         // or
  AND,        // and
  EQUALITY,   // == !=
  COMPARISON, // < > <= >=
  TERM,       // + -
  FACTOR,     // * /
  UNARY,      // ! -
  CALL,       // . ()
  PRIMARY,
}

type ParseFn = (canAssign: boolean) => void

interface ParseRule {
  prefix: ParseFn;
  infix: ParseFn;
  precedence: Precedence;
}

const parser: Parser = {
  current: null,
  previous: null,
  hadError: false,
  panicMode: false,
}
let compilingChunk: Chunk

const currentChunk = (): Chunk => {
  return compilingChunk
}

const errorAt = (token: Token, message: string) => {
  if (parser.panicMode) return
  parser.panicMode = true
  process.stderr.write(`[line ${token.line}] Error`)

  if (token.type === TokenType.EOF) {
    process.stderr.write(" at end")
  }
  else if (token.type === TokenType.ERROR) {
    // Nothing.
  }
  else {
    process.stderr.write(` at '${token.source.slice(token.start, token.start + token.length)}'`)
  }

  process.stderr.write(`: ${message}`)
  parser.hadError = true
}

const error = (message: string) => {
  errorAt(parser.previous, message)
}

const errorAtCurrent = (message: string) => {
  errorAt(parser.current, message)
}

const advance = () => {
  parser.previous = parser.current

  for (;;) {
    parser.current = scanToken()
    if (parser.current.type !== TokenType.ERROR) break

    errorAtCurrent(parser.current.source.slice(parser.current.start))
  }
}

const consume = (type: TokenType, message: string) => {
  if (parser.current.type === type) {
    advance()
    return
  }

  errorAtCurrent(message)
}

const check = (type: TokenType): boolean => {
  return parser.current.type === type
}

const match = (type: TokenType): boolean => {
  if (!check(type)) return false
  advance()
  return true
}

const emitByte = (byte: number) => {
  writeChunk(currentChunk(), byte, parser.previous.line)
}

const emitBytes = (byte1: number, byte2: number) => {
  emitByte(byte1)
  emitByte(byte2)
}

const emitReturn = () => {
  emitByte(OpCode.OP_RETURN)
}

const UINT8_MAX = 255
const makeConstant = (value: Value): number => {
  const constant = addConstant(currentChunk(), value)
  if (constant > UINT8_MAX) {
    error("Too many constants in one chunk.")
    return 0
  }

  return constant
}

const emitConstant = (value: Value) => {
  emitBytes(OpCode.OP_CONSTANT, makeConstant(value))
}

const endCompiler = () => {
  emitReturn()
#ifdef DEBUG_PRINT_CODE
  if (!parser.hadError) {
    disassembleChunk(currentChunk(), "code")
  }
#endif
}

const binary = (canAssign: boolean) => {
  const operatorType = parser.previous.type
  const rule: ParseRule = getRule(operatorType)
  parsePrecedence(rule.precedence + 1)

  switch (operatorType) {
    case TokenType.BANG_EQUAL:    emitBytes(OpCode.OP_EQUAL, OpCode.OP_NOT); break
    case TokenType.EQUAL_EQUAL:   emitByte(OpCode.OP_EQUAL); break
    case TokenType.GREATER:       emitByte(OpCode.OP_GREATER); break
    case TokenType.GREATER_EQUAL: emitBytes(OpCode.OP_LESS, OpCode.OP_NOT); break
    case TokenType.LESS:          emitByte(OpCode.OP_LESS); break
    case TokenType.LESS_EQUAL:    emitBytes(OpCode.OP_GREATER, OpCode.OP_NOT); break
    case TokenType.PLUS:          emitByte(OpCode.OP_ADD); break
    case TokenType.MINUS:         emitByte(OpCode.OP_SUBTRACT); break
    case TokenType.STAR:          emitByte(OpCode.OP_MULTIPLY); break
    case TokenType.SLASH:         emitByte(OpCode.OP_DIVIDE); break
    default:
      return // Unreachable.
  }
}

const literal = (canAssign: boolean) => {
  switch (parser.previous.type) {
    case TokenType.FALSE: emitByte(OpCode.OP_FALSE); break
    case TokenType.NIL: emitByte(OpCode.OP_NIL); break
    case TokenType.TRUE: emitByte(OpCode.OP_TRUE); break
    default: return // Unreachable.
  }
}

const grouping = (canAssign: boolean) => {
  expression()
  consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.")
}

const number = (canAssign: boolean) => {
  const previous = parser.previous
  const value = Number(previous.source.slice(previous.start, previous.start + previous.length))
  emitConstant(NUMBER_VAL(value))
}

const string = (canAssign: boolean) => {
  emitConstant(OBJ_VAL(copyString(
    parser.previous.source,
    parser.previous.start + 1,
    parser.previous.length - 2,
  )))
}

const namedVariable = (name: Token, canAssign: boolean) => {
  const arg = identifierConstant(name)

  if (canAssign && match(TokenType.EQUAL)) {
    expression()
    emitBytes(OpCode.OP_SET_GLOBAL, arg)
  }
  else {
    emitBytes(OpCode.OP_GET_GLOBAL, arg)
  }
}

const variable = (canAssign: boolean) => {
  namedVariable(parser.previous, canAssign)
}

const unary = (canAssign: boolean) => {
  const operatorType = parser.previous.type

  // Compile the operand.
  parsePrecedence(Precedence.UNARY)

  // Emit the operator instruction.
  switch (operatorType) {
    case TokenType.BANG:  emitByte(OpCode.OP_NOT); break
    case TokenType.MINUS: emitByte(OpCode.OP_NEGATE); break
    default: return // Unreachable.
  }
}

const R = (prefix: ParseFn, infix: ParseFn, precedence: Precedence): ParseRule => ({prefix, infix, precedence})

const rules: ParseRule[] = []
rules[TokenType.LEFT_PAREN]    = R(grouping, null, Precedence.NONE)
rules[TokenType.RIGHT_PAREN]   = R(null,     null, Precedence.NONE)
rules[TokenType.LEFT_BRACE]    = R(null,     null, Precedence.NONE)
rules[TokenType.RIGHT_BRACE]   = R(null,     null, Precedence.NONE)
rules[TokenType.COMMA]         = R(null,     null, Precedence.NONE)
rules[TokenType.DOT]           = R(null,     null, Precedence.NONE)
rules[TokenType.MINUS]         = R(unary,  binary, Precedence.TERM)
rules[TokenType.PLUS]          = R(null,   binary, Precedence.TERM)
rules[TokenType.SEMICOLON]     = R(null,     null, Precedence.NONE)
rules[TokenType.SLASH]         = R(null,   binary, Precedence.FACTOR)
rules[TokenType.STAR]          = R(null,   binary, Precedence.FACTOR)
rules[TokenType.BANG]          = R(unary,    null, Precedence.NONE)
rules[TokenType.BANG_EQUAL]    = R(null,   binary, Precedence.EQUALITY)
rules[TokenType.EQUAL]         = R(null,     null, Precedence.NONE)
rules[TokenType.EQUAL_EQUAL]   = R(null,   binary, Precedence.EQUALITY)
rules[TokenType.GREATER]       = R(null,   binary, Precedence.COMPARISON)
rules[TokenType.GREATER_EQUAL] = R(null,   binary, Precedence.COMPARISON)
rules[TokenType.LESS]          = R(null,   binary, Precedence.COMPARISON)
rules[TokenType.LESS_EQUAL]    = R(null,   binary, Precedence.COMPARISON)
rules[TokenType.IDENTIFIER]    = R(variable, null, Precedence.NONE)
rules[TokenType.STRING]        = R(string,   null, Precedence.NONE)
rules[TokenType.NUMBER]        = R(number,   null, Precedence.NONE)
rules[TokenType.AND]           = R(null,     null, Precedence.NONE)
rules[TokenType.CLASS]         = R(null,     null, Precedence.NONE)
rules[TokenType.ELSE]          = R(null,     null, Precedence.NONE)
rules[TokenType.FALSE]         = R(literal,  null, Precedence.NONE)
rules[TokenType.FOR]           = R(null,     null, Precedence.NONE)
rules[TokenType.FUN]           = R(null,     null, Precedence.NONE)
rules[TokenType.IF]            = R(null,     null, Precedence.NONE)
rules[TokenType.NIL]           = R(literal,  null, Precedence.NONE)
rules[TokenType.OR]            = R(null,     null, Precedence.NONE)
rules[TokenType.PRINT]         = R(null,     null, Precedence.NONE)
rules[TokenType.RETURN]        = R(null,     null, Precedence.NONE)
rules[TokenType.SUPER]         = R(null,     null, Precedence.NONE)
rules[TokenType.THIS]          = R(null,     null, Precedence.NONE)
rules[TokenType.TRUE]          = R(literal,  null, Precedence.NONE)
rules[TokenType.VAR]           = R(null,     null, Precedence.NONE)
rules[TokenType.WHILE]         = R(null,     null, Precedence.NONE)
rules[TokenType.ERROR]         = R(null,     null, Precedence.NONE)
rules[TokenType.EOF]           = R(null,     null, Precedence.NONE)

const parsePrecedence = (precedence: Precedence) => {
  advance()
  const prefixRule = getRule(parser.previous.type).prefix
  if (prefixRule === null) {
    error("Expect expression.")
    return
  }

  const canAssign = precedence <= Precedence.ASSIGNMENT
  prefixRule(canAssign)

  while (precedence <= getRule(parser.current.type).precedence) {
    advance()
    const infixRule = getRule(parser.previous.type).infix
    infixRule(canAssign)
  }

  if (canAssign && match(TokenType.EQUAL)) {
    error("Invalid assignment target.")
  }
}

const identifierConstant = (name: Token): number => {
  return makeConstant(OBJ_VAL(copyString(name.source, name.start, name.length)))
}

const parseVariable = (errorMessage: string): number => {
  consume(TokenType.IDENTIFIER, errorMessage)
  return identifierConstant(parser.previous)
}

const defineVariable = (global: number) => {
  emitBytes(OpCode.OP_DEFINE_GLOBAL, global)
}

const getRule = (type: TokenType): ParseRule => {
  return rules[type]
}

const expression = () => {
  parsePrecedence(Precedence.ASSIGNMENT)
}

const varDeclaration = () => {
  const global: number = parseVariable("Expect variable name.")

  if (match(TokenType.EQUAL)) {
    expression()
  }
  else {
    emitByte(OpCode.OP_NIL)
  }
  consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.")

  defineVariable(global)
}

const expressionStatement = () => {
  expression()
  consume(TokenType.SEMICOLON, "Expect ';' after expression.")
  emitByte(OpCode.OP_POP)
}

const printStatement = () => {
  expression()
  consume(TokenType.SEMICOLON, "Expect ';' after value.")
  emitByte(OpCode.OP_PRINT)
}

const synchronize = () => {
  parser.panicMode = false

  while (parser.current.type !== TokenType.EOF) {
    if (parser.previous.type === TokenType.SEMICOLON) return
    switch (parser.current.type) {
      case TokenType.CLASS:
      case TokenType.FUN:
      case TokenType.VAR:
      case TokenType.FOR:
      case TokenType.IF:
      case TokenType.WHILE:
      case TokenType.PRINT:
      case TokenType.RETURN:
        return

      default:
        ; // Do nothing.
    }

    advance()
  }
}

const declaration = () => {
  if (match(TokenType.VAR)) {
    varDeclaration()
  }
  else {
    statement()
  }

  if (parser.panicMode) synchronize()
}

const statement = () => {
  if (match(TokenType.PRINT)) {
    printStatement()
  }
  else {
    expressionStatement()
  }
}

export const compile = (source: string, chunk: Chunk): boolean => {
  initScanner(source)
  compilingChunk = chunk

  parser.hadError = false
  parser.panicMode = false

  advance()
  
  while (!match(TokenType.EOF)) {
    declaration()
  }

  endCompiler()
  return !parser.hadError
}