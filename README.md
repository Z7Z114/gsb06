# @vue/shared（裁剪快照）

从 [vuejs/core](https://github.com/vuejs/core) 的 `packages/shared` 提取的最小可运行快照，只保留
`looseEqual` 相关源码与测试。

## 目录

- `packages/shared/src/general.ts` —— 类型判定工具（isObject / isArray / isMap / isSet / isDate / isSymbol 等）
- `packages/shared/src/looseEqual.ts` —— 宽松相等工具，导出 `looseEqual` 与 `looseIndexOf`
- `packages/shared/src/makeMap.ts`、`packages/shared/src/index.ts` —— 包入口
- `packages/shared/__tests__/looseEqual.spec.ts` —— 现有测试

## 命令

```bash
npm install
npm test           # vitest run
npm run typecheck  # tsc --noEmit
```

## 背景

`looseEqual` 是 Vue 内部做“宽松相等”比较的核心工具：递归按值比较数组、普通对象、`Map`、`Set`、
`Date` 与基本类型；数字与字符串之间按 `String(a) === String(b)` 处理，因此
`looseEqual('1', 1)` 为 `true`。

它被 `runtime-dom` 的 v-model（select / checkbox / radio 选项匹配）、`server-renderer` 的 SSR
v-model，以及 `runtime-core` 的 props 变化检测所依赖。

## 环形引用支持

旧版实现拿“存在环形引用（互相指向）”的对象去比较时，会无限递归并抛
`RangeError: Maximum call stack size exceeded`；现已修复。例如：

```ts
import { looseEqual } from './packages/shared/src'

const makeGraph = () => {
  const n1 = { id: 1 }
  const n2 = { id: 2 }
  n1.peer = n2
  n2.peer = n1
  return [n1, n2]
}

looseEqual(makeGraph(), makeGraph())
// true（修复前：RangeError: Maximum call stack size exceeded）
```

自引用对象、自引用 `Set`、`Map` 内含环形值、环形数组，以及环形结构嵌在数组 / 对象 / 集合内部时同样适用。

### 修复语义

比较从顶层调用开始，内部维护两张仅在当前递归栈上生效的对象对应表：

- `seenA`：左侧对象 `a` 当前正在与哪个右侧对象比较；
- `seenB`：右侧对象 `b` 当前正在与哪个左侧对象比较（反向表，保证对称）。

进入数组 / 普通对象 / `Map` / `Set` 的结构性递归前登记这一对 `(a, b)`，递归返回（无论成功或提前退出）时通过
`try/finally` 注销。再次遇到正在栈上的对象时有三种情况：

1. `seenA.get(a) === b`：沿同一条对应关系绕回，说明两边闭合的是**同构的环**，直接判定该环相等；
2. `a` 已在栈上但对应的不是 `b`（或 `b` 已对应别的对象）：环长不同或对应关系冲突，返回 `false`；
3. 双方都不在栈上：正常登记并继续结构比较。

由此保证：

- 同构的环（自引用、互相引用、环形数组、自引用 `Set`、`Map` 装着环形值）判定为相等；
- 环长不同的结构不相等（自环 `self.next === self` 与二节点环 `a.next → b → a` 不相等）；
- 判定关于参数顺序对称：`looseEqual(x, y) === looseEqual(y, x)`；
- 反向对应（一边回指、另一边指向新节点）不相等。

对应表是“栈作用域”而非全局缓存：无环的共享引用（DAG，同一对象被多个字段引用）在每条递归路径结束后即注销，
仍按结构展开比较，既有“按值相等”语义不变。

### 已知边界

- 对应关系按字段 / 下标的访问顺序建立，要求环在两边的闭合位置一致；它判定的是“按相同遍历路径的同构”，
  不是图论意义上对任意自同构都成立的完整图同构。
- `Set` 成员仍是无序的“贪心存在匹配”（沿用原算法，与 Vue 上游一致）：成员存在一一对应即可，
  不做回溯，因此极少数“多个成员同时可匹配多个候选”的集合可能漏配；环形成员不改变这一既有行为。
- `Map` 按迭代项（`[key, value]` 数组）整体比较，键与值都参与宽松相等，`Map` 与 `Set` 混用仍为 `false`。
- 对应表只追踪对象 / 数组 / `Map` / `Set`；`Date`、`Symbol`、基本类型不登记。极度深但**无环**的结构仍受
  JS 调用栈深度限制（这是修复前就存在的限制，本次不改变）；环形结构的环长本身不再导致无限递归。
- 递归状态完全是函数内部局部变量，每次顶层调用新建、返回即销毁；`looseEqual(a, b)` 与
  `looseIndexOf(arr, val)` 的签名与调用方式不变。

## 行为规格（`looseEqual` 的既有语义，修复时不得改变）

1. 基本类型按“宽松相等”比较：数字与字符串相等（`'1'` 与 `1` 相等），布尔与数字**不**相等（`true` 与 `1` 不等）。
2. `Date` 按时间戳比较；`Symbol` 只能与自身相等。
3. 数组按长度与逐位元素比较；普通对象按键数量与逐键值比较。
4. `Map` / `Set` 按大小与成员的“存在匹配”比较，匹配与顺序无关；`Map` 与 `Set` 混用视为不相等。
5. 递归比较共享引用或环形结构时，不能栈溢出。
