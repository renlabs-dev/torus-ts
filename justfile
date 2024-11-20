default: check

# == Chain metadata ==

download-metadata name:
	scripts/get_metadata.sh {{ name }} >> ./data/metadata/{{ name }}.json

copy-specs:
	cp ../subspace/specs/* ./data/chain-specs/

# == Dev ==

install:
  pnpm install

check: install typecheck lint format

fix: lint-fix format-fix

build:
  pnpm exec ./scripts/dev-helper with-env turbo run build

dev name:
  pnpm exec ./scripts/dev-helper dev {{name}}

dev-watch name:
  pnpm exec ./scripts/dev-helper dev {{name}}

typecheck:
  pnpm exec turbo run typecheck

format:
  pnpm exec turbo run format --continue -- --cache --cache-location .cache/.prettiercache

format-fix:
  pnpm exec turbo run format --continue -- --write --cache --cache-location .cache/.prettiercache

lint:
  pnpm exec turbo run lint --continue -- --cache --cache-location .cache/.eslintcache

lint-fix:
  pnpm exec turbo run lint --continue -- --fix --cache --cache-location .cache/.eslintcache

lint-ws:
  pnpm exec pnpm dlx sherif@latest

# -- DB --

db-push:
  pnpm exec turbo -F @torus-ts/db push

db-studio:
  pnpm exec turbo -F @torus-ts/db dev

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
