# Tech Stack

Full rationale in `TRD.md` (project root) — this note is the quick-reference version for when you're mid-code and don't want to re-open the whole TRD.

- **Expo SDK 57 / RN 0.86 / React 19.** Expo Go works fine until `react-native-iap` is added (see → [[Monetization Model]]) — that's the one thing that forces a switch to an EAS Dev Build.
- **No router.** One linear flow (entry → preview → settings) — a plain screen-name state value covers it. Don't reach for react-navigation unless the flow actually grows tabs/deep links.
- **State: React Context + `useReducer`.** One `ResumeContext` holding the single master resume record — no Redux/Zustand, there's only one entity.
- **Storage: AsyncStorage only**, two keys (`resume`, `aiUsage`) — see → [[Data Model]]. No SQLite/WatermelonDB/Realm; the whole dataset is two small JSON blobs.
- **Preview + PDF share one HTML/CSS template** (`react-native-webview` for live preview, `expo-print` for the PDF) — one source of truth, so preview can't visually drift from the exported PDF. Word export via `docx` stays a genuinely separate pipeline (see → [[Export Pipeline]]).
- **Always resolve deps with `npx expo install <pkg>`**, never bare `npm install` — it picks the SDK-57-compatible version instead of guessing.
- **TypeScript is set up** (`tsconfig.json` extending `expo/tsconfig.base`, `App.tsx`) — `npm run typecheck` runs `tsc --noEmit`. ESLint is Expo's own scaffolded config (`npx expo lint` generated `eslint.config.js` + `eslint-config-expo`) — `npm run lint`.
- **Env vars use Expo's built-in `EXPO_PUBLIC_*` prefix**, no `react-native-dotenv` or similar library — Expo inlines any variable with that prefix into the JS bundle at build time natively. See `.env.example` at the project root.
- **The Cloudflare Worker (`worker/`) is a separate npm project**, not part of the Expo app's `node_modules` or build — its own `package.json`, `wrangler.toml`, deployed independently via `wrangler deploy`. Real secrets (`GEMINI_API_KEY`, `APP_SHARED_SECRET`) are set with `wrangler secret put`, never committed — see `worker/.dev.vars.example` for local dev.

← back to [[Resume Builder MOC]]
