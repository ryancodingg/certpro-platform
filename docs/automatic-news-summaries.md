# Automatic news summaries

The existing hourly on-visit source refresh and daily `/api/news` cron generate summaries for new articles. Each feed processes one pending article per refresh, selecting the least recently attempted first. Existing human-reviewed summaries take precedence.

Only public text from registered official provider hosts is sent to the existing Gemini connection. Full RSS content is preferred; otherwise an HTTPS allowlisted article is fetched, with bounded size, redirects and timeouts. Navigation and page scripts are removed. No user account information is used.

A generation call produces three original paragraphs plus private supporting quotations. Shape, length (90–200 words), exact evidence, numbers and excessive copying are checked. A second model call verifies factual support and restrictions. Passing summaries are visibly labelled AI-generated, not human-reviewed. These checks reduce errors but cannot guarantee perfect factual accuracy.

Completed summaries are stored in Firestore `certproConfig/news_summary_*` and reused. Next's one-hour data cache also protects requests when Firestore is unavailable. Provider or quota failures return no summary; the article remains accessible and is retried later. No paid-provider fallback is configured. Free-tier availability is controlled by the existing Google project.

Configuration: existing `GEMINI_API_KEY`; optional `GEMINI_NEWS_MODEL`, otherwise existing `GEMINI_TUTOR_MODEL` then the current app default. No new credential or billing changes are required.

Run `node tests/news-summary.test.cjs`, `node tests/news-updates.test.cjs`, the focused application tests and the production build before publishing.
