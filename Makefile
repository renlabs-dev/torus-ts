.PHONY: check fix build

check:
	pnpm run typecheck
	pnpm run lint
	pnpm run format

fix:
	pnpm run lint:fix
	pnpm run format:fix

build:
	pnpm run build
