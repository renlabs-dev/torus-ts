ARG APP_NAME

# ======== base layer ======== #
FROM node:20-slim AS base

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN pnpm --version

# Install turbo
RUN npm install -g "turbo@^2.1.1"

# ======== pruner layer ======== #
FROM base AS pruner
ARG APP_NAME

COPY . /build
WORKDIR /build

# Prune input packages to only what is needed for the app.  
# Docs: https://turbo.build/repo/docs/guides/tools/docker
RUN turbo prune ${APP_NAME} --docker


# ======== builder layer ======== #
FROM base AS builder
ARG APP_NAME

# TODO: fix hardcoded vars on Dockerfile
ENV NEXT_PUBLIC_WS_PROVIDER_URL="wss://api.communeai.net"
ENV NEXT_PUBLIC_CACHE_PROVIDER_URL="https://cache.torus.network"

WORKDIR /app

COPY --from=pruner /build/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies using only package.json files to reduce changes
COPY --from=pruner /build/out/json/ .
RUN pnpm install --frozen-lockfile

# Build the app
COPY --from=pruner /build/out/full/ .
# TODO: fix hardcoded vars on Dockerfile
RUN POSTGRES_URL="postgres://postgres:password@localhost:5432/database" \
    PINATA_JWT="junk" \
    JWT_SECRET="12345678" \
    pnpm turbo run build --filter=${APP_NAME}


# ======== runner layer ======== #
FROM base AS runner

LABEL org.opencontainers.image.source https://github.com/renlabs-dev/torus-ts

ARG APP_NAME

ENV PORT=8000

ENV NEXT_PUBLIC_PORT=8000

WORKDIR /app

COPY --from=builder /app/ .

WORKDIR /app/apps/${APP_NAME}

EXPOSE 8000

CMD [ "pnpm", "run", "start" ]
