# Plan and research
Source: user request; existing Spec Kit templates and draft constitution in work/performance-fixes/.specify. This feature uses its requirements, plan and outcome structure without rerunning project initialization.

Reference reviewed: https://pro.reactbits.dev/ — public section composition and live rendered blocks. Current browser requests reduced motion, so observation does not establish the site's full timing or source implementation. Implement original motion, not a claimed exact clone.

Impeccable: retain the hero focal moment; add bounded continuity to the two card collections. Taste Skill: grouped arrivals in reading order, short stagger, smaller mobile travel, no layout animation. Explicit existing-brand brief wins over aesthetic lint preferences.

Implementation: reusable native IntersectionObserver/Web Animations controller around existing homepage sections; static default; each target unobserved after its first entry; cancel on focus/pause/hidden/reduced-motion. Avoid wrapping every individual card or introducing a package. Connect homepage hero control with parent state. No data model changes.

Validation: production build/TypeScript, source-scoped design checks, desktop/mobile UI and keyboard paths; report reduced-motion observation separately from ordinary-motion behavior checks. One inspection batch, at most one correction pass.
