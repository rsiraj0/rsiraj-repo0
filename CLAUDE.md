# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

UIGen — an AI-powered React component generator with live preview. Users
describe a component in chat; the backend asks Claude to emit a virtual file
system of `.tsx` files, which the frontend renders into an isolated iframe
preview. Registered users get their projects persisted in SQLite; anonymous
users get an in-memory session.

## Commands

- Install + migrate DB: `npm run setup`
- Dev server: `npm run dev` (http://localhost:3000)
- Build / start: `npm run build` && `npm start`
- Unit tests: `npm test` (vitest). Single test: `npx vitest run path/to/file.test.ts`
- Prisma regenerate: `npm run db:generate`; new migration: `npm run db:migrate`

## Architecture

- `src/app` — Next.js 15 App Router. `page.tsx` renders the workspace;
  `signin/page.tsx` handles auth; `api/generate/route.ts` is the chat endpoint.
- `src/components` — `workspace.tsx` owns client state (VFS, messages, view).
  `chat.tsx`, `preview.tsx`, and `code-panel.tsx` are the three main panes.
- `src/lib/vfs.ts` — virtual file system: a flat `{ path: contents }` map with
  tree-building helpers. Never writes to disk.
- `src/lib/ai.ts` — wraps the Anthropic SDK. If `ANTHROPIC_API_KEY` is unset it
  returns a hard-coded static component so the app stays usable without a key.
- `src/lib/auth.ts` + `src/app/actions/auth.ts` — JWT session cookies via
  `jose`, password hashing via `bcryptjs`. Server actions for sign in/up/out.
- `src/components/preview.tsx` — builds an iframe `srcDoc` that loads React
  from an import map, transforms VFS files with `@babel/standalone`, and
  resolves relative imports through an in-memory require registry.
- `prisma/schema.prisma` — `User` and `Project`. `Project.files` and
  `Project.messages` are JSON-serialized strings (SQLite-friendly).

## Conventions

- Client components are marked `"use client"`. Server actions live in files
  marked `"use server"` at the top (see `src/app/actions/auth.ts`).
- Path alias `@/*` → `src/*` (see `tsconfig.json`).
- Tailwind v4 via `@tailwindcss/postcss`; global styles in
  `src/app/globals.css` with `@import "tailwindcss"`.
- No server-side rendering of Monaco; the editor is imported via
  `next/dynamic` with `ssr: false`.
