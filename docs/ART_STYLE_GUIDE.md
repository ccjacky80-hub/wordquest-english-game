# WordQuest MVP Illustration Style Guide

## Art direction

Use one visual language for every vocabulary asset: flat vector cartoon illustration for an 8–9-year-old learning game. The subject must be immediately recognizable at a small card size, with a friendly expressive silhouette and enough separation from the background for touch-game overlays.

The style lock appended to every prompt is:

> flat vector illustration, clean bold outlines, simple geometric shapes, bright but limited color palette, centered composition with generous negative space, child-friendly educational app art, consistent character proportions, no photorealistic shading, no gradients, no text, no watermark

## Palette

Use these tokens as a restrained shared palette, not as a requirement that every image contain every color:

| Token | Hex | Use |
|---|---|---|
| Leaf green | `#67B96B` | foliage, grass, positive accents |
| Sky blue | `#65B9E8` | sky, water, cool background fields |
| Sun yellow | `#F7C948` | highlights, warm accent shapes |
| Coral | `#F27A68` | secondary warm accents, cheeks, small props |
| Plum | `#6D5A8D` | outlines or deep contrast accents when black is too harsh |
| Cream | `#FFF4D6` | neutral background cards and warm light areas |
| Mist | `#E8F3F1` | pale background fields |
| Outline ink | `#263238` | primary line work; use softened dark ink rather than pure black |

Keep one dominant background color, one subject color family, and at most two accent colors. Saturation should be lively but controlled; avoid neon colors and muddy brown-gray palettes.

## Line and shape rules

- Use consistent `5–7%` of subject-height equivalent stroke weight, with rounded caps and joins.
- Prefer large, closed, readable shapes over tiny internal details.
- Use one outline color family (`#263238` or a nearby softened dark) across a set.
- Use flat fills and at most one small highlight shape per major form.
- Do not use realistic fur strands, feather barbs, skin pores, fabric weave, or complex texture maps.
- Keep facial features simple: two readable eyes, a small mouth or beak when useful, and no intricate expressions.

## Composition and canvas

- Default canvas: square `1:1` for vocabulary cards.
- Keep the main subject centered and occupying roughly `55–70%` of the canvas height.
- Preserve roughly `15–20%` clear negative space around the subject; leave the lower third calm enough for optional game UI.
- Use a single clear focal subject unless the word inherently needs an interaction (for example `fly` or `swim`).
- Keep the silhouette fully inside the frame; do not crop ears, wings, tails, feet, or props.
- Use a simple pale backdrop or a two-layer environment (ground plane plus soft background shape). Do not create a busy scene that competes with the word.
- For action words, show one frozen, unmistakable action pose with a small motion cue such as two curved lines; never use motion blur.
- Maintain consistent facing direction and scale when the same animal appears in multiple later assets; use a three-quarter view unless a side profile communicates the action better.

## Character and world consistency

The recurring Animal Kingdom guide mascot, when added later, should be a small teal-green explorer gecko with a cream belly, rounded head, two simple dot eyes, a coral neckerchief, and the same `5–7%` rounded outline. It is a supporting character only: keep it below `20%` of canvas height and never let it obscure the target vocabulary subject.

Animal illustrations should share:

- rounded friendly silhouettes;
- the same outline weight and eye language;
- simplified anatomical features that remain semantically correct;
- a shared ground shadow or small grounding shape;
- no realistic aggression, blood, hunting, or frightening facial expression.

## Prompt construction

Each prompt should state the exact English target word, the visual subject/action, a simple child-safe context, and the shared style lock. Do not add written labels to the generated image; the application renders the word separately.

The source database remains authoritative for `difficulty`, `imageability`, and `actionability`. These values guide visual complexity and pose selection but must not become visible text in the image.

## Prohibited output

- Photorealism, 3D rendering, cinematic lighting, dramatic shadows, lens blur, or glossy material rendering.
- Dense backgrounds, realistic textures, excessive props, tiny decorative details, or cropped anatomy.
- Scary, violent, threatening, injured, sad, or anatomically distorted animals.
- Extra animals or objects that could be mistaken for the target word.
- Any visible letters, captions, logos, watermarks, UI, or invented labels.
- Different outline colors, palettes, proportions, or rendering styles between assets.
- Depicting a verb ambiguously: `fly` must show an airborne subject; `swim` must show a subject moving through water.
