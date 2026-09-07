# WordQuest 开发任务清单 v1.0

> 本文件是所有 Agent 的 **唯一任务队列**。  
> 状态：`TODO / IN_PROGRESS / BLOCKED / DONE`。  
> 同一时刻建议最多一个 `IN_PROGRESS`。

---

# Phase 0 — 项目上下文

## TASK-000 — 建立 SSOT 文档包
**Status: DONE**

交付：
- README
- AGENTS
- PRD
- ARCHITECTURE
- DATA_MODEL
- CONVENTIONS
- TASKS
- DECISIONS
- Master vocabulary data files

---

# Phase 1 — 工程基线

## TASK-001 — 初始化 Web 项目
**Status: DONE**

范围：
- Next.js App Router
- TypeScript strict
- pnpm
- Tailwind
- 基础 lint/format
- `src/` 目录

验收：
- [x] `pnpm install`
- [x] `pnpm dev`
- [x] `pnpm build`
- [x] 默认首页可访问
- [x] 无 TypeScript error

不得做：具体游戏业务。

## TASK-002 — 配置 static export
**Status: DONE**

验收：
- [x] build 输出 `out/`
- [x] 本地静态预览可运行
- [x] 不依赖 Node runtime API

## TASK-003 — GitHub / Cloudflare Preview 基线
**Status: TODO**

范围：
- GitHub repo 推送
- Cloudflare Pages Git Integration
- main → production
- feature branch / PR → preview

验收：
- [ ] GitHub push 触发 build
- [ ] Preview URL 可打开
- [ ] Production 可打开
- [ ] 构建命令与本地一致

---

# Phase 2 — 内容管线

## TASK-004 — 定义 Vocabulary Zod Schema
**Status: TODO**

验收：
- [ ] 与 DATA_MODEL 对齐
- [ ] MVP30 全部通过 validation
- [ ] 错误数据能给出明确错误位置

## TASK-005 — 编写 Excel/JSON 内容转换脚本
**Status: TODO**

目标：让 Master 数据能 deterministic 生成 runtime content。

验收：
- [ ] `pnpm content:build`
- [ ] `pnpm content:validate`
- [ ] 输出顺序稳定
- [ ] 无数据时不静默跳过错误

## TASK-006 — 冻结 MVP30 内容字段
**Status: TODO**

为 30 个词补齐：
- stable ID
- 主图片路径
- 发音路径
- 相关词
- 对比词
- Day1–6 分配

验收：30/30 无缺字段。

---

# Phase 3 — 本地数据与学习引擎

## TASK-007 — Dexie DB v1
**Status: DONE**

表：
- wordProgress
- attempts
- reviewSchedule
- confusionPairs
- sessions
- rewards
- settings

验收：
- [ ] 新建 DB 成功
- [ ] 刷新不丢数据
- [ ] 测试覆盖初始化

## TASK-008 — Attempt quality 纯函数
**Status: DONE**

验收：
- [ ] 五类 outcome 映射正确
- [ ] 单测全部通过

## TASK-009 — Word mastery 更新函数
**Status: DONE**

验收：
- [ ] Seen/Recognized/Recalled/Used/Mastered 按证据推进
- [ ] 提示后正确不能等同独立正确
- [ ] 同一天刷题不能直接 Mastered

## TASK-010 — Review scheduler v1
**Status: DONE**

验收：
- [ ] 10m / 1d / 3d / 7d / 14d / 30d
- [ ] 低 quality 会缩短/回退
- [ ] due queue 可查询
- [ ] 单元测试覆盖时区/日期边界基础场景

## TASK-011 — Confusion pair 逻辑
**Status: DONE**

验收：
- [ ] 选错另一个词时计数
- [ ] Pair key 顺序稳定
- [ ] 可生成对比复习候选

---

# Phase 4 — App Shell / 儿童首页

## TASK-012 — Child Home
**Status: TODO**

验收：
- [ ] 大型 Play 按钮
- [ ] iPad/手机布局
- [ ] 无复杂菜单
- [ ] 可进入 Map

## TASK-013 — World Map v1
**Status: TODO**

验收：
- [ ] Animal Kingdom 开放
- [ ] 其他世界只展示锁定态
- [ ] 节点完成状态持久化

## TASK-014 — GameShell 基础组件
**Status: TODO**

包括：
- Progress
- Audio replay
- Feedback layer
- Pause/exit
- Touch lock

---

# Phase 5 — 五个游戏

## TASK-015 — Treasure Hunt
**Status: TODO**

验收：
- [ ] audio → object
- [ ] 3 级错误提示
- [ ] 输出标准 GameAttempt
- [ ] touch 流畅

## TASK-016 — Picture Match
**Status: TODO**

验收：
- [ ] image → written word
- [ ] 干扰项支持 contrast words
- [ ] 难度 2/3/4 options

## TASK-017 — Word Builder
**Status: TODO**

验收：
- [ ] 缺字母模式
- [ ] 字母块模式
- [ ] 触摸拖放或点选均可完成
- [ ] 主动拼写证据正确写入

## TASK-018 — Put It Somewhere
**Status: TODO**

验收：
- [ ] dnd-kit touch
- [ ] 指令可播音频
- [ ] 组合两个以上词
- [ ] 失败不会把对象拖丢/卡死

## TASK-019 — Mini Story / Boss
**Status: TODO**

验收：
- [ ] 3–6 个已学词组合
- [ ] 不引入未学核心词作为解题关键
- [ ] 至少一种非多选交互

---

# Phase 6 — Daily Plan / Reward

## TASK-020 — Day1–7 学习计划生成器
**Status: TODO**

验收：
- [ ] 每日新词 ≤ 7
- [ ] due reviews 优先插入
- [ ] Day7 无新词
- [ ] session 中有 warm start / review / boss

## TASK-021 — RewardState 与世界解锁
**Status: TODO**

验收：
- [ ] 完成任务有世界变化
- [ ] 刷新后保留
- [ ] 错题不扣已有奖励

---

# Phase 7 — Parent Dashboard

## TASK-022 — Parent Gate
**Status: TODO**

验收：孩子不易误触进入；不能构成真正安全认证，但能隔离普通操作。

## TASK-023 — Parent Dashboard
**Status: TODO**

验收显示：
- [ ] 今日分钟
- [ ] 新词/复习
- [ ] mastery 分组
- [ ] review due
- [ ] confusion pair

## TASK-024 — 数据导出 / 导入 / Reset
**Status: TODO**

验收：
- [ ] JSON export
- [ ] Zod validate import
- [ ] import 失败不覆盖旧数据
- [ ] reset 双重确认

---

# Phase 8 — PWA / Offline

## TASK-025 — Web Manifest / Installability
**Status: TODO**

验收：iPad Safari 可添加到主屏；图标/名称正确。

## TASK-026 — Service Worker / Offline shell
**Status: TODO**

验收：
- [ ] 安装/访问后断网可打开 app shell
- [ ] MVP30 所需资源可用
- [ ] 数据更新不清 IndexedDB

---

# Phase 9 — QA

## TASK-027 — Unit test quality gate
**Status: TODO**

目标：学习引擎核心逻辑关键分支覆盖，不用追求虚高总体覆盖率。

## TASK-028 — Playwright 核心 E2E
**Status: TODO**

至少：
- [ ] Day1 完成
- [ ] refresh persistence
- [ ] Day2 unlock
- [ ] parent report
- [ ] offline smoke

## TASK-029 — iPad 实机测试清单
**Status: TODO**

必须真人在 iPad 上操作，检查：
- touch
- 音频
- Safari PWA
- 横竖屏
- 键盘/输入
- 卡顿

---

# Phase 10 — 7 天家庭实验

## TASK-030 — 运行 7 天 MVP
**Status: TODO**

每天只记录必要数据和家长观察，不中途大改游戏规则，除非出现阻塞级问题。

## TASK-031 — 7 天复盘
**Status: TODO**

输出：
- Retention
- Active recall
- Voluntary return
- 各游戏完成/退出
- 最难词
- 混淆 pair
- 是否扩第二世界

只有 TASK-031 后才讨论 V2 功能扩张。
