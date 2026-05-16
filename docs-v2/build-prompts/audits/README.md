# Audits

Read-only audit reports. These are **reference documents** — they document the gaps that were found when the build prompts were checked against the actual codebase. The fixes from these audits have already been applied to the current prompt versions.

| File | What it audits |
|---|---|
| `B0-header.md` (this folder) | Audit of `B0-header-chrome.md` — found 3 missing scope files (+layout.svelte, AlphaBanner, PageContainer), several class-level errors. All fixed in the current `B0-header-chrome.md`. |
| `C-market-detail.md` | Audit of `C-market-detail.md` — found structural errors (wrong layout root, 3 dead-code files in scope, wrong CTA targets, broken grep gates). All fixed in the current `C-market-detail.md`. |
| `0-fix-docs.md` | Meta-prompt used to generate this fix pass (archived here for reference). |

Do not run these as prompts. Use them to understand the reasoning behind specific decisions in the corrected build prompts.
