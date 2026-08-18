#!/usr/bin/env bash
# Compiles components/fall-risk-entry.jsx into the fall-risk.js bundle the site loads.
# React and ReactDOM stay external — they arrive from the CDN as UMD globals and are
# aliased in through components/react-shim.js, which is why the classic JSX transform
# is used rather than the automatic runtime. Rerun after editing anything under
# components/, and commit the rebuilt fall-risk.js alongside the source.
#
#   ./scripts/build-fall-risk.sh
set -euo pipefail
cd "$(dirname "$0")/.."

npx --yes esbuild@0.23.1 components/fall-risk-entry.jsx \
  --bundle \
  --minify \
  --format=iife \
  --target=es2019 \
  --jsx=transform \
  --jsx-factory=React.createElement \
  --jsx-fragment=React.Fragment \
  --alias:react=./components/react-shim.js \
  --alias:react-dom/client=./components/react-dom-shim.js \
  --outfile=fall-risk.js

echo "Built fall-risk.js ($(wc -c < fall-risk.js | tr -d ' ') bytes)"
