# Feature Specification: Homepage block reveals
Created: 2026-11-05. Status: Implementation authorized by user.

## User scenarios and testing
P1: A learner scrolls from the hero to certifications and news; grouped cards enter in a short sequence that communicates the next choice. Content and links stay immediately usable.
P1: A reduced-motion or keyboard user reads the same complete page without waiting for movement. Focus cancels a card's entrance; Pause stops active and future block reveals.
P2: A mobile visitor gets shorter movement without page overflow or scroll interception.

## Requirements / acceptance criteria
R1: Preserve content, layout, purple colors, Option C branding, fox animation and learning routes.
R2: Homepage-only card reveals, once per mounted card; certification cards rise/settle, news cards settle horizontally. Card stagger at most 200ms; duration at most 700ms desktop and 560ms mobile.
R3: Default HTML/CSS fully visible; missing observers/animation APIs and reduced motion show static content unless the visitor explicitly selects Play.
R4: Existing homepage Pause control cancels block animations; keyboard focus cancels its target animation. No pointer blocking, pinned sections, scroll handlers or additional runtime dependency.
R5: Cancel running animation on hidden document, reduced-motion change and unmount. No animation delay on filtering choices.
R6: Record build, focused behavior checks, desktop/mobile inspection and live deployment evidence honestly.

## Scope boundaries
No assessment, document, metadata, billing or question-bank changes. No licensed component installed or copied; React Bits Pro's public page is a visual reference. Blur Highlight remains separately blocked on its missing license key.

## Follow-up: stronger reveals and explicit Play
- Shared homepage motion state allows explicit Play to enable text and card reveals when reduced motion is otherwise respected.
- Words reveal with a short blur and upward rotation; cards fade from 0.12 opacity and rise 48px desktop / 24px mobile.
- Duration is 700ms desktop / 560ms mobile; card stagger caps at 200ms, words at 340ms. Mobile cards use no blur.
- Pause cancels both word and card reveals. Content remains visible with JavaScript unavailable.
- Use the canonical /#catalog target to avoid duplicated fragments on repeat navigation.
