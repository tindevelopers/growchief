#!/bin/bash
set -e

# Railway/Cloud Run set PORT. Default 5000 for local Docker.
NGINX_PORT="${PORT:-5000}"

# Generate nginx config from template
sed "s/\${NGINX_PORT}/$NGINX_PORT/g" /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start nginx (daemon) then pm2 (runs prisma db push, backend, orchestrator)
nginx && pnpm run pm2
