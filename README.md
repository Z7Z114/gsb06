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

## 已知问题

拿“存在环形引用（互相指向）”的对象去比较时，`looseEqual` 会无限递归并抛
`RangeError: Maximum call stack size exceeded`。例如：

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
// 期望：true
// 实际：RangeError: Maximum call stack size exceeded
```

自引用对象、自引用 `Set`、`Map` 内含环形值、以及环形结构嵌在数组 / 对象 / 集合内部时同样会命中。

## 行为规格（`looseEqual` 的既有语义，修复时不得改变）

1. 基本类型按“宽松相等”比较：数字与字符串相等（`'1'` 与 `1` 相等），布尔与数字**不**相等（`true` 与 `1` 不等）。
2. `Date` 按时间戳比较；`Symbol` 只能与自身相等。
3. 数组按长度与逐位元素比较；普通对象按键数量与逐键值比较。
4. `Map` / `Set` 按大小与成员的“存在匹配”比较，匹配与顺序无关；`Map` 与 `Set` 混用视为不相等。
5. 递归比较共享引用或环形结构时，不能栈溢出。
