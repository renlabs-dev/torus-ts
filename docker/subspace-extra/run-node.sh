#!/bin/bash
set -e

check_var () {
  value="${!1}"
  if [ -z "$value" ]; then echo "Missing \$$1" 1>&2; exit 1; fi
}

check_var "SUBSPACE_BASE_PATH"
check_var "SUBSPACE_CHAIN_SPEC"
check_var "PORT"
check_var "RPC_PORT"

if [ "$SUBSPACE_ACCOUNT" = "alice" ]; then
  echo "Running Alice"
  node_name="Alice"
  node_key="2756181a3b9bca683a35b51a0a5d75ee536738680bcb9066c68be1db305a1ac5"
elif [ "$SUBSPACE_ACCOUNT" = "bob" ]; then
  echo "Running Bob"
  node_name="Bob"
  node_key="e83fa0787cb280d95c666ead866a2a4bc1ee1e36faa1ed06623595eb3f474681"
fi

node-subspace \
  --base-path "$SUBSPACE_BASE_PATH" \
  --chain "$SUBSPACE_CHAIN_SPEC" \
  --unsafe-rpc-external \
  --rpc-cors all \
  --port "$PORT" \
  --rpc-port "$RPC_PORT" \
  --allow-private-ipv4 \
  --discover-local \
  --force-authoring \
  --validator \
  --name "$node_name" \
  --node-key "$node_key"
  # --sealing=localnet
  # --bootnodes /ip4/127.0.0.1/tcp/30342/p2p/12D3KooWQh3CeSp2rpUVvPb6jqvmHVCUieoZmKbkUhZ8rPR77vmA
