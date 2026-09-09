# Master Excel structure verification

Source of truth: `三年级英语词汇_Master_Database_v1.xlsx`

Verified with Python `openpyxl` in read-only/data-only mode. No PDF was read or used.

## Workbook structure

| Sheet | Data rows | Columns |
|---|---:|---:|
| `00_Overview` | 48 | 14 |
| `01_Raw_Vocabulary` | 524 | 12 |
| `02_Clean_Vocabulary` | 471 | 23 |
| `03_Game_Classification` | 471 | 19 |

### `01_Raw_Vocabulary`

`Raw ID`, `File`, `Page`, `Unit`, `Lesson`, `Source Order`, `Source Entry`, `Canonical Word`, `Chinese (source)`, `POS (source)`, `Theme Source`, `Suggested World`

### `02_Clean_Vocabulary`

`Clean ID`, `Word`, `Normalized Key`, `Lemma`, `Chinese (source)`, `POS (source)`, `Occurrence Count`, `Source Entries`, `Sources`, `Source Themes`, `All Worlds`, `Primary World`, `Difficulty (1-5)`, `Imageability (1-5)`, `Actionability`, `Source Wording Varies`, `MVP30`, `MVP Rank`, `MVP Priority`, `Related Words`, `Confusing / Contrast Words`, `Recommended Games`, `Default Mastery State`

### `03_Game_Classification`

`Clean ID`, `Word`, `Chinese`, `Primary World`, `Category`, `Difficulty`, `Imageability`, `Actionability`, `MVP30`, `MVP Rank`, `MVP Priority`, `Recommended Games`, `Related Words`, `Confusing / Contrast Words`, `First Exposure`, `Recall / Production`, `Story Potential`, `Review Pattern`, `Initial Mastery`

## Findings versus document assumptions

- The workbook confirms 524 raw entries, 471 unique words, and 53 repeated entries.
- The workbook contains an explicit `MVP30` flag and `MVP Rank` 1-30 in both clean and game-classification sheets.
- The MVP words are the Animal Kingdom list recorded in the overview and have ranks 1-30.
- There is **no Day1-Day6 assignment column** in the workbook. The PRD's 6/5/5/5/5/4 distribution remains a plan, not source data.
- The source does not contain image file names or audio paths/URLs. Runtime `media` is therefore emitted empty and is pending asset production.
- Chinese meanings, POS, source file/page/unit/lesson provenance, difficulty, imageability, actionability, related words, contrast words, recommended games, first exposure, recall/production, story potential, and review pattern are present in source sheets.

## MVP30 field coverage

For all 30 MVP rows:

- Present: `difficulty` (30/30), `imageability` (30/30), `actionability` (30/30), `relatedWords` (30/30), `MVP Rank` (30/30), `MVP30` (30/30).
- Missing: `Confusing / Contrast Words` for 23/30. Present for `goat`, `feather`, `wing`, `claw`, `horn`, `fur`, and `paw`.
- Missing: Day1-Day6 assignment for 30/30 because no such source field exists. This remains pending manual freeze; no day was inferred by the pipeline.
- Missing: image and audio asset references for 30/30 because the workbook has no asset-path fields.

## Conversion output

`python scripts/import_vocabulary.py` produces `data/vocabulary.clean.json` with 471 entries, copied stable IDs (`C0001` style), source references, relationship IDs, MVP flags/ranks, and deterministic sort by ID. `python scripts/validate_content.py` verifies counts, sorted unique IDs, MVP ranks 1-30, and relationship references.

Sample output records are printed by the conversion command and include `C0001` (`bed`), `C0002` (`sofa`), `C0003` (`table`), `C0004` (`TV`), and `C0005` (`lamp`).

## Asset directory contract

- Images: `public/images/C0012.webp`
- Word audio: `public/audio/C0012-word.mp3`
- Slow audio: `public/audio/C0012-slow.mp3`

Runtime references belong in `VocabularyEntry.media`; provider/attribution metadata must be recorded before a generated/downloaded asset is promoted to runtime.
