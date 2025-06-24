#!/bin/sh

# Check if there are any changeset files in .changeset directory
# Excludes README.md and config.json files

set -e

CHANGESET_DIR=".changeset"

# Check if .changeset directory exists
if [ ! -d "$CHANGESET_DIR" ]; then
    echo "Error: .changeset directory not found"
    exit 1
fi

# Find .md files in .changeset, excluding README.md and config.json
changeset_files=$(find "$CHANGESET_DIR" -name '*.md' -not -name 'README.md' -not -name 'config.json' 2>/dev/null || true)

if [ -z "$changeset_files" ]; then
    echo "Error: No changeset files found in $CHANGESET_DIR directory."
    echo "Please add a changeset first with 'just changeset-add'"
    exit 1
fi

echo "Found changeset files:"
echo "$changeset_files"
echo "Ready to publish!"
