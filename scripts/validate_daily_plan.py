from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = ROOT / "data" / "vocabulary.clean.json"
PLAN_PATH = ROOT / "data" / "daily-plan.json"
EXPECTED_COUNTS = {1: 6, 2: 5, 3: 5, 4: 5, 5: 5, 6: 4, 7: 0}


def main() -> None:
    content = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
    plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
    mvp_entries = sorted(
        (entry for entry in content["entries"] if entry["mvp"]["enabled"] is True),
        key=lambda entry: entry["mvp"]["rank"],
    )
    mvp_ids = {entry["id"] for entry in mvp_entries}
    mvp_ids_in_rank_order = [entry["id"] for entry in mvp_entries]
    days = plan["days"]
    if [day["dayIndex"] for day in days] != list(range(1, 8)):
        raise ValueError("plan must contain Day1-Day7 in order")

    new_ids: list[str] = []
    for day in days:
        day_index = day["dayIndex"]
        ids = day["newWordIds"]
        review_ids = day["reviewWordIds"]
        print(f"day{day_index}_new={len(ids)} review={len(review_ids)}")
        if len(ids) != EXPECTED_COUNTS[day_index]:
            raise ValueError(f"unexpected Day {day_index} new-word count")
        if len(ids) != len(set(ids)):
            raise ValueError(f"duplicate new IDs within Day {day_index}")
        new_ids.extend(ids)

        expected_review = list(new_ids[:-len(ids)] if ids else new_ids)
        if day_index == 7:
            expected_review = mvp_ids_in_rank_order
        if review_ids != expected_review:
            raise ValueError(f"unexpected review IDs for Day {day_index}")

    if len(new_ids) != 30:
        raise ValueError(f"expected 30 assigned new IDs, found {len(new_ids)}")
    if len(set(new_ids)) != 30:
        raise ValueError("new IDs are not globally unique")
    if set(new_ids) != mvp_ids:
        missing = sorted(mvp_ids - set(new_ids))
        extra = sorted(set(new_ids) - mvp_ids)
        raise ValueError(f"MVP mismatch: missing={missing}, extra={extra}")
    print(f"new_ids_total={len(new_ids)}")
    print(f"new_ids_unique={len(set(new_ids))}")
    print("matches_mvp30=True")


if __name__ == "__main__":
    main()
