# Run prompt — LiquidityWatch vision-strategy debate

Paste everything below the line into a fresh Claude session on the Mac mini
(`10.0.0.42`), where `e3d-pilot` / `e3d-debate` is set up. It assumes the E3D repos
live at `~/e3d-pilot` and `~/e3d-liquiditywatch` — adjust the paths if they differ.

---

You are running a one-off strategic debate for me using the `e3d-debate` prototype in
`e3d-pilot`, then writing up the result. Work in `~/e3d-liquiditywatch`.

## 1. Update the repos

```bash
cd ~/e3d-pilot && git pull --ff-only && test -x bin/e3d-debate && echo "e3d-debate OK"
cd ~/e3d-liquiditywatch && git pull --ff-only
```

If `bin/e3d-debate` is missing or `git pull` isn't a clean fast-forward, stop and
tell me.

## 2. Load context (you are the synthesizer — you need this; the debaters don't)

Read, in `~/e3d-liquiditywatch`:
- `docs/VISION.md` — the framing being challenged
- `docs/MODEL.md` — §6 (causal graph) and §8 (open items) especially
- `docs/API-CONTRACT.md` — skim
- `docs/liquiditywatch-session-notes.md` — how we got here

## 3. Choose providers

```bash
for p in claude codex grok-build gemini gpt; do
  E3D_PILOT_CHECK=1 ~/e3d-pilot/lib/providers/$p >/dev/null 2>&1 && echo "available: $p"
done
```

Use **every available adapter that is a real external LLM** (skip `local` and
`devin`). Minimum 2; prefer 3+ across different model families. Synthesizer: `claude`.

## 4. Run the debate

The question file is already in the repo (`docs/debates/2026-09-08-vision-strategy/QUESTION.md`)
and is self-contained.

```bash
~/e3d-pilot/bin/e3d-debate \
  --providers <comma,separated,list from step 3> \
  --rounds 3 \
  --max-words 500 \
  --synthesizer claude \
  --question-file ~/e3d-liquiditywatch/docs/debates/2026-09-08-vision-strategy/QUESTION.md \
  --out-dir ~/e3d-liquiditywatch/docs/debates/2026-09-08-vision-strategy/run
```

This writes `run/transcript.md` (full transcript **plus** the synthesis block at the
end). It also prints the synthesis to stdout.

If it errors (provider unavailable, budget cap hit, timeout): **do not retry
blindly.** Report what failed and the stderr path it printed, then stop.

## 5. Write up the result

Create `docs/debates/2026-09-08-vision-strategy/RESULT.md`:

- **Header:** date, `machine: mac-mini 10.0.0.42`, providers used, rounds actually
  run, whether it converged (and at which round).
- **Per question (Q1, Q2, Q3):** the debate's `FINAL ANSWER`, `CONSENSUS`
  (full/majority/split), and `DISSENT` line, pulled from the synthesis.
- **Your assessment (3–5 sentences):** what specifically should change in
  `docs/VISION.md` and/or `docs/MODEL.md` §8 as a result — concrete edits, or
  "no change, because …". You have read those files; ground it in them.

## 6. Commit (do not push)

```bash
cd ~/e3d-liquiditywatch
git add docs/debates/2026-09-08-vision-strategy
git commit -m "e3d-debate: LiquidityWatch vision strategy (<providers>)"
```

Leave it unpushed for me to review. Report back with the RESULT.md contents.

## Notes

- Each provider call is budget-capped (~$0.50). 3 providers × 3 rounds + synthesis ≈
  10–13 calls; expect a few minutes and a couple dollars.
- Bundling three questions into one debate is deliberate — they're linked. The
  `QUESTION.md` tells participants to give a per-question `POSITION:` block so the
  converge/revise signal still works.
- If only `claude` and `codex` are available, that's an acceptable 2-way run — note
  it in RESULT.md as a limitation (no third family).
