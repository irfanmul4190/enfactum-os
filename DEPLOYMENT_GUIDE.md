# Phase 1 Deployment Guide

A single Cloud Run service (`intranet-hub` in `asia-southeast1`, GCP project `automated-axis-325507`) serves all six apps from one Nginx container.

Production root: <https://intranet.enfactum.com/>

## Apps

| Path | Source folder | Bundle entry |
|------|---------------|--------------|
| `/` | `apps/launcher` | TanStack Start (SSR-capable) |
| `/market-grammer/` | `apps/market-grammer` | Vite SPA |
| `/pipeline-pro/` | `apps/pipeline-pro` | Vite SPA |
| `/profit-navigator/` | `apps/profit-navigator` | Vite SPA |
| `/enfactum-financing-hub/` | `apps/enfactum-financing-hub` | Vite SPA |
| `/hr-hub/` | `apps/hr-hub` | Vite SPA |

Adding a new app: see the checklist at the top of [`nginx.conf`](nginx.conf).

## Prerequisites

- Google Cloud SDK installed and authenticated as a user with Cloud Build + Cloud Run + IAM permissions
- `gcloud config set project automated-axis-325507`
- Cloud Build and Cloud Run APIs enabled, billing active

## Local development

```powershell
npm install        # workspaces install (turbo + all 6 apps + 4 packages)
npm run dev        # turbo runs every app's dev server in parallel
```

Each app picks its own port (see `vite.config.ts`). For mixed local-dev where the launcher loads sub-app cards from running dev servers, [`apps/launcher/.env.local`](apps/launcher/.env.local) maps each `VITE_LAUNCHER_*_URL` to its localhost port.

### Environment precedence

Each app reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The resolution order is:

1. **Cloud Run / Docker** — `Dockerfile`'s top-of-file `ENV` lines. Authoritative for production builds.
2. **Local dev** — `apps/<app>/.env.local` (gitignored).
3. **Per-app `.env.production`** — checked into the repo for cases where someone runs `npm run build -w apps/<app>` outside Docker. Contents must match the Dockerfile `ENV` values; otherwise the deployed bundle and the locally-built bundle diverge.

The anon/publishable key is intentionally public — RLS gates writes on the database side. **Never** hardcode the key as a string literal in `src/`; always read via `import.meta.env`.

## Deploy

```powershell
./deploy.ps1     # Windows
./DEPLOY.sh      # macOS / Linux
```

Both scripts:

1. `gcloud builds submit .` — uploads the repo, builds a single container via [`Dockerfile`](Dockerfile), pushes to `gcr.io/automated-axis-325507/intranet-hub`.
2. `gcloud run deploy intranet-hub --region asia-southeast1 --allow-unauthenticated --memory 512Mi --cpu 1 --min-instances 0 --max-instances 10` — rolls a new revision and shifts 100% traffic.

Total wall-clock: ~3–5 minutes. Six apps build in parallel inside the container via `turbo run build`.

### Migration ordering

When a code change depends on a Supabase schema change (RLS policy, new table, new column), **run the migration first**, then deploy. Otherwise users land on an authenticated query against a column/table that doesn't exist yet.

Migrations live at [`apps/pipeline-pro/supabase/migrations/`](apps/pipeline-pro/supabase/migrations/). The folder is owned by pipeline-pro for historical reasons; all six apps' migrations live here. They're chronologically named (`YYYYMMDDHHMMSS_<slug>.sql`), all idempotent, and most contain a sanity-check SQL block in the file footer.

Apply via Supabase Dashboard → project `dfzmkxkyqtyqntvmzcpt` → SQL Editor → paste → Run. Confirm with the file's sanity check, then run `./deploy.ps1`.

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every PR + push to `main`:

- `npm install -g npm@11` + `npm ci` (mirrors Dockerfile install)
- `turbo run build` (catches missing imports / type errors / generated-file drift)
- `turbo run check-types`
- `turbo run test` (vitest suites where declared)
- `turbo run lint` (advisory — does not fail the pipeline)

Per-app deploy workflows in [`.github/workflows/deploy-*.yml`](.github/workflows/) trigger when files in that app's folder change. Each one builds + pushes the full container; we don't do per-app images. Two secrets are required: `GCP_SA_KEY`, `GCP_PROJECT_ID`.

## Verification

```powershell
gcloud run services describe intranet-hub --region asia-southeast1
curl -I https://intranet.enfactum.com/                          # 200
curl -I https://intranet.enfactum.com/hr-hub/                   # 200
curl -I https://intranet.enfactum.com/pipeline-pro/             # 200
# ...and similarly for the other four paths
```

To audit which Supabase key the deployed bundles actually shipped with:

```bash
for app in market-grammer pipeline-pro profit-navigator enfactum-financing-hub hr-hub; do
  asset=$(curl -s "https://intranet.enfactum.com/$app/" | grep -oE 'assets/index-[^"]+\.js' | head -1)
  key=$(curl -s "https://intranet.enfactum.com/$app/$asset" | grep -oE "sb_publishable_[a-zA-Z0-9_]+" | head -1)
  echo "$app -> ${key:0:30}..."
done
```

## Rollback

```powershell
# List the last N revisions to find one to roll back to
gcloud run revisions list --service intranet-hub --region asia-southeast1 --limit 5

# Shift 100% traffic to a known-good revision
gcloud run services update-traffic intranet-hub --region asia-southeast1 --to-revisions intranet-hub-<revision>=100
```

DB rollback: most migrations are additive (ADD COLUMN, GRANT, CREATE POLICY) so the new bundle simply ignores them. If a migration deleted or renamed something, you'll need a forward-fix migration; Supabase has no automated down-migration.

## Architecture notes

- **Single container, multiple SPAs.** Each app builds with `base: "/<route>/"` in its `vite.config.ts`. Nginx routes by path prefix, serving `index.html` for unknown sub-paths so client-side routing works. See [`nginx.conf`](nginx.conf).
- **Single Supabase project (`dfzmkxkyqtyqntvmzcpt`)** hosts both auth (Google SSO) and data for every app. Consolidated 2026-05-19 from a previously-split auth/data setup.
- **Shared `@enfactum/auth-gate` package** ([`packages/auth-gate`](packages/auth-gate)) provides the React `<AuthProvider>` + `useAuth()` hook used by all five secured apps. The same package owns the canonical `ACCESS_MATRIX_APPS` list — adding a new app there is the single source of truth that the launcher's admin matrix UI and HR Hub's new-employee seeder both read from.
- **Shared `@repo/ui` package** ([`packages/ui`](packages/ui)) provides the top-level `<ErrorBoundary>` wrapped around every SPA's root in `src/main.tsx`. Crashes show a recovery card instead of a blank page.
- **Access matrix** is a `(employee_id, app, access_level)` table. Levels: `none`/`read`/`write`/`admin`. Edit via `/admin/people` in the launcher (gated to matrix admins). New employees created via HR Hub get a default `read` grant on every app.
- **Sensitive columns on `public.employees`** (monthly_ctc, personal_email, phone, payboy_employee_id, insurance_member_id, drive folder URLs) are hidden from `select('*')` via column-level `GRANT`s and exposed only through the `get_employee_sensitive(p_id)` SECURITY DEFINER RPC, which checks self / matrix-admin / `can_admin_app('hr-hub')`. See migration `20260524120000_hr_hub_security_hardening.sql`.

## Common gotchas

- **Stale anon key in browser cache.** After any deploy that includes new client.ts code, users with the old cached JS will see `401 Invalid API key`. Mitigation: hard-refresh / Ctrl+Shift+R. The deploy is correct; the user's bundle is stale.
- **Path-based routing requires `base` to match nginx.** If `vite.config.ts` `base` and `nginx.conf` `location` disagree, the SPA loads but every internal navigation 404s.
- **React 19 vs React 18.** Launcher is React 19; the other five SPAs are React 18. Each app's `vite.config.ts` has `resolve.dedupe: ["react", "react-dom", "react/jsx-runtime"]` to prevent npm's hoisting from injecting React 18 into the launcher (which would surface as minified React error #525).
- **Pre-existing employee row required.** The auth gate fails closed if there's no `employees` row for the signed-in email. Bootstrap the first admin via the Supabase Table Editor (service-role bypass of RLS); after that, use `/admin/people`.
