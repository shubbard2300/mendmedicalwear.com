---
name: image-generator
description: |
  Generate or edit photorealistic images (product shots, lifestyle photography,
  hero images) using OpenAI's gpt-image-1 API, sized and named to match this
  site's existing image conventions.

  Use when asked to:
  - Generate a hero image, product photo, or lifestyle photo
  - Create a photorealistic image of a person using/wearing a product
  - Make an AI-generated image for a product detail page
  - Regenerate or fix a mismatched/low-quality product photo
  - Produce a variation of an existing photo (same subject, different detail)

  Triggers: "generate an image", "generate a photo", "create a hero image",
  "AI image", "image generator", "generate a product photo", "generate a
  lifestyle shot", "make a photorealistic image"
---

# Image Generator

Generates or edits photorealistic images via OpenAI's `gpt-image-1` model and
saves them straight into the repo, following this site's naming and sizing
conventions so they drop into existing pages with no layout changes.

## Prerequisites

- `OPENAI_API_KEY` environment variable. Get one from
  https://platform.openai.com/api-keys
- `requests` Python package (already available in this environment)

Copy `.claude/skills/image-generator.env.example` to `.env` at the repo root
and fill in the key, or export `OPENAI_API_KEY` directly. Never commit the
real key — `.env` is gitignored.

## Workflow

### Step 1: Write a strong prompt

Quality is almost entirely prompt quality. Include, in order:

1. **Shot type** — lifestyle photograph / studio product photograph / macro / etc.
2. **Subject** — who (age, general description — never a real named person)
   and what they're doing.
3. **Product detail** — exact shape, materials, colors, and any on-device UI
   text/readings that must be legible. Be literal: this site has been burned
   by vague prompts producing devices that don't match the actual product
   design (see `MEND-Pulse-design-brief.md` §7 for the pattern to follow).
4. **Setting & light** — location, time of day, light quality.
5. **Camera/lens & finish** — 35mm/50mm/100mm macro, f-stop, "8k",
   "photorealistic", "editorial commercial photography".

Reuse the prompt bank in `MEND-Pulse-design-brief.md` §7 as a style reference
for this site's product photography.

### Step 2: Pick a size matching where the image is used

This site's existing photos set the convention — match whichever the new
image is replacing/joining:

| Use case | Existing example | `--size` |
|---|---|---|
| Hero / model shot (portrait) | `MEND Pulse - Model - *.jpg` (533×800) | `1024x1536` |
| Square card / detail shot | `MEND Oxi - Model - *.jpg` (768×768) | `1024x1024` |
| Card thumbnail (portrait) | `MEND Oxi - Model Card - *.jpg` (512×768) | `1024x1536` |

### Step 3: Generate

Text-to-image (new scene):

```bash
python .claude/skills/image-generator/scripts/generate_image.py \
  --prompt "PROMPT" \
  --size 1024x1536 \
  --quality high \
  --output "scratch/candidate.png"
```

Image edit (keep an existing reference photo's subject/framing, change a
detail — e.g. regenerating just the device on an otherwise-good photo):

```bash
python .claude/skills/image-generator/scripts/generate_image.py \
  --prompt "PROMPT describing the full desired final image" \
  --input-image "MEND Pulse - Model - 2026-07-24-web.jpg" \
  --size 1024x1536 \
  --output "scratch/candidate.png"
```

Generate a few variations at once to pick the best with `--n 3` (writes
`candidate-1.png`, `candidate-2.png`, `candidate-3.png`).

Always write first candidates to a scratch path, not directly over a live
site asset.

### Step 4: Review before using

**Always view the generated image with the Read tool before wiring it in.**
Generation can produce anatomically wrong hands, mismatched device details,
or text that doesn't render correctly — catch this before it ships.

If it doesn't match, refine the prompt and regenerate rather than accepting a
close-enough result — product-detail accuracy matters more than speed here.

### Step 5: Name and place it

Once a candidate passes review, rename it to match this site's convention and
move it into the repo root (or wherever the asset lives):

```
<Product Name> - <Descriptor> - YYYY-MM-DD-web.jpg
```

e.g. `MEND Pulse - Model - 2026-07-26-web.jpg`. Convert PNG output to JPEG if
the slot it's replacing is a `.jpg` (keep transparency/PNG only for assets
that need it).

### Step 6: Wire it in

Update the `<img src="...">` reference on the relevant product page(s) and,
if replacing a homepage-linked asset, check `index.html` for other references
to the same filename.

## Content & compliance notes

- Never depict a real, identifiable person; use generic descriptors (e.g.
  "a woman in her 30s"), consistent with every existing prompt in this repo.
- This site already marks device product pages as concept/pre-clearance in
  the footer — don't imply FDA clearance or real availability in the image
  itself (no fake regulatory marks, no real clinic logos).
- OpenAI's content policy will reject prompts depicting real people,
  minors in compromising contexts, or graphic medical content — keep prompts
  in the same tone as the existing design-brief prompt bank.
