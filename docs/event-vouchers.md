# Events and exam vouchers

## Release scope (2026-11-05)
Adds the Events & exam vouchers filter, Data Days' three limited offers, and Ignite's in-person exam benefit. No question banks, catalog metadata, subscription or user data changes.

## Trusted sources
- Data Days: https://community.fabric.microsoft.com/blog/community_blog/data-days--certification-vouchers/5376271 — administrator-authored announcement, individually reviewed; the community domain alone does not qualify other member posts.
- Ignite: https://learn.microsoft.com/en-us/training/topics/ignite/microsoft-ignite-2026-certification-registration
- Existing allowlisted provider feeds continue discovery. Explicit event/voucher headlines receive the event category; no percentages, eligibility or deadlines are guessed from headlines. Summaries use the existing source-checking flow.

## Update behavior
Event results also use the shared Vercel data cache independently of Firestore. Display waits at most 250 ms for these cached results on a cold cache, then uses the bounded reviewed copy; background refresh warms the cache. Official event pages are fetched by the existing hourly background refresh and daily Vercel cron. Successful extraction replaces the source's entire offer list: a changed deadline must not leave its old offer behind. Expired offers are filtered at assembly and in the browser. Withdrawal notices remove offers. Missing expected terms or markup fail closed to the last verified copy for at most 48 hours. Redirects are not followed for event pages.

The initial reviewed snapshot is bounded by the same 48-hour age. It is labelled stale (not a successful automated refresh). During release testing Fabric Community returned HTTP 403 to direct server requests; it was verified using web retrieval. No access-control bypass is attempted. If the provider continues rejecting requests, its cards disappear after 48 hours. An admin must reverify the official source and replace the reviewed snapshot or onboard an accessible official feed; never silently reset the timestamp. New unrelated event landing pages need a reviewed parser/source entry.

## Offer meaning
Exam completion deadlines differ from redemption deadlines. Data Days vouchers are limited and conditional, one per person. Ignite is onsite only; free exam does not imply free conference admission. Link to official eligibility and registration rather than collecting voucher applications on CertPro.

## Verification
Run the event-vouchers, news-updates and isaca-news tests, TypeScript and production build. Browser-check desktop and mobile filter, search by exam code, article details and official links before publication.
