# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv

# Optimized Dockerfile for torus-bridge using Next.js standalone output
# This reduces the final image from ~600MB to ~100MB

# ======== base layer ======== #
FROM node:20-slim AS base

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN corepack prepare pnpm@9.7.1 --activate
RUN pnpm --version

# ======== pruner layer ======== #
FROM base AS pruner

COPY . /build
WORKDIR /build

# Install turbo
RUN pnpm install -g "turbo@^2.1.1"

# Prune input packages to only what is needed for the app.
# Docs: https://turbo.build/repo/docs/guides/tools/docker
RUN turbo prune torus-bridge --docker

# ======== builder layer ======== #
FROM base AS builder

ARG TURBO_API
ENV TURBO_API=$TURBO_API

ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM

ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN

WORKDIR /app

COPY --from=pruner /build/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies using only package.json files to reduce changes
COPY --from=pruner /build/out/json/ .
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build the app with increased memory limit for large builds
COPY --from=pruner /build/out/full/ .
ENV NODE_OPTIONS="--max-old-space-size=8192"
RUN CI=1 pnpm turbo run build --filter=torus-bridge

# ======== runner layer ======== #
FROM node:20-slim AS runner

LABEL org.opencontainers.image.source=https://github.com/renlabs-dev/torus-ts

ENV NODE_ENV=production
ENV PORT=8000
ENV HOSTNAME="0.0.0.0"

WORKDIR /app

# Copy only the standalone output (much smaller than full node_modules)
COPY --from=builder /app/apps/torus-bridge/.next/standalone ./
COPY --from=builder /app/apps/torus-bridge/.next/static ./apps/torus-bridge/.next/static
COPY --from=builder /app/apps/torus-bridge/public ./apps/torus-bridge/public

EXPOSE 8000

# Use the standalone server
CMD ["node", "apps/torus-bridge/server.js"]
