# WordQuest 开发与产品规范 v1.0

# 1. Git 规范

## 分支
建议：

```text
main
feat/TASK-xxx-short-name
fix/TASK-xxx-short-name
chore/TASK-xxx-short-name
```

单人开发也建议短分支，以便 Cloudflare Preview 验证。

## Commit
使用 Conventional Commits：

```text
feat(game): add treasure hunt attempt flow
fix(review): prevent same-day mastery escalation
chore(content): validate mvp vocabulary schema
docs(adr): record cloud deployment decision
```

一个 commit 尽量对应一个可解释的逻辑变化。

---

# 2. Agent 任务粒度

一个 Agent 一次只做一个 Task ID。

不接受：
> “帮我把整个 App 做完。”

接受：
> “完成 TASK-012：实现 review scheduler pure functions 和单元测试；不要改 UI。”

---

# 3. TypeScript

- `strict: true`
- 禁止无理由 `any`
- 外部 JSON 先 Zod parse
- domain function 尽量 pure
- 时间统一用 ISO string 持久化；显示层再本地化
- ID 必须稳定，不用数组 index 作为业务 ID

---

# 4. React

- 页面组件负责组合，不塞学习算法。
- 状态提升到“最小必要范围”。
- 持久数据不直接塞 Zustand 作为唯一存储。
- UI 不直接写 Dexie table。
- 复用 `GameShell`、`AudioButton`、`FeedbackLayer`、`ProgressDots` 等基础组件。

---

# 5. CSS / 视觉

- Tailwind token 化，不在大量组件中散落 magic color。
- 儿童主界面避免 shadcn 默认“企业面板”观感。
- 家长页可更多使用 shadcn 标准控件。
- touch target 主按钮/主要游戏元素尽量 ≥ 48px。
- 禁止依赖 hover。
- 重要状态同时使用形状/动画/文字或声音，不只靠颜色。

---

# 6. 儿童交互语言

儿童端：
- 短句
- 动词优先
- 少系统术语

推荐：
- `Find the tiger!`
- `Build the word.`
- `Listen again.`
- `Try this one.`

不推荐：
- `Incorrect answer.`
- `Mastery level updated.`
- `Review overdue.`

中文只做必要兜底，不做每题翻译。

---

# 7. 错误反馈

禁止：
- 大红叉持续闪烁
- 惩罚音效
- 扣星星
- “你错了”式文本

推荐：
- 轻回弹
- 重播
- 减少干扰项
- 目标局部高亮
- 几分钟后再测

---

# 8. 音频规范

- 不允许重叠播放多个词音频。
- 新音频播放前停止上一个。
- 页面离开时清理播放器。
- 预加载当前题和下一题必要音频，不全量加载 471 词。
- 单词发音与句子发音使用不同 asset key。

---

# 9. 内容规范

每个正式上线词必须至少有：
- stable ID
- 英文词形
- 中文兜底义
- world/category
- 图片或可视化策略
- 标准发音资源
- 至少 1 种识别玩法
- 至少 1 种主动回忆/使用玩法（在达到相应学习阶段后）

短语作为 Vocabulary Chunk，不强拆为孤立单词。

---

# 10. 测试规范

## 每个 domain bug 必须补 regression test。

## 禁止只测试 happy path
学习算法至少覆盖：
- 连错
- 提示后正确
- 同日多次正确
- 跨天正确
- review overdue
- confusion pair
- DB migration

## E2E viewport
至少：
- iPad landscape
- iPad portrait
- 常见手机 portrait

---

# 11. 日志与调试

开发模式可以有 debug panel：
- 当前 wordId
- mastery
- review stage
- dueAt
- attempt outcome

Production 儿童端默认隐藏。

不要依赖 `console.log` 作为长期诊断系统。

---

# 12. 网络访问规范

V1 正常游戏流程应可在 Network offline 后继续基础学习。

未经新 ADR 允许，不新增：
- analytics SDK
- remote DB SDK
- LLM SDK
- speech cloud API
- ad SDK

---

# 13. 依赖管理

新增依赖前检查：
1. 是否真有必要？
2. 原生 Web API 是否足够？
3. iPad Safari 是否支持？
4. 是否显著增加 bundle？
5. 是否有维护风险？

每个 Agent 不得为一个简单 util 随意新增 npm 包。

---

# 14. 文件命名

- React component: `PascalCase.tsx`
- domain/service/util: `kebab-case.ts` 或项目统一 `camelCase.ts`，初始化时二选一并全项目保持一致
- test: `*.test.ts(x)`
- E2E: `*.spec.ts`
- assets: stable ID + semantic suffix，如 `C0012-word.mp3`

---

# 15. 文档同步

以下变化必须同步文档：
- 用户可见行为 → PRD
- 目录/技术/部署 → ARCHITECTURE
- schema → DATA_MODEL
- 协作/编码规则 → CONVENTIONS
- 任务顺序/状态 → TASKS
- 关键 tradeoff → DECISIONS

不能只改代码。
