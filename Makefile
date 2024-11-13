.PHONY: check fix build copy-specs

check:
	pnpm install
	pnpm run typecheck
	pnpm run lint
	@# pnpm run format

fix:
	pnpm run lint:fix
	pnpm run format:fix

build:
	pnpm run build

copy-specs:
	cp ../subspace/specs/* ./data/chain-specs/

data/metadata/%.json: FORCE
	scripts/get_metadata.sh $* > $@

FORCE:
