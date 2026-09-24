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

`looseEqual` 现在可以安全比较包含环形引用（自引用、互相引用、环嵌套在数组 / 对象 /
`Map` / `Set` 内部）的结构，不再抛出 `RangeError`。

### 修复原理

原实现递归比较对象时没有任何"已比较过"的记录，遇到 `a.self === a` 这类结构会无限递归。
修复后在递归过程中维护一张**比较路径上的对象配对表**（`a` 侧对象 → `b` 侧对象，双向）：

- 递归进入一对对象时，把 `(a, b)` 记录到配对表；递归退出时将其移除。
- 再次遇到**同一对** `(a, b)`，说明两边结构在同一位置闭合了环，判定这一对相等
  （共归纳假设），不再继续递归。
- 再次遇到 `a` 或 `b` 中**只有一个**出现过的配对（`a` 已对应别的 `b'`，或 `b` 已对应
  别的 `a'`），说明两边环的对应关系不是一一对应，直接判定 `false`。
- 当一对对象在**当前递归路径上**闭合（即确认它们处在同一个环上）时，这一对会被
  "提交"为持久配对，在本次比较的剩余过程中一直生效。这保证了"环上的对应关系必须
  一一对应"：环长不同、共享节点数不同、反向对应都会返回 `false`，且结果与参数顺序
  无关（对称）。
- 不在环上的共享引用（DAG）不提交持久配对，仍按值重复比较，与修复前语义一致。
- `Set` / `Map` 成员匹配是"试错式"的：某个候选匹配失败时，它在尝试过程中产生的
  持久配对会被回滚，保证集合匹配仍与顺序无关。

### 已知边界

- 递归深度仍与结构的**非循环深度**成正比（与修复前一致）：环形结构本身不再导致
  无限递归，但深度数十万层的极端嵌套仍可能触及调用栈上限。
- 环的判定是"同构"语义：两棵图形状相同、叶子值相同才相等；仅"可双向模拟"
  （bisimilar）但节点对应关系不一一对应的结构判定为不相等。

## 行为规格（`looseEqual` 的既有语义，修复时不得改变）

1. 基本类型按“宽松相等”比较：数字与字符串相等（`'1'` 与 `1` 相等），布尔与数字**不**相等（`true` 与 `1` 不等）。
2. `Date` 按时间戳比较；`Symbol` 只能与自身相等。
3. 数组按长度与逐位元素比较；普通对象按键数量与逐键值比较。
4. `Map` / `Set` 按大小与成员的“存在匹配”比较，匹配与顺序无关；`Map` 与 `Set` 混用视为不相等。
5. 递归比较共享引用或环形结构时，不能栈溢出（见上节"环形引用支持"）。
