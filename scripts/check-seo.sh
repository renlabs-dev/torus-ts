#!/bin/bash

set -e

# Get script and repo root directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Find all Next.js apps (torus-*) that have a next.config file (any supported extension)
APPS=$(find "$REPO_ROOT/apps" -maxdepth 1 -type d -name "torus-*" | while read -r app_dir; do
  if find "$app_dir" -maxdepth 1 -type f \( -name "next.config.js" -o -name "next.config.ts" -o -name "next.config.mjs" -o -name "next.config.cjs" \) | grep -q .; then
    echo "$app_dir"
  fi
done | sort)

errors=0
error_list=()

echo "Scanning Next.js apps for SEO compliance..."

for app_dir in $APPS; do
  app_name=$(basename "$app_dir")
  echo "Checking $app_name..."

  # Skip if src/app directory does not exist
  if [ ! -d "$app_dir/src/app" ]; then
    echo "  Warning: $app_name does not have src/app directory, skipping..."
    continue
  fi

  # Find all page.tsx and layout.tsx files in the app
  pages=$(find "$app_dir/src/app" -type f -name "page.tsx" 2>/dev/null || true)
  layouts=$(find "$app_dir/src/app" -type f -name "layout.tsx" 2>/dev/null || true)

  # Check each page.tsx for SEO metadata or generateMetadata
  for page in $pages; do
    # Skip client components
    if grep -q '"use client"' "$page"; then
      echo "  $page: Skipped ('use client' detected)"
      continue
    fi

    # Check for static metadata export or generateMetadata function
    has_metadata=$(grep -E 'export\s+(const|let|var)\s+metadata\s*=' "$page" || true)
    has_generate_metadata=$(grep -E 'export\s+(async\s+)?function\s+generateMetadata' "$page" || true)

    page_dir=$(dirname "$page")
    # Check if layout.tsx exists in the same directory as the page
    layout_exists=$(find "$page_dir" -maxdepth 1 -type f -name "layout.tsx" | wc -l)

    if [ -n "$has_metadata" ] || [ -n "$has_generate_metadata" ]; then
      echo "  ✅ $page: OK (metadata or generateMetadata found)"
    elif [ "$layout_exists" -gt 0 ]; then
      echo "  ✅ $page: OK (layout.tsx found in $page_dir)"
    else
      # Add error if neither metadata nor generateMetadata nor layout.tsx is present
      error_list+=("Error: $page must export either a static 'metadata' object or a 'generateMetadata' function, unless 'use client' is specified or a layout.tsx exists in the same directory.")
      errors=1
    fi
  done

  # Check each layout.tsx for SEO metadata or generateMetadata
  for layout in $layouts; do
    has_metadata=$(grep -E 'export\s+(const|let|var)\s+metadata\s*=' "$layout" || true)
    has_generate_metadata=$(grep -E 'export\s+(async\s+)?function\s+generateMetadata' "$layout" || true)

    if [ -n "$has_metadata" ] || [ -n "$has_generate_metadata" ]; then
      echo "  ✅ $layout: OK (metadata or generateMetadata found)"
    else
      # Add error if neither metadata nor generateMetadata is present
      error_list+=("Error: $layout must export either a static 'metadata' object or a 'generateMetadata' function.")
      errors=1
    fi
  done

  # Warn if no page.tsx or layout.tsx files found in the app
  if [ -z "$pages" ] && [ -z "$layouts" ]; then
    echo "  No page.tsx or layout.tsx files found."
  fi
done

# Print all errors, if any
if [ ${#error_list[@]} -gt 0 ]; then
  echo -e "\nSEO Compliance Errors Found:"
  for error in "${error_list[@]}"; do
    echo "  $error"
  done
fi

# Exit with error if any SEO compliance errors were found
if [ "$errors" -eq 1 ]; then
  exit 1
fi

echo -e "\nAll SEO rules satisfied."
exit 0