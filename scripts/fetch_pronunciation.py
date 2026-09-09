from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = ROOT / "data" / "vocabulary.clean.json"
MANIFEST_PATH = ROOT / "data" / "pronunciation-manifest.json"
AUDIO_DIR = ROOT / "public" / "audio"
SOURCES_PATH = AUDIO_DIR / "SOURCES.md"
API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en/"
FALLBACK_API_BASE = "https://freedictionaryapi.com/api/v1/entries/en/"
USER_AGENT = "WordQuest-content-pipeline/1.0"


def fetch_json(url: str) -> object:
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urlopen(request, timeout=8) as response:
        return json.loads(response.read().decode("utf-8"))


def choose_audio(phonetics: list[dict[str, object]]) -> tuple[str, str] | None:
    candidates: list[tuple[int, int, str, str]] = []
    for index, item in enumerate(phonetics):
        audio = str(item.get("audio") or "").strip()
        if not audio:
            continue
        normalized = audio.casefold()
        # Keep one global preference: US first, then UK, then any available pronunciation.
        region_rank = 0 if "-us" in normalized or "/us/" in normalized else 1 if "-uk" in normalized or "/uk/" in normalized else 2
        candidates.append((region_rank, index, audio, str(item.get("text") or "").strip()))
    if not candidates:
        return None
    _, _, audio, phonetic = sorted(candidates)[0]
    return audio, phonetic


def choose_fallback_audio(entries: list[dict[str, object]]) -> tuple[str, str] | None:
    for entry in entries:
        for pronunciation in list(entry.get("pronunciations") or []):
            audio = str(pronunciation.get("audio") or "").strip()
            if audio:
                return audio, str(pronunciation.get("text") or "").strip()
    return None


def download(url: str, destination: Path) -> None:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=15) as response:
        data = response.read()
    if not data:
        raise ValueError("empty audio response")
    destination.write_bytes(data)


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch MVP30 word pronunciations from Free Dictionary API")
    parser.add_argument("--sleep", type=float, default=0.15, help="seconds between API requests")
    args = parser.parse_args()

    content = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
    entries = sorted((entry for entry in content["entries"] if entry["mvp"]["enabled"]), key=lambda entry: entry["mvp"]["rank"])
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    records: list[dict[str, object]] = []
    successes: list[dict[str, object]] = []
    failures: list[dict[str, str]] = []

    print(f"source={API_BASE}<word>")
    print(f"target_entries={len(entries)}")
    for position, entry in enumerate(entries):
        word_id = str(entry["id"])
        word = str(entry["word"])
        api_url = API_BASE + quote(word, safe="")
        filename = f"{word_id}-word.mp3"
        destination = AUDIO_DIR / filename
        source_name = "Free Dictionary API (dictionaryapi.dev)"
        try:
            try:
                payload = fetch_json(api_url)
                if not isinstance(payload, list) or not payload:
                    raise ValueError("API response did not contain dictionary entries")
                selected: tuple[str, str] | None = None
                for dictionary_entry in payload:
                    selected = choose_audio(list(dictionary_entry.get("phonetics") or []))
                    if selected:
                        break
                if not selected:
                    raise ValueError("no non-empty phonetics audio field")
                audio_url, phonetic = selected
            except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError):
                api_url = FALLBACK_API_BASE + quote(word, safe="")
                source_name = "Free Dictionary API (freedictionaryapi.com)"
                fallback_payload = fetch_json(api_url)
                if not isinstance(fallback_payload, dict) or not fallback_payload.get("entries"):
                    raise ValueError("fallback API response did not contain dictionary entries")
                selected = choose_fallback_audio(list(fallback_payload["entries"]))
                if not selected:
                    raise ValueError("no non-empty fallback pronunciations audio field")
                audio_url, phonetic = selected
            download(audio_url, destination)
            record = {
                "wordId": word_id,
                "word": word,
                "status": "success",
                "apiUrl": api_url,
                "source": source_name,
                "audioUrl": audio_url,
                "localPath": f"/audio/{filename}",
                "filename": filename,
                "phonetic": phonetic,
                "license": "CC BY-SA 4.0",
                "attribution": "Audio data from Wiktionary via Free Dictionary API; CC BY-SA 4.0.",
            }
            records.append(record)
            successes.append(record)
            print(f"SUCCESS {position + 1:02d}/30 {word} -> {filename}")
        except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError) as error:
            failure = {"wordId": word_id, "word": word, "status": "failure", "apiUrl": api_url, "error": str(error)}
            records.append(failure)
            failures.append(failure)
            print(f"FAILURE {position + 1:02d}/30 {word} -> {error}")
        if position + 1 < len(entries):
            time.sleep(max(0.0, args.sleep))

    manifest = {
        "source": "Free Dictionary API (dictionaryapi.dev; fallback freedictionaryapi.com)",
        "dataSource": "Wiktionary",
        "license": "CC BY-SA 4.0",
        "records": records,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "# Pronunciation sources",
        "",
        "Audio files are fetched from the Free Dictionary API (`dictionaryapi.dev`). The dictionary data source is Wiktionary.",
        "Every successful audio record is attributed under **CC BY-SA 4.0**. Keep this attribution with redistributed audio assets.",
        "",
        "| Word ID | Word | Local file | API URL | Audio URL | Status |",
        "|---|---|---|---|---|---|",
    ]
    for record in records:
        lines.append(
            f"| {record['wordId']} | {record['word']} | `{record.get('localPath', '')}` | "
            f"{record['apiUrl']} | {record.get('audioUrl', '')} | {record['status']} |"
        )
    if failures:
        lines.extend(["", "## Failed lookups", "", "The following words were not silently skipped; they require a later fallback or manual review:"])
        lines.extend(f"- `{failure['wordId']}` `{failure['word']}`: {failure['error']}" for failure in failures)
    SOURCES_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"manifest={MANIFEST_PATH}")
    print(f"sources={SOURCES_PATH}")
    print(f"successes={len(successes)}")
    print(f"failures={len(failures)}")
    print("failed_words=" + json.dumps([failure["word"] for failure in failures], ensure_ascii=False))
    if failures:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
