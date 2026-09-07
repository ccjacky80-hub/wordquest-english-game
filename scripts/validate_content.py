from __future__ import annotations

import json
from pathlib import Path

CONTENT = Path(__file__).resolve().parents[1] / "data" / "vocabulary.clean.json"


def main() -> None:
    content = json.loads(CONTENT.read_text(encoding="utf-8"))
    entries = content["entries"]
    ids = [entry["id"] for entry in entries]
    if ids != sorted(ids):
        raise ValueError("entries are not sorted by stable ID")
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate stable IDs")
    if content["source"]["rawEntryCount"] != 524 or len(entries) != 471:
        raise ValueError("unexpected source counts")
    mvp = [entry for entry in entries if entry["mvp"]["enabled"]]
    if len(mvp) != 30 or sorted(entry["mvp"]["rank"] for entry in mvp) != list(range(1, 31)):
        raise ValueError("MVP30 ranks are incomplete")
    entry_ids = set(ids)
    for entry in entries:
        if not set(entry["relatedWordIds"]).issubset(entry_ids):
            raise ValueError(f"unknown related word in {entry['id']}")
        if not set(entry["contrastWordIds"]).issubset(entry_ids):
            raise ValueError(f"unknown contrast word in {entry['id']}")
    print(f"validated={CONTENT}")
    print(f"entries={len(entries)}")
    print(f"mvp30={len(mvp)}")
    print("stable_ids=unique,sorted")
    print("relationships=resolved")


if __name__ == "__main__":
    main()
