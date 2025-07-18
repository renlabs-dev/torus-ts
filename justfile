default: install check-all

# == Chain metadata ==

# Dump metadata from chain named 'name'
metadata-dump name:
  mkdir -p ./data/metadata
  scripts/get-metadata.sh {{ name }} > ./data/metadata/{{ name }}.json

# Generate Polkadot.js types from metadata file '<name>.json'
gen-types-from name:
  (cd packages/torus-sdk-ts && just gen-types {{ name }})

# Dump metadata from chain named 'name' and generate types
gen-types name:
  just metadata-dump {{ name }}
  (cd packages/torus-sdk-ts && just gen-types {{ name }})

# == Dev ==

# Install dependencies
install:
  pnpm install

# List all packages in the workspace
ls:
  pnpm exec turbo ls

# Run a development command for a package
dev name *args:
  pnpm exec ./scripts/dev-helper dev {{name}} {{args}}

# Run a development command for a package and watch for changes
dev-watch name *args:
  pnpm exec ./scripts/dev-helper dev --watch {{name}} {{args}}

build filter="*":
  pnpm exec ./scripts/dev-helper with-env turbo run build -F "{{filter}}"

# Typecheck code (with TypeScript)
typecheck filter="*":
  pnpm exec turbo run typecheck --continue -F "{{filter}}"

# Check code formatting (with Prettier)
format filter="*":
  pnpm exec turbo run format --continue -F "{{filter}}"

# Format code (with Prettier)
format-fix filter="*":
  pnpm exec turbo run format-fix --continue -F "{{filter}}"

# Lint code (with ESLint)
lint filter="*":
  pnpm exec turbo run lint --continue -F "{{filter}}"

# Fix linting issues (with ESLint)
lint-fix filter="*":
  pnpm exec turbo run lint-fix --continue -F "{{filter}}"

# Run all code fixes
fix: lint-fix format-fix

lint-ws:
  pnpm exec pnpm dlx sherif@latest -r unordered-dependencies

check-all filter="*":
  pnpm exec turbo run typecheck lint -F "{{filter}}"

check filter="*":
  pnpm exec turbo run typecheck lint -F "{{filter}}"

test filter="*":
  pnpm exec turbo run test --continue -F "{{filter}}"

create-package:
  pnpm turbo gen init

# == Publishing ==

publish:
  pnpm run -F "@torus-network/sdk" -F "@torus-network/torus-utils" build
  # how to bump / manage versions?
  pnpm publish -F "@torus-network/sdk" -F "@torus-network/torus-utils" --no-git-checks

changeset-add:
  pnpm changeset add

changeset-version:
  pnpm changeset version


# == Database Management with Atlas ==

local-db-url := "postgres://postgres:postgres@localhost:5432/torus-ts-db?sslmode=disable"

# Install Atlas CLI
atlas-install:
  curl -sSf https://atlasgo.sh | sh

# Spawn a local development database
db-dev-up:
    @echo "Starting local development database..."
    @docker --version > /dev/null || (echo "Docker is required but not installed" && exit 1)
    docker compose up -d postgres
    @echo "Waiting for database to be ready..."
    while ! pg_isready -d "{{local-db-url}}"; do sleep 1; done
    @echo "Database is ready!"

# Spin down the local development database
db-dev-down:
    docker compose down postgres

# Purge the local development database (removes all data)
# This completely removes the database volume, so all data will be lost.
db-dev-purge:
    docker compose down -v postgres

# Generate a new migration based on schema changes
# Usage: just db-generate [name]
db-generate *args:
    @atlas version > /dev/null || (echo "Atlas is required but not installed" && exit 1)
    atlas migrate diff {{args}} --env local

# Apply all pending migrations (on local dev DB)
db-apply:
    @atlas version > /dev/null || (echo "Atlas is required but not installed" && exit 1)
    atlas migrate apply --env local \
        --url "{{local-db-url}}"

# Lint all migration files
db-lint:
    @atlas version > /dev/null || (echo "Atlas is required but not installed" && exit 1)
    git fetch origin main
    atlas migrate lint --env local --git-base origin/main


# Reset the local development database and apply all migrations
# This will remove all data and reapply migrations from scratch.
db-reset: db-dev-purge db-dev-up db-apply

# Reset migrations not in base branch (useful for clean regeneration)
db-migrations-reset base="dev":
    git fetch origin
    git restore --source=origin/{{base}} -- atlas/migrations/
    git restore --source=origin/{{base}} -- atlas/migrations/atlas.sum

# NOTE: The following commands are disabled due to issues with Atlas schema cleaning
# See: https://t.torus.network/PoEmc
# # Clean current dev DB schema
# db-wipe:
#     @atlas version > /dev/null || (echo "Atlas is required but not installed" && exit 1)
#     atlas schema clean \
#         --url "{{local-db-url}}"

# # Full reset: clean DB and reapply all migrations
# db-reset: db-wipe db-apply


# -- DB --

db-dump:
  cd packages/db; pnpm exec drizzle-kit export --dialect postgresql --schema src/schema.ts > drizzle/dump.sql

db-studio:
  pnpm exec scripts/dev-helper with-env turbo -F @torus-ts/db dev

# -- Cleaning --

clean:
  rm -rf node_modules

clean-workspaces:
  pnpm exec turbo run clean

clean-all:
  find . -type d \( \
      -name 'node_modules' -o \
      -name '.next' -o \
      -name '.turbo' -o \
      -name 'dist' -o \
      -name '.cache' \
    \) -prune -exec rm -rf '{}' +

clean-output:
  find . -type d \( \
      -name '.cache' -o \
      -name '.next' -o \
      -name 'dist' -o \
      -name '.turbo' \
    \) -prune -exec rm -rf '{}' +


# == Github Actions ==

run-workflows:
  act --secret-file .env \
    -P 'ubuntu-24.04-8core-bakunin=ghcr.io/catthehacker/act-ubuntu:24.04' \
    -P 'ubuntu-24.04-16core-friedrich=ghcr.io/catthehacker/act-ubuntu:24.04' \
    -P 'ubuntu-22.04-32core-karl=ghcr.io/catthehacker/ubuntu:act-22.04'



# -- @EdSDR Things --

i:
  pnpm install

b:
  pnpm exec ./scripts/dev-helper with-env turbo run build --ui=tui

c:
  pnpm exec turbo run format lint typecheck
