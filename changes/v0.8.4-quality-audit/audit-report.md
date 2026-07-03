# v0.8.4 质量审计报告

> 审计日期：2026-07-03 | 全仓库扫描 | 3 个并行 Agent

---

## 总览

| 维度 | Critical | High | Medium | Low | 合计 |
|------|----------|------|--------|-----|------|
| Bug（逻辑/路径/兼容） | 3 | 8 | 12 | 8 | **31** |
| Token 优化 | — | — | 4 | 2 | **6** |

---

## 一、Critical（必须修，阻断正常工作）

### C-1：中文模板与 Validator 引擎不兼容

**文件**：`templates/proposal.md:3,8` ← vs → `src/validation/validator.ts:29,202,226`

模板用中文标题 `## 背景（Why）` 和 `## 变更内容（What Changes）`，但 Validator 的正则是 `/^##\s+Why\s*$/i` 和 `/^##\s+What\s+Changes\s*$/i`——**精确匹配英文标题**。`spec-writer` 按模板生成 proposal 后，`schema-valid` guard 检查直接报错「## Why 缺失」→ 阻塞 `specifying→bridging` 转换。

**修复**：Validator regex 改为 `/^##\s+(背景（)?Why(）)?\s*$/i`（兼容中英文），或模板改回纯英文标题（`## Why` / `## What Changes`）。

---

### C-2：guard.mjs 存在死 transition `bridging:approved`

**文件**：`scripts/guard/guard.mjs:14`

```js
'bridging:approved': ['artifacts-exist', 'schema-valid', 'contract-fresh'],
```

状态名是 `approved-for-build`（全仓库统一），没有 `approved` 这个短名。此 transition key 永远不会被匹配到，**`bridging → approved-for-build` 的 guard 检查实际从未执行**。

**修复**：`s/approved/approved-for-build/`。

---

### C-3：Cursor workflow-orchestrator 给 guard 传了错误的状态名

**文件**：`.cursor/skills/workflow-orchestrator/SKILL.md:145`

```bash
node scripts/guard/guard.mjs check <dir> approved executing --json
```

同上——guard 里只有 `approved-for-build:executing`，`approved:executing` 不存在 → guard 报 `Unknown transition` → Cursor 用户无法启动执行。

**修复**：`s/approved/approved-for-build/`。

---

## 二、High（会导致实际使用失败）

### H-1：guard.mjs 缺少 6 个合法 transition

**文件**：`scripts/guard/guard.mjs:11-21`

Transition matrix 只定义了 9 个 transition，以下合法回退全部缺失：

| 缺失 transition | 场景 |
|----------------|------|
| `specifying:exploring` | 需求变更，回退探索 |
| `bridging:specifying` | 契约漂移，重新规格 |
| `approved-for-build:bridging` | 契约需返工 |
| `executing:specifying` | 执行中发现需求变更 |
| `executing:bridging` | 执行中发现契约过期 |
| `closing:specifying` | 验证失败需重新规划 |

缺失 = guard 对合法回退报 `Unknown transition` 并 exit 1 → **正常回退被硬阻断**。

**修复**：补全 transition matrix。

---

### H-2：Guard 可被完全绕过

**文件**：`scripts/lib/cmd-state.mjs:73-91`（transition 不调用 guard）

`ssf state transition <dir> <to>` 直接写状态文件，不检查任何 guard 维度。skill 调了 `guard.mjs check`，但用户或脚本直接跑 `ssf state transition` 就能跳过所有门禁。

**修复**：`cmd-state.mjs` 的 `transition` 在写文件前调用 `guard.mjs check`。

---

### H-3：tasks-complete.mjs 不认大写 `[X]`

**文件**：`scripts/guard/checks/tasks-complete.mjs:25`

```js
const hasAny = content.match(/^- \[x\]/gm);  // 只匹配小写 x
```

Markdown 工具（GitHub、VS Code）自动生成的任务列表常用大写 `[X]`。全部任务完成但用了大写 X → guard 报「no completed tasks found」→ **阻塞 closing transition**。

**修复**：`/^- \[[xX]\]/gm`。

---

### H-4：build-executor 在 worktree 场景下脚本路径全断

**文件**：`skills/build-executor/SKILL.md:220,236,247`

该 skill 第 194 行指导 `cd ../<project>-<change-name>` 进入 worktree，之后的三处脚本引用全用相对路径：

```
scripts/task-brief           ← worktree 里没有 scripts/
scripts/review-package       ← worktree 里没有 scripts/
node scripts/spec-superflow.mjs state get ... ← 同上
```

**修复**：全部改为 `${CLAUDE_PLUGIN_ROOT}/scripts/...`。

---

### H-5：spec-merger 所有路径多了不存在的 `workflow/` 前缀

**文件**：`skills/spec-merger/SKILL.md:48,64,133,134,138`

用 `workflow/changes/<name>/specs/` 和 `workflow/specs/<capability>/spec.md`，但实际目录结构没有 `workflow/` 层：

```
实际：changes/<name>/specs/  和  specs/<capability>/spec.md
```

**修复**：删除 `workflow/` 前缀。

---

### H-6：infer-workflow.mjs 相对路径调用静默失败

**文件**：`scripts/infer-workflow.mjs:120`

```js
if (import.meta.url === `file://${process.argv[1]}`) { main(); }
```

`import.meta.url` 是 `file:///abs/path`（三斜杠），`process.argv[1]` 是 `scripts/infer-workflow.mjs`（相对路径）→ 永远不匹配 → `main()` 永远不执行 → 脚本静默无输出。

**修复**：用 `path.resolve()` 归一化再比较，或用 `import.meta.filename`（Node 22+）。

---

### H-7：cmd-state.mjs 接受任意 state 名，不校验

**文件**：`scripts/lib/cmd-state.mjs:81`

```js
state.state = toState;  // 无校验
```

打错字如 `ssf state transition ... executin`（少 g）→ 状态被写为 `executin` → 后续所有 guard 调用报 `Unknown transition` → 状态机不可恢复。

**修复**：加 VALID_STATES 白名单校验。

---

### H-8：Cursor 3 个 skill 缺失决策点协议

| Skill | 缺失 | 影响 |
|-------|------|------|
| `.cursor/skills/spec-explorer/SKILL.md` | 无 DP-1（需求确认） | Cursor 用户跳过需求确认 |
| `.cursor/skills/spec-forger/SKILL.md` | 无 DP-2（工件审查） | Cursor 用户跳过工件审查 |
| `.cursor/skills/workflow-orchestrator/SKILL.md` | 无 DP-0（设计前确认） | Cursor 用户跳过设计前门禁 |

**修复**：从 `skills/` 的对应文件同步 DP 章节到 `.cursor/skills/`。

---

## 三、Medium（功能降级/数据风险）

### M-1：6 个 skill 的 H1 标题仍是 v0.7 旧名

| 文件 | 当前 H1 | 应为 | 行号 |
|------|---------|------|------|
| `skills/need-explorer/SKILL.md` | Spec Explorer | Need Explorer | 6 |
| `skills/contract-builder/SKILL.md` | Bridge Contract | Contract Builder | 6 |
| `skills/build-executor/SKILL.md` | Execution Governor | Build Executor | 6 |
| `skills/bug-investigator/SKILL.md` | Systematic Debugger | Bug Investigator | 6 |
| `skills/release-archivist/SKILL.md` | Closure Archivist | Release Archivist | 6 |
| `skills/spec-merger/SKILL.md` | Spec Syncer | Spec Merger | 6 |

不影响功能（H1 不作为路由依据），但用户看到旧名会困惑。

---

### M-2：state-loader.mjs 的 `||` vs `??` 导致空字符串数据丢失

**文件**：`scripts/lib/state-loader.mjs:71-76`

```js
`execution_mode: ${state.execution_mode || 'null'}`  // '' → 'null'
`dp_0_decisions: ${state.dp_0_decisions ?? 'null'}`  // '' → '' (正确)
```

用 `||` 的字段（execution_mode, test_result, change_name）中，空字符串是合法值，但会被序列化为 `'null'` → 下次读回变成 JS `null` → 数据丢失。

**修复**：统一用 `??`。

---

### M-3：hash.mjs 把 specs 目录下所有 .md 都纳入哈希

**文件**：`scripts/lib/hash.mjs:22-30`

`walkDir` 递归收集 specs/ 下所有 `.md` 文件参与哈希。如果有人在 specs/ 下放了 `README.md` 或 `design-notes.md`，修改它会导致「artifacts_hash mismatch」→ 误报 contract stale。

**修复**：只 hash `spec.md` 文件。

---

### M-4：schema-valid.mjs 丢弃所有 WARNING 级别问题

**文件**：`scripts/guard/checks/schema-valid.mjs:33,52`

只收集 ERROR，WARNING 全丢弃。Validator 返回的预警信息（如 requirements 无 Scenario 但未到 ERROR 阈值）被静默忽略。

**修复**：WARNING 也应包含在输出中（不阻塞，但展示）。

---

### M-5：schema-valid.mjs 不验证 design.md 和 tasks.md

**文件**：`scripts/guard/checks/schema-valid.mjs:26-58`

只验证 `proposal.md` + `specs/*/spec.md`，不验证 design 和 tasks。命名暗示全面验证，实际只覆盖一半。

**修复**：要么补全验证，要么重命名为 `proposal-and-specs-valid`。

---

### M-6：schema-valid.mjs 的 dynamic import 无错误处理

**文件**：`scripts/guard/checks/schema-valid.mjs:11`

`dist/index.js` 不存在（未 build）→ `import()` 直接 crash，无提示。

**修复**：try/catch + 提示「请先运行 npm run build」。

---

### M-7：infer-workflow.mjs 显式 `full` 被覆盖

**文件**：`scripts/infer-workflow.mjs:40-46`

只有 `hotfix` 和 `tweak` 作为显式覆盖——如果用户设了 `workflow: full`，自动检测仍可能推断出 hotfix/tweak 并覆盖。

**修复**：`if (state.workflow !== 'auto' && state.workflow != null) return ...`。

---

### M-8：workflow-start 中 8 处脚本路径用相对路径

**文件**：`skills/workflow-start/SKILL.md:134,211,219,229,255,279,291`

`infer-workflow.mjs`（1 处）和 `guard.mjs`（6 处）+ `contract-builder`（1 处）用相对路径。在非插件根目录的 CWD 下失效。

**修复**：统一用 `${CLAUDE_PLUGIN_ROOT}/scripts/...`。

---

### M-9：SETTABLE_FIELDS 缺少多个字段

**文件**：`scripts/lib/cmd-state.mjs:6-13`

缺少：`batches_completed`、`dp_0_result`、`dp_1_decisions`~`dp_7_decisions`、`dp_1_confirmed`~`dp_7_confirmed`。workflow 自动化想写这些字段时只能用 `writeFileSync`。

**修复**：补全 SETTABLE_FIELDS。

---

### M-10：bug-investigator 缺失 DP-5 引用

**文件**：`skills/bug-investigator/SKILL.md`

`decision-points.md` 将 DP-5 关联到 `bug-investigator`，但 skill 文件中 DP-5 从未出现。

**修复**：在 3+ 修复失败升级处加 DP-5 记录。

---

### M-11：session-start 声称 ~50 tokens，实际 ~75-100

**文件**：`hooks/session-start:8-9`

评论声称 ~50 tokens，实际 ~300 字符 ÷ 3 ≈ 100 tokens。

**修复**：更新注释数字。

---

### M-12：`.cursor/skills/` 有 15 个目录，`skills/` 有 9 个

`.cursor/skills/` 包含 v0.7 旧名和 v0.8 新名的混合（如 `spec-explorer/` 和 `need-explorer/` 同时存在），内容版本不同。Cursor 用户看到两套名字。

**修复**：清理 `.cursor/skills/` 只保留当前 9 个，内容与 `skills/` 对齐。

---

## 四、Token 优化（可量化收益）

### Token 消耗全景

| 组件 | 当前 tokens | 触发频率 | 优化目标 |
|------|------------|----------|---------|
| **workflow-start SKILL.md** | ~4,900 | 每次手动调用 + hook 注入 | ~3,000 |
| **build-executor SKILL.md** | ~4,900 | 每次执行 | ~3,500 |
| **spec-writer SKILL.md** | ~3,200 | 每次规划 | ~2,500 |
| **bug-investigator SKILL.md** | ~3,100 | 调试时 | ~2,500 |
| **code-reviewer SKILL.md** | ~2,900 | 审查时 | ~2,300 |
| **spec-merger SKILL.md** | ~2,600 | 收口时 | ~2,200 |
| **contract-builder SKILL.md** | ~2,500 | 桥接时 | ~2,200 |
| **release-archivist SKILL.md** | ~2,500 | 收口时 | ~2,200 |
| **need-explorer SKILL.md** | ~1,800 | 探索时 | 足够精简 |
| implementer-prompt.md | ~2,000 | 每个 SDD 子代理 | ~1,500 |
| task-reviewer-prompt.md | ~2,600 | 每个 SDD 子代理 | ~2,000 |
| code-reviewer-prompt.md | ~1,800 | 每次审查 | ~1,500 |
| **session-start hook 注入** | ~100 | **每次会话** | ~50 |
| **phase-guard 重复文件** | 2 份 × N bytes | 每次 inject | 去重为 1 份 |

### T-1：workflow-start SKILL.md 缩减（~4,900 → ~3,000，省 ~1,900 tokens/次调用）

**分析**：362 行是最大的 skill 文件。可砍：
- 示例部分（lines 159-176）——示例可移到 docs/
- 重复的 guard check 命令可因子化——6 处几乎相同的命令改为 1 处描述 + 引用
- DP-0 部分（lines 84-117）可以压缩到 1/2 长度

**节省**：~1,900 tokens × 每次会话 = 用户每次打开 Claude Code 就省这么多。

### T-2：build-executor SKILL.md 缩减（~4,900 → ~3,500，省 ~1,400 tokens/次执行）

**分析**：338 行。可砍：
- TDD/SDD/Batch Inline 三种模式的重复说明——合并为选择表
- Law 1-5 可压缩

### T-3：session-start 注入精确化（~100 → ~50 tokens，省 ~50 tokens/次会话）

`hooks/session-start:10` 当前注入 ~300 字符。可压缩为更简洁的一句话：

```
<EXTREMELY_IMPORTANT>\nYou have spec-superflow. Use /spec-superflow:workflow-start before planning or implementing.\n</EXTREMELY_IMPORTANT>
```

### T-4：消除重复的 phase-guard 文件

`rules/phase-guard.md` 和 `.claude/always/phase-guard.md` 内容相同，每次 `ssf inject` 写两份。`cmd-inject.mjs:189-196` 同时写两个路径。

**修复**：只写 `.claude/always/phase-guard.md`（Claude Code 实际生效的路径），删 `rules/phase-guard.md`。

### T-5：清理 `.cursor/skills/` 过期目录（省 ~50% 空间）

删除 v0.7 旧名 skill，只保留 9 个与 `skills/` 对齐的目录。

### T-6：Sub-prompt 模板合并去重

implementer-prompt 和 task-reviewer-prompt 有重复的「TDD 要求」段落，可提取共用。

---

## 五、Low（建议修，不阻塞）

| ID | 文件 | 问题 |
|----|------|------|
| L-1 | `CLAUDE.md` 状态图 | ASCII 图写 `approved` → 应为 `approved-for-build` |
| L-2 | `scripts/spec-superflow.mjs:48` | CLI help 示例用 `approved` |
| L-3 | `cmd-state.mjs:100` | `state[field]` 可读 `__proto__` |
| L-4 | `cmd-state.mjs` init | TOCTOU race |
| L-5 | `state-loader.mjs` parseYaml | 负数/浮点数当字符串 |
| L-6 | `hash.mjs` contract-fresh | 重复 YAML 解析逻辑 |
| L-7 | `docs/state-machine.md:70-83` | 缺 fast-path transition |
| L-8 | `hooks/session-start:22,25,28` | `| cat` 无操作管道 |

---

## 修复优先级建议

```
Phase 1（阻塞性问题）: C1 C2 C3 H1 H2 H3 H4 H5 H6 H7
Phase 2（数据/体验）: M1-M12 + Token T1-T6
Phase 3（边角）:     L1-L8
```
