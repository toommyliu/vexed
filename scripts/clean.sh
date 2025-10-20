# !/bin/bash

find . -name "node_modules" -type d -prune -exec printf 'Deleting: %s\n' '{}' \; -exec rm -rf '{}' +
find . -name "pnpm-lock.yaml" -type f -exec printf 'Deleting: %s\n' '{}' \; -exec rm -f '{}' \;
find . -name "dist" -type d -prune -exec printf 'Deleting: %s\n' '{}' \; -exec rm -rf '{}' +
find . -name "build" -type d -prune -exec printf 'Deleting: %s\n' '{}' \; -exec rm -rf '{}' +