# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY ../../package.json ../../package-lock.json ./

# Copy app package files
COPY package.json package-lock.json ./apps/market-grammer/

# Copy other workspace items
COPY ../../apps ./apps
COPY ../../packages ./packages

# Install dependencies
RUN npm ci

# Build the market-grammer app with the base path
RUN npm run build -w apps/market-grammer

# Production stage - serve with a lightweight HTTP server
FROM node:20-alpine

WORKDIR /app

# Install serve to run the static build
RUN npm install -g serve

# Copy built assets from builder
COPY --from=builder /app/apps/market-grammer/dist ./dist

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the app - serve the dist folder on port 8080
# The base path /market-grammer is already baked into the build via vite.config.ts
CMD ["serve", "-s", "dist", "-l", "8080"]
