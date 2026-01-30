#!/usr/bin/env bash
# Pull schema and/or data from Neon using pg_dump
#
# Usage:
#   ./scripts/neon-dump.sh           # Schema only (default)
#   ./scripts/neon-dump.sh --data    # Schema + data
#   ./scripts/neon-dump.sh -o backup.sql  # Save to file
#
# Requires: DIRECT_URL or DATABASE_URL in .env
# For Neon, use DIRECT_URL (non-pooled) for pg_dump.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Load .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Use DIRECT_URL for pg_dump (direct connection recommended for Neon)
URL="${DIRECT_URL:-$DATABASE_URL}"
if [ -z "$URL" ]; then
  echo "Error: Set DIRECT_URL or DATABASE_URL in .env"
  echo "Get both from console.neon.tech -> Connect"
  exit 1
fi

# Parse args
DUMP_OPTS="--schema-only --no-owner --no-privileges"
OUTPUT_FILE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --data)
      DUMP_OPTS="--no-owner --no-privileges"
      shift
      ;;
    -o|--output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--data] [-o output.sql]"
      exit 1
      ;;
  esac
done

echo "Dumping from Neon (Postgres 17)..."
if [ -n "$OUTPUT_FILE" ]; then
  docker run --rm -i postgres:17-alpine pg_dump "$URL" $DUMP_OPTS > "$OUTPUT_FILE"
  echo "Saved to $OUTPUT_FILE"
else
  docker run --rm postgres:17-alpine pg_dump "$URL" $DUMP_OPTS
fi
