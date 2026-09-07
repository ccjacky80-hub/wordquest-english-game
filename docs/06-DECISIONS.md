# WordQuest Architecture / Product Decisions v1.0

> 状态：Accepted / Superseded / Proposed。  
> 后续 Agent 若要推翻 Accepted 决策，必须新增一条 Decision，而不是静默改旧文本。

---

## ADR-001 — 先做单用户家庭 MVP
**Status: Accepted**

Decision：V1 只服务当前一个 8–9 岁孩子，不设计多用户商业平台。

Why：当前最大风险是“孩子不愿意玩 / 学习效果不成立”，不是扩展性。

Consequence：不做账号、支付、班级、教师后台。

---

## ADR-002 — 产品形态为 PWA Web App
**Status: Accepted**

Decision：iPad 优先的 PWA，兼容手机。

Why：本地迭代快，不需要 App Store；适合 AI Agent 开发；可添加到主屏。

---

## ADR-003 — Framework 采用 Next.js + TypeScript
**Status: Accepted**

Decision：使用 Next.js App Router + React + TypeScript strict。

Why：生态成熟、Agent 熟悉、未来有扩展路径。

Constraint：V1 不能因为 Next.js 存在 server 能力就主动引入 server 依赖。

---

## ADR-004 — V1 使用 static export + Cloudflare Pages Git Integration
**Status: Accepted**

Decision：本地开发 → GitHub → Cloudflare Pages 自动构建；输出 `out/`。

Why：V1 无后端；静态部署最少运行时复杂度。

Future：出现账号、云同步、API、D1/R2/KV 等需求时，再评估迁到 Cloudflare Workers 的当前官方 Next.js 路径。

---

## ADR-005 — 学习数据 local-first
**Status: Accepted**

Decision：IndexedDB + Dexie 保存学习数据。

Why：离线、隐私、无需账号、刷新不丢。

---

## ADR-006 — V1 不使用运行时生成式 AI
**Status: Accepted**

Decision：AI 用于开发和离线内容生产；孩子玩游戏时不调用 LLM。

Why：儿童安全、可控、无延迟、可测试、成本低。

---

## ADR-007 — Master Excel 是人工内容基线，JSON 是运行时格式
**Status: Accepted**

Decision：保留 Excel 便于审阅；脚本生成并校验 JSON。

Why：既方便人工校对，又避免运行时直接读表格。

---

## ADR-008 — 所有游戏输出统一 GameAttempt
**Status: Accepted**

Decision：游戏本身不直接改 mastery；统一经过 Learning Engine。

Why：避免不同 Agent 为不同游戏复制一套学习逻辑。

---

## ADR-009 — 使用 6 级宏观掌握状态
**Status: Accepted**

`New → Seen → Recognized → Recalled → Used → Mastered`

Why：避免“看过/选对一次=学会”。

---

## ADR-010 — 复习算法 V1 采用简单可解释间隔
**Status: Accepted**

`10m → 1d → 3d → 7d → 14d → 30d`

Why：当前数据量小，优先可解释与可测试，不提前上复杂 SM-2/FSRS。

---

## ADR-011 — 第一批只开放 Animal Kingdom 30 词
**Status: Accepted**

Decision：先做 30 词 7 天实验。

Why：验证核心循环，而不是验证内容录入速度。

---

## ADR-012 — 奖励以“世界变化”为主，不以分数为主
**Status: Accepted**

Decision：星星可以存在，但主要奖励是解锁/修复世界。

Why：学习动作和游戏进度建立可理解因果。

---

## ADR-013 — 不做惩罚型连续签到
**Status: Accepted**

Decision：不得断签清零、扣收藏品、错题重罚。

Why：产品目标是长期兴趣和记忆，不是制造焦虑。

---

## ADR-014 — 多 Agent 的上下文必须仓库化
**Status: Accepted**

Decision：不依赖任一 Chat 会话；所有关键上下文写入 AGENTS/PRD/ARCH/DATA/TASKS/DECISIONS。

Why：用户会交替使用 Codex、Claude Code 和其他 Agent。

---

## ADR-015 — shadcn/ui 只服务标准 UI，不定义儿童游戏美术
**Status: Accepted**

Why：快速做家长页/弹窗，但儿童体验需要自定义高触控、游戏化视觉。

---

## ADR-016 — V1 不使用远程 Analytics
**Status: Accepted**

Decision：实验数据先写本地事件表/学习表。

Why：隐私、离线、减少外部依赖。

---

# Proposed / 后续门槛

## ADR-P01 — Cloudflare Workers + 云同步
**Status: Proposed**

只有 V1 验证成功且出现多设备同步/账号需求后评估。

## ADR-P02 — 云端语音评分
**Status: Proposed**

只有本地跟读被证明有价值且确需评分时评估。

## ADR-P03 — AI Mini Story 动态生成
**Status: Proposed**

只有静态故事内容被验证有效、且家长希望扩词后评估；必须有儿童内容安全设计。
