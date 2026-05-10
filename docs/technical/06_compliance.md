# BigMarket — Compliance & Legal

**Repository status:** No authoritative legal opinions, licences, jurisdictional matrices, or KYC/AML policies were found embedded as source-of-truth in the examined code paths. This file is **non-legal** engineering scaffolding only.

## 1. Anjouan e-gambling licence scope

[PLACEHOLDER — CONFIRM WITH TEAM] Licence holder entity, licence number, covered URLs/products, territorial exclusions, RNG certification (if applicable), AVS requirements, responsible-gambling measures, whether prediction markets qualify as wagering under that licence vs alternate structuring.

## 2. KYC / AML requirements by jurisdiction

[PLACEHOLDER — CONFIRM WITH TEAM]

- Onboarding tiers ( zkTLS / OAuth only vs document KYC ).
- Sanctions screening vendors.
- Travel Rule for crypto transfers (if offered).
- US / EU / UK / AU treatment of prediction markets vs derivatives.

**Technical note:** The API includes auth routes (Google OAuth + zkTLS "reclaim" flows); presence of OAuth does **not** imply AML completion.

## 3. EU MiCA implications

[PLACEHOLDER — CONFIRM WITH LEGAL COUNSEL] Classification of BIG and any wrapped assets (security vs utility vs e-money relevance), issuance disclosure, CASP thresholds, custody rules, MiCA-compliant disclosures, MAR/MiFID overlap for event contracts, GDPR for LLM prompts/logs, data minimisation.

## 4. Prediction-market–specific disclosures

[PLACEHOLDER — CONFIRM WITH TEAM]

- Transparency of AI resolution methodology and appeals.
- Oracle failure / LLM error disclaimers and compensation policies.

## 5. Operational records

[PLACEHOLDER — CONFIRM WITH TEAM] Retention for `marketLlmLogsCollection`, DAO event archives, dispute votes, and user authentication artefacts.
