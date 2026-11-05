# Homepage automatic replay specification
Updated 2026-11-05 following user request to remove Play/Pause and replay on scrolling.

- Preserve layout, content, purple colors, Option C logos and animated C-Fox.
- Start reveals automatically when cards or words enter view; replay after exiting and re-entering in either direction. Never repeatedly restart while the same element stays visible.
- Desktop: 700ms entrances, cards rise 48px; mobile: 560ms entrances, cards rise 24px. Card stagger caps at 200ms; word stagger at 340ms. No card blur.
- Reduced-motion preference: automatic 180ms opacity-only fade from .85 to 1 with no stagger, translation, rotation or blur. Hero background remains static.
- Remove the homepage Play/Pause button. Hero background automatically runs a bounded four-second scene on each re-entry, then settles.
- Focus, hidden documents and unmount cancel active reveals. Content is fully readable without JavaScript or animation support.
- No scroll interception, frame-by-frame React updates, new runtime dependencies, catalog metadata or question-bank changes.
- Use /#catalog for reliable repeat navigation.

## Final approved direction
Headings use word-by-word scroll entrances. The hero headline has no text loop or exit phase. Certification and news cards reveal on entry and replay only after leaving and returning. The entire latest-updates panel (Your next chapter starts here) reveals as one block, without a nested heading reveal. Dynamically replaced cards from catalog filters or refreshed news must also be observed. Existing colors, layout and C-Fox stay unchanged. User explicitly requested testing on mobile and publishing this revision.
