from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = ROOT / "data" / "vocabulary.clean.json"
PROMPTS_PATH = ROOT / "data" / "image-prompts.json"
PRONUNCIATION_PATH = ROOT / "data" / "pronunciation-manifest.json"
IMAGE_DIR = ROOT / "public" / "images"
AUDIO_DIR = ROOT / "public" / "audio"


def main() -> None:
    content = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
    prompts = json.loads(PROMPTS_PATH.read_text(encoding="utf-8"))
    pronunciation = json.loads(PRONUNCIATION_PATH.read_text(encoding="utf-8"))
    entries = content["entries"]
    mvp_ids = {entry["id"] for entry in entries if entry["mvp"]["enabled"]}
    prompt_by_id = {item["wordId"]: item for item in prompts}
    audio_by_id = {item["wordId"]: item for item in pronunciation["records"] if item.get("status") == "success"}
    if set(prompt_by_id) != mvp_ids:
        raise ValueError("image prompt IDs do not exactly match MVP IDs")
    if set(audio_by_id) != mvp_ids:
        raise ValueError("successful pronunciation IDs do not exactly match MVP IDs")

    for entry in entries:
        word_id = entry["id"]
        if word_id not in mvp_ids:
            entry.pop("imagePath", None)
            entry.pop("audioPath", None)
            continue
        image_filename = prompt_by_id[word_id]["suggestedFilename"]
        audio_filename = audio_by_id[word_id]["filename"]
        image_file = IMAGE_DIR / image_filename
        audio_file = AUDIO_DIR / audio_filename
        if not image_file.is_file():
            raise FileNotFoundError(f"missing image asset: {image_file}")
        if not audio_file.is_file():
            raise FileNotFoundError(f"missing audio asset: {audio_file}")
        entry["imagePath"] = f"/images/{image_filename}"
        entry["audioPath"] = f"/audio/{audio_filename}"

    CONTENT_PATH.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"updated={CONTENT_PATH}")
    print(f"mvp_assets_linked={len(mvp_ids)}")
    for entry in sorted((entry for entry in entries if entry["mvp"]["enabled"]), key=lambda item: item["mvp"]["rank"])[:5]:
        print(f"{entry['id']} {entry['word']} imagePath={entry['imagePath']} audioPath={entry['audioPath']}")


if __name__ == "__main__":
    main()
