# ─── Stage 1: Build workspace apps ────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json turbo.json ./

# Copy only the apps that are tracked in the root lockfile
COPY apps/launcher ./apps/launcher
COPY apps/market-grammer ./apps/market-grammer
COPY apps/profit-navigator ./apps/profit-navigator
COPY apps/enfactum-financing-hub ./apps/enfactum-financing-hub
COPY apps/pipeline-pro ./apps/pipeline-pro
COPY apps/hr-hub ./apps/hr-hub
COPY apps/enfactum-mdf-central ./apps/enfactum-mdf-central
COPY apps/enforge-contract-craft ./apps/enforge-contract-craft
COPY packages ./packages

RUN npm install -g npm@11 && npm ci --no-audit --no-fund

# Shared Supabase config — single project for auth and data across every app.
# Anon key is intentionally public (RLS gates writes to authenticated only).
ENV VITE_AUTH_PROVIDER=supabase
ENV VITE_SUPABASE_URL=https://dfzmkxkyqtyqntvmzcpt.supabase.co
ENV VITE_SUPABASE_ANON_KEY=sb_publishable_fM5FYEaEnM0nhbMx6LAoYw_TLUTiND2
ENV VITE_MARKET_GRAMMER_URL=/market-grammer/

# Build all Phase 1 apps in parallel via turbo. They all read
# VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from the ENV declarations above;
# no per-app overrides needed. Turbo respects the workspace dep graph
# (packages/auth-gate, packages/ui etc. build first) and parallelizes the
# rest across cores.
RUN npx turbo run build


# ─── Stage 3: Nginx runtime ────────────────────────────────────────────────────
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Launcher at root
COPY --from=builder /app/apps/launcher/dist /usr/share/nginx/html

# Market-Grammer at /market-grammer/
COPY --from=builder /app/apps/market-grammer/dist /usr/share/nginx/html/market-grammer

# Profit Navigator at /profit-navigator/
COPY --from=builder /app/apps/profit-navigator/dist /usr/share/nginx/html/profit-navigator

# Enfactum Financing Hub at /enfactum-financing-hub/
COPY --from=builder /app/apps/enfactum-financing-hub/dist /usr/share/nginx/html/enfactum-financing-hub

# Pipeline Pro at /pipeline-pro/
COPY --from=builder /app/apps/pipeline-pro/dist /usr/share/nginx/html/pipeline-pro

# HR Hub at /hr-hub/
COPY --from=builder /app/apps/hr-hub/dist /usr/share/nginx/html/hr-hub

# MDF Central at /enfactum-mdf-central/
COPY --from=builder /app/apps/enfactum-mdf-central/dist /usr/share/nginx/html/enfactum-mdf-central

# Contract Craft at /enforge-contract-craft/
COPY --from=builder /app/apps/enforge-contract-craft/dist /usr/share/nginx/html/enforge-contract-craft

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
