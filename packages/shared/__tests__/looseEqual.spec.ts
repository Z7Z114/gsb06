import { looseEqual, looseIndexOf } from '../src'

describe('utils/looseEqual', () => {
  test('compares booleans correctly', () => {
    expect(looseEqual(true, true)).toBe(true)
    expect(looseEqual(false, false)).toBe(true)
    expect(looseEqual(true, false)).toBe(false)
    expect(looseEqual(true, 1)).toBe(false)
    expect(looseEqual(false, 0)).toBe(false)
  })

  test('compares strings correctly', () => {
    const text = 'Lorem ipsum'
    const number = 1
    const bool = true

    expect(looseEqual(text, text)).toBe(true)
    expect(looseEqual(text, text.slice(0, -1))).toBe(false)
    expect(looseEqual(String(number), number)).toBe(true)
    expect(looseEqual(String(bool), bool)).toBe(true)
  })

  test('compares numbers correctly', () => {
    const number = 100
    const decimal = 2.5
    const multiplier = 1.0000001

    expect(looseEqual(number, number)).toBe(true)
    expect(looseEqual(number, number - 1)).toBe(false)
    expect(looseEqual(decimal, decimal)).toBe(true)
    expect(looseEqual(decimal, decimal * multiplier)).toBe(false)
    expect(looseEqual(number, number * multiplier)).toBe(false)
    expect(looseEqual(multiplier, multiplier)).toBe(true)
  })

  test('compares dates correctly', () => {
    const date1 = new Date(2019, 1, 2, 3, 4, 5, 6)
    const date2 = new Date(2019, 1, 2, 3, 4, 5, 6)
    const date3 = new Date(2019, 1, 2, 3, 4, 5, 7)
    const date4 = new Date(2219, 1, 2, 3, 4, 5, 6)

    // Identical date object references
    expect(looseEqual(date1, date1)).toBe(true)
    // Different date references with identical values
    expect(looseEqual(date1, date2)).toBe(true)
    // Dates with slightly different time (ms)
    expect(looseEqual(date1, date3)).toBe(false)
    // Dates with different year
    expect(looseEqual(date1, date4)).toBe(false)
  })

  test('compares symbols correctly', () => {
    const symbol1 = Symbol('a')
    const symbol2 = Symbol('a')
    const symbol3 = Symbol('b')
    const notSymbol = 0

    expect(looseEqual(symbol1, symbol1)).toBe(true)
    expect(looseEqual(symbol1, symbol2)).toBe(false)
    expect(looseEqual(symbol1, symbol3)).toBe(false)
    expect(looseEqual(symbol1, notSymbol)).toBe(false)
  })

  test('compares files correctly', () => {
    const date1 = new Date(2019, 1, 2, 3, 4, 5, 6)
    const date2 = new Date(2019, 1, 2, 3, 4, 5, 7)
    const file1 = new File([''], 'filename.txt', {
      type: 'text/plain',
      lastModified: date1.getTime(),
    })
    const file2 = new File([''], 'filename.txt', {
      type: 'text/plain',
      lastModified: date1.getTime(),
    })
    const file3 = new File([''], 'filename.txt', {
      type: 'text/plain',
      lastModified: date2.getTime(),
    })
    const file4 = new File([''], 'filename.csv', {
      type: 'text/csv',
      lastModified: date1.getTime(),
    })
    const file5 = new File(['abcdef'], 'filename.txt', {
      type: 'text/plain',
      lastModified: date1.getTime(),
    })
    const file6 = new File(['12345'], 'filename.txt', {
      type: 'text/plain',
      lastModified: date1.getTime(),
    })

    // Identical file object references
    expect(looseEqual(file1, file1)).toBe(true)
    // Different file references with identical values
    expect(looseEqual(file1, file2)).toBe(true)
    // Files with slightly different dates
    expect(looseEqual(file1, file3)).toBe(false)
    // Two different file types
    expect(looseEqual(file1, file4)).toBe(false)
    // Two files with same name, modified date, but different content
    expect(looseEqual(file5, file6)).toBe(false)
  })

  test('compares arrays correctly', () => {
    const arr1 = [1, 2, 3, 4]
    const arr2 = [1, 2, 3, '4']
    const arr3 = [1, 2, 3, 4, 5]
    const arr4 = [1, 2, 3, 4, { a: 5 }]

    // Identical array references
    expect(looseEqual(arr1, arr1)).toBe(true)
    // Different array references with identical values
    expect(looseEqual(arr1, arr1.slice())).toBe(true)
    expect(looseEqual(arr4, arr4.slice())).toBe(true)
    // Array with one value different (loose)
    expect(looseEqual(arr1, arr2)).toBe(true)
    // Array with one value different
    expect(looseEqual(arr3, arr4)).toBe(false)
    // Arrays with different lengths
    expect(looseEqual(arr1, arr3)).toBe(false)
    // Arrays with values in different order
    expect(looseEqual(arr1, arr1.slice().reverse())).toBe(false)
  })

  test('compares RegExp correctly', () => {
    const rx1 = /^foo$/
    const rx2 = /^foo$/
    const rx3 = /^bar$/
    const rx4 = /^bar$/i

    // Identical regex references
    expect(looseEqual(rx1, rx1)).toBe(true)
    // Different regex references with identical values
    expect(looseEqual(rx1, rx2)).toBe(true)
    // Different regex
    expect(looseEqual(rx1, rx3)).toBe(false)
    // Same regex with different options
    expect(looseEqual(rx3, rx4)).toBe(false)
  })

  test('compares objects correctly', () => {
    const obj1 = { foo: 'bar' }
    const obj2 = { foo: 'bar1' }
    const obj3 = { a: 1, b: 2, c: 3 }
    const obj4 = { b: 2, c: 3, a: 1 }
    const obj5 = { ...obj4, z: 999 }
    const nestedObj1 = { ...obj1, bar: [{ ...obj1 }, { ...obj1 }] }
    const nestedObj2 = { ...obj1, bar: [{ ...obj1 }, { ...obj2 }] }

    // Identical object references
    expect(looseEqual(obj1, obj1)).toBe(true)
    // Two objects with identical keys/values
    expect(looseEqual(obj1, { ...obj1 })).toBe(true)
    // Different key values
    expect(looseEqual(obj1, obj2)).toBe(false)
    // Keys in different orders
    expect(looseEqual(obj3, obj4)).toBe(true)
    // One object has additional key
    expect(looseEqual(obj4, obj5)).toBe(false)
    // Identical object references with nested array
    expect(looseEqual(nestedObj1, nestedObj1)).toBe(true)
    // Identical object definitions with nested array
    expect(looseEqual(nestedObj1, { ...nestedObj1 })).toBe(true)
    // Object definitions with nested array (which has different order)
    expect(looseEqual(nestedObj1, nestedObj2)).toBe(false)
  })

  test('compares different types correctly', () => {
    const obj1 = {}
    const obj2 = { a: 1 }
    const obj3 = { 0: 0, 1: 1, 2: 2 }
    const arr1: any[] = []
    const arr2 = [1]
    const arr3 = [0, 1, 2]
    const date1 = new Date(2019, 1, 2, 3, 4, 5, 6)
    const file1 = new File([''], 'filename.txt', {
      type: 'text/plain',
      lastModified: date1.getTime(),
    })

    expect(looseEqual(123, '123')).toBe(true)
    expect(looseEqual(123, new Date(123))).toBe(false)
    expect(looseEqual(`123`, new Date(123))).toBe(false)
    expect(looseEqual([1, 2, 3], '1,2,3')).toBe(false)
    expect(looseEqual(obj1, arr1)).toBe(false)
    expect(looseEqual(obj2, arr2)).toBe(false)
    expect(looseEqual(obj1, '[object Object]')).toBe(false)
    expect(looseEqual(arr1, '[object Array]')).toBe(false)
    expect(looseEqual(obj1, date1)).toBe(false)
    expect(looseEqual(obj2, date1)).toBe(false)
    expect(looseEqual(arr1, date1)).toBe(false)
    expect(looseEqual(arr2, date1)).toBe(false)
    expect(looseEqual(obj2, file1)).toBe(false)
    expect(looseEqual(arr2, file1)).toBe(false)
    expect(looseEqual(date1, file1)).toBe(false)
    // Special case where an object's keys are the same as keys (indexes) of an array
    expect(looseEqual(obj3, arr3)).toBe(false)
  })

  test('compares null and undefined values correctly', () => {
    expect(looseEqual(null, null)).toBe(true)
    expect(looseEqual(undefined, undefined)).toBe(true)
    expect(looseEqual(void 0, undefined)).toBe(true)
    expect(looseEqual(null, undefined)).toBe(false)
    expect(looseEqual(null, void 0)).toBe(false)
    expect(looseEqual(null, '')).toBe(false)
    expect(looseEqual(null, false)).toBe(false)
    expect(looseEqual(undefined, false)).toBe(false)
  })

  test('compares sparse arrays correctly', () => {
    // The following arrays all have a length of 3
    // But the first two are "sparse"
    const arr1 = []
    arr1[2] = true
    const arr2 = []
    arr2[2] = true
    const arr3 = [false, false, true]
    const arr4 = [undefined, undefined, true]
    // This one is also sparse (missing index 1)
    const arr5 = []
    arr5[0] = arr5[2] = true

    expect(looseEqual(arr1, arr2)).toBe(true)
    expect(looseEqual(arr2, arr1)).toBe(true)
    expect(looseEqual(arr1, arr3)).toBe(false)
    expect(looseEqual(arr3, arr1)).toBe(false)
    expect(looseEqual(arr1, arr4)).toBe(true)
    expect(looseEqual(arr4, arr1)).toBe(true)
    expect(looseEqual(arr1, arr5)).toBe(false)
    expect(looseEqual(arr5, arr1)).toBe(false)
  })

  test('compares maps correctly', () => {
    const map = new Map<any, any>([
      [{ id: 1 }, { value: '1' }],
      ['foo', 'bar'],
    ])

    expect(looseEqual(map, map)).toBe(true)
    expect(
      looseEqual(
        map,
        new Map<any, any>([
          ['foo', 'bar'],
          [{ id: '1' }, { value: 1 }],
        ]),
      ),
    ).toBe(true)
    expect(looseEqual(map, new Map([['foo', 'bar']]))).toBe(false)
    expect(looseEqual(new Map([['a', 1]]), new Map([['b', 2]]))).toBe(false)
    expect(
      looseEqual(
        new Map<any, any>([
          ['a', 1],
          ['b', 2],
        ]),
        new Map<any, any>([
          ['a', 2],
          ['b', 1],
        ]),
      ),
    ).toBe(false)
    expect(
      looseEqual(
        new Map<any, any>([
          [1, 'value'],
          ['1', 'value'],
        ]),
        new Map<any, any>([
          [1, 'value'],
          [2, 'value'],
        ]),
      ),
    ).toBe(false)
  })

  test('compares sets correctly', () => {
    const set = new Set<any>([{ id: 1 }, 'foo'])

    expect(looseEqual(set, set)).toBe(true)
    expect(looseEqual(set, new Set(['foo', { id: '1' }]))).toBe(true)
    expect(looseEqual(set, new Set(['foo']))).toBe(false)
    expect(looseEqual(new Set([1]), new Set([2]))).toBe(false)
    expect(looseEqual(new Set<any>([1, '1']), new Set<any>([1, 2]))).toBe(false)
    expect(looseEqual(new Set(), new Map())).toBe(false)
  })
})

describe('utils/looseEqual circular references', () => {
  // Builds two separate but structurally identical mutual-reference graphs:
  // [n1 <-> n2] and [m1 <-> m2]
  const makeGraph = () => {
    const n1: any = { id: 1 }
    const n2: any = { id: 2 }
    n1.peer = n2
    n2.peer = n1
    return [n1, n2]
  }

  test('does not throw on circular graphs and compares isomorphic ones', () => {
    // 1. mutual references embedded inside an array
    expect(() => looseEqual(makeGraph(), makeGraph())).not.toThrow()
    expect(looseEqual(makeGraph(), makeGraph())).toBe(true)

    // 2. self-referencing object
    const selfA: any = { id: 1 }
    selfA.self = selfA
    const selfB: any = { id: 1 }
    selfB.self = selfB
    expect(looseEqual(selfA, selfB)).toBe(true)

    // 3. self-referencing Set
    const setA = new Set<any>()
    setA.add(1)
    setA.add(setA)
    const setB = new Set<any>()
    setB.add(1)
    setB.add(setB)
    expect(looseEqual(setA, setB)).toBe(true)

    // 4. circular array
    const arrA: any[] = [1]
    arrA.push(arrA)
    const arrB: any[] = [1]
    arrB.push(arrB)
    expect(looseEqual(arrA, arrB)).toBe(true)

    // 5. Map containing a circular value
    const mapA = new Map<string, any>([['a', 1]])
    mapA.set('self', mapA)
    const mapB = new Map<string, any>([['a', 1]])
    mapB.set('self', mapB)
    expect(looseEqual(mapA, mapB)).toBe(true)

    // 6. circular structure nested inside arrays / objects / collections
    expect(looseEqual({ list: makeGraph() }, { list: makeGraph() })).toBe(true)
    expect(
      looseEqual(new Set([makeGraph()]), new Set([makeGraph()])),
    ).toBe(true)
    expect(
      looseEqual(
        new Map([['graph', makeGraph()]]),
        new Map([['graph', makeGraph()]]),
      ),
    ).toBe(true)
  })

  test('handles cycles hundreds of levels deep', () => {
    const makeChain = (length: number, tailTarget: number) => {
      const nodes: any[] = []
      for (let i = 0; i < length; i++) {
        nodes.push({ id: i })
      }
      nodes.forEach((node, i) => {
        node.next = nodes[(i + 1) % length]
      })
      // sanity: the tail points back into the chain, closing a cycle
      expect(nodes[length - 1].next).toBe(nodes[tailTarget])
      return nodes[0]
    }
    const depth = 200
    expect(looseEqual(makeChain(depth, 0), makeChain(depth, 0))).toBe(true)
    // cycles of different lengths must not match
    expect(looseEqual(makeChain(depth, 0), makeChain(depth - 1, 0))).toBe(
      false,
    )
  })

  test('distinguishes a self loop from a two-node cycle', () => {
    const self: any = { id: 1 }
    self.next = self

    const a: any = { id: 1 }
    const b: any = { id: 1 }
    a.next = b
    b.next = a

    expect(looseEqual(self, a)).toBe(false)
    expect(looseEqual(a, self)).toBe(false)
  })

  test('rejects reverse / conflicting correspondences', () => {
    // a pairs with b at the root, but a.peer closes back to a instead of b
    const rootA: any = { id: 1 }
    const rootB: any = { id: 1 }
    const otherB: any = { id: 1 }
    rootA.peer = rootA
    rootB.peer = otherB
    otherB.peer = rootB
    expect(looseEqual(rootA, rootB)).toBe(false)
    expect(looseEqual(rootB, rootA)).toBe(false)

    // same cycle length but the corresponding nodes carry different leaves
    const x1: any = { id: 1 }
    const x2: any = { id: 2 }
    x1.peer = x2
    x2.peer = x1
    const y1: any = { id: 1 }
    const y2: any = { id: 99 }
    y1.peer = y2
    y2.peer = y1
    expect(looseEqual(x1, y1)).toBe(false)
    expect(looseEqual(y1, x1)).toBe(false)

    // identical leaves but the extra key breaks structural equality
    expect(looseEqual(makeGraph(), [...makeGraph(), 3])).toBe(false)
  })

  test('is symmetric for circular structures', () => {
    const selfA: any = { id: 1 }
    selfA.self = selfA
    const selfB: any = { id: 1, other: true }
    selfB.self = selfB

    const cases: [any, any][] = [
      [makeGraph(), makeGraph()],
      [selfA, selfB],
    ]
    for (const [x, y] of cases) {
      expect(looseEqual(x, y)).toBe(looseEqual(y, x))
    }
  })

  test('keeps DAG (acyclic shared references) semantics', () => {
    // shared references without a cycle must stay structurally equal
    const shared = { v: 1 }
    const dagA = { x: shared, y: shared }
    const dagB = { x: { v: 1 }, y: { v: 1 } }
    expect(looseEqual(dagA, dagB)).toBe(true)
    expect(looseEqual(dagB, dagA)).toBe(true)

    const dagC = { x: { v: 1 }, y: { v: 2 } }
    expect(looseEqual(dagA, dagC)).toBe(false)
  })

  test('preserves existing semantics for containers holding cyclic members', () => {
    const selfA: any = { id: 1 }
    selfA.self = selfA
    const selfB: any = { id: 2 }
    selfB.self = selfB

    // Set vs Map mismatch still wins even with cyclic content
    const cyclicSet = new Set<any>([selfA])
    const cyclicMap = new Map<any, any>([[selfA, 1]])
    expect(looseEqual(cyclicSet, cyclicMap)).toBe(false)

    // order-independent matching with a cyclic member present
    expect(
      looseEqual(new Set<any>([1, selfA]), new Set<any>([selfA, 1])),
    ).toBe(true)
    expect(
      looseEqual(new Set<any>([1, selfA]), new Set<any>([2, selfA])),
    ).toBe(false)

    // Map key/value matching with a circular key
    expect(
      looseEqual(
        new Map<any, any>([[selfA, 1]]),
        new Map<any, any>([[selfB, 1]]),
      ),
    ).toBe(false)
  })

  test('is reentrant: state is cleaned up between calls', () => {
    const g1 = makeGraph()
    const g2 = makeGraph()
    for (let i = 0; i < 50; i++) {
      expect(looseEqual(g1, g2)).toBe(true)
      expect(looseEqual(g2, g1)).toBe(true)
      expect(looseEqual(g1, g1)).toBe(true)
    }
    // nested invocation from within a comparison must not see outer state:
    // looseIndexOf compares several unrelated cyclic elements in one loop
    const a: any = { id: 1 }
    a.self = a
    const b: any = { id: 2 }
    b.self = b
    const c: any = { id: 1 }
    c.self = c
    expect(looseIndexOf([b, c], a)).toBe(1)
    expect(looseIndexOf([b, c], { id: 3 })).toBe(-1)
  })

  test('keeps the public signature unchanged', () => {
    expect(looseEqual.length).toBe(2)
    expect(looseIndexOf.length).toBe(2)
  })
})
