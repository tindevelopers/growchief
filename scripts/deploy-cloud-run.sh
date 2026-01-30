#!/usr/bin/env bash
# Deploy growchief to Google Cloud Run
#
# Usage:
#   ./scripts/deploy-cloud-run.sh              # Deploy with env from .env
#   ./scripts/deploy-cloud-run.sh --build      # Build, push, then deploy
#
# Requires: gcloud CLI authenticated, .env with production values
# Set FRONTEND_URL and VITE_BACKEND_URL to your Cloud Run URL before deploy.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-growchief}"
IMAGE="us-central1-docker.pkg.dev/postiz-master-social-v1/growchief/growchief:latest"

# Load .env
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Build and push if requested
if [ "$1" = "--build" ]; then
  echo "Building and pushing image..."
  gcloud builds submit --tag "$IMAGE" .
fi

# FRONTEND_URL = Cloud Run URL (for CORS). On first deploy, use placeholder then update.
CLOUD_RUN_URL="${FRONTEND_URL:-https://growchief.run.app}"
[ "$CLOUD_RUN_URL" = "https://growchief.run.app" ] && echo "Note: Using placeholder FRONTEND_URL. Update after first deploy with actual URL."

# Build env vars for Cloud Run (required for app to start)
ENV_VARS=(
  "NODE_ENV=production"
  "PORT=8080"
  "DATABASE_URL=${DATABASE_URL:?DATABASE_URL is required}"
  "DIRECT_URL=${DIRECT_URL:-$DATABASE_URL}"
  "AUTH_SECRET=${AUTH_SECRET:?AUTH_SECRET is required}"
  "STORAGE_PROVIDER=${STORAGE_PROVIDER:-local}"
  "FRONTEND_URL=$CLOUD_RUN_URL"
)

# Optional env vars
[ -n "$TEMPORAL_ADDRESS" ] && ENV_VARS+=("TEMPORAL_ADDRESS=$TEMPORAL_ADDRESS")
[ -n "$GOOGLE_CLIENT_ID" ] && ENV_VARS+=("GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID")
[ -n "$GOOGLE_CLIENT_SECRET" ] && ENV_VARS+=("GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET")
[ -n "$VITE_BACKEND_URL" ] && ENV_VARS+=("VITE_BACKEND_URL=$VITE_BACKEND_URL")
[ -n "$VITE_PUBLIC_WS" ] && ENV_VARS+=("VITE_PUBLIC_WS=$VITE_PUBLIC_WS")

ENV_FLAGS=""
for var in "${ENV_VARS[@]}"; do
  ENV_FLAGS="$ENV_FLAGS --set-env-vars=$var"
done

echo "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 10 \
  $ENV_FLAGS

echo ""
echo "Deployment complete. Get URL with:"
echo "  gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'"
