# Fix docs-v2 — pre-build sanity sweep

You are improving the `docs-v2/` documentation pack before we run the build prompts (`A-token-wiring.md`, `B0-header-chrome.md`, `B-homepage.md`, `C-market-detail.md`).

**Goal.** Every doc is internally consistent, every claim matches the current codebase, and every build prompt can be executed verbatim by another agent without having to guess. How you achieve that is up to you — read what you need, fix what is wrong.

---

## Scope

- You may read anything in the repo.
- You may edit any file under `docs-v2/`.
- You may NOT edit anything outside `docs-v2/`. No code, no `theme.css`, no `tokens.ts`, no `package.json`, no legacy `docs/`.
- You may NOT add dependencies, run builds, run tests, or run any `pnpm` / `npm` command. Read tools only (`Read`, `Glob`, `Grep`).
- If a doc disagrees with `theme.css` / `tokens.ts` / a real source file, the code wins — update the doc.
- If two docs disagree, resolve using the single-source rule in `docs-v2/README.md`. If the rule doesn't resolve it, flag it; do not pick.

---

## What counts as a "major error"

Anything that would mislead a build agent running the prompts. Concretely: a wrong file path or line number; a class string a prompt says to replace that isn't actually in the source; a token name a prompt assumes is defined that nothing wires up; a lock-file value that disagrees with what `theme.css` actually emits today; a prompt promising "class-only / no `<script>` change" while instructing an edit that requires touching `<script>`; a verification grep that would let known Tier-1 leakage through; an instruction so ambiguous that two reasonable agents would do different things and at least one would be wrong.

Typos, awkward phrasing, and stylistic taste are NOT in scope, unless they sit immediately next to something you are already fixing.

If a fix would require a product or design decision you don't have authority to make, do not invent the answer. Leave the doc unchanged and flag it in the changelog.

---

## Output

Edit files directly. At the end of the run, write a single file `docs-v2/build-prompts/changelog-pre-build-fixes.md` containing:

1. One section per file you changed, with a bullet list of the fixes. Each bullet: severity (`critical` / `high` / `medium`), one-line summary, the original problem cited as `path:line`, and what the doc now says.
2. A final "Open issues" section listing anything you flagged but did not fix and why.

A short dense changelog with real fixes is more valuable than a long one full of polish.

---

## Stop conditions

- Hard cap: ~90 minutes of work. If you would exceed it, stop and ship the changelog with what you have.
- If you cannot verify a claim against the codebase, leave the doc unchanged and add it to "Open issues".
- If a fix would change behavior in code, that is out of scope — flag it, do not edit.
