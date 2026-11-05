# Brand icon and logo review — 2026-11-05

## Requirements
Use A for header/footer, C for tab/app icons; preserve purple colors and animated C-Fox. Verify the canonical homepage without query parameters. Review customer experience using Impeccable and Hallmark, with requirements-to-validation traceability from the Notion implementation workflow. No matching CertPro Notion spec was found; this records the supplied chat specification locally.

## Findings and implementation
- Live canonical metadata and all conventional public icon assets already contain C, but native Safari still showed the previous full-body fox after a hard refresh. This is an observed browser discrepancy, not a missing header logo.
- Simplified browser metadata to a primary 32px PNG and ICO shortcut at fresh root paths. Conventional favicon and fresh paths require revalidation. This cannot guarantee eviction of Safari's separate favicon database.
- Retained 38px desktop / 32px mobile header mark. Increased its home-link minimum height to 44px. Footer mark is now 32px with existing 44px link height.
- Logos retain empty alt text within the accessible “CertPro home” link, preventing duplicate announcements. Existing global focus-visible rings remain.
- No changes to colors, animation, catalog, question banks or account data.

## Validation
- Production webpack build and TypeScript passed. Local Turbopack cannot resolve this workspace's external node_modules symlink; remote deployment remains the Turbopack check.
- Mobile 390px preview: 32px header/footer marks, 44px link heights, no horizontal overflow.
- Impeccable flags existing gradients/accent borders/grid; unchanged to preserve the user's approved design. Hallmark component-only focus warning is resolved by inspecting the global focus-visible CSS, rather than duplicating it.
- Release and native Safari favicon verification: pending.
