import { isArray, isDate, isMap, isObject, isSet, isSymbol } from './general'

interface CompareState {
  aToB: Map<any, any>
  bToA: Map<any, any>
  path: Array<[any, any]>
  pathPositions: Map<any, number>
  committed: Set<any>
  commitLog: any[]
}

function createCompareState(): CompareState {
  return {
    aToB: new Map(),
    bToA: new Map(),
    path: [],
    pathPositions: new Map(),
    committed: new Set(),
    commitLog: [],
  }
}

function commitPathFrom(state: CompareState, index: number) {
  for (let i = index; i < state.path.length; i++) {
    const a = state.path[i][0]
    if (!state.committed.has(a)) {
      state.committed.add(a)
      state.commitLog.push(a)
    }
  }
}

function rollbackCommits(state: CompareState, count: number) {
  while (state.commitLog.length > count) {
    const a = state.commitLog.pop()
    state.committed.delete(a)
    if (!state.pathPositions.has(a)) {
      state.bToA.delete(state.aToB.get(a))
      state.aToB.delete(a)
    }
  }
}

function looseCompareArrays(a: any[], b: any[], state: CompareState) {
  if (a.length !== b.length) return false
  let equal = true
  for (let i = 0; equal && i < a.length; i++) {
    equal = looseCompare(a[i], b[i], state)
  }
  return equal
}

function looseCompareCollections(
  a: Map<any, any> | Set<any>,
  b: Map<any, any> | Set<any>,
  state: CompareState,
) {
  if (a.size !== b.size) return false
  const candidates = Array.from(b)
  const matched = new Uint8Array(candidates.length)
  for (const item of a) {
    let index = -1
    for (let i = 0; i < candidates.length; i++) {
      if (!matched[i]) {
        const commitCount = state.commitLog.length
        if (looseCompare(item, candidates[i], state)) {
          index = i
          break
        }
        rollbackCommits(state, commitCount)
      }
    }
    if (index < 0) return false
    matched[index] = 1
  }
  return true
}

function looseCompareObjects(a: any, b: any, state: CompareState): boolean {
  let aValidType = isArray(a)
  let bValidType = isArray(b)
  if (aValidType || bValidType) {
    return aValidType && bValidType ? looseCompareArrays(a, b, state) : false
  }
  aValidType = isMap(a)
  bValidType = isMap(b)
  if (aValidType || bValidType) {
    return aValidType && bValidType
      ? looseCompareCollections(a, b, state)
      : false
  }
  aValidType = isSet(a)
  bValidType = isSet(b)
  if (aValidType || bValidType) {
    return aValidType && bValidType
      ? looseCompareCollections(a, b, state)
      : false
  }
  const aKeysCount = Object.keys(a).length
  const bKeysCount = Object.keys(b).length
  if (aKeysCount !== bKeysCount) {
    return false
  }
  for (const key in a) {
    const aHasKey = a.hasOwnProperty(key)
    const bHasKey = b.hasOwnProperty(key)
    if (
      (aHasKey && !bHasKey) ||
      (!aHasKey && bHasKey) ||
      !looseCompare(a[key], b[key], state)
    ) {
      return false
    }
  }
  return String(a) === String(b)
}

function looseCompare(a: any, b: any, state: CompareState): boolean {
  if (a === b) return true
  let aValidType = isDate(a)
  let bValidType = isDate(b)
  if (aValidType || bValidType) {
    return aValidType && bValidType ? a.getTime() === b.getTime() : false
  }
  aValidType = isSymbol(a)
  bValidType = isSymbol(b)
  if (aValidType || bValidType) {
    return a === b
  }
  aValidType = isObject(a)
  bValidType = isObject(b)
  if (aValidType && bValidType) {
    if (state.aToB.has(a) || state.bToA.has(b)) {
      if (state.aToB.get(a) !== b || state.bToA.get(b) !== a) {
        return false
      }
      const index = state.pathPositions.get(a)
      if (index !== undefined) {
        commitPathFrom(state, index)
      }
      return true
    }
    state.aToB.set(a, b)
    state.bToA.set(b, a)
    state.pathPositions.set(a, state.path.length)
    state.path.push([a, b])
    let equal: boolean
    try {
      equal = looseCompareObjects(a, b, state)
    } finally {
      state.path.pop()
      state.pathPositions.delete(a)
      if (!state.committed.has(a)) {
        state.aToB.delete(a)
        state.bToA.delete(b)
      }
    }
    return equal
  }
  if (aValidType || bValidType) {
    return false
  }
  return String(a) === String(b)
}

export function looseEqual(a: any, b: any): boolean {
  return looseCompare(a, b, createCompareState())
}

export function looseIndexOf(arr: any[], val: any): number {
  return arr.findIndex(item => looseEqual(item, val))
}
