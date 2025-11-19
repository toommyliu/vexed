#!/bin/bash

if [ ! -f "package.json" ]; then
  echo "Please execute this script from the root directory"
  echo "Currently in: $(pwd)"
  exit 1
fi

find . -name "node_modules" -type d -prune -exec printf 'Deleting: %s\n' '{}' \; -exec rm -rf '{}' +
find . -name "pnpm-lock.yaml" -type f -exec printf 'Deleting: %s\n' '{}' \; -exec rm -f '{}' \;
find . -name "dist" -type d -prune -exec printf 'Deleting: %s\n' '{}' \; -exec rm -rf '{}' +
find . -name "build" -type d -prune -exec printf 'Deleting: %s\n' '{}' \; -exec rm -rf '{}' +

# svelte stuff
find . -name ".svelte-kit" -type d -prune -exec printf 'Deleting: %s\n' '{}' \; -exec rm -rf '{}' +

# packages/electron specifics
find . -name "path.txt" -type f -exec printf 'Deleting: %s\n' '{}' \; -exec rm -f '{}' \;

read -p "Reinstall dependencies? [y/N] " -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
  pnpm install
fi