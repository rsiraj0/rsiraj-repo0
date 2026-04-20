# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

UIGen — an AI-powered React component generator. The user types a prompt in
chat; the backend streams tool calls from Claude (via the Vercel AI SDK) that
mutate an **in-memory** virtual file system; the frontend transforms those
files with Babel Standalone and renders them in a sandboxed iframe preview.
Nothing is written to disk on the server.

## Commands

- `npm run setup` — install deps, generate Prisma client, apply migrations.
- `npm run dev` — Next.js dev server on port 3000 (Turbopack).
- `npm run dev:daemon` — dev server in the background writing to `logs.txt`.
- `npm run build` / `npm start` — production build and serve.
- `npm run lint` — `next lint`.
- `npm test` — Vitest (jsdom). Single file: `npx vitest run path/to/file.test.ts`. Watch a file: `npx vitest path/to/file.test.ts`.
- `npm run db:reset` — drop and recreate the SQLite DB (destructive).

## Running without an API key

If `ANTHROPIC_API_KEY` is empty, `src/lib/provider.ts`'s `getLanguageModel()`
returns a `MockLanguageModel` that emits a canned tool-call sequence to
create a component based on keywords in the prompt (`form` → ContactForm,
`card` → Card, otherwise Counter). This is why the app is usable without
a key, and why mock runs cap at 4 steps vs. 40 for the real provider.

## Architecture

### Backend: chat endpoint + AI tools
- `src/app/api/chat/route.ts` is the single streaming endpoint. It prepends
  the system prompt from `src/lib/prompts/generation.tsx`, reconstructs a
  `VirtualFileSystem` from the client-serialized file nodes, and hands
  Claude two tools. When `projectId` is present **and** the session is
  valid, it persists messages and the serialized VFS onto the `Project`
  row inside `onFinish`.
- `src/lib/tools/str-replace.ts` — create/view/str_replace/insert/undo on
  the VFS (the model's main way to write code).
- `src/lib/tools/file-manager.ts` — rename/delete files and folders.
- `src/lib/provider.ts` — wraps `@ai-sdk/anthropic` and defines
  `MockLanguageModel` (see above).

### Virtual file system
- `src/lib/file-system.ts` — `VirtualFileSystem` is a tree of `FileNode`s
  (type `file | directory`). It normalizes paths, lazily creates parent
  directories on `createFile`, and exposes `serialize`/`deserializeFromNodes`
  for sending the tree across the network. The same class runs on the
  server (per-request in the chat route) and in the browser (inside the
  React context below) — treat it as the single source of truth.
- `src/lib/contexts/file-system-context.tsx` — the client-side instance,
  seeded from `project?.data` for signed-in users or from sessionStorage
  for anonymous users (see `src/lib/anon-work-tracker.ts`).

### Frontend rendering
- `src/app/main-content.tsx` — the three-pane layout (chat | file tree +
  editor | preview) built with `react-resizable-panels`. It provides the
  `FileSystemProvider` and `ChatProvider` contexts that everything else
  consumes.
- `src/components/preview/PreviewFrame.tsx` + `src/lib/transform/jsx-transformer.ts`
  — the transformer runs Babel Standalone in the browser, resolves
  relative imports against the VFS, and stubs missing modules with
  placeholder components so a half-finished generation still renders.
  `/App.jsx` is the convention-by-contract entry the preview looks for.

### Routing & auth
- `src/app/page.tsx` — for signed-in users, redirects to the most recent
  project (or creates one). For anonymous users, renders `MainContent`
  without a project.
- `src/app/[projectId]/page.tsx` — the per-project workspace; redirects
  anonymous users home.
- `src/lib/auth.ts` — JWT cookie sessions via `jose` (7-day expiry, cookie
  name `auth-token`, secret from `JWT_SECRET`). `src/middleware.ts` only
  gates `/api/projects` and `/api/filesystem`; the chat route does its
  own session check before persisting.
- `src/actions/` — server actions for auth (`signUp`, `signIn`, `signOut`,
  `getUser`) and project CRUD (`createProject`, `getProject`,
  `getProjects`). `src/lib/anon-work-tracker.ts` stashes the current
  chat + VFS in sessionStorage so an anonymous user who signs up mid-session
  can promote their work into a real project.

### Database
- `prisma/schema.prisma` — `User` and `Project`. `Project.userId` is
  optional (nullable) so the schema technically supports ownerless
  projects, but the app always writes a userId in practice.
  `Project.messages` and `Project.data` are JSON strings (SQLite, no
  JSON column type).
- Prisma Client is generated to `src/generated/prisma` (see the `output`
  in the schema) — don't import from `@prisma/client` directly in new
  code; use `@/lib/prisma` which re-exports the generated client.

## Conventions

- Path alias `@/*` → `src/*` (see `tsconfig.json`). Vitest picks this up
  via `vite-tsconfig-paths`.
- Server-only modules (`src/lib/auth.ts`) import `server-only` to fail
  loudly if bundled into a client component.
- UI primitives in `src/components/ui/` are shadcn-generated (see
  `components.json`); prefer composing those over new one-off components.
- The AI interacts with code exclusively through the two tools above —
  if you need a new capability, add a tool rather than side-channeling
  through the chat endpoint.
