from __future__ import annotations

import argparse
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = ROOT / "data" / "vocabulary.clean.json"
MANIFEST_PATH = ROOT / "data" / "pronunciation-manifest.json"
AUDIO_DIR = ROOT / "public" / "audio"
SOURCES_PATH = AUDIO_DIR / "SOURCES.md"
ENGINE = "Microsoft Speech API 5.4"
VOICE = "Microsoft Zira Desktop"
CULTURE = "en-US"
LICENSE = "Microsoft system TTS voice; generated locally for this project"


def powershell_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def synthesize_wav(text: str, output: Path, rate: int) -> None:
    command = (
        "Add-Type -AssemblyName System.Speech; "
        "$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
        f"$synth.SelectVoice({powershell_literal(VOICE)}); "
        f"$synth.Rate = {rate}; $synth.Volume = 100; "
        f"$synth.SetOutputToWaveFile({powershell_literal(str(output))}); "
        f"$synth.Speak({powershell_literal(text)}); "
        "$synth.Dispose()"
    )
    result = subprocess.run(
        ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode != 0:
        detail = (result.stderr or result.stdout).strip()
        raise RuntimeError(detail or f"PowerShell exited with {result.returncode}")
    if not output.exists() or output.stat().st_size == 0:
        raise RuntimeError("SAPI produced no WAV bytes")


def convert_mp3(wav: Path, mp3: Path) -> None:
    result = subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "96k", str(mp3)],
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"ffmpeg exited with {result.returncode}")
    if not mp3.exists() or mp3.stat().st_size == 0:
        raise RuntimeError("ffmpeg produced no MP3 bytes")


def is_mp3(path: Path) -> bool:
    with path.open("rb") as stream:
        header = stream.read(3)
    return header == b"ID3" or len(header) >= 2 and header[0] == 0xFF and header[1] & 0xE0 == 0xE0


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate MVP30 English word audio with local Windows SAPI")
    parser.add_argument("--rate", type=int, default=-1, help="SAPI speech rate (-10 to 10); -1 is moderately slow")
    args = parser.parse_args()
    if not -10 <= args.rate <= 10:
        raise SystemExit("--rate must be between -10 and 10")

    content = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
    entries = sorted((entry for entry in content["entries"] if entry["mvp"]["enabled"]), key=lambda entry: entry["mvp"]["rank"])
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    records: list[dict[str, object]] = []
    failures: list[dict[str, str]] = []
    print(f"engine={ENGINE}")
    print(f"voice={VOICE}")
    print(f"culture={CULTURE}")
    print(f"target_entries={len(entries)}")

    with tempfile.TemporaryDirectory(prefix="wordquest-tts-") as temp_dir:
        temp_root = Path(temp_dir)
        for position, entry in enumerate(entries):
            word_id = str(entry["id"])
            word = str(entry["word"])
            mp3 = AUDIO_DIR / f"{word_id}.mp3"
            wav = temp_root / f"{word_id}.wav"
            try:
                synthesize_wav(word, wav, args.rate)
                convert_mp3(wav, mp3)
                if not is_mp3(mp3):
                    raise RuntimeError("output header is not recognized as MP3")
                record = {
                    "wordId": word_id,
                    "word": word,
                    "status": "success",
                    "engine": ENGINE,
                    "voice": VOICE,
                    "culture": CULTURE,
                    "rate": args.rate,
                    "localPath": f"/audio/{word_id}.mp3",
                    "filename": f"{word_id}.mp3",
                    "bytes": mp3.stat().st_size,
                    "format": "MP3",
                    "license": LICENSE,
                    "attribution": "Generated locally with Microsoft Speech API 5.4, Microsoft Zira Desktop (en-US).",
                }
                records.append(record)
                print(f"SUCCESS {position + 1:02d}/30 {word} -> {word_id}.mp3 ({record['bytes']} bytes)")
            except (OSError, RuntimeError, subprocess.SubprocessError) as error:
                failure = {"wordId": word_id, "word": word, "status": "failure", "error": str(error)}
                records.append(failure)
                failures.append(failure)
                print(f"FAILURE {position + 1:02d}/30 {word} -> {error}")

    manifest = {
        "sourceType": "local_tts",
        "engine": ENGINE,
        "voice": VOICE,
        "culture": CULTURE,
        "rate": args.rate,
        "license": LICENSE,
        "records": records,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "# Pronunciation sources",
        "",
        f"Audio is generated locally with **{ENGINE}**, voice **{VOICE}** (`{CULTURE}`), at SAPI rate `{args.rate}`.",
        "This is a local system TTS fallback, not the previously failed dictionary API and not a cloud neural voice.",
        "The generated files are project build artifacts; review voice licensing/redistribution terms before public release.",
        "",
        "| Word ID | Word | Local file | Engine | Voice | Bytes | Format | Status |",
        "|---|---|---|---|---|---:|---|---|",
    ]
    for record in records:
        lines.append(
            f"| {record['wordId']} | {record['word']} | `{record.get('localPath', '')}` | "
            f"{record.get('engine', ENGINE)} | {record.get('voice', VOICE)} | {record.get('bytes', '')} | "
            f"{record.get('format', '')} | {record['status']} |"
        )
    if failures:
        lines.extend(["", "## Failed generations", "", "These words require manual review or a different TTS engine:"])
        lines.extend(f"- `{failure['wordId']}` `{failure['word']}`: {failure['error']}" for failure in failures)
    SOURCES_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    successes = len(records) - len(failures)
    print(f"manifest={MANIFEST_PATH}")
    print(f"sources={SOURCES_PATH}")
    print(f"successes={successes}")
    print(f"failures={len(failures)}")
    print("failed_words=" + json.dumps([failure["word"] for failure in failures], ensure_ascii=False))
    if failures:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
