#!/bin/sh

# THIS SCRIPT WILL ONLY WORK ON A DRONE CI PIPELINE

# Install yq to inspect yaml files
apk add yq

# Fetch env name according to branch
env_name=$( [ "$DRONE_BRANCH" = "main" ] && echo "prod" || echo "dev" )

# Set importante file locations
DOCKERFILE=docker/Dockerfile
HELMFILE=apps/$APP_NAME/helmfile.yaml

# Fetch the correct values from the app's helmfile.yaml
echo "Fetching from $HELMFILE"

export WSS_ENDPOINT=$(yq -r " .environments.[\"$env_name\"].values[].wssApiEndpoint | select(. != null)" $HELMFILE)
echo $WSS_ENDPOINT

export CACHE_URL=$(yq -r " .environments.[\"$env_name\"].values[].cacheUrl | select(. != null)" $HELMFILE)
echo $CACHE_URL

# Replacing new values into the Dockerfile
if [ -n "${WSS_ENDPOINT+x}" ]; then
    echo "Adding $WSS_ENDPOINT to $DOCKERFILE"
    sed -i "s|NEXT_PUBLIC_TORUS_RPC_URL=\".*\"|NEXT_PUBLIC_TORUS_RPC_URL=\"$WSS_ENDPOINT\"|g" $DOCKERFILE
    sed -i "s|TORUS_RPC_URL=\".*\"|TORUS_RPC_URL=\"$WSS_ENDPOINT\"|g" $DOCKERFILE
fi

if [ -n "${CACHE_URL+x}" ]; then
    echo "Adding $CACHE_URL to $DOCKERFILE"
    sed -i "s|NEXT_PUBLIC_TORUS_CACHE_URL=\".*\"|NEXT_PUBLIC_TORUS_CACHE_URL=\"$CACHE_URL\"|g" $DOCKERFILE
fi