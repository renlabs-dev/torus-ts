all: check

.PHONY: all check generate-types

check:
	pnpm run typecheck
	pnpm run lint

generate-types:
	pnpm run generate-types-from-defs
	pnpm run generate-types-from-chain
