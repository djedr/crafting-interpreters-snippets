import { markObject, markValue } from "./memory.js";
import { ObjString } from "./object.js";
import { Value } from "./value.js";

#include "value.h"

#define TABLE_MAX_LOAD 0.75

export interface Entry {
  key: ObjString;
  value: Value;
}

export interface Table {
  count: number;
  capacity: number;
  entries: Entry[];
}

export const makeTable = () => {
  return {
    count: 0,
    capacity: 0,
    entries: [],
  }
}

export const freeTable = (table: Table) => {
  // free entries
  // reinit table
}

const findEntry = (
  entries: Entry[],
  capacity: number,
  key: ObjString,
): Entry => {
  let index = key.hash & (capacity - 1)
  let tombstone: Entry = null
  for (;;) {
    const entry = entries[index]
    if (entry.key === null) {
      if (IS_NIL(entry.value)) {
        // Empty entry.
        return tombstone !== null ? tombstone : entry
      }
      else {
        // We found a tombstone.
        if (tombstone === null) tombstone = entry
      }
    }
    else if (entry.key === key) {
      // We found the key.
      return entry
    }

    index = (index + 1) & (capacity - 1)
  }
}

export const tableGet = (table: Table, key: ObjString): Value | undefined => {
  if (table.count === 0) return undefined

  const entry = findEntry(table.entries, table.capacity, key)
  if (entry.key === null) return undefined

  return entry.value
}

const adjustCapacity = (table: Table, capacity: number) => {
  const entries: Entry[] = Array(capacity)
  for (let i = 0; i < capacity; ++i) {
    entries[i] = {key: null, value: NIL_VAL}
  }

  table.count = 0
  for (let i = 0; i < table.capacity; ++i) {
    const entry = table.entries[i]
    if (entry.key === null) continue
    const dest = findEntry(entries, capacity, entry.key)
    dest.key = entry.key
    dest.value = entry.value
    table.count += 1
  }

  // FREE_ARRAY(Entry, table.entries, table.capacity)
  table.entries = entries
  table.capacity = capacity
}

export const tableSet = (table: Table, key: ObjString, value: Value) => {
  if (table.count + 1 > table.capacity * TABLE_MAX_LOAD) {
    const capacity = table.capacity < 8? 8: table.capacity * 2
    adjustCapacity(table, capacity)
  }

  const entry: Entry = findEntry(table.entries, table.capacity, key)
  const isNewKey = entry.key === null
  if (isNewKey && IS_NIL(entry.value)) table.count += 1

  entry.key = key
  entry.value = value
  return isNewKey
}

export const tableDelete = (table: Table, key: ObjString): boolean => {
  if (table.count === 0) return false

  // Find the entry.
  const entry = findEntry(table.entries, table.capacity, key)
  if (entry.key === null) return false

  // Place a tombstone in the entry.
  entry.key = null
  entry.value = BOOL_VAL(true)
  return true
}

export const tableAddAll = (from: Table, to: Table) => {
  for (let i = 0; i < from.capacity; ++i) {
    const entry = from.entries[i]
    if (entry.key !== null) {
      tableSet(to, entry.key, entry.value)
    }
  }
}

export const tableFindString = (table: Table, chars: string, length: number, hash: number): ObjString => {
  if (table.count === 0) return null

  let index = hash & (table.capacity - 1)
  for (;;) {
    const entry = table.entries[index]
    if (entry.key === null) {
      // Stop if we find an empty non-tombstone entry.
      if (IS_NIL(entry.value)) return null
    }
    else if (entry.key.length === length && entry.key.hash === hash && entry.key.chars === chars) {
      // We found it.
      return entry.key
    }

    index = (index + 1) & (table.capacity - 1)
  }
}

export const tableRemoveWhite = (table: Table) => {
  for (let i = 0; i < table.capacity; ++i) {
    const entry = table.entries[i]
    if (entry.key !== null && !entry.key.isMarked) {
      tableDelete(table, entry.key)
    }
  }
}

export const markTable = (table: Table) => {
  for (let i = 0; i < table.capacity; ++i) {
    const entry: Entry = table.entries[i]
    markObject(entry.key)
    markValue(entry.value)
  }
}