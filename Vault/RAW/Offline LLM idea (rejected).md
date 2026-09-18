# Offline LLM idea (rejected)

Considered using an on-device/offline LLM (Ollama or similar) for the AI rewriting feature, so it could work with zero internet.

Rejected because:
- Ollama itself doesn't run on Android at all — it's a desktop/server tool.
- Mobile-native alternatives (llama.cpp-for-Android, MLC-LLM) need 500MB-2GB+ bundled models, are slow, drain battery, and produce meaningfully worse output than a cloud model.
- The target market (price-sensitive Indian users) skews toward budget/low-RAM phones — exactly the devices worst suited to running a local model.
- Would have consumed most of the available solo build time on infra instead of the app.

Resolved by → [[AI Architecture]] (cloud-based, Gemini 2.5 Flash-Lite via Cloudflare Workers proxy).

← back to [[RAW Overview]]
