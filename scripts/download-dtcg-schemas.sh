#!/usr/bin/env bash
set -euo pipefail

# Download DTCG 2025.10 JSON Schemas for validation tests
# Source: https://www.designtokens.org/schemas/2025.10/
#
# These schemas are vendored in the repo so tests work without network access.
# To refresh them, delete src/fixtures/.dtcg-schemas/format.json and re-run this script.

DIR="src/fixtures/.dtcg-schemas"
BASE_URL="https://www.designtokens.org/schemas/2025.10"

# Skip if already downloaded
if [[ -f "$DIR/format.json" ]]; then
  echo "DTCG schemas already present, skipping download."
  exit 0
fi

mkdir -p "$DIR/format/values"

FILES=(
  "format.json"
  "format/group.json"
  "format/groupOrToken.json"
  "format/token.json"
  "format/tokenType.json"
  "format/values/border.json"
  "format/values/color.json"
  "format/values/cubicBezier.json"
  "format/values/dimension.json"
  "format/values/duration.json"
  "format/values/fontFamily.json"
  "format/values/fontWeight.json"
  "format/values/gradient.json"
  "format/values/number.json"
  "format/values/shadow.json"
  "format/values/strokeStyle.json"
  "format/values/transition.json"
  "format/values/typography.json"
)

echo "Downloading DTCG schemas..."
for file in "${FILES[@]}"; do
  curl -sS -o "$DIR/$file" "$BASE_URL/$file"
done

echo "Downloaded ${#FILES[@]} DTCG schema files to $DIR/"
