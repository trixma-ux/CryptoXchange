---
name: CryptoXchange backend port
description: Notes from porting the Prisma/Express backend to Drizzle/Express 5 in artifacts/api-server
---

## Rules

**Why:** The original .migration-backup/backend used Prisma and Express 4. The workspace uses Drizzle ORM and Express 5.

**Key adaptations:**
- `express-async-errors` is incompatible with Express 5 (patches internal router paths that no longer exist). Remove it — Express 5 handles async errors natively.
- `uuid` package isn't in esbuild externals → replace with `crypto.randomUUID()` (Node.js 14.17+).
- Drizzle has no `prisma.$transaction([])` equivalent for array syntax — use individual awaits or a callback transaction `db.transaction(async (tx) => { ... })`.
- The API server runs on the PORT env var assigned by Replit (was 8080 in dev). The frontend Vite dev server proxies `/api/v1/*` to `localhost:8080`.

**Schema push:**
Run `pnpm --filter @workspace/db run push` after any schema change to push to PostgreSQL.

**How to apply:** Any future backend work on this project should use Drizzle ORM (not Prisma), and keep the `/api/v1` prefix on all routes.
