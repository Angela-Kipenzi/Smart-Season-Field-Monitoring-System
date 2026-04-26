# SmartSeason — Field Monitoring System

SmartSeason is a full-stack web application for tracking crop progress across many fields during a growing season. It is built for two roles:

- **Admin / Coordinator** — sees every field, manages users, creates and assigns fields, and gets the org-wide dashboard.
- **Field Agent** — sees only the fields assigned to them, can advance the stage of those fields, and can log notes/updates from the ground.

---

## Stack

- **Monorepo** — pnpm workspaces with shared `lib/*` packages (DB, OpenAPI spec, generated Zod schemas, generated React Query client).
- **Backend** — Node.js / Express, Drizzle ORM on PostgreSQL, Clerk for authentication.
- **Frontend** — React + Vite, shadcn/ui, TanStack Query, wouter for routing, Recharts for charts, Clerk React for auth, react-hook-form + Zod for forms.
- **API contract** — OpenAPI 3.1 spec (`lib/api-spec/openapi.yaml`) is the single source of truth. React Query hooks and Zod request/response schemas are generated from it via Orval, so the backend and frontend are kept in sync automatically.

---

## How it works

### Roles & access control

- The system uses **invitation-only onboarding**. New users cannot just sign up and start using the app — a coordinator must invite their email address first.
  - The very first user ever to sign in is bootstrapped as an `admin` (so the system isn't permanently locked).
  - For every subsequent sign-in, the backend checks the `invitations` table by email. If a pending invitation exists, the user is created with the invited role (`admin` or `field_agent`) and the invitation is marked accepted. If no invitation exists, the API returns `403 { error: "no_invitation" }` and the frontend shows a friendly "Account not invited" screen with a sign-out button.
- An admin manages invitations from the **Agents** page (send, list pending, revoke). An admin can also promote/demote existing users.
- After login, users are redirected to `/dashboard`, which renders one of two distinct views based on `currentUser.role`:
  - `AdminDashboard` — org-wide totals, stage chart, total agents, all recent updates.
  - `AgentDashboard` — only assigned fields, "needs attention" focus list, and the agent's own recent updates.
- Every protected route runs `requireAuth` middleware (resolves the Clerk identity, applies the rules above, attaches `req.currentUser`). Admin-only routes additionally use `requireAdmin`.
- Field-level authorization: agents can only read/update fields where `assignedAgentId` matches them.

### Stage lifecycle

Every field moves through four stages: **Planted → Growing → Ready → Harvested**. The current stage is changed when an authorized user (admin or the assigned agent) submits an update with a new stage. Each update is stored with `previousStage`, `newStage`, the author, the note, and a timestamp, giving each field an auditable timeline.

### Computed field status

Field **status** is derived on the server, not stored, so it always reflects the current truth (`artifacts/api-server/src/lib/fieldStatus.ts`):

- **completed** — `stage === "harvested"`.
- **at_risk** — no update in 14+ days, *or* the field has been in the `planted` stage for more than 7 days (i.e. activity has stalled).
- **active** — anything else.

This rule is intentionally simple and explainable; it is computed per-field both for list views and for the aggregate dashboard counters.

### Dashboards

`GET /api/dashboard/summary` returns counts (active, at_risk, completed), a stage breakdown, a status breakdown, the 10 most recent updates, and (admins only) the total agent count. The query is automatically scoped to the current user's role: agents see numbers covering only the fields they are assigned to.

### CSV exports

The Fields page has an **Export** menu that downloads either a fields snapshot or a full updates log as CSV. Both endpoints (`GET /api/exports/fields.csv`, `GET /api/exports/updates.csv`) are role-scoped on the server: admins get every row, agents get only the fields assigned to them and the updates on those fields.

---

## Local setup

Requirements: Node 20+, pnpm 10+, a PostgreSQL database, a Clerk application.

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Environment variables** — provide:

   - `DATABASE_URL` — PostgreSQL connection string
   - `SESSION_SECRET` — any random string
   - `CLERK_SECRET_KEY` — from your Clerk dashboard
   - `VITE_CLERK_PUBLISHABLE_KEY` — from your Clerk dashboard

3. **Push the database schema**

   ```bash
   pnpm --filter @workspace/db run push
   ```

4. **Run the app** — run the API server and the web app per artifact:

   ```bash
   pnpm --filter @workspace/api-server run dev   # API on :8080
   pnpm --filter @workspace/smartseason run dev  # Web on the assigned port
   ```

5. **Sign up** — open the app, click *Get Started*, and create your first account. Because you are the first user, you are automatically made an **admin**. Create a few fields, then sign up a second account in another browser — that one will be a **field_agent**, and you can assign fields to them from the admin UI.

### Demo credentials

For the reviewer, demo accounts are provided in the submission email (one admin, one field agent). They are real Clerk accounts on the deployed instance and can be used to sign in directly.

---

## Project layout

```
artifacts/
  api-server/          Express API
  smartseason/         React + Vite frontend
lib/
  api-spec/            openapi.yaml (source of truth)
  api-zod/             generated Zod request/response schemas
  api-client-react/    generated React Query hooks
  db/                  Drizzle schema + db client
```

---

