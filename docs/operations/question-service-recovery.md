# Question service quota incident — 2026-11-05

Firebase console showed Spark (no cost), approximately 51,000 document reads and 3,000 writes for the current quota period, with a no-cost-limit exceeded warning. Firestore allows 50,000 free reads per day; quotas reset around midnight Pacific time. No billing change was made.

The reader previously fetched all question documents for each certification every five minutes. Catalog availability reused that full-bank reader. Repeated cache refreshes, admin exports/reviews and individual attempt transactions all consume document reads; the console does not attribute the total to individual code paths.

## Repair

- Successful question-bank reads are cached for six hours (previously five minutes). Publishing or changing publication status invalidates the shared cache immediately.
- A short per-instance circuit breaker avoids repeated Firestore calls during an outage. Failed reads are not stored as six-hour successful cache entries.
- The verified recovery release contains 2,300 previously published questions across 23 certifications. Source: live-bank-export-2026-11-05.json plus the published/reviewed PCA, PCD, PDE, PDVE and PCSE exports recorded in the research workspace. Archived drafts are excluded. This is a backup snapshot, not a new question publication.
- During the free testing period, authenticated users can start timed backup Mock Exams. A signed account-bound state token carries saved answers; answer keys remain server-side until submission. Deadline checks happen on the server. Backup results stay on the device and do not claim account synchronization.
- Existing Practical Mode backup and device resume behavior is retained, with expanded question coverage.

## Limits and maintenance

The free quota cannot be reset by application code. Account synchronization and existing cloud-only attempts still depend on Firestore recovering. Temporary exam state is not an authoritative account score and does not upload automatically; keep its tab open. Tokens are signed using a separate purpose prefix and the existing private server configuration, and expire after 24 hours. Replay of an older valid state cannot extend its exam deadline, but temporary results are not intended for certification or proctoring.

After future banks are published or archived, refresh the recovery snapshot through the reviewed export process. The backup is only as current as that release. If paid attempt limits are re-enabled, outage exams stay disabled until a durable quota-aware solution is provided.

## Validation

Build; all snapshot records pass schema, published status and unique-ID checks; signed-token tamper/account/expiry tests; deadline and score tests; leave/changed-bank tests; API start/answer/submit under mocked quota exhaustion; practice fallback; resume/removal and Firebase Auth runtime regressions.
