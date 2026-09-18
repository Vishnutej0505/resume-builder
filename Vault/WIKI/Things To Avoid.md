# Things To Avoid

A running ledger of traps already identified and closed — append to this whenever a future session finds another one, don't re-discover these mid-code.

- **Don't store `freeCreditsExhausted` as its own field.** It's derived (`freeCreditsRemaining <= 0`) — a separate stored boolean can drift out of sync with the count it's supposed to reflect. Compute it at read time. See → [[Data Model]].
- **Don't skip `schemaVersion` on stored records.** Costs one field now; retrofitting version detection onto data that was never tagged, after users already have it on-device, is a much bigger job later.
- **Don't trust the Worker's shared-secret header as real security.** It ships inside the APK and can be extracted by decompiling it — it only deters casual scraping. The thing that actually caps financial risk is the separate hard daily KV spend counter, which can't be bypassed by extracting anything from the client. See → [[AI Architecture]].
- **Don't add a router, Redux/Zustand, or SQLite/WatermelonDB for v1.** One linear screen flow and two singleton JSON records don't need any of them — see → [[Tech Stack]]. Add only if the actual shape of the app changes (e.g. real multi-resume storage gets un-rejected).
- **Don't use structured Date fields for resume date ranges.** Real resumes have fuzzy/partial/open-ended dates ("Summer 2021", "Present") — free-text `dateRange: string` avoids solving a timezone/parsing problem that buys nothing.
- **Don't automate PDF/Word visual-parity testing.** Two templates, checked manually against real sample data once, is enough — a snapshot-testing setup for two static layouts is more infrastructure than the problem warrants. (Still: check it manually before calling v1 done — the risk itself is real per → [[Export Pipeline]], only the automation is skippable.)
- **Don't add server-side purchase receipt validation for v1.** `react-native-iap`'s local purchase state is trusted, consistent with the already-accepted local-credit-bypass limitation in the PRD. Revisit only if paid-tier abuse is actually observed, not preemptively.
- **Don't bare `npm install` a new dependency in this project.** Always `npx expo install <pkg>` so the version matches SDK 57 instead of guessing — see AGENTS.md's warning that Expo's API surface has moved across recent SDKs.
- **Don't re-sort by `order` inside the function that re-sequences `order`.** A real bug caught by `resumeReducer.test.ts`: `normalizeSectionOrder` sorted sections by their existing `order` field before reassigning 0..n-1, which silently undid every drag-reorder (the array had already been moved into the new position; re-sorting by the stale field put it right back). Fixed by re-sequencing from current array position only, never re-sorting by the value the function exists to fix. See `src/lib/resumeModel.ts`.
- **Increment the Worker's daily-cap KV counter before calling Gemini, not after.** Counting only on success lets a retry storm against a broken Gemini endpoint bypass the cap entirely (every failed attempt would be free to retry forever). See `worker/src/index.js`.

← back to [[Resume Builder MOC]]
