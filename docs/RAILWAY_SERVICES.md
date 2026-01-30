# Railway Services - Growchief Deployment

## Required Services

| Service | Purpose | Used By |
|---------|---------|---------|
| **growchief** | Main app (frontend + backend + orchestrator worker) | Primary deployment |
| **Temporal** | Workflow engine (campaigns, enrichment, etc.) | growchief |
| **Postgres** | Database for growchief (User, Org, workflows metadata) | growchief |
| **Temporal Basic Auth** | Protects Temporal UI | Temporal UI |
| **Temporal UI** | Web UI for viewing workflows | Optional, for debugging |
| **Postgres** (Temporal's) | Database for Temporal workflow state | Temporal |

## Temporal Starter Template Services

When you deploy [Temporal Starter](https://railway.com/deploy/temporal-starter), it adds:
- **Temporal** - Server
- **Postgres** - For Temporal (workflow state)
- **Temporal UI** - Management interface
- **Temporal Basic Auth** - Auth for UI
- **Client** - Demo app (can remove)
- **Worker** - Demo worker (can remove)

## Services You Can Remove

If you used the Temporal Starter template, these demo services are **not** needed for growchief:

- **Client** - Demo client application
- **Worker** - Demo Temporal worker (growchief has its own worker in the orchestrator)

## How to Remove Unused Services

1. Go to [Railway Dashboard](https://railway.com/dashboard)
2. Open the **growchief** project
3. Click on each service (Client, Worker) you want to remove
4. Open **Settings** (gear icon)
5. Scroll down and click **Remove Service** or **Delete**

## Growchief Database

growchief needs its **own** Postgres for app data (users, organizations, workflows metadata). Options:

1. **Railway Postgres plugin** - Add via "New" → "Database" → "PostgreSQL"
2. **Share Temporal's Postgres** - Use a different database name (e.g. `growchief`) in the same Postgres instance. Update DATABASE_URL to include the database name.

## Environment Variables (growchief service)

| Variable | Required | Notes |
|----------|----------|-------|
| DATABASE_URL | ✓ | Postgres connection for app data |
| AUTH_SECRET | ✓ | JWT signing |
| FRONTEND_URL | ✓ | Your app URL (for CORS, auth links) |
| TEMPORAL_ADDRESS | ✓ | `temporal.railway.internal:7233` |
| STORAGE_PROVIDER | | `local` (default), or `cloudflare` for persistent uploads |
| PORT | | Set by Railway automatically |
