# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv

ARG APP_NAME

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
ARG APP_NAME

COPY . /build
WORKDIR /build

# Install turbo
RUN pnpm install -g "turbo@^2.1.1"

# Prune input packages to only what is needed for the app.
# Docs: https://turbo.build/repo/docs/guides/tools/docker
RUN turbo prune ${APP_NAME} --docker

# ======== builder layer ======== #
FROM base AS builder
ARG APP_NAME

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
RUN pnpm install --frozen-lockfile

# Build the app
COPY --from=pruner /build/out/full/ .
RUN CI=1 pnpm turbo run build --filter=${APP_NAME} --turbopack

# ======== runner layer ======== #
FROM base AS runner
ARG APP_NAME

LABEL org.opencontainers.image.source=https://github.com/renlabs-dev/torus-ts

ENV PORT=8000

WORKDIR /app

COPY --from=builder /app/ .

WORKDIR /app/apps/${APP_NAME}

EXPOSE 8000

CMD [ "pnpm", "run", "start" ]
