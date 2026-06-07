# Capable in-house SLM — training pipeline plan

Goal: train a small language model (SLM) that learns from Capable's real site
generations and the reviewer's corrections, so over time it can do the cheap bulk
of generation locally — cutting reliance on Gemini/Sonnet/Opus and lowering cost.

This is a phased plan. Phase 0 (data collection) is **already shipped**.

---

## How it plugs into today's system

The Builder pipeline (`/api/ai/generate`) runs tiers:

| Tier | Generator | Reviewer |
|------|-----------|----------|
| capable1 | Gemini Flash | Sonnet 4.6 |
| capable2 | Gemini Flash | Opus 4.8 |
| capable3 | Sonnet 4.6 | Opus 4.8 |

The SLM's first home is a new **capable0** tier: `SLM generates → Sonnet reviews`.
Cheapest of all, with the big models still available as fallback/upgrade. The
reviewer pipeline we already have doubles as the SLM's automatic grader.

---

## Phase 0 — Data collection (DONE)

Table `training_samples` (in `backend/server.js` schema init) captures one row per
generation:

| column | meaning | training use |
|--------|---------|--------------|
| `prompt` | the user's request | model **input** |
| `output_code` | final single-file HTML returned | model **target output** |
| `review_issues` | reviewer's correction notes (null if approved) | **correction signal** |
| `revised` | whether a fix round happened | quality flag |
| `tier` | which models produced it | provenance / filtering |
| `user_edit` | (reserved) later edits the user made on the site | strongest correction signal |
| `rating` | (reserved) explicit/implicit quality score | sample weighting |

**Still to wire (small):** populate `user_edit` when a user edits generated code,
and `rating` from signals like publish / keep / regenerate. These are the highest
quality labels — a human keeping or fixing the output.

Target before training: **~5–10k approved samples** for a first useful fine-tune.

---

## Phase 1 — Dataset pipeline

1. **Export** `training_samples` to JSONL (admin-only endpoint or a script).
2. **Clean**: drop truncated/oversized HTML, dedupe near-identical prompts, strip
   PII from prompts, keep only parseable code.
3. **Build two example types:**
   - *Generation* — `{prompt} → {output_code}` using only `approved` rows
     (review_issues IS NULL) and rows the user kept/published.
   - *Correction* — `{prompt + first-draft code + review_issues} → {fixed code}`
     using rows where `revised = true`. This teaches the model to fix the exact
     mistakes our reviewer catches.
4. **Format** as instruction tuning, reusing the production `SYSTEM_PROMPT` so the
   SLM speaks the same `{message, code, title, type}` JSON contract.
5. **Split** train/val/test by prompt hash (no leakage), hold out a fixed eval set.

## Phase 2 — Base model selection

Pick a small code-capable, Arabic-friendly open model. Candidates:

| Model | Size | Notes |
|-------|------|-------|
| Qwen2.5-Coder | 1.5B / 7B | strong code + decent Arabic; good first pick |
| Llama 3.2 | 1B / 3B | light, multilingual |
| Gemma 2 | 2B / 9B | solid quality/size |

Start with **Qwen2.5-Coder-7B** for quality, keep a 1.5B variant for cost/latency
comparison. Decide on context length (≥16k to fit prompt + full HTML output).

## Phase 3 — Fine-tuning

- **Method:** QLoRA (4-bit) LoRA adapters — cheap, single 24–48 GB GPU.
- **Stack:** PyTorch + PEFT/TRL (or Unsloth/Axolotl for speed).
- **Objective:** supervised fine-tune on the generation + correction sets.
- **Hardware:** one rented A100/H100 (e.g. Runpod/Lambda) for hours, not a cluster.
- **Output:** merged weights served behind an OpenAI-compatible endpoint.

## Phase 4 — Evaluation (reuse what we built)

Automatic graders we already have:
- The **structural checks** from `backend/scripts/verify-builder.mjs` (doctype, RTL,
  fonts, no placeholders, 200+ lines).
- **Opus/Sonnet as judge** — feed SLM output through `reviewSite()` and measure the
  approval rate vs. Gemini's baseline.

Ship gate: SLM approval rate ≥ Gemini's on the held-out set, at materially lower cost.

## Phase 5 — Serving & integration

- Host on vLLM/TGI (OpenAI-compatible) on a small GPU box or serverless GPU.
- Add **capable0** to `BUILDER_TIERS` (`generator: { provider: 'slm' }`) with a
  generous limit since it's cheap. `generateSite()` dispatches to the SLM endpoint.
- **Fallback:** if the SLM output fails review twice, auto-escalate to Gemini so
  users never get a broken result. Log escalations as fresh training data.

## Phase 6 — Continuous loop

Every generation keeps writing to `training_samples`. Retrain monthly on the growing
set (including SLM escalations and user edits). The system improves itself: the more
people build, the better and cheaper Capable gets.

---

## Milestones

1. Wire `user_edit` + `rating` capture. (small, next)
2. Export + dataset builder script. (at ~5k samples)
3. First QLoRA fine-tune + eval vs Gemini. (at ~5–10k samples)
4. Serve behind capable0 with fallback. (if eval passes)
5. Monthly retrain cron.

## Risks

- **Cold start:** not enough data early → keep collecting before training.
- **Arabic + RTL quality:** verify on the held-out Arabic eval specifically.
- **Output size:** single-file sites are long; ensure context length + max tokens.
- **Mode collapse to mediocrity:** weight by `rating`/kept samples, not raw volume.
