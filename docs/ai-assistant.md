# Practice assistant: Gemini free tier

Before requesting AI, each learner must explicitly confirm they are 18 or older and accept the disclosed Gemini data use. No date of birth is collected. The server requires the boolean acknowledgement for every AI request, and ordinary bank explanations remain available without it. This is an acknowledgement, not verified age assurance.

The assistant uses Gemini only. Existing OpenAI credentials are not used and there is no paid-provider fallback. It only explains an answer already checked in an authenticated Practical Mode attempt; Mock Exams cannot invoke it.

Configure `GEMINI_API_KEY` as a private server environment variable in Vercel Preview and Production, then redeploy. Never use a `NEXT_PUBLIC_` key or commit credentials. Use a Google AI Studio project on the free tier with billing disabled. An API request cannot enforce the project’s billing tier: enabling billing on that project could incur charges. Keep billing disabled to satisfy the free-only requirement.

`GEMINI_TUTOR_MODEL` is optional; the default is `gemini-3.5-flash-lite`. Check its availability in your project before enabling it. No SDK installation is needed. Calls use the documented REST `generateContent` endpoint and the `x-goog-api-key` header. No search grounding or paid tools are enabled.

Google’s pricing page lists free input/output for this model, subject to project quota and availability. Free-tier prompts and responses may be used to improve Google products. The UI discloses this before learners request an explanation. Only question data, the selected answer and bank explanation are included; account identifiers, email, billing information and credentials are excluded.

Limits: 20 uncached requests per learner per UTC day, 100 sitewide per UTC day, 24,000 context characters, 1,600 output tokens and a 25-second timeout. Failed requests count toward the application limit to prevent retry storms. Gemini 429 responses show a free-allowance message; no automatic retries or fallback incur extra calls. Complete explanations are cached by provider, model, prompt version, style and question context; blocked or truncated responses are not cached. Google may impose lower limits than CertPro.

Validation after configuration: check an answer in Practical Mode, request all three styles, verify a complete explanation, confirm the same request uses the cache, and verify Mock Exams and unchecked answers remain denied. Never claim activation until a real API request succeeds. Automated contract tests use mocked HTTP and do not spend quota.

Official sources checked October 18, 2026:
- [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite)
- [GenerateContent REST API](https://ai.google.dev/api/generate-content)
- [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
