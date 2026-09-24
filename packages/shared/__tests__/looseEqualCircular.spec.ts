import { looseEqual, looseIndexOf } from '../src'

const makeGraph = () => {
  const n1: any = { id: 1 }
  const n2: any = { id: 2 }
  n1.peer = n2
  n2.peer = n1
  return [n1, n2]
}

const makeSelfLoop = () => {
  const node: any = { id: 1 }
  node.self = node
  return node
}

const makeChain = (length: number) => {
  const nodes: any[] = []
  for (let i = 0; i < length; i++) {
    nodes.push({ id: i })
  }
  for (let i = 0; i < length; i++) {
    nodes[i].next = nodes[(i + 1) % length]
  }
  return nodes[0]
}

describe('looseEqual with circular references', () => {
  test('compares mutually referencing objects', () => {
    expect(looseEqual(makeGraph(), makeGraph())).toBe(true)
    expect(looseEqual(makeGraph(), makeGraph().reverse())).toBe(false)
  })

  test('compares self-referencing objects', () => {
    expect(looseEqual(makeSelfLoop(), makeSelfLoop())).toBe(true)
    const other = makeSelfLoop()
    other.id = 2
    expect(looseEqual(makeSelfLoop(), other)).toBe(false)
  })

  test('compares self-referencing arrays', () => {
    const makeArr = () => {
      const arr: any[] = [1, 2]
      arr.push(arr)
      return arr
    }
    expect(looseEqual(makeArr(), makeArr())).toBe(true)
    const shorter: any[] = [1]
    shorter.push(shorter)
    expect(looseEqual(makeArr(), shorter)).toBe(false)
  })

  test('compares self-referencing sets', () => {
    const makeSet = () => {
      const set = new Set<any>(['foo'])
      set.add(set)
      return set
    }
    expect(looseEqual(makeSet(), makeSet())).toBe(true)
    const different = new Set<any>(['bar'])
    different.add(different)
    expect(looseEqual(makeSet(), different)).toBe(false)
  })

  test('compares maps containing circular keys and values', () => {
    const makeMapWithCircularValue = () => {
      const map = new Map<any, any>()
      map.set('self', map)
      return map
    }
    expect(
      looseEqual(makeMapWithCircularValue(), makeMapWithCircularValue()),
    ).toBe(true)

    const makeMapWithCircularKey = () => {
      const key: any = { id: 1 }
      key.self = key
      return new Map<any, any>([[key, 'value']])
    }
    expect(
      looseEqual(makeMapWithCircularKey(), makeMapWithCircularKey()),
    ).toBe(true)
  })

  test('compares circular structures nested in arrays, objects and collections', () => {
    const wrap = (node: any) => ({
      list: [node],
      set: new Set([node]),
      map: new Map([['node', node]]),
    })
    expect(looseEqual(wrap(makeSelfLoop()), wrap(makeSelfLoop()))).toBe(true)
    expect(looseEqual([makeGraph()], [makeGraph()])).toBe(true)
  })

  test('compares deep circular chains without stack overflow', () => {
    expect(looseEqual(makeChain(300), makeChain(300))).toBe(true)
    expect(looseEqual(makeChain(300), makeChain(301))).toBe(false)
  })

  test('returns false for cycles of different lengths', () => {
    // 1-cycle: self.next === self
    const one: any = { id: 1 }
    one.next = one
    // 2-cycle: a.next === b && b.next === a
    const a: any = { id: 1 }
    const b: any = { id: 1 }
    a.next = b
    b.next = a
    expect(looseEqual(one, a)).toBe(false)
    expect(looseEqual(a, one)).toBe(false)
  })

  test('returns false for reversed correspondences', () => {
    // a-side shares one node through two paths, b-side uses two distinct nodes
    const makeShared = () => {
      const root: any = {}
      const child: any = { up: root }
      root.p = child
      root.q = child
      return root
    }
    const makeSplit = () => {
      const root: any = {}
      root.p = { up: root }
      root.q = { up: root }
      return root
    }
    expect(looseEqual(makeShared(), makeSplit())).toBe(false)
    expect(looseEqual(makeSplit(), makeShared())).toBe(false)
  })

  test('is symmetric for circular structures', () => {
    const cases: Array<[any, any]> = [
      [makeGraph(), makeGraph()],
      [makeSelfLoop(), makeSelfLoop()],
      [makeChain(50), makeChain(51)],
      [makeSelfLoop(), { id: 1, self: {} }],
    ]
    for (const [x, y] of cases) {
      expect(looseEqual(x, y)).toBe(looseEqual(y, x))
    }
  })

  test('detects leaf differences inside cycles', () => {
    const x = makeSelfLoop()
    const y = makeSelfLoop()
    y.extra = 'only-in-y'
    expect(looseEqual(x, y)).toBe(false)
    expect(looseEqual(y, x)).toBe(false)

    const g1 = makeGraph()
    const g2 = makeGraph()
    g2[1].id = 3
    expect(looseEqual(g1, g2)).toBe(false)
  })

  test('compares circular structures against non-circular ones without hanging', () => {
    const circular = makeSelfLoop()
    const finite = { id: 1, self: { id: 1, self: { id: 1 } } }
    expect(looseEqual(circular, finite)).toBe(false)
    expect(looseEqual(finite, circular)).toBe(false)
  })

  test('still compares shared (non-circular) references by value', () => {
    const shared = { v: 1 }
    const x = { p: shared, q: shared }
    const y = { p: { v: 1 }, q: { v: 1 } }
    expect(looseEqual(x, y)).toBe(true)
    expect(looseEqual(y, x)).toBe(true)
    const z = { p: { v: 1 }, q: { v: 2 } }
    expect(looseEqual(x, z)).toBe(false)
  })

  test('matches circular set members regardless of order', () => {
    const makeSet = (id: number) => {
      const node: any = { id }
      node.self = node
      return new Set<any>([node, 'foo'])
    }
    const setA = makeSet(1)
    const setB = new Set<any>(['foo', ...makeSet(1)])
    expect(looseEqual(setA, setB)).toBe(true)
    expect(looseEqual(setA, makeSet(2))).toBe(false)
  })

  test('is reentrant and leaves no state behind', () => {
    const g1 = makeGraph()
    const g2 = makeGraph()
    const different = makeGraph()
    different[0].id = 99
    for (let i = 0; i < 3; i++) {
      expect(looseEqual(g1, g2)).toBe(true)
      expect(looseEqual(g2, g1)).toBe(true)
      expect(looseEqual(g1, different)).toBe(false)
      // a failing comparison must not corrupt subsequent ones
      expect(looseEqual(g1, g2)).toBe(true)
    }
    // plain comparisons still work after circular ones
    expect(looseEqual('1', 1)).toBe(true)
    expect(looseEqual(true, 1)).toBe(false)
  })

  test('rolls back cycle pairings from failed set candidate matches', () => {
    // key order matters: `self` is compared before `tag`, so a failed
    // candidate still closes (and commits) the cycle before mismatching
    const makeNode = (tag: string) => {
      const node: any = { tag }
      node.self = node
      return node
    }
    const setA = new Set<any>([makeNode('x'), makeNode('y')])
    const setB = new Set<any>([makeNode('y'), makeNode('x')])
    expect(looseEqual(setA, setB)).toBe(true)
    expect(looseEqual(setB, setA)).toBe(true)
  })

  test('looseIndexOf finds circular structures', () => {
    const list = [makeSelfLoop(), makeGraph()]
    expect(looseIndexOf(list, makeGraph())).toBe(1)
    expect(looseIndexOf(list, makeSelfLoop())).toBe(0)
    const other = makeSelfLoop()
    other.id = 2
    expect(looseIndexOf(list, other)).toBe(-1)
  })
})
