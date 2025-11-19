# !/bin/bash

if [ "$(pwd)" != "$(cd .. && pwd)" ]; then
  echo "Please execute this script from the root directory"
  echo "currently in: $(pwd)"
  exit 1
fi

find . -name "node_modules" -type d -prune -exec printf 'Deleting: %s\n' '{}' \; -exec rm -rf '{}' +
find . -name "pnpm-lock.yaml" -type f -exec printf 'Deleting: %s\n' '{}' \; -exec rm -f '{}' \;
find . -name "dist" -type d -prune -exec printf 'Deleting: %s\n' '{}' \; -exec rm -rf '{}' +
find . -name "build" -type d -prune -exec printf 'Deleting: %s\n' '{}' \; -exec rm -rf '{}' +

read -p "Reinstall dependencies? [y/N] " -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
  pnpm install
fi