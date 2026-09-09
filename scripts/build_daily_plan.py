from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = ROOT / "data" / "vocabulary.clean.json"
OUTPUT_PATH = ROOT / "data" / "daily-plan.json"

NEW_WORD_COUNTS = {1: 6, 2: 5, 3: 5, 4: 5, 5: 5, 6: 4, 7: 0}


def main() -> None:
    content = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
    mvp_entries = sorted(
        (entry for entry in content["entries"] if entry["mvp"]["enabled"] is True),
        key=lambda entry: entry["mvp"]["rank"],
    )
    if len(mvp_entries) != 30:
        raise ValueError(f"expected 30 MVP entries, found {len(mvp_entries)}")
    if [entry["mvp"]["rank"] for entry in mvp_entries] != list(range(1, 31)):
        raise ValueError("MVP ranks are not a complete 1-30 sequence")

    plans: list[dict[str, object]] = []
    cursor = 0
    introduced: list[str] = []
    for day, count in NEW_WORD_COUNTS.items():
        new_ids = [entry["id"] for entry in mvp_entries[cursor : cursor + count]]
        if day == 7 and new_ids:
            raise ValueError("Day 7 must not introduce new words")
        review_ids = list(introduced)
        if day == 7:
            review_ids = [entry["id"] for entry in mvp_entries]
        plans.append(
            {
                "dayIndex": day,
                "newWordIds": new_ids,
                "reviewWordIds": review_ids,
                "reviewRule": "all-previous" if day < 7 else "all-mvp30",
            }
        )
        introduced.extend(new_ids)
        cursor += count

    payload = {
        "schemaVersion": 1,
        "source": "data/vocabulary.clean.json",
        "allocation": {
            "basis": "MVP rank ascending",
            "newWordCounts": {f"day{day}": count for day, count in NEW_WORD_COUNTS.items()},
            "totalNewWords": sum(NEW_WORD_COUNTS.values()),
        },
        "days": plans,
    }
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"output={OUTPUT_PATH}")
    for plan in plans:
        print(
            f"day{plan['dayIndex']}: new={len(plan['newWordIds'])} "
            f"review={len(plan['reviewWordIds'])} "
            f"newWordIds={json.dumps(plan['newWordIds'])}"
        )


if __name__ == "__main__":
    main()
