# AGENTS.md — WordQuest 多 Agent 协作协议

> 本文件是 **Codex、Claude Code、其他 AI Agent 的第一入口**。  
> 不允许依赖聊天历史作为项目事实来源；项目事实必须写进仓库。

## 1. 上下文权威顺序

发生冲突时，按以下优先级执行：

1. 用户在当前任务中的明确指令
2. `docs/06-DECISIONS.md` 中状态为 Accepted 的最新决策
3. `docs/01-PRD.md`
4. `docs/02-ARCHITECTURE.md`
5. `docs/03-DATA_MODEL.md`
6. `docs/04-CONVENTIONS.md`
7. `docs/05-TASKS.md`
8. 现有代码与注释

若代码与上层文档冲突，**不能默认代码是对的**；先报告冲突，再按任务权限处理。

## 2. 每个 Agent 开工前必须做

1. 读取本文件（`docs/AGENTS.md`）。
2. 读取 `docs/05-TASKS.md`，确认唯一目标 Task ID。
3. 读取该任务引用的 PRD / Architecture / Data Model 条目。
4. 查看 `git status`，不得覆盖用户或其他 Agent 未提交的改动。
5. 先给出 3–8 条极短实施计划，再动代码（工具支持时）。
6. 只修改完成当前 Task 所必需的文件。

## 3. 每个 Agent 完工必须输出

```text
Task: TASK-xxx
Status: done / blocked / partial
Changed:
- path/a
- path/b
Tests:
- command -> pass/fail
Acceptance criteria:
- [x] ...
- [ ] ...
Risks / follow-up:
- ...
```

并同步更新 `docs/05-TASKS.md` 的任务状态；若产生架构级决策，必须同步更新 `docs/06-DECISIONS.md`。

## 4. 严禁事项

- 不得一次“顺手”完成多个未授权任务。
- 不得擅自更换框架、状态库、数据库、部署平台。
- 不得为了快速通过测试删除测试或放宽关键断言。
- 不得把 API key、token、账号信息写入仓库。
- 不得引入儿童端实时第三方 AI API。
- 不得把 471 个词一次性全部开放给孩子。
- 不得把中文作为所有题目的必经中介。
- 不得用持续签到惩罚、倒计时焦虑、付费诱导等机制驱动孩子。
- 不得在没有明确需求时引入 SSR、Server Actions、远程数据库、账号系统。

## 5. Agent 变更范围规则

### 文档任务
可以编辑：`docs/README.md`、`docs/AGENTS.md`、`docs/*`、`data/*`。  
不得新增业务代码，除非任务明确要求。

### 前端任务
可以编辑：相关页面、组件、样式、测试。  
不得修改数据模型或架构决策，除非当前任务明确包含迁移。

### 数据任务
数据 schema 改动必须先改 `docs/03-DATA_MODEL.md`，再改代码与 migration。

### 部署任务
部署配置必须保持“本地可运行、本地可 build、GitHub 可复现”；不得只在 Cloudflare Dashboard 做无法追踪的隐式配置。

## 6. Definition of Done

一个任务只有同时满足以下条件才算 Done：

- 符合 PRD 行为。
- 符合架构边界。
- TypeScript 无错误。
- lint / unit test 通过（若任务涉及相应范围）。
- 关键 UI 在 iPad 视口可用。
- 没有 console error。
- 没有把学习数据意外发送到网络。
- 验收标准逐条勾选。
- 文档/任务状态已同步。

## 7. 产品不可变核心

当前 V1 的核心不是“功能多”，而是：

1. 8–9 岁孩子无需家长持续陪伴即可操作。
2. 每天约 30 分钟，真正新词 5–7 个。
3. 图片/声音/动作/场景优先，中文只做兜底。
4. 单词必须从识别走向主动回忆和情境使用。
5. 错误触发提示与后续再现，而不是惩罚。
6. 学习数据 local-first。
7. 7 天 MVP 先验证 30 词的记忆与复玩。

## 8. 上下文变更协议

任何影响多个 Agent 的新规则，必须落到以下至少一个文件：

- 产品行为 → `docs/01-PRD.md`
- 技术架构 → `docs/02-ARCHITECTURE.md`
- schema → `docs/03-DATA_MODEL.md`
- 编码/协作 → `docs/04-CONVENTIONS.md`
- 工作顺序 → `docs/05-TASKS.md`
- 为什么这样选 → `docs/06-DECISIONS.md`

禁止只在 commit message、聊天或代码注释里保存关键决策。
