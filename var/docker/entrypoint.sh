#!/bin/bash
set -e

# Cloud Run sets PORT (default 8080). Docker/local uses 5000.
NGINX_PORT="${PORT:-5000}"

# Generate nginx config from template
sed "s/\${NGINX_PORT}/$NGINX_PORT/g" /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start nginx and pm2
nginx && pnpm run pm2
