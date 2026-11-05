# Feature Specification: Homepage block reveals
Created: 2026-11-05. Status: Implementation authorized by user.

## User scenarios and testing
P1: A learner scrolls from the hero to certifications and news; grouped cards enter in a short sequence that communicates the next choice. Content and links stay immediately usable.
P1: A reduced-motion or keyboard user reads the same complete page without waiting for movement. Focus cancels a card's entrance; Pause stops active and future block reveals.
P2: A mobile visitor gets shorter movement without page overflow or scroll interception.

## Requirements / acceptance criteria
R1: Preserve content, layout, purple colors, Option C branding, fox animation and learning routes.
R2: Homepage-only card reveals, once per mounted card; certification cards rise/settle, news cards settle horizontally. Stagger at most 120ms; duration at most 500ms.
R3: Default HTML/CSS fully visible; missing observers/animation APIs and reduced motion show static content.
R4: Existing homepage Pause control cancels block animations; keyboard focus cancels its target animation. No pointer blocking, pinned sections, scroll handlers or additional runtime dependency.
R5: Cancel running animation on hidden document, reduced-motion change and unmount. No animation delay on filtering choices.
R6: Record build, focused behavior checks, desktop/mobile inspection and live deployment evidence honestly.

## Scope boundaries
No assessment, document, metadata, billing or question-bank changes. No licensed component installed or copied; React Bits Pro's public page is a visual reference. Blur Highlight remains separately blocked on its missing license key.
