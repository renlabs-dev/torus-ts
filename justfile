default: check

# == Chain metadata ==

dump-metadata name:
	mkdir -p ./data/metadata
	scripts/get_metadata.sh {{ name }} > ./data/metadata/{{ name }}.json

gen-types name:
	(cd packages/subspace && just gen-types {{ name }})

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
  pnpm exec pnpm dlx sherif@latest -r unordered-dependencies

create-package:
  pnpm turbo gen init

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

# -- @EdSDR Things --

i:
  pnpm install

b:
  pnpm exec ./scripts/dev-helper with-env turbo run build --ui=tui

c: 
  pnpm exec turbo run format lint typecheck
