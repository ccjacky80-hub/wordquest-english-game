# WordQuest / 单词小世界

> 项目上下文版本：`1.0.0`  
> 当前阶段：`PRD / 架构冻结，尚未开始业务代码开发`  
> 当前唯一真实用户：8 岁、即将 9 岁、小学三年级女孩；自然拼读 A3；主要设备 iPad，兼容手机；每天约 30 分钟。

## 1. 项目目标

WordQuest 不是“电子单词卡”，而是一个 **由英语词汇驱动的儿童冒险游戏**。孩子通过看、听、找、拖、拼、说、使用词汇推进游戏世界，在反复的场景化调用与间隔复习中形成长期记忆。

第一阶段只解决一个问题：

> **孩子是否愿意主动反复玩，并且 7 天后能稳定记住第一批 30 个词。**

## 2. 当前教材数据

三份扫描材料已整理为 Master Vocabulary Database：

- 原始教材词汇条目：**524**
- 去重后独立单词/词块：**471**
- MVP 第一批：**Animal Kingdom 30 词**
- 人工可编辑主表：`三年级英语词汇_Master_Database_v1.xlsx`（根目录唯一数据源）
- 运行时候选 JSON：`data/vocabulary.clean.json`
- MVP30 JSON：`data/vocabulary.mvp30.json`

## 3. 核心文档（所有 AI Agent 必须统一使用）

1. `docs/AGENTS.md` — Agent 总入口、上下文优先级与协作规则
2. `docs/01-PRD.md` — 产品需求与验收标准
3. `docs/02-ARCHITECTURE.md` — 技术架构、目录、部署和边界
4. `docs/03-DATA_MODEL.md` — 内容、学习进度与本地数据库模型
5. `docs/04-CONVENTIONS.md` — 编码、UX、Git、测试、内容规范
6. `docs/05-TASKS.md` — 唯一任务清单与开发顺序
7. `docs/06-DECISIONS.md` — 关键决策记录（ADR 风格）

`docs/README.md` 是项目入口文档，8 份规格文档统一位于 `docs/`。

## 4. 推荐工作流

```text
本地开发
  ↓
本地测试 / 本地构建
  ↓
Git commit
  ↓
GitHub push / PR
  ↓
Cloudflare 自动构建 Preview
  ↓
main 合并
  ↓
Cloudflare Production
```

## 5. V1 技术栈

- Framework: Next.js + React + TypeScript
- Rendering: V1 采用 static export，避免引入运行时服务端依赖
- Styling: Tailwind CSS；shadcn/ui 只用于普通控件/家长页，不主导儿童游戏视觉
- Client state: Zustand
- Offline/local DB: IndexedDB + Dexie
- Validation: Zod
- Drag & drop: dnd-kit（iPad / touch 优先）
- Animation: Motion
- PWA: Web App Manifest + Service Worker（实现阶段优先评估 Serwist）
- Unit tests: Vitest + Testing Library
- E2E: Playwright（至少覆盖 iPad 尺寸）
- Package manager: pnpm
- Git remote: GitHub
- V1 deployment: Cloudflare Pages Git Integration，构建输出 `out/`

> 注意：Cloudflare 未来后端能力以 Workers 为目标。V1 因为是纯本地、离线优先、无需服务端，先走 static export；需要云同步/账号/API 时再切换部署方案，不能为了“以后可能用”提前增加复杂度。

## 6. 开发原则

- 文档是唯一真相，不依赖某次 ChatGPT/Codex/Claude Code 会话的隐藏上下文。
- 一个 Agent 一次只处理 `docs/05-TASKS.md` 中一个小任务。
- 未记录在 `docs/06-DECISIONS.md` 的架构变化，不允许直接落代码。
- V1 不引入实时生成式 AI，不上传儿童语音或学习数据到第三方服务。
- 先验证学习效果和自愿复玩，再扩词库和功能。

## 7. 开工前阅读顺序

```text
docs/docs/AGENTS.md
→ docs/05-TASKS.md（确认当前任务）
→ docs/01-PRD.md（确认产品行为）
→ docs/02-ARCHITECTURE.md（确认技术边界）
→ docs/03-DATA_MODEL.md（涉及数据时）
→ docs/04-CONVENTIONS.md（实现规范）
→ docs/06-DECISIONS.md（有冲突时查最终决策）
```

## 8. 当前下一任务

`TASK-001`：初始化 Next.js + TypeScript + Tailwind + pnpm 项目，建立静态导出与 Cloudflare Pages 可部署基线。详见 `docs/05-TASKS.md`。
