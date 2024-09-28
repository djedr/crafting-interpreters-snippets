import { exit } from "node:process"
import * as fs from 'node:fs'
import { addConstant, freeChunk, makeChunk, OpCode, writeChunk } from "./chunk.js"
import { freeVm, initVm, interpret } from "./vm.js"
import { readLine } from "./readLine.js"

const repl = async () => {
  for (;;) {
    const line = await readLine()
    if (line === null) break
    interpret(line)
  }
}

const runFile = (path: string) => {
  return interpret(fs.readFileSync(path, 'utf8'))
}



///
/// main
///

initVm()

const argc = process.argv.length

console.log('welcome to tslox')
console.log('argc', argc)

if (argc === 2) {
  repl()
}
else if (argc === 3) {
  console.log(process.argv)
  runFile(process.argv[2])
}
else {
  // todo: proper message
  console.error("Usage: tslox [path]")
  exit(64)
}

// freeVm()