import { isArray, isDate, isMap, isObject, isSet, isSymbol } from './general'

type SeenMap = Map<object, object>

function looseCompareArrays(
  a: any[],
  b: any[],
  seenA: SeenMap,
  seenB: SeenMap,
) {
  if (a.length !== b.length) return false
  let equal = true
  for (let i = 0; equal && i < a.length; i++) {
    equal = looseEqualValue(a[i], b[i], seenA, seenB)
  }
  return equal
}

function looseCompareCollections(
  a: Map<any, any> | Set<any>,
  b: Map<any, any> | Set<any>,
  seenA: SeenMap,
  seenB: SeenMap,
) {
  if (a.size !== b.size) return false
  const candidates = Array.from(b)
  const matched = new Uint8Array(candidates.length)
  for (const item of a) {
    let index = -1
    for (let i = 0; i < candidates.length; i++) {
      if (!matched[i] && looseEqualValue(item, candidates[i], seenA, seenB)) {
        index = i
        break
      }
    }
    if (index < 0) return false
    matched[index] = 1
  }
  return true
}

// Runs the structural comparison of a container pair while keeping track of
// every (a, b) pair currently being expanded on the recursion stack. This
// makes circular references terminate instead of recursing forever.
//
// - revisiting the exact same pair closes an isomorphic cycle -> equal
// - revisiting either side paired with a different object means the cycles
//   have different lengths or diverge in their correspondence -> not equal
function compareObjectPair(
  a: object,
  b: object,
  seenA: SeenMap,
  seenB: SeenMap,
  compare: () => boolean,
): boolean {
  if (seenA.get(a) === b) {
    return true
  }
  if (seenA.has(a) || seenB.has(b)) {
    return false
  }
  seenA.set(a, b)
  seenB.set(b, a)
  try {
    return compare()
  } finally {
    seenA.delete(a)
    seenB.delete(b)
  }
}

function looseEqualValue(
  a: any,
  b: any,
  seenA: SeenMap,
  seenB: SeenMap,
): boolean {
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
  aValidType = isArray(a)
  bValidType = isArray(b)
  if (aValidType || bValidType) {
    return aValidType && bValidType
      ? compareObjectPair(a, b, seenA, seenB, () =>
          looseCompareArrays(a, b, seenA, seenB),
        )
      : false
  }
  aValidType = isObject(a)
  bValidType = isObject(b)
  if (aValidType || bValidType) {
    if (!aValidType || !bValidType) {
      return false
    }
    aValidType = isMap(a)
    bValidType = isMap(b)
    if (aValidType || bValidType) {
      return aValidType && bValidType
        ? compareObjectPair(a, b, seenA, seenB, () =>
            looseCompareCollections(a, b, seenA, seenB),
          )
        : false
    }
    aValidType = isSet(a)
    bValidType = isSet(b)
    if (aValidType || bValidType) {
      return aValidType && bValidType
        ? compareObjectPair(a, b, seenA, seenB, () =>
            looseCompareCollections(a, b, seenA, seenB),
          )
        : false
    }
    return compareObjectPair(a, b, seenA, seenB, () => {
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
          !looseEqualValue(a[key], b[key], seenA, seenB)
        ) {
          return false
        }
      }
      return String(a) === String(b)
    })
  }
  return String(a) === String(b)
}

export function looseEqual(a: any, b: any): boolean {
  const seenA: SeenMap = new Map()
  const seenB: SeenMap = new Map()
  return looseEqualValue(a, b, seenA, seenB)
}

export function looseIndexOf(arr: any[], val: any): number {
  return arr.findIndex(item => looseEqual(item, val))
}
