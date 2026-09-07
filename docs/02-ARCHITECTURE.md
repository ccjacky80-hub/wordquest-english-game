# WordQuest 技术架构 v1.0

## 1. 架构目标

当前工程目标不是最大可扩展性，而是：

1. 本地开发体验稳定。
2. Codex / Claude Code / 其他 Agent 都容易理解和修改。
3. GitHub 是版本真相。
4. Cloudflare 自动 Preview / Production。
5. iPad / 手机使用稳定。
6. V1 无后端也能完整运行。
7. 将来增加后端时不需要推翻内容与学习模型。

---

# 2. 总体架构

```text
┌──────────────────────── Local Machine ────────────────────────┐
│ Next.js / React / TypeScript                                  │
│                                                               │
│ UI / Games       Learning Engine       Content Repository     │
│     │                    │                     │               │
│     └──────────────┬─────┴──────────────┬──────┘               │
│                    │                    │                      │
│                 Zustand              Dexie                    │
│                  UI state          IndexedDB                  │
└────────────────────┬───────────────────────────────────────────┘
                     │ git commit / push
                     ▼
                  GitHub Repo
                     │
                     ▼
             Cloudflare Git Build
                     │
              Preview / Production
                     ▼
               iPad / Mobile PWA
```

V1 不存在运行时应用服务器、远程 DB、登录 API。

---

# 3. 技术栈冻结

## 3.1 Core

| 层 | 选择 | 原因 |
|---|---|---|
| Framework | Next.js App Router | React 生态成熟，AI Agent 熟悉，后续扩展空间足 |
| Language | TypeScript strict | 多 Agent 修改时减少隐式契约 |
| Package manager | pnpm | lockfile 清晰、安装快、适合 CI |
| V1 rendering | Static export | 当前无服务器需求，部署和离线简单 |
| CSS | Tailwind CSS | 快速迭代、可控设计 token |
| 普通 UI | shadcn/ui（选择性使用） | 家长页/弹窗等标准控件可复用 |
| Game UI | 自定义组件 | 儿童游戏不能被企业后台风格主导 |
| Client state | Zustand | 小而清晰，不引入 Redux 复杂度 |
| Persistent DB | Dexie / IndexedDB | local-first、离线、结构化查询 |
| Schema validation | Zod | 内容 JSON 与持久化边界校验 |
| DnD | dnd-kit | touch/iPad 友好 |
| Animation | Motion | 反馈动画、页面过渡 |
| PWA | manifest + service worker | 主屏安装与离线 |
| Unit | Vitest + Testing Library | 学习算法和组件测试 |
| E2E | Playwright | 关键流程、iPad viewport |

## 3.2 不采用

- Redux：V1 状态规模不需要。
- Firebase/Supabase：V1 不需要远程账号/数据库。
- Runtime LLM API：儿童端不可控、延迟、隐私和成本都不必要。
- React DnD：优先使用更适合当前 touch 场景的 dnd-kit。
- 复杂游戏引擎（Phaser/Unity）：当前 2D 交互不需要。

---

# 4. Cloudflare 部署策略

## 4.1 V1

采用：

```text
Next.js static export
→ GitHub
→ Cloudflare Pages Git Integration
→ out/
```

原因：
- V1 完全 local-first，无 SSR/API。
- static export 减少 Cloudflare runtime 兼容层。
- GitHub push 自动生成 Preview，main 自动 Production。

## 4.2 为什么不在 V1 直接上 full-stack Workers

当前产品还没证明孩子愿意玩。为不存在的账号/云同步预先引入 Worker runtime 会增加：
- 构建与适配复杂度
- Agent 上下文复杂度
- 调试面
- 数据迁移风险

## 4.3 迁移到 Workers 的明确触发条件

满足任一条件，创建新 ADR 评估迁移：
- 需要账号登录
- 多设备同步
- 云端家长报告
- 服务端 AI 内容生成
- 需要 D1/R2/KV 等绑定
- 服务端授权或付费

迁移不得改变核心领域接口：Content、Learning Engine、Progress Repository 应保持可替换存储实现。

---

# 5. 建议目录

```text
/
├─ docs/
│  ├─ README.md
│  ├─ AGENTS.md
│  ├─ 01-PRD.md
│  ├─ 02-ARCHITECTURE.md
│  ├─ 03-DATA_MODEL.md
│  ├─ 04-CONVENTIONS.md
│  ├─ 05-TASKS.md
│  └─ 06-DECISIONS.md
├─ data/
│  ├─ 三年级英语词汇_Master_Database_v1.xlsx
│  ├─ vocabulary.clean.json
│  └─ vocabulary.mvp30.json
├─ public/
│  ├─ audio/
│  ├─ images/
│  ├─ icons/
│  └─ manifest-assets/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx
│  │  ├─ map/
│  │  ├─ play/
│  │  └─ parent/
│  ├─ components/
│  │  ├─ child-ui/
│  │  ├─ parent-ui/
│  │  └─ common/
│  ├─ games/
│  │  ├─ treasure-hunt/
│  │  ├─ picture-match/
│  │  ├─ word-builder/
│  │  ├─ put-it-somewhere/
│  │  └─ mini-story/
│  ├─ domain/
│  │  ├─ vocabulary/
│  │  ├─ learning/
│  │  ├─ review/
│  │  └─ rewards/
│  ├─ db/
│  │  ├─ db.ts
│  │  ├─ schema.ts
│  │  ├─ migrations/
│  │  └─ repositories/
│  ├─ content/
│  │  ├─ loader.ts
│  │  └─ schemas.ts
│  ├─ stores/
│  ├─ lib/
│  └─ styles/
├─ scripts/
│  ├─ import-vocabulary.ts
│  └─ validate-content.ts
└─ tests/
   ├─ unit/
   └─ e2e/
```

---

# 6. 模块边界

## 6.1 `domain/learning`

纯业务逻辑：
- Attempt → quality
- quality → mastery 更新
- mastery → review due

禁止依赖 React、Dexie、浏览器 API。这样算法可以单测。

## 6.2 `db/`

只负责：
- IndexedDB schema
- migration
- repository 实现

UI 不直接调用 Dexie table；通过 repository/service。

## 6.3 `games/`

每个游戏只负责产生标准化 `GameAttempt`，不直接修改掌握等级。

```text
Game UI
→ GameAttempt
→ Learning Engine
→ Progress Repository
```

这是最重要的工程边界之一。

## 6.4 `content/`

只加载经过 schema 校验的静态内容。游戏不得写死具体单词。

---

# 7. 状态策略

## Zustand
只放短生命周期 UI / session 状态：
- 当前页面/任务
- 当前题
- 暂停状态
- 当前奖励动画

## IndexedDB
放必须跨刷新存在的数据：
- WordProgress
- Attempts
- Sessions
- ReviewQueue
- RewardState
- AppSettings
- schemaVersion

避免把同一份持久数据同时维护在 localStorage 和 IndexedDB。

localStorage 仅允许存极少量启动偏好，例如已完成 onboarding 的 flag；若不必要就不用。

---

# 8. 内容构建流程

人可编辑主数据：

```text
Master Excel
```

开发/运行时：

```text
Master Excel
→ import-vocabulary.ts
→ validated JSON
→ static bundle
```

规则：
- JSON 是构建产物/运行时格式，不是人工主编辑入口。
- import 脚本必须 deterministic。
- 数据变更应能通过 Git diff 审查。
- 每条词保留 source provenance。

---

# 9. 音频与图片

## V1 资源策略
- 静态资源随版本发布。
- 每个 MVP 词至少一个主图片和一个标准发音。
- 文件名使用稳定 ID，不使用中文文件名作为 runtime key。

例如：

```text
public/audio/C0012.mp3
public/images/C0012.webp
```

资源 manifest 由 content JSON 引用。

## 图片格式
优先 WebP/AVIF；关键兼容需求可保留 PNG fallback。

## 音频
优先压缩格式；每段尽量短。不得自动同时播放多个音频。

---

# 10. PWA 与缓存

缓存层：

1. App shell
2. MVP 内容 JSON
3. MVP30 图片
4. MVP30 音频

V1 不要求把 471 词所有媒体预缓存到设备。

升级原则：
- App 代码升级不能清 DB。
- 内容版本独立于 DB schemaVersion。
- service worker 更新失败时不得阻塞已有缓存版本启动。

---

# 11. 测试架构

## Unit 必测
- Attempt quality 计算
- review 间隔推进/回退
- Mastered 条件
- 同一天刷题不能直接 Mastered
- 提示后正确权重低于独立正确
- 数据 migration

## Component 必测
- 连错 3 次提示升级
- 音频 replay
- touch 可操作性基础
- Word Builder 正确/错误流程

## E2E 必测
- 新用户 Day1 → Reward → 退出 → 重开进度仍在
- Day1 完成后 Day2 正确解锁
- 家长页显示对应学习记录
- IndexedDB 数据导出
- 离线启动基础流程

---

# 12. 性能预算（V1）

目标：
- 首屏不因为 471 词媒体资源而下载大量文件。
- 游戏切题反馈主观上即时。
- 单次场景尽量避免超大背景图。
- 动画以 transform/opacity 为主。
- iPad Safari 不出现持续高 CPU 动画。

资源具体字节预算在第一版真实美术资产到位后再冻结。

---

# 13. 隐私与安全

V1 默认：
- 无账号
- 无儿童姓名必填
- 无远程 analytics
- 无远程语音上传
- 无广告
- 无第三方追踪 SDK

如果以后引入网络数据，必须新 ADR + PRD 更新，不得由某个 Agent自行添加。

---

# 14. 环境与可复现

必须提交：
- `pnpm-lock.yaml`
- Node 版本声明（`.nvmrc` 或 `package.json#engines`）
- 构建脚本
- 内容验证脚本

本地与 Cloudflare 使用同一 `pnpm build`。不允许“Cloudflare 专用但本地不可复现”的构建步骤。
