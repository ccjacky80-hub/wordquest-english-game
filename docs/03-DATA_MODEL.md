# WordQuest 数据模型 v1.0

## 1. 数据分层

分三类，不允许混合：

1. **Source Content**：教材与人工整理内容，只读。
2. **Runtime Learning Data**：孩子的学习进度，本地可写。
3. **UI Session State**：当前题目等临时状态，不需要永久存储。

---

# 2. VocabularyEntry

建议运行时 schema：

```ts
export interface VocabularyEntry {
  id: string;                  // 稳定 ID，例如 C0012
  word: string;                // elephant
  lemma: string;
  meaningZh: string;
  pos: string;
  world: WorldId;
  category: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  imageability: 1 | 2 | 3 | 4 | 5;
  actionability: 'Low' | 'Medium' | 'High';

  source: SourceReference[];
  relatedWordIds: string[];
  contrastWordIds: string[];

  media: {
    image?: string;
    audioWord?: string;
    audioSlow?: string;
  };

  mvp?: {
    enabled: boolean;
    rank?: number;
  };

  contentVersion: number;
}
```

> 当前 `data/vocabulary.clean.json` 是候选数据导出，还不是最终 runtime schema；正式开发前由 `TASK-004` 完成转换和 Zod 校验。

---

# 3. SourceReference

```ts
export interface SourceReference {
  file: 'File 1' | 'File 2' | 'File 3';
  page: number;
  unit?: string;
  lesson?: string;
  sourceEntry?: string;
  sourceMeaningZh?: string;
  sourcePos?: string;
}
```

要求：
- 不因游戏分类而删除教材来源。
- 同形异义必须能追溯到多个 SourceReference。

---

# 4. WordProgress

IndexedDB 主表之一。

```ts
export type MasteryLevel =
  | 0 // New
  | 1 // Seen
  | 2 // Recognized
  | 3 // Recalled
  | 4 // Used
  | 5; // Mastered

export interface WordProgress {
  wordId: string;
  masteryLevel: MasteryLevel;

  listeningRecognition: number; // 0..1
  visualRecognition: number;
  spelling: number;
  activeRecall: number;
  contextUse: number;
  memoryStrength: number;

  firstSeenAt?: string;          // ISO datetime
  lastSeenAt?: string;
  lastIndependentCorrectAt?: string;

  currentReviewStage: number;    // 0..5+
  nextReviewAt?: string;

  independentCorrectCount: number;
  assistedCorrectCount: number;
  wrongCount: number;
  activeRecallCorrectCount: number;

  version: number;
}
```

---

# 5. GameAttempt

所有游戏统一输出。

```ts
export type AttemptOutcome =
  | 'independentCorrect'
  | 'correctAfterReplay'
  | 'correctAfterHint'
  | 'revealed'
  | 'wrong';

export interface GameAttempt {
  id: string;
  sessionId: string;
  gameType: GameType;
  wordId: string;
  relatedWordIds?: string[];

  promptType:
    | 'audio-to-object'
    | 'image-to-word'
    | 'word-build'
    | 'instruction-action'
    | 'story-context';

  outcome: AttemptOutcome;
  attemptIndex: number;
  hintsUsed: number;
  audioReplayCount: number;
  responseTimeMs?: number;

  selectedAnswerId?: string;
  confusionWithWordId?: string;

  occurredAt: string;
  contentVersion: number;
}
```

重要：一个错误尝试也应记录；后续最终提示正确不能覆盖之前的 wrong。

---

# 6. Attempt → Quality

V1 固定映射：

```ts
const qualityMap = {
  independentCorrect: 1.0,
  correctAfterReplay: 0.65,
  correctAfterHint: 0.4,
  revealed: 0.15,
  wrong: 0.0,
} as const;
```

如果 prompt 属于 `word-build` / `story-context` 且独立正确，可在 Learning Engine 内给 active recall/context 维度更高证据，但总 quality 上限仍为 1.0。

---

# 7. ReviewSchedule

```ts
export interface ReviewSchedule {
  wordId: string;
  stage: number;
  dueAt: string;
  lastQuality: number;
  reason:
    | 'new-word'
    | 'standard-review'
    | 'low-quality'
    | 'confusion'
    | 'manual';
}
```

标准阶段：

```ts
const REVIEW_INTERVALS = [
  { minutes: 10 },
  { days: 1 },
  { days: 3 },
  { days: 7 },
  { days: 14 },
  { days: 30 },
];
```

调度算法必须是 pure function，可单元测试。

---

# 8. ConfusionPair

```ts
export interface ConfusionPair {
  pairKey: string;       // 排序后的 `${a}:${b}`
  wordAId: string;
  wordBId: string;
  count: number;
  lastOccurredAt: string;
  resolvedEvidenceCount: number;
}
```

当 `selectedAnswerId !== target wordId` 且它是另一个词时，可以增加 pair 计数。

---

# 9. LearningSession

```ts
export interface LearningSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  planDate: string;      // local YYYY-MM-DD
  dayIndex?: number;     // MVP Day1..7

  newWordIds: string[];
  reviewWordIds: string[];
  completedWordIds: string[];

  attempts: number;
  independentCorrect: number;
  hintsUsed: number;

  status: 'active' | 'completed' | 'abandoned';
}
```

---

# 10. RewardState

```ts
export interface RewardState {
  id: 'main';
  stars: number;
  unlockedAnimalIds: string[];
  unlockedDecorationIds: string[];
  completedMissionIds: string[];
  updatedAt: string;
}
```

星星是辅助，不是唯一奖励。

---

# 11. AppSettings

```ts
export interface AppSettings {
  id: 'main';
  audioEnabled: boolean;
  musicEnabled: boolean;
  reducedMotion: boolean;
  showChineseFallback: boolean;
  onboardingCompleted: boolean;
  dataSchemaVersion: number;
}
```

儿童姓名不是必需字段。

---

# 12. LocalEvent（可选但推荐）

V1 不接外部 analytics，但为了测试可以本地记录：

```ts
export interface LocalEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}
```

限制：
- 设置容量上限或按时间清理。
- 不记录麦克风原始音频。
- 不记录不必要的设备指纹信息。

---

# 13. Dexie Schema 草案

```ts
class WordQuestDB extends Dexie {
  wordProgress!: Table<WordProgress, string>;
  attempts!: Table<GameAttempt, string>;
  reviewSchedule!: Table<ReviewSchedule, string>;
  confusionPairs!: Table<ConfusionPair, string>;
  sessions!: Table<LearningSession, string>;
  rewards!: Table<RewardState, string>;
  settings!: Table<AppSettings, string>;
  localEvents!: Table<LocalEvent, string>;
}
```

索引在实现阶段根据查询确定，但至少需要支持：
- `nextReviewAt <= now`
- attempts by `wordId`
- attempts by `sessionId`
- sessions by `planDate`
- confusionPair by pairKey

---

# 14. 数据版本与迁移

必须有两个独立版本：

- `contentVersion`：词汇/题目内容版本
- `dataSchemaVersion`：孩子本地学习数据 schema

内容更新不应自动清进度。

Dexie 每次 schema 变更必须新增 migration；禁止“开发方便”直接 delete DB，除非专门的开发 reset 命令。

---

# 15. 导出 / 导入

家长/开发页支持导出：

```json
{
  "exportVersion": 1,
  "exportedAt": "...",
  "appVersion": "...",
  "dataSchemaVersion": 1,
  "wordProgress": [],
  "attempts": [],
  "reviewSchedule": [],
  "confusionPairs": [],
  "sessions": [],
  "rewards": {},
  "settings": {}
}
```

导入必须 Zod 校验；失败不能破坏已有 DB。推荐先 transaction + backup/rollback。

---

# 16. Master Excel 与运行时 JSON

`三年级英语词汇_Master_Database_v1.xlsx` 为人工审阅基线（按项目约定保留在仓库根目录）。  
`data/vocabulary.clean.json` 为当前导出候选。  
正式实现要求：

1. 写 import script。
2. 固定列映射。
3. 输出 deterministic JSON。
4. Zod 校验。
5. CI/本地 `content:validate` 校验。
6. 运行时只消费已验证 JSON。
