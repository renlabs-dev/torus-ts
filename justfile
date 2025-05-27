default: install check-all

# == Chain metadata ==

dump-metadata name:
	mkdir -p ./data/metadata
	scripts/get-metadata.sh {{ name }} > ./data/metadata/{{ name }}.json

gen-types name: (dump-metadata name)
	(cd packages/torus-sdk-ts && just gen-types {{ name }})

# == Dev ==

install:
  pnpm install

fix: lint-fix format-fix

ls:
  pnpm exec turbo ls

build:
  pnpm exec ./scripts/dev-helper with-env turbo run build

dev name *args:
  pnpm exec ./scripts/dev-helper dev {{name}} {{args}}

dev-watch name *args:
  pnpm exec ./scripts/dev-helper dev --watch {{name}} {{args}}

typecheck:
  pnpm exec turbo run typecheck

format:
  pnpm exec turbo run format --continue

format-fix filter="*":
  pnpm exec turbo run format-fix --continue -F "{{filter}}"

lint:
  pnpm exec turbo run lint --continue

lint-fix:
  pnpm exec turbo run lint-fix --continue

lint-ws:
  pnpm exec pnpm dlx sherif@latest -r unordered-dependencies

check-all:
  pnpm exec turbo run typecheck lint

check name:
  pnpm exec turbo run typecheck lint -F {{name}}

test filter="*":
  pnpm exec turbo run test -F "{{filter}}"

create-package:
  pnpm turbo gen init

# -- DB --

db-push:
  pnpm exec scripts/dev-helper with-env turbo -F @torus-ts/db push

db-dump:
  cd packages/db; pnpm exec drizzle-kit export > drizzle/dump.sql

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
