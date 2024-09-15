import { addConstant, Chunk, OpCode, writeChunk } from "./chunk.js"
import { Value } from "./value.js";
import { disassembleChunk } from "./debug.js";
import { initScanner, scanToken, Token, TokenType } from "./scanner.js"

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

type ParseFn = () => void

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

const binary = () => {
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

const literal = () => {
  switch (parser.previous.type) {
    case TokenType.FALSE: emitByte(OpCode.OP_FALSE); break
    case TokenType.NIL: emitByte(OpCode.OP_NIL); break
    case TokenType.TRUE: emitByte(OpCode.OP_TRUE); break
    default: return // Unreachable.
  }
}

const grouping = () => {
  expression()
  consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.")
}

const number = () => {
  const previous = parser.previous
  const value = Number(previous.source.slice(previous.start, previous.start + previous.length))
  emitConstant(NUMBER_VAL(value))
}

const unary = () => {
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
rules[TokenType.IDENTIFIER]    = R(null,     null, Precedence.NONE)
rules[TokenType.STRING]        = R(null,     null, Precedence.NONE)
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

const parsePrecedence = (precendence: Precedence) => {
  advance()
  const prefixRule = getRule(parser.previous.type).prefix
  if (prefixRule === null) {
    error("Expect expression.")
    return
  }

  prefixRule()

  while (precendence <= getRule(parser.current.type).precedence) {
    advance()
    const infixRule = getRule(parser.previous.type).infix
    infixRule()
  }
}

const getRule = (type: TokenType): ParseRule => {
  return rules[type]
}

const expression = () => {
  parsePrecedence(Precedence.ASSIGNMENT)
}

export const compile = (source: string, chunk: Chunk): boolean => {
  initScanner(source)
  compilingChunk = chunk

  parser.hadError = false
  parser.panicMode = false

  advance()
  expression()
  consume(TokenType.EOF, "Expect end of expression.")
  endCompiler()
  return !parser.hadError
}