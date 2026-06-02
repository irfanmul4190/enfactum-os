# Enterprise Intranet (Phase 1)

Phase 1 ships a single Cloud Run service (`intranet-hub`, region `asia-southeast1`)
that hosts five apps from one Nginx container.

## Apps

| Path                          | Folder                              | Description                                            |
|-------------------------------|-------------------------------------|--------------------------------------------------------|
| `/`                           | `apps/launcher`                     | Central launcher (TanStack Start, Firebase/Supabase)   |
| `/market-grammer/`            | `apps/market-grammer`               | Brand book + messaging library (Supabase)              |
| `/pipeline-pro/`              | `apps/pipeline-pro`                 | Sales pipeline analytics (Supabase auth + data)        |
| `/profit-navigator/`          | `apps/profit-navigator`             | Margin / profitability dashboards                      |
| `/enfactum-financing-hub/`    | `apps/enfactum-financing-hub`       | Invoicing, payments, and financial visibility          |

## Local Development

```sh
npm install
npm run dev          # runs all apps via turbo
# or per-app:
npm run dev -w apps/launcher
```

Per-app dev ports are defined in each app's `vite.config.ts`.

## Deploy

- PowerShell: `./deploy.ps1`
- Bash: `./DEPLOY.sh`

Both scripts run `gcloud builds submit` (building the root [Dockerfile](Dockerfile))
then `gcloud run deploy intranet-hub`. GitHub Actions workflows in
`.github/workflows/deploy-*.yml` do the same on push to `main` filtered by app path.

Deployment details: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

## Public env vars baked into the image

Supabase anon/publishable keys are public by design. They are set in the
[Dockerfile](Dockerfile) build stage:

- `VITE_AUTH_PROVIDER`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — shared auth project
- `VITE_AUTH_SUPABASE_URL`, `VITE_AUTH_SUPABASE_KEY` — pipeline-pro auth client
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — pipeline-pro data client
