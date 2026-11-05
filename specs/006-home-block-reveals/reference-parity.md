# Pixel Point Soft Blur reference parity

Source: https://pixelpoint.io/skills/animate-text/ and installed animate-text/assets/effects/soft-blur-in.json.

Independent subagent checked the exact recipe, cancellation and semantics. Hero phrases now use individual characters including spaces, 648ms entrance / 18ms stagger, opacity 0→1, blur 12→0, and vertical travel 9.28px→0. Exit uses 432ms / 11ms, opacity 1→0, blur 0→12 and travel 0→-9.28px. Hold 550ms and subsequent gap 320ms; initial randomized delay 0–400ms. No double-enter after a loop gap. Animation runs while visible and cancels timers/animations on exit, tab hiding and teardown.

Preserved original wording, purple gradient coordinates per word, layout, and mobile word wrapping. Screen-reader text remains intact outside aria-hidden visual units. Section headings use the same entrance on re-entry, without the hero's continuous loop. Reduced-motion users get the same timing/opacity choreography without spatial movement or blur—an intentional accessibility adaptation, not exact visual parity. Cards now fade from .25 over 450ms under reduced motion rather than the nearly imperceptible .85/180ms.

Tests cover exact frames, timings, stagger, loop order, re-entry, teardown, hidden-tab cancellation and reduced motion. No proprietary React Bits code was used. Question banks and catalog metadata remain unchanged.

Verification: production webpack build and TypeScript passed; both focused suites passed. Independent review findings (gradient coordinates and accessible heading name) fixed. Desktop browser captured changing per-character opacity across entrance and hold. At 390px the full words wrap correctly, document width is 384px (no horizontal page overflow), and no browser console errors were observed. The browser requests reduced motion, so blur/translation parity was validated against the exact recipe in automated tests, not visually claimed on that device. Awaiting explicit publication approval.
