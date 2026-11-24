---
inclusion: always
---

# Hauntly engineering and safety guidance

## Stack and structure

- Use the existing TypeScript, React, and Vite application; do not introduce a second framework or unnecessary dependencies.
- Follow the existing `src` organization: pages, components, contexts, hooks, lib, and types. Keep backend SQL and migrations in `supabase/` and the existing verification scripts in `scripts/`.
- The application uses Supabase for authentication and data/realtime features, MapLibre GL for the globe, and optional Gemini integration. Follow the established service and UI patterns when modifying these areas.

## Validation

- Run `npm run build` for TypeScript and production-build validation.
- Run `npm run lint` for lint validation.
- Run relevant existing feature checks when changing behavior, including `npm run test:friends`, `npm run test:groups`, `npm run test:globe`, `npm run test:locations`, and `npm run test:gemini`. Some tests may depend on local environment configuration; report such limitations rather than claiming they passed.
- Do not change dependencies or lockfiles unless a change requires it.

## Secrets and user data

- Never commit `.env` files, API keys, passwords, access tokens, or private judge credentials. `.env.example` is for placeholders and public client configuration only.
- Never expose Supabase service-role credentials or OAuth client secrets in frontend code. Keep access control enforced by the backend, including existing Supabase Row Level Security policies.
- Avoid logging private messages, credentials, or precise user location. Request only the data needed for a feature and preserve existing authorization checks.
