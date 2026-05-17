# Sanity-check prompt — for Claude Code, before running A / B0 / B / C

**Use this for:** a fast, stronger-model second opinion on whether the four build prompts are safe to run. NOT a full audit (use [`0-pre-run-audit.md`](./0-pre-run-audit.md) for that). This is a 10-minute gut-check.

**Recommended model:** Claude Code (or any model with `Read` + `Grep` across the repo).

**Estimated time:** 10–15 minutes.

**Paste everything below this line into a fresh Claude Code session.**

---

```text
You are doing a read-only sanity check on four build prompts BEFORE I run any of
them. Your output is ONE short structured report. You do NOT edit any file,
you do NOT run any build/lint/test/pnpm command, you do NOT touch git, and you
do NOT modify the build prompts. If you think you should write to a file, STOP
and put the proposed change in the report as a quoted patch instead.

Read (full files):

1.  docs-v2/tokens-and-rules.lock.md
2.  docs-v2/build-prompts/A-token-wiring.md
3.  docs-v2/build-prompts/B0-header-chrome.md
4.  docs-v2/build-prompts/B-homepage.md
5.  docs-v2/build-prompts/C-market-detail.md
6.  docs-v2/build-prompts/audits/B0-header.md          (prior audit of B0)
7.  docs-v2/build-prompts/audits/C-market-detail.md   (prior audit of C)

You may freely Read / Grep / Glob any file in the repo. You may NOT browse the
web. Cite paths + line ranges for every claim you make.

For EACH of the four build prompts (A, B0, B, C), answer these eight questions
and ONLY these eight questions. Each answer must be ≤ 3 sentences. If you don't
know, say "UNKNOWN — need to read X" and move on.

Q1. Does every file path the prompt lists in its "Allowed files" block actually
    exist on disk? List any that don't, with the prompt's section and the
    real-disk path that's closest.
Q2. Does every line-number citation in the prompt land within the real file's
    length (and within ±2 lines of the cited line)? List any that don't.
Q3. Does every Tier-1 class string the prompt asks the agent to REPLACE actually
    appear in the source file at the cited line (verbatim or with trivial
    whitespace difference)? List any "replace X with Y" rows where X is not on
    disk.
Q4. Does every TOKEN NAME the prompt asks the agent to INTRODUCE (bg-card,
    text-community, bg-price-up, etc.) get defined by Prompt A's CSS block? List
    any tokens used in B0/B/C that are NOT defined in A.
Q5. Would the prompt's verification grep gates return ZERO if the agent
    perfectly executed every substitution? Run the gates mentally against the
    files in scope; list any file that still leaks Tier-1 inside the prompt's
    own grep paths.
Q6. Does the prompt promise "class-only / no <script> changes" while also
    asking the agent to edit something INSIDE a <script> block? Flag every
    violation. (B0 has ONE authorized exception — the three navLink* class-name
    string constants in HeaderMenuTailwind.svelte. Anything else counts.)
Q7. Does the prompt touch any file that is OUT OF SCOPE of its stated goal
    (e.g. C edits bm-ui primitives that B already owns; B0 edits something B
    will also edit; the chrome bleeds across multiple PRs)?
Q8. Single highest-risk thing in this prompt that a strong model running it
    would still get wrong. ONE sentence. If "nothing", say "nothing".

After the per-prompt sections, output ONE cross-prompt section:

X1. Run-order: README claims A → B0 → B → C. Given everything above, is that
    order still correct, or should it be different? One sentence + reason.
X2. Top-three blockers to fix BEFORE running anything. Cite the prompt + section
    each blocker lives in. If "none", say "none".

OUTPUT FORMAT — exactly this skeleton, no preamble, no postscript:

# Sanity check report

## A — Token wires
Q1: …
Q2: …
…
Q8: …

## B0 — Header chrome
Q1: … (etc)

## B — Homepage
Q1: … (etc)

## C — Market detail
Q1: … (etc)

## Cross-prompt
X1: …
X2:
  1. {prompt}.md §{section} — {≤ 1 sentence}
  2. …
  3. …

Stop conditions:
- If a citation in any prompt is wrong by > 2 lines, flag it under Q2 and keep
  going.
- If you find a Q4 token that does NOT exist in Prompt A's CSS block, that is
  automatically a blocker — add it to X2 with prompt + section + token name.
- Hard cap: 1500 words total. If you'd exceed, summarize and link the most
  important finding instead of listing every nit.
```

---

## How to use the output

The report tells you, for each prompt, whether the prompt's claims line up with reality. If Q1–Q5 are all "yes" / "none" and Q6–Q7 are "none", the prompt is safe to run. If any Q lights up, fix the prompt (or apply my recommendation from the relevant `audit-*.md`) before running.

The cross-prompt section (X1 / X2) tells you the top blockers across all four prompts in one glance.

## What this does NOT do

- It does not propose patch text for fixes. For patches, run [`0-pre-run-audit.md`](./0-pre-run-audit.md).
- It does not re-do the deep audits already in [`audits/B0-header.md`](../audits/B0-header.md) and [`audits/C-market-detail.md`](../audits/C-market-detail.md) — it just cross-checks them with fresh eyes.
- It does not run any command. All checks are read-only via `Read` / `Grep` / `Glob`.
