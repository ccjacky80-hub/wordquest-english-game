from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

import openpyxl

DEFAULT_INPUT = Path(__file__).resolve().parents[1] / "三年级英语词汇_Master_Database_v1.xlsx"
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "data" / "vocabulary.clean.json"


def clean(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).strip())


def key(value: Any) -> str:
    return clean(value).casefold()


def split_words(value: Any) -> list[str]:
    return [clean(item) for item in clean(value).split(",") if clean(item)]


def parse_sources(value: Any) -> list[dict[str, Any]]:
    references: list[dict[str, Any]] = []
    for source in clean(value).split(";"):
        source = clean(source)
        match = re.match(r"^(File [123]) p\.(\d+)(?: (.*))?$", source)
        if not match:
            if source:
                raise ValueError(f"Unsupported source reference: {source!r}")
            continue
        file_name, page, detail = match.groups()
        reference: dict[str, Any] = {"file": file_name, "page": int(page)}
        if detail:
            unit_lesson = re.match(r"^(.*?)(?: (Lesson \d+))?$", detail)
            if unit_lesson:
                unit, lesson = unit_lesson.groups()
                if unit:
                    reference["unit"] = unit
                if lesson:
                    reference["lesson"] = lesson
        references.append(reference)
    return references


def row_dict(header: list[Any], row: tuple[Any, ...]) -> dict[str, Any]:
    return {clean(name): row[index] if index < len(row) else None for index, name in enumerate(header) if clean(name)}


def build_content(input_path: Path) -> dict[str, Any]:
    workbook = openpyxl.load_workbook(input_path, read_only=True, data_only=True)
    clean_sheet = workbook["02_Clean_Vocabulary"]
    classification_sheet = workbook["03_Game_Classification"]
    raw_sheet = workbook["01_Raw_Vocabulary"]

    def read_sheet(sheet: Any) -> list[dict[str, Any]]:
        rows = sheet.iter_rows(values_only=True)
        header = list(next(rows, ()))
        return [row_dict(header, row) for row in rows if any(value not in (None, "") for value in row)]

    clean_rows = read_sheet(clean_sheet)
    classification_rows = read_sheet(classification_sheet)
    raw_rows = read_sheet(raw_sheet)
    if not clean_rows or len(clean_rows) != len(classification_rows):
        raise ValueError("Clean and classification sheets must contain the same non-empty row count")

    classification_by_id = {clean(row["Clean ID"]): row for row in classification_rows}
    raw_by_word: dict[str, list[dict[str, Any]]] = {}
    for row in raw_rows:
        raw_by_word.setdefault(key(row["Canonical Word"]), []).append(row)

    id_by_word = {key(row["Word"]): clean(row["Clean ID"]) for row in clean_rows}
    entries: list[dict[str, Any]] = []
    unresolved: list[str] = []
    for row in clean_rows:
        clean_id = clean(row["Clean ID"])
        classification = classification_by_id.get(clean_id)
        if classification is None:
            raise ValueError(f"Missing classification row for {clean_id}")
        word = clean(row["Word"])
        related = split_words(row["Related Words"])
        contrast = split_words(row["Confusing / Contrast Words"])
        related_keys = [key(item) for item in related]
        contrast_keys = [key(item) for item in contrast]
        related_ids = [id_by_word[item_key] for item_key in related_keys if item_key in id_by_word]
        contrast_ids = [id_by_word[item_key] for item_key in contrast_keys if item_key in id_by_word]
        unresolved_related = [item for item in related if key(item) not in id_by_word]
        unresolved_contrast = [item for item in contrast if key(item) not in id_by_word]
        if unresolved_related or unresolved_contrast:
            unresolved.append(f"{clean_id}: related={unresolved_related}, contrast={unresolved_contrast}")

        source_references: list[dict[str, Any]] = []
        for raw in raw_by_word.get(key(word), []):
            reference: dict[str, Any] = {
                "file": clean(raw["File"]),
                "page": int(raw["Page"]),
            }
            if clean(raw["Unit"]):
                reference["unit"] = clean(raw["Unit"])
            if clean(raw["Lesson"]):
                reference["lesson"] = clean(raw["Lesson"])
            reference["sourceEntry"] = clean(raw["Source Entry"])
            reference["sourceMeaningZh"] = clean(raw["Chinese (source)"])
            reference["sourcePos"] = clean(raw["POS (source)"])
            source_references.append(reference)
        if not source_references:
            raise ValueError(f"No raw source references found for {clean_id} ({word})")

        mvp_enabled = clean(row["MVP30"]).casefold() == "yes"
        mvp: dict[str, Any] = {"enabled": mvp_enabled}
        if row["MVP Rank"] not in (None, ""):
            mvp["rank"] = int(row["MVP Rank"])

        entry = {
            "id": clean_id,
            "word": word,
            "lemma": clean(row["Lemma"]),
            "meaningZh": clean(row["Chinese (source)"]),
            "pos": clean(row["POS (source)"]),
            "world": clean(row["Primary World"]),
            "category": clean(classification["Category"]),
            "difficulty": int(row["Difficulty (1-5)"]),
            "imageability": int(row["Imageability (1-5)"]),
            "actionability": clean(row["Actionability"]),
            "source": source_references,
            "relatedWordIds": related_ids,
            "contrastWordIds": contrast_ids,
            "media": {},
            "mvp": mvp,
            "contentVersion": 1,
        }
        entries.append(entry)

    if unresolved:
        raise ValueError("Unresolved relationship references:\n" + "\n".join(unresolved))
    entries.sort(key=lambda entry: (entry["id"], key(entry["word"])))
    return {
        "contentVersion": 1,
        "source": {
            "file": input_path.name,
            "rawEntryCount": len(raw_rows),
            "cleanEntryCount": len(entries),
        },
        "entries": entries,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert the Master vocabulary workbook to deterministic runtime JSON")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    content = build_content(args.input)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"input={args.input}")
    print(f"output={args.output}")
    print(f"entries={len(content['entries'])}")
    print(f"mvp30={sum(1 for entry in content['entries'] if entry['mvp']['enabled'])}")
    for entry in content["entries"][:5]:
        print(json.dumps(entry, ensure_ascii=False, separators=(",", ":")))


if __name__ == "__main__":
    main()
