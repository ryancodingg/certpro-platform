# My Learning document lifecycle

Implemented 2026-11-05. Existing document titles and the current design are preserved.

- New blank documents use Document 1, Document 2, and so on. The account counter includes previously issued numbers; concurrent offline names are reconciled deterministically after sync. Existing custom and legacy-note titles are retained.
- Move to Trash is reversible. Trash has its own preview, restore actions, individual permanent deletion and Empty Trash. Permanent deletion requires a second explicit confirmation and affects only the selected trashed document IDs. Independently recovered documents and external Google/Notion documents remain intact.
- Permanent deletion removes page content and retains minimal document-ID markers for synchronization. These markers are combined on the server even for older clients; offline original documents cannot return after sync. Do not discard these markers merely because a device has been offline for a long time.
- Removing the last active page leaves an empty workspace. Creating a new page continues numbering. Initial blank-device detection supports legacy starter pages without relying solely on the new title.
- Local and cloud storage use a 900,000-byte UTF-8 budget. Existing oversized local data can shrink incrementally; storage usage includes Trash. Offline deletion reaches the account only when sync succeeds.

## Validation
- tests/workspace-lifecycle.test.ts: numbering, legacy migration, restore/purge scope, offline edits, recovery preservation, new-device initialization, deterministic concurrent creation, capacity, stale tabs and invalid metadata.
- tests/workspace-api.test.cjs: server revision conflicts, canonical response, persistent deletion protection against old-client writes and account ownership.
- Existing focused, learning-feedback and editor-autosave checks passed.
- Isolated Chromium test using the real workspace/editor and local test data: create, edit/autosave, Trash, Restore, cancellation, Empty Trash, last-page empty state, reload and 390px layout passed. External services were mocked; no real account data was deleted.
- Production build and TypeScript checks passed. Physical iPhone and live two-account cloud synchronization were not tested in this local validation.

Catalog metadata and unrelated My Learning features are unchanged. The remaining review recommendations are not included in this release.
