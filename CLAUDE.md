# Project: FIRE Dashboard

## Gemini API Integration
- Use `@google/generative-ai` SDK (NOT Firebase AI Logic SDK, NOT raw fetch calls)
- Store API key in `VITE_GEMINI_API_KEY` env var (Vite framework)
- Local dev: `.env` file (gitignored)
- Production: GitHub Actions secret `VITE_GEMINI_API_KEY`
- NEVER hardcode API keys in source code — repo is public

## Deployment
- GitHub Pages via GitHub Actions on push to main
- Repo: `godwintl/fire-tracker`
- Live URL: https://godwintl.github.io/fire-tracker/

## Auth
- Firebase Auth (Google sign-in)
- Restricted to `godwintl@gmail.com` only
