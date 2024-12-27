#!/usr/bin/env bash

show_usage() {
  echo "Usage: $0 <mainnet|testnet|local|URL>" 1>&2
}

case "$1" in
mainnet)
  node_url="https://api.torus.network"
  ;;
testnet)
  node_url="https://api-0.nodes.testnet.torus.network"
  ;;
local)
  node_url="http://localhost:9951"
  ;;
"")
  show_usage
  exit 1
  ;;
*)
  node_url="$1"
  ;;
esac
shift 1

echo 1>&2
echo "Getting metadata from $node_url" 1>&2
echo 1>&2

curl -H "Content-Type: application/json" \
  -d '{"id":"1", "jsonrpc":"2.0", "method": "state_getMetadata", "params":[]}' \
  "$node_url"
