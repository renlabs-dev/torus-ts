#!/bin/bash
set -euo pipefail

# Test Docker builds for all apps locally
APPS=(
  "torus-wallet"
  "torus-cache"
  "torus-worker"
  "torus-allocator"
  "torus-page"
)

echo "🧪 Testing Docker builds for all apps..."
echo

for app in "${APPS[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🏗️  Building: $app"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if docker build -f docker/Dockerfile \
    --build-arg APP_NAME="$app" \
    -t "test-$app:latest" \
    .; then
    echo "✅ Build successful: $app"

    # Get image size
    SIZE=$(docker images "test-$app:latest" --format "{{.Size}}")
    echo "📦 Image size: $SIZE"
  else
    echo "❌ Build failed: $app"
    exit 1
  fi
  echo
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All builds successful!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
