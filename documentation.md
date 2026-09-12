# StreamDrop — Development Log

---

## Session 1 — Clerk → Database Sync

### What was done

Implemented the authenticated User model and Clerk → Prisma/Neon synchronization.

### Files changed

| File | Change |
|---|---|
| `prisma/schema.prisma` | Replaced draft `Test` + `User` models with `UserRole` enum and proper `User` model |
| `src/app/api/sync-user/route.ts` | New POST route — syncs authenticated Clerk user into the database |
| `src/app/api/webhooks/clerk/route.ts` | Updated `user.created` webhook handler to use new schema fields |
| `src/app/api/test/route.ts` | Replaced Test model usage with a `user.count()` health check |
| `src/middleware.ts` | Added `/` as a public route so unauthenticated visitors can access the home page |

### Prisma User model

```prisma
enum UserRole {
  STREAMER
  ADMIN
}

model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String
  firstName String?
  lastName  String?
  fullName  String?
  imageUrl  String?
  role      UserRole @default(STREAMER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### How sync works

- `POST /api/sync-user` is called after sign-in.
- The server uses Clerk's `currentUser()` — no data is trusted from the client.
- Uses `upsert` on `clerkId` — safe to call multiple times (idempotent).
- First login: creates a new `User` row with `role = STREAMER`.
- Repeat login: updates profile fields only (`email`, `firstName`, `lastName`, `fullName`, `imageUrl`). Role is never modified.

### ADMIN protection

- `role` is never read from the request body.
- Every new user gets `role = STREAMER` by default via the Prisma schema.
- To grant ADMIN, update the row directly in the database (Prisma Studio or a seed script).

### Setup required

1. Create `.env` at the project root:
   ```
   DATABASE_URL="postgresql://..."
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
   CLERK_SECRET_KEY="sk_..."
   CLERK_WEBHOOK_SECRET="whsec_..."
   ```
2. Run the migration and generate the Prisma client:
   ```bash
   npx prisma migrate dev --name add_user_model
   npx prisma generate
   ```

---

## Session 2 — Sign-in / Sign-up Pages + Streamer Dashboard + React Query + Zustand

### What was done

Built the sign-in and sign-up pages using Clerk's hosted components with a dark purple design. Added a streamer dashboard that calls `POST /api/sync-user` via React Query on first load and stores the result in Zustand. Cleaned up the home page with a landing UI.

### Packages installed

- `@tanstack/react-query` — server state / data fetching
- `zustand` — client-side global state for the synced DB user

### Files changed

| File | Change |
|---|---|
| `src/app/page.tsx` | Replaced placeholder with a clean landing page |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | New — Clerk `<SignIn>` with dark theme, redirects to `/streamer-dashboard` |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | New — Clerk `<SignUp>` with dark theme, redirects to `/streamer-dashboard` |
| `src/app/streamer-dashboard/page.tsx` | New — calls sync-user via React Query, stores result in Zustand, renders profile |
| `src/app/layout.tsx` | Added `QueryProvider`, set Clerk `signInUrl`/`signUpUrl` redirect URLs |
| `src/middleware.ts` | Added `/sign-in(.*)` and `/sign-up(.*)` as public routes |
| `src/providers/query-provider.tsx` | New — React Query `QueryClientProvider` wrapper |
| `src/store/user-store.ts` | New — Zustand store holding the synced `DbUser` |

### Data flow

```
User signs in/up via Clerk
        ↓
Clerk redirects to /streamer-dashboard
        ↓
useQuery({ queryKey: ["sync-user"] }) fires POST /api/sync-user
        ↓
Server calls currentUser() → upserts DB user
        ↓
Response stored in Zustand via setDbUser()
        ↓
Dashboard renders profile from Zustand store
```

### Notes

- `staleTime: Infinity` on the query means sync-user is only called once per page load session, not on every re-render.
- Zustand store is in-memory only — resets on page refresh (intentional for now, re-sync happens automatically).
- Dashboard is protected by middleware — unauthenticated users are redirected to `/sign-in`.
