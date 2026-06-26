# Faralin

University-backed student recognition and scholarship pathway platform.

## Monorepo layout

```
faralin/
├── apps/
│   ├── web/          # Student + university frontend (:3000)
│   ├── admin/        # Admin dashboard (:3002)
│   └── api/          # NestJS backend (:3001)
├── packages/
│   ├── db/           # Prisma schema + client
│   ├── types/        # Shared TypeScript types
│   ├── config/       # Shared tsconfig presets
│   ├── ui/           # Shared styles (design tokens)
│   └── utils/        # Shared helpers (apiFetch, formatting)
├── package.json      # Root command center
├── pnpm-workspace.yaml
└── turbo.json
```

**Rule:** Root = command center. `apps/` = runnable applications. `packages/` = shared reusable code only.

## Commands (always from root)

```bash
pnpm install

# Database
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:seed
pnpm db:studio

# Development
pnpm dev              # all apps with a dev script
pnpm dev:web          # student/university app only
pnpm dev:api          # API only
pnpm dev:admin        # admin dashboard only

# Or filter directly
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter admin dev

# Production build
pnpm build
```

## Setup

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` + Clerk keys
2. `pnpm install`
3. `pnpm db:generate && pnpm db:push && pnpm db:seed`
4. `pnpm dev`

| App | URL |
|-----|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001/api |
| Admin | http://localhost:3002 |

## Stack

- pnpm workspaces + Turborepo
- Next.js 15 (web + admin)
- NestJS (api)
- PostgreSQL + Prisma
- Clerk auth
