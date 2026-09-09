from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = ROOT / "data" / "vocabulary.clean.json"
OUTPUT_PATH = ROOT / "data" / "image-prompts.json"
STYLE_SUFFIX = (
    "flat vector illustration, clean bold rounded outlines, simple geometric shapes, "
    "bright but limited color palette, centered composition with generous negative space, "
    "child-friendly educational app art, consistent character proportions, "
    "no photorealistic shading, no gradients, no text, no watermark"
)

SUBJECTS = {
    "lion": "a friendly golden lion with a rounded mane and clear paws",
    "zebra": "a friendly zebra with bold simplified black-and-cream stripes",
    "tiger": "a friendly orange tiger with simple dark stripes",
    "panda": "a friendly black-and-white panda sitting upright",
    "giraffe": "a friendly giraffe with a long neck and simple brown patches",
    "monkey": "a friendly brown monkey with a curled tail",
    "fox": "a friendly orange fox with a white muzzle and large tail",
    "goat": "a friendly cream goat with small curved horns",
    "bear": "a friendly brown bear standing with visible paws",
    "snake": "a friendly green snake in a gentle S-shaped coil",
    "hippo": "a friendly purple-gray hippo with a rounded body",
    "elephant": "a friendly gray elephant with a short raised trunk",
    "rabbit": "a friendly white rabbit with long ears",
    "bee": "a friendly yellow-and-black bee with two simple wings",
    "turtle": "a friendly green turtle with a patterned shell",
    "frog": "a friendly green frog in a small crouched pose",
    "bird": "a friendly small blue bird perched with a clear beak",
    "ant": "a friendly tiny red ant shown large enough to recognize",
    "eagle": "a friendly brown-and-white eagle with broad wings",
    "rhino": "a friendly gray rhinoceros with one clear horn",
    "deer": "a friendly light-brown deer with small antlers",
    "feather": "one large soft blue feather floating upright",
    "wing": "one clearly readable blue bird wing shown in side view",
    "claw": "one simplified curved animal claw shown clearly against a cream card",
    "horn": "one smooth gray animal horn shown clearly in three-quarter view",
    "tail": "a friendly animal tail with a clear curved silhouette, attached to a small partial animal body",
    "fur": "a friendly brown animal with one clearly visible soft fur patch",
    "paw": "one friendly rounded animal paw with four simple toes",
    "fly": "a friendly small bird flying upward through a pale blue sky",
    "swim": "a friendly green turtle swimming through simple blue water waves",
}


def prompt_for(entry: dict[str, object]) -> str:
    word = str(entry["word"])
    subject = SUBJECTS[word]
    action_hint = " The pose should communicate the action immediately." if entry["actionability"] == "High" else ""
    complexity_hint = " Keep the shapes especially simple for a first-learning card." if int(entry["difficulty"]) <= 2 else " Use a few clear distinguishing features without adding clutter."
    return (
        f"Create a vocabulary card illustration for the English word '{word}': {subject}. "
        f"Use a pale cream or mist background, one soft grounding shape, and a centered subject with "
        f"roughly 15–20% clear space around it.{action_hint}{complexity_hint} {STYLE_SUFFIX}."
    )


def main() -> None:
    content = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
    entries = [entry for entry in content["entries"] if entry["mvp"]["enabled"]]
    entries.sort(key=lambda entry: entry["mvp"]["rank"])
    if len(entries) != 30:
        raise ValueError(f"Expected 30 MVP entries, found {len(entries)}")
    prompts = []
    for entry in entries:
        word = str(entry["word"])
        prompts.append(
            {
                "wordId": entry["id"],
                "word": word,
                "mvpRank": entry["mvp"]["rank"],
                "difficulty": entry["difficulty"],
                "imageability": entry["imageability"],
                "actionability": entry["actionability"],
                "prompt": prompt_for(entry),
                "suggestedFilename": f"{entry['id']}.webp",
            }
        )
    OUTPUT_PATH.write_text(json.dumps(prompts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"output={OUTPUT_PATH}")
    print(f"prompts={len(prompts)}")
    print(f"style_suffix_shared={all(item['prompt'].endswith(STYLE_SUFFIX + '.') for item in prompts)}")
    for item in prompts[:5]:
        print(json.dumps(item, ensure_ascii=False, separators=(",", ":")))


if __name__ == "__main__":
    main()
