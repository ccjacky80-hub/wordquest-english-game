# MVP30 Daily Plan Notes

## Scope

`data/daily-plan.json` is the authoritative Day1-Day7 allocation for the frozen MVP30 vocabulary set. The source vocabulary remains `data/vocabulary.clean.json`; this file stores only stable IDs and schedule metadata.

## Allocation basis

New words are allocated by ascending `mvp.rank`, not by JSON array position or alphabetic order. This keeps the schedule deterministic and directly tied to the frozen MVP ordering.

| Day | New words | Rank range |
|---:|---:|---:|
| 1 | 6 | 1-6 |
| 2 | 5 | 7-11 |
| 3 | 5 | 12-16 |
| 4 | 5 | 17-21 |
| 5 | 5 | 22-26 |
| 6 | 4 | 27-30 |
| 7 | 0 | none |

The first six days introduce 30 unique IDs total. Day7 intentionally introduces no new vocabulary.

## Review rule

- Day1 reviews no earlier words.
- Day2-Day6 review the cumulative set of all words introduced before that day (`all-previous`). This gives each earlier word a daily retrieval opportunity while the set remains small enough for the MVP session.
- Day7 is a pure review and active-recall test day. Its `reviewWordIds` contains all 30 MVP IDs in MVP rank order (`all-mvp30`), and `newWordIds` is empty. The explicit full-set rule ensures no MVP word is omitted from the capstone review and gives the learning engine a deterministic input set.

The daily plan does not encode per-user scheduling, mastery state, or retry timing. Those remain responsibilities of the learning engine; `reviewWordIds` defines the candidate set for the day's first-pass review/test content.

## Data shape

```json
{
  "dayIndex": 1,
  "newWordIds": ["C0430"],
  "reviewWordIds": [],
  "reviewRule": "all-previous"
}
```

Top-level metadata records `schemaVersion`, the source file, allocation basis, per-day new-word counts, and total new words. `scripts/validate_daily_plan.py` verifies daily counts, global uniqueness, complete MVP30 set equality, and review-rule expansion.
