# Original question-bank production

The catalog contains **111 certifications and 504 sections**. At 200 unique questions each, the requested minimum is **22,200 questions**. `data/question-bank/manifest.json` allocates exactly 200 to each certification. These are planned quotas, not a claim that the questions exist.

## Current deliverable

Three original, source-backed example drafts demonstrate the workflow: AWS Cloud Practitioner, Azure Fundamentals, and Databricks Data Engineer Associate. All remain inactive and pending editorial review. No questions were imported, published, or written to Firebase. Actual deployed coverage requires a current admin export; the local snapshot has no complete bank export. Existing questions must be checked before additional content is imported.

The manifest inherits the existing catalog and exam-guide dates. It does **not** imply 111 exam outlines were freshly revisited. Check every provider's current guide before approving a batch, especially beta or retired exams. Do not fabricate official weights: stated percentage ranges use their midpoint, normalized by largest-remainder rounding. Sections without complete weights use an explicitly labeled equal editorial allocation.

## Reproducible loop

From the repository root, with Python 3 (no packages, paid API, or network needed to run the harness):

```sh
python3 scripts/question-bank.py plan
python3 scripts/question-bank.py next
python3 scripts/question-bank.py validate --drafts data/question-bank/drafts.json
python3 scripts/question-bank.py export --drafts data/question-bank/drafts.json
python3 tests/question-bank.test.py
```

For real production work, pass `--existing /secure/path/admin-export.json` to **validate, next, and export** so duplicate checks include the deployed bank. The export must be a JSON array of normalized question objects. Keep this export out of Git. Coverage reports describe reviewed local drafts only, not existing production coverage.

Repeat the following for each remaining section:

1. Open the certification's official `sourceUrl` and `guideUrl` from the manifest. Confirm active exam version and section scope against the current outline; correct `data/exam-guides.json` when needed, then regenerate the plan.
2. Research individual skills in official provider documentation. Record precise supporting URLs, date actually read, and the supported fact in each question's references. Follow relevant links rather than claiming an exhaustive search of the web. Do not use exam dumps or reproduce proprietary practice banks.
3. Author varied, original scenario and application questions. Match the exact section ID. Supply all distractor rationales, a supported correct answer, and explicit AI provenance. Use the draft examples as the record schema, **not** as templates to inflate counts with superficial substitutions.
4. Run validation. Correct failures. Compare against the existing bank and peer drafts. The conservative token-similarity check catches close paraphrases; it is not a semantic originality guarantee. Manual review is required for correctness, ambiguity, duplication, and exam relevance.
5. A subject-matter reviewer sets `review.status` to `approved`, fills `review.reviewer`, and sets `answerVerified`, `topicVerified`, and `originalityVerified` only after performing those checks. The author must not simply auto-approve model output. Reviewer assertions are audit metadata, not cryptographic proof of review.
6. Run export. It emits content-addressed JSON batches of at most 200 compatible with CertPro's admin importer, and a separate review ledger. All exported records remain `status: draft, isActive: false`. Only an authorized administrator can import, inspect, and publish using the existing admin workflow. Never import `review-ledger.json` as questions.
7. Resume with `next`: approved draft counts reduce the relevant section's remaining quota. Drafts and manifests are durable checkpoints; reruns do not generate new questions or spend API money. Existing production counts are intentionally not auto-credited without validating their quality and section mappings.

## Quality gates and limitations

The validator checks known certifications/sections, option count and uniqueness, answer indexes, type, explanation lengths, every-option rationales, HTTPS provider hosts, evidence descriptions/dates, inactive draft state, exact and near duplicates, and review attestations. Currently the editorial harness supports single- and multiple-choice questions; the application itself supports additional formats.

A URL and a passing validator **do not prove** a fact or question is correct. The harness performs offline structural checks and does not automatically retrieve sources or certify content rights. This deliberate review boundary prevents 22,200 unverified generated records from silently reaching learners. No auto-publication, scraping bypass, or paid subscription is configured. The optional bounded API runner described below requires separate secure key setup and explicit execution.

Original draft references:
- AWS shared-responsibility model: https://aws.amazon.com/compliance/shared-responsibility-model/
- Azure RBAC: https://learn.microsoft.com/en-us/azure/role-based-access-control/overview
- Databricks medallion architecture: https://docs.databricks.com/aws/en/lakehouse/medallion

Remaining work to meet the user's numerical target: research and independently review the full set of 22,200 questions, reconcile the existing bank, and publish validated batches. The scaffold and three samples do not fulfill that numerical target.

## Optional bounded API research/generation loop

`scripts/question-bank-generate.py` provides the actual network loop. It retrieves explicitly selected official HTML/text sources (maximum three per section, one MB per download, provider-only redirects), caches source hashes with dates, asks Gemini for small structured batches, validates each batch, and atomically checkpoints accepted **pending drafts**. It stops on rate limits, insufficient evidence, malformed output or a batch with no valid distinct candidates. Individual rejected candidates are recorded separately while valid candidates are preserved. Sections are selected by lowest completion ratio. It never retries into a paid provider or writes to Firebase. A process lock prevents concurrent checkpoint overwrites. It can resume toward 200 per certification by running bounded batches repeatedly.

Select an available Gemini model and verify the project is on a free tier with paid billing disabled before execution. Model availability, free quotas, and terms can change. `--max-batches` is a request bound, **not a dollar billing cap**. The approved free-tier key has been exercised with Gemini 3.5 Flash-Lite. Credentials are kept outside source.

```sh
# Preview only, no API calls:
python3 scripts/question-bank-generate.py --certification aws-cloud-practitioner --model YOUR_AVAILABLE_MODEL --sources data/question-bank/aws-source-map.example.json --workspace /private/tmp/certpro-editorial --max-batches 1
# After securely configuring GEMINI_API_KEY and sufficient official source URLs:
python3 scripts/question-bank-generate.py --certification aws-cloud-practitioner --model YOUR_AVAILABLE_MODEL --sources /secure/path/complete-source-map.json --workspace /private/tmp/certpro-editorial --max-batches 4 --batch-size 5 --execute
```

The example map covers only one skill area; it is intentionally insufficient for a complete bank. Add official documentation covering each objective. PDF sources require a separately reviewed text workflow; the network runner stops instead of guessing content. The runner processes only mapped sections. Run the offline validator/exporter with its generated drafts and the existing-bank export after editorial review. Pending candidates count toward generation quotas to avoid repeatedly generating the same allocation; only approved items count toward export readiness.

Gemini structured-output integration uses `models/{model}:generateContent` REST with `generationConfig.responseSchema`, compatible with `gemini-3.5-flash-lite`; see https://ai.google.dev/api/generate-content . The live generateContent API path succeeded on 2026-10-18. Gemini 2.5 Flash-Lite was rejected for this new account; Gemini 3.5 Flash-Lite succeeded.

`historical-coverage.json` records the previously saved local availability snapshot: **117 questions across four certifications** (DP-700: 57; AWS Cloud Practitioner: 20; Azure Fundamentals: 20; Databricks Data Engineer Associate: 20), **107 certification banks empty**, and a minimum numerical gap of **22,083**. This is explicitly historical, not a fresh production audit, and does not certify topic distribution or editorial quality.


## Priority certification source maps

The three `*-source-map.json` files for AWS Cloud Practitioner, Azure Fundamentals, and Databricks Data Engineer Associate provide three official HTML sources for **every exam section**, 42 URLs total. They were checked through official documentation on 2026-10-18. Source-map completeness means all sections have evidence inputs, not that every exam objective or future generated question has been audited.

Each map spans multiple distinct concepts per domain. AWS includes cloud economics/frameworks/adoption, security and identity, compute/database/storage, and cost/support. Azure includes shared responsibility/deployment/scaling, compute/storage/networking, and governance/cost/monitoring. Databricks includes lakehouse/medallion, ingestion, transformations/data quality, jobs, CI/CD, monitoring/history, and Unity Catalog governance.

Before publishing a full bank, expand source coverage for remaining objective details (for example AWS networking/global infrastructure and Azure identity/resource hierarchy). Do not infer unsupported answers from a section title. Provider documentation may discuss features outside a fundamentals exam; reviewers must keep questions at the guide's stated skill level. Some sources document recent service changes, so avoid obsolete support-plan or product-name assumptions.

Example bounded run, after privately configuring the approved free-tier key:

```sh
python3 scripts/question-bank-generate.py --certification aws-cloud-practitioner --model gemini-3.5-flash-lite --sources data/question-bank/aws-cloud-practitioner-source-map.json --workspace /private/tmp/certpro-editorial --max-batches 40 --batch-size 5 --execute
```

This permits at most 200 new candidates in one run, stops sooner at section quotas or quality failure, and preserves completed checkpoints. A full 200 total may require more than 40 small batches because sections have nonmultiples of five; resume in another bounded run if needed. A model is never instructed to pad a quota when the evidence does not support additional distinct questions.

## Latest bounded run — 2026-10-18

Saved 220 original pending drafts: AWS Cloud Practitioner 58, Azure Fundamentals 100, Databricks Data Engineer Associate 62. All pass the structural/source-host/duplicate validator but still require answer, topic and originality review. None were published or written to Firebase. The runs stopped when available evidence yielded duplicates, or a response cited a URL outside the supplied evidence. Broader objective-level source coverage is required before resuming; do not weaken the validation gates to fill a quota. The 200-per-certification target remains incomplete. Generated files are under `data/question-bank/generated/`; official-source text/hash caches are retained separately in the local research workspace.
