from __future__ import annotations

import json
from pathlib import Path

import openpyxl

WORKBOOK = Path(__file__).resolve().parents[1] / "三年级英语词汇_Master_Database_v1.xlsx"
MVP_WORDS = [
    "lion", "zebra", "tiger", "panda", "giraffe", "monkey", "fox", "goat", "bear", "snake",
    "hippo", "elephant", "rabbit", "bee", "turtle", "frog", "bird", "ant", "eagle", "rhino",
    "deer", "feather", "wing", "claw", "horn", "tail", "fur", "paw", "fly", "swim",
]


def clean(value: object) -> str:
    return "" if value is None else str(value).strip()


def main() -> None:
    workbook = openpyxl.load_workbook(WORKBOOK, read_only=True, data_only=True)
    sheet = workbook["02_Clean_Vocabulary"]
    rows = list(sheet.iter_rows(values_only=True))
    header = [clean(value) for value in rows[0]]
    index = {name: position for position, name in enumerate(header) if name}
    by_word = {clean(row[index["Word"]]).casefold(): row for row in rows[1:] if clean(row[index["Word"]])}
    fields = [
        "Difficulty (1-5)", "Imageability (1-5)", "Actionability", "Related Words",
        "Confusing / Contrast Words", "MVP Rank", "MVP30",
    ]
    result = {"workbook": str(WORKBOOK), "mvp_count": len(MVP_WORDS), "fields": {}, "rows": []}
    for field in fields:
        field_index = index[field]
        missing = [word for word in MVP_WORDS if by_word.get(word) is None or by_word[word][field_index] in (None, "")]
        result["fields"][field] = {"missing_count": len(missing), "missing_words": missing}
    for word in MVP_WORDS:
        row = by_word[word]
        result["rows"].append({field: row[index[field]] for field in fields} | {"Word": word})
    print(json.dumps(result, ensure_ascii=False, indent=2, default=str))


if __name__ == "__main__":
    main()
