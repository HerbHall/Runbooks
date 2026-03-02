#!/usr/bin/env bash
# Static validation for Docker Desktop extension packaging.
# Catches missing Dockerfile labels and metadata.json fields
# before they reach Docker Hub and fail marketplace submission.
#
# Usage: bash scripts/validate-extension.sh [Dockerfile] [metadata.json]

set -euo pipefail

DOCKERFILE="${1:-Dockerfile}"
METADATA="${2:-metadata.json}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Find python
PYTHON=""
for p in python3 python; do
    if command -v "$p" &>/dev/null && "$p" --version &>/dev/null 2>&1; then
        PYTHON="$p"
        break
    fi
done

if [ -z "$PYTHON" ]; then
    echo "ERROR: python3 or python required for validation"
    exit 2
fi

exec "$PYTHON" "$SCRIPT_DIR/validate_extension.py" "$DOCKERFILE" "$METADATA"
