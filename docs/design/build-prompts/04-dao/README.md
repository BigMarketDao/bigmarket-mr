# 04 — DAO Page

**Depends on:** `00-token-wiring` + `01-app-chrome` landed.
**Routes:** `/dao`, `/dao/proposals/[slug]`, `/dao/token-sale`

## Components to refactor (all prompts pending)

### DAO main page (`/dao`)
| # | Prompt | Component | File |
|---|--------|-----------|------|
| D-01 | *(pending)* | `DaoIntro` | `apps/frontend-c1/src/lib/components/dao/DaoIntro.svelte` |
| D-02 | *(pending)* | `DaoTabs` | `apps/frontend-c1/src/lib/components/dao/DaoTabs.svelte` |
| D-03 | *(pending)* | `Proposals` | `apps/frontend-c1/src/lib/components/dao/proposals/Proposals.svelte` |
| D-04 | *(pending)* | `ProposalGridItem` | `apps/frontend-c1/src/lib/components/dao/proposals/ProposalGridItem.svelte` |
| D-05 | *(pending)* | `MakeProposal` | `apps/frontend-c1/src/lib/components/dao/proposals/MakeProposal.svelte` |
| D-06 | *(pending)* | `Disputes` | `apps/frontend-c1/src/lib/components/dao/disputes/Disputes.svelte` |
| D-07 | *(pending)* | `DisputeGridItem` | `apps/frontend-c1/src/lib/components/dao/disputes/DisputeGridItem.svelte` |
| D-08 | *(pending)* | `ConstructDao` | `apps/frontend-c1/src/lib/components/dao/construction/ConstructDao.svelte` |
| D-09 | *(pending)* | DAO route page (inline HTML) | `apps/frontend-c1/src/routes/dao/+page.svelte` |

### Proposal detail (`/dao/proposals/[slug]`)
| # | Prompt | Component | File |
|---|--------|-----------|------|
| D-10 | *(pending)* | `DaoHeading` | `apps/frontend-c1/src/lib/components/dao/DaoHeading.svelte` |
| D-11 | *(pending)* | `DaoVotingActiveNew` | `apps/frontend-c1/src/lib/components/dao/proposals/dao-voting/ballot-box/DaoVotingActiveNew.svelte` |
| D-12 | *(pending)* | `VotingResults` | `apps/frontend-c1/src/lib/components/dao/proposals/dao-voting/VotingResults.svelte` |
| D-13 | *(pending)* | `DaoConcluded` | `apps/frontend-c1/src/lib/components/dao/proposals/dao-voting/DaoConcluded.svelte` |
| D-14 | *(pending)* | Proposal detail route (inline HTML) | `apps/frontend-c1/src/routes/dao/proposals/[slug]/+page.svelte` |
