# v0.8.4 质量审计 & 修复

## 背景（Why）

spec-superflow 已经迭代到 v0.8.3，152 个测试通过。但缺乏一次系统性的代码审查——涵盖 bug 扫描、token 消耗优化、跨平台一致性。本次审计覆盖全仓库（skills/ scripts/ src/ hooks/ templates/ docs/），目标是把质量从「能用」提升到「可靠」。

## 变更内容（What Changes）

### Bug 修复（23 个）
- **Critical (3)**：模板-Validator 不兼容、dead guard transition、Cursor guard 状态名错误
- **High (8)**：缺失 guard transition、guard 可绕过、tasks 正则、路径错误、空状态验证、worktree 路径断裂
- **Medium (12)**：H1 标题过期、DP 引用缺失、|| vs ?? 序列化 bug、warning 丢失、hash 过度匹配等

### Token 优化（6 项）
- workflow-start skill 精简（~4,900 → 目标 ~3,000 tokens）
- build-executor skill 精简（~4,900 → 目标 ~3,500 tokens）
- Sub-prompt 模板合并/去重
- phase-guard 重复文件消除
- session-start hook token 精确化
- `.cursor/skills/` 过期技能目录清理（15→9，与 skills/ 对齐）

## 约束

- 零运行时依赖保持不变
- Skill 名称和 API 保持不变
- 向后兼容

## 审计报告

详见 `audit-report.md`。