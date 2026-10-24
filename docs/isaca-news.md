# ISACA automatic news and offers

The news refresh reads two independent official sources:

- Newsroom: https://www.isaca.org/news
- Promotions: https://www.isaca.org/training-and-events/training-topics/featured-training

The newsroom parser prioritizes `.tile-title` and skips empty image headings. Dates and canonical ISACA links are required. Certification-related titles pass through the existing relevance filter, deduplication, archive and summary queue.

The offer parser reads dated product promotions in the main page content. It requires a percentage, product scope, promotion code and valid closing date. A missing year must be established by one unambiguous year in the same content block. It never guesses the next year. Eligibility, code and expiry are shown in the article; these facts are extracted directly, without a model. Unsupported terms cause a source error rather than a fabricated discount.

A successful refresh replaces the prior offer list, so withdrawn offers are removed. Expired offers are filtered on the server and client. During a source failure, a saved offer is retained for no more than 48 hours since verification and never beyond its stated expiry. Historical news is preserved separately. Newsroom and offer statuses are listed independently.

The existing hourly cache and daily `/api/news` Vercel cron apply to both sources. Hourly checks occur on visits; this is not an instant or exhaustive provider monitor. A provider markup change or unsupported promotion format can require a parser update. No extra paid service is introduced.

Run `node tests/isaca-news.test.cjs` and `node tests/news-updates.test.cjs`. The focused suite covers the real card structure, domain restrictions, date validation, ambiguity, year rollover, expiration, withdrawal, replacement, and bounded failure fallback.
