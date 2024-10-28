#!/bin/sh
set -e

# show_usage() {
#     echo "Usage: generate-authority-keys.sh"
# }

err_exit() {
    echo "$@" 1>&2
    exit 1
}

base_path="$SUBSPACE_BASE_PATH"
if [ -z "$base_path" ]; then err_exit "Missing $SUBSPACE_BASE_PATH"; fi

chain_spec="$SUBSPACE_CHAIN_SPEC"
if [ -z "$chain_spec" ]; then err_exit "Missing $SUBSPACE_CHAIN_SPEC"; fi

account="$SUBSPACE_ACCOUNT"
if [ -z "$account" ]; then err_exit "Missing $SUBSPACE_ACCOUNT"; fi

if [ "$account" = "alice" ]; then
    suri="//Alice"
elif [ "$account" = "bob" ]; then
    suri="//Bob"
else
    suri="$account"
fi

node-subspace key insert \
    --base-path "$base_path" \
    --chain "$chain_spec" \
    --suri "$suri" \
    --scheme "sr25519" \
    --key-type "aura"

node-subspace key insert \
    --base-path "$base_path" \
    --chain "$chain_spec" \
    --suri "$suri" \
    --scheme "ed25519" \
    --key-type "gran"
