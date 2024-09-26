import { addConstant, Chunk, OpCode, writeChunk } from "./chunk.js"
import { Value } from "./value.js";
import { disassembleChunk } from "./debug.js";
import { initScanner, scanToken, Token, TokenType } from "./scanner.js"
import { copyString, newFunction, ObjFun as ObjFun } from "./object.js";
interface Parser {
  current: Token;
  previous: Token;
  hadError: boolean;
  panicMode: boolean;
}
enum Precedence {
  NONE,
  ASSIGNMENT, // =
  OR, // or
  AND, // and
  EQUALITY, // == !=
  COMPARISON, // < > <= >=
  TERM, // + -
  FACTOR, // * /
  UNARY, // ! -
  CALL, // . ()
  PRIMARY,
}
type ParseFn = (canAssign: boolean) => void
interface ParseRule {
  prefix: ParseFn;
  infix: ParseFn;
  precedence: Precedence;
}
interface Local {
  name: Token;
  depth: number;
}
enum FunType {
  FUN,
  SCRIPT,
}
interface Compiler {
  enclosing: Compiler;
  fun: ObjFun;
  type: FunType;
  locals: Local[];
  localCount: number;
  scopeDepth: number;
}
const parser: Parser = {
  current: null,
  previous: null,
  hadError: false,
  panicMode: false,
}
const makeLocals = (): Local[] => {
  return Array.from({length: (255 + 1)}).map(() => ({
    depth: -1,
    name: {
      type: TokenType.ERROR,
      source: "",
      start: 0,
      length: 0,
      line: 0,
    }
  }))
}
let current: Compiler = {
  enclosing: null,
  fun: null,
  type: FunType.SCRIPT,
  localCount: 0,
  scopeDepth: 0,
  locals: makeLocals(),
}
const currentChunk = (): Chunk => {
  return current.fun.chunk
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
  process.stderr.write(`: ${message}\n`)
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
const emitLoop = (loopStart: number) => {
  emitByte(OpCode.OP_LOOP)
  const offset = currentChunk().count - loopStart + 2
  if (offset > 65535) error("Loop body too large.")
  emitByte((offset >> 8) & 0xff)
  emitByte(offset & 0xff)
}
const emitJump = (instruction: number) => {
  emitByte(instruction)
  emitByte(0xff)
  emitByte(0xff)
  return currentChunk().count - 2
}
const emitReturn = () => {
  emitByte(OpCode.OP_RETURN)
}
const makeConstant = (value: Value): number => {
  const constant = addConstant(currentChunk(), value)
  if (constant > 255) {
    error("Too many constants in one chunk.")
    return 0
  }
  return constant
}
const emitConstant = (value: Value) => {
  emitBytes(OpCode.OP_CONSTANT, makeConstant(value))
}
const patchJump = (offset: number) => {
  // -2 to adjust for the bytecode for the jump offset itself.
  const jump = currentChunk().count - offset - 2
  if (jump > 65535) {
    error("Too much code to jump over.")
  }
  currentChunk().code[offset] = (jump >> 8) & 0xff
  currentChunk().code[offset + 1] = jump & 0xff
}
const makeCompiler = (): Compiler => {
  return {
    enclosing: null,
    fun: null,
    type: FunType.SCRIPT,
    localCount: 0,
    scopeDepth: 0,
    locals: makeLocals(),
  }
}
const initCompiler = (compiler: Compiler, type: FunType) => {
  compiler.enclosing = current
  compiler.fun = null
  compiler.type = type
  compiler.localCount = 0
  compiler.scopeDepth = 0
  compiler.fun = newFunction()
  current = compiler
  if (type !== FunType.SCRIPT) {
    current.fun.name = copyString(parser.previous.source, parser.previous.start, parser.previous.length)
  }
  const local: Local = current.locals[current.localCount++]
  local.depth = 0
  local.name.source = ""
  local.name.start = 0
  local.name.length = 0
}
const endCompiler = (): ObjFun => {
  emitReturn()
  const fun: ObjFun = current.fun
  if (!parser.hadError) {
    disassembleChunk(currentChunk(), fun.name !== null ? fun.name.chars : "<script>")
  }
  current = current.enclosing
  return fun
}
const beginScope = () => {
  current.scopeDepth += 1
}
const endScope = () => {
  current.scopeDepth -= 1
  while (
    current.localCount > 0 &&
    current.locals[current.localCount - 1].depth > current.scopeDepth
  ) {
    emitByte(OpCode.OP_POP)
    current.localCount -= 1
  }
}
const and_ = (canAssign: boolean) => {
  const endJump = emitJump(OpCode.OP_JUMP_IF_FALSE)
  emitByte(OpCode.OP_POP)
  parsePrecedence(Precedence.AND)
  patchJump(endJump)
}
const binary = (canAssign: boolean) => {
  const operatorType = parser.previous.type
  const rule: ParseRule = getRule(operatorType)
  parsePrecedence(rule.precedence + 1)
  switch (operatorType) {
    case TokenType.BANG_EQUAL: emitBytes(OpCode.OP_EQUAL, OpCode.OP_NOT); break
    case TokenType.EQUAL_EQUAL: emitByte(OpCode.OP_EQUAL); break
    case TokenType.GREATER: emitByte(OpCode.OP_GREATER); break
    case TokenType.GREATER_EQUAL: emitBytes(OpCode.OP_LESS, OpCode.OP_NOT); break
    case TokenType.LESS: emitByte(OpCode.OP_LESS); break
    case TokenType.LESS_EQUAL: emitBytes(OpCode.OP_GREATER, OpCode.OP_NOT); break
    case TokenType.PLUS: emitByte(OpCode.OP_ADD); break
    case TokenType.MINUS: emitByte(OpCode.OP_SUBTRACT); break
    case TokenType.STAR: emitByte(OpCode.OP_MULTIPLY); break
    case TokenType.SLASH: emitByte(OpCode.OP_DIVIDE); break
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
  emitConstant((value))
}
const or_ = (canAssign: boolean) => {
  const elseJump = emitJump(OpCode.OP_JUMP_IF_FALSE)
  const endJump = emitJump(OpCode.OP_JUMP)
  patchJump(elseJump)
  emitByte(OpCode.OP_POP)
  parsePrecedence(Precedence.OR)
  patchJump(endJump)
}
const string = (canAssign: boolean) => {
  emitConstant((copyString( parser.previous.source, parser.previous.start + 1, parser.previous.length - 2, )))
}
const namedVariable = (name: Token, canAssign: boolean) => {
  let getOp: number, setOp: number
  let arg: number = resolveLocal(current, name)
  if (arg !== -1) {
    getOp = OpCode.OP_GET_LOCAL
    setOp = OpCode.OP_SET_LOCAL
  }
  else {
    arg = identifierConstant(name)
    getOp = OpCode.OP_GET_GLOBAL
    setOp = OpCode.OP_SET_GLOBAL
  }
  if (canAssign && match(TokenType.EQUAL)) {
    expression()
    emitBytes(setOp, arg)
  }
  else {
    emitBytes(getOp, arg)
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
    case TokenType.BANG: emitByte(OpCode.OP_NOT); break
    case TokenType.MINUS: emitByte(OpCode.OP_NEGATE); break
    default: return // Unreachable.
  }
}
const R = (prefix: ParseFn, infix: ParseFn, precedence: Precedence): ParseRule => ({prefix, infix, precedence})
const rules: ParseRule[] = []
rules[TokenType.LEFT_PAREN] = R(grouping, null, Precedence.NONE)
rules[TokenType.RIGHT_PAREN] = R(null, null, Precedence.NONE)
rules[TokenType.LEFT_BRACE] = R(null, null, Precedence.NONE)
rules[TokenType.RIGHT_BRACE] = R(null, null, Precedence.NONE)
rules[TokenType.COMMA] = R(null, null, Precedence.NONE)
rules[TokenType.DOT] = R(null, null, Precedence.NONE)
rules[TokenType.MINUS] = R(unary, binary, Precedence.TERM)
rules[TokenType.PLUS] = R(null, binary, Precedence.TERM)
rules[TokenType.SEMICOLON] = R(null, null, Precedence.NONE)
rules[TokenType.SLASH] = R(null, binary, Precedence.FACTOR)
rules[TokenType.STAR] = R(null, binary, Precedence.FACTOR)
rules[TokenType.BANG] = R(unary, null, Precedence.NONE)
rules[TokenType.BANG_EQUAL] = R(null, binary, Precedence.EQUALITY)
rules[TokenType.EQUAL] = R(null, null, Precedence.NONE)
rules[TokenType.EQUAL_EQUAL] = R(null, binary, Precedence.EQUALITY)
rules[TokenType.GREATER] = R(null, binary, Precedence.COMPARISON)
rules[TokenType.GREATER_EQUAL] = R(null, binary, Precedence.COMPARISON)
rules[TokenType.LESS] = R(null, binary, Precedence.COMPARISON)
rules[TokenType.LESS_EQUAL] = R(null, binary, Precedence.COMPARISON)
rules[TokenType.IDENTIFIER] = R(variable, null, Precedence.NONE)
rules[TokenType.STRING] = R(string, null, Precedence.NONE)
rules[TokenType.NUMBER] = R(number, null, Precedence.NONE)
rules[TokenType.AND] = R(null, and_, Precedence.AND)
rules[TokenType.CLASS] = R(null, null, Precedence.NONE)
rules[TokenType.ELSE] = R(null, null, Precedence.NONE)
rules[TokenType.FALSE] = R(literal, null, Precedence.NONE)
rules[TokenType.FOR] = R(null, null, Precedence.NONE)
rules[TokenType.FUN] = R(null, null, Precedence.NONE)
rules[TokenType.IF] = R(null, null, Precedence.NONE)
rules[TokenType.NIL] = R(literal, null, Precedence.NONE)
rules[TokenType.OR] = R(null, or_, Precedence.OR)
rules[TokenType.PRINT] = R(null, null, Precedence.NONE)
rules[TokenType.RETURN] = R(null, null, Precedence.NONE)
rules[TokenType.SUPER] = R(null, null, Precedence.NONE)
rules[TokenType.THIS] = R(null, null, Precedence.NONE)
rules[TokenType.TRUE] = R(literal, null, Precedence.NONE)
rules[TokenType.VAR] = R(null, null, Precedence.NONE)
rules[TokenType.WHILE] = R(null, null, Precedence.NONE)
rules[TokenType.ERROR] = R(null, null, Precedence.NONE)
rules[TokenType.EOF] = R(null, null, Precedence.NONE)
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
  return makeConstant((copyString(name.source, name.start, name.length)))
}
const identifiersEqual = (a: Token, b: Token): boolean => {
  if (a.length !== b.length) return false
  // todo: maybe there is a more performant way?
  return a.source.startsWith(b.source.slice(b.start, b.start + b.length), a.start)
}
const resolveLocal = (compiler: Compiler, name: Token) => {
  for (let i = compiler.localCount - 1; i >= 0; --i) {
    const local = compiler.locals[i]
    if (identifiersEqual(name, local.name)) {
      if (local.depth === -1) {
        error("Can't read local variable in its own initializer.")
      }
      return i
    }
  }
  return -1
}
const addLocal = (name: Token) => {
  if (current.localCount === (255 + 1)) {
    error("Too many local variables in function.")
    return
  }
  const local: Local = current.locals[current.localCount++]
  local.name = name
  local.depth = -1
}
const declareVariable = () => {
  if (current.scopeDepth === 0) return
  const name: Token = parser.previous
  for (let i = current.localCount - 1; i >= 0; --i) {
    const local = current.locals[i]
    if (local.depth !== -1 && local.depth < current.scopeDepth) {
      break
    }
    if (identifiersEqual(name, local.name)) {
      error("Already a variable with this name in this scope.")
    }
  }
  addLocal(name)
}
const parseVariable = (errorMessage: string): number => {
  consume(TokenType.IDENTIFIER, errorMessage)
  declareVariable()
  if (current.scopeDepth > 0) return 0
  return identifierConstant(parser.previous)
}
const markInitialized = () => {
  if (current.scopeDepth === 0) return
  current.locals[current.localCount - 1].depth = current.scopeDepth
}
const defineVariable = (global: number) => {
  if (current.scopeDepth > 0) {
    markInitialized()
    return
  }
  emitBytes(OpCode.OP_DEFINE_GLOBAL, global)
}
const getRule = (type: TokenType): ParseRule => {
  return rules[type]
}
const expression = () => {
  parsePrecedence(Precedence.ASSIGNMENT)
}
const block = () => {
  while (!check(TokenType.RIGHT_BRACE) && !check(TokenType.EOF)) {
    declaration()
  }
  consume(TokenType.RIGHT_BRACE, "Expect '}' after block.")
}
const fun = (type: FunType) => {
  let compiler: Compiler = makeCompiler()
  initCompiler(compiler, type)
  beginScope()
  consume(TokenType.LEFT_PAREN, "Expect '(' after function name.")
  if (!check(TokenType.RIGHT_PAREN)) {
    do {
      current.fun.arity++
      if (current.fun.arity > 255) {
        errorAtCurrent("Can't have more than 255 parameters.")
      }
      const constant = parseVariable("Expect parameter name.")
      defineVariable(constant)
    } while (match(TokenType.COMMA))
  }
  consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.")
  consume(TokenType.LEFT_BRACE, "Expect '{' before function body.")
  block()
  const fun: ObjFun = endCompiler()
  emitBytes(OpCode.OP_CONSTANT, makeConstant((fun)))
}
const funDeclaration = () => {
  const global = parseVariable("Expect function name.")
  markInitialized()
  fun(FunType.FUN)
  defineVariable(global)
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
const forStatement = () => {
  beginScope()
  consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.")
  if (match(TokenType.SEMICOLON)) {
    // No initializer.
  }
  else if (match(TokenType.VAR)) {
    varDeclaration()
  }
  else {
    expressionStatement()
  }
  let loopStart = currentChunk().count
  let exitJump = -1
  if (!match(TokenType.SEMICOLON)) {
    expression()
    consume(TokenType.SEMICOLON, "Expect ';' after loop condition.")
    // Jump out of the loop if the condition is false.
    exitJump = emitJump(OpCode.OP_JUMP_IF_FALSE)
    emitByte(OpCode.OP_POP) // Condition.
  }
  if (!match(TokenType.RIGHT_PAREN)) {
    const bodyJump = emitJump(OpCode.OP_JUMP)
    const incrementStart = currentChunk().count
    expression()
    emitByte(OpCode.OP_POP)
    consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.")
    emitLoop(loopStart)
    loopStart = incrementStart
    patchJump(bodyJump)
  }
  statement()
  emitLoop(loopStart)
  if (exitJump !== -1) {
    patchJump(exitJump)
    emitByte(OpCode.OP_POP) // Condition.
  }
  endScope()
}
const ifStatement = () => {
  consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.")
  expression()
  consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.")
  const thenJump = emitJump(OpCode.OP_JUMP_IF_FALSE)
  emitByte(OpCode.OP_POP)
  statement()
  const elseJump = emitJump(OpCode.OP_JUMP)
  patchJump(thenJump)
  emitByte(OpCode.OP_POP)
  if (match(TokenType.ELSE)) statement()
  patchJump(elseJump)
}
const printStatement = () => {
  expression()
  consume(TokenType.SEMICOLON, "Expect ';' after value.")
  emitByte(OpCode.OP_PRINT)
}
const whileStatement = () => {
  const loopStart = currentChunk().count
  consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.")
  expression()
  consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.")
  const exitJump = emitJump(OpCode.OP_JUMP_IF_FALSE)
  emitByte(OpCode.OP_POP)
  statement()
  emitLoop(loopStart)
  patchJump(exitJump)
  emitByte(OpCode.OP_POP)
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
  if (match(TokenType.FUN)) {
    funDeclaration()
  }
  else if (match(TokenType.VAR)) {
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
  else if (match(TokenType.FOR)) {
    forStatement()
  }
  else if (match(TokenType.IF)) {
    ifStatement()
  }
  else if (match(TokenType.WHILE)) {
    whileStatement()
  }
  else if (match(TokenType.LEFT_BRACE)) {
    beginScope()
    block()
    endScope()
  }
  else {
    expressionStatement()
  }
}
export const compile = (source: string): ObjFun => {
  initScanner(source)
  initCompiler(makeCompiler(), FunType.SCRIPT)
  parser.hadError = false
  parser.panicMode = false
  advance()
  while (!match(TokenType.EOF)) {
    declaration()
  }
  const fun: ObjFun = endCompiler()
  return parser.hadError ? null: fun
}
