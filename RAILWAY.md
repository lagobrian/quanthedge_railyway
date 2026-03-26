# Railway Deployment

This repo is set up for Railway as two app services plus databases:

1. `web` service
Path: repo root
Dockerfile: `Dockerfile.web`

2. `api` service
Path: `backend`
Dockerfile: `backend/Dockerfile`

3. `PostgreSQL`
Use Railway's managed Postgres and copy its `DATABASE_URL` into:
- the `api` service
- the `web` service

4. Optional `Redis`
If used, set `REDIS_URL` on the `api` service.

## Recommended env vars

### Web service
- `NEXT_PUBLIC_API_URL=https://<your-api-domain>`
- `DATABASE_URL=<shared postgres connection string>`
- `NODE_ENV=production`

### API service
- `SECRET_KEY=<strong-random-string>`
- `DEBUG=False`
- `DATABASE_URL=<shared postgres connection string>`
- `ALLOWED_HOSTS=<your-api-domain>,<your-web-domain>,localhost,127.0.0.1`
- `CORS_ALLOWED_ORIGINS=https://<your-web-domain>`
- `SITE_URL=https://<your-web-domain>`
- `STRIPE_PUBLISHABLE_KEY=...`
- `STRIPE_SECRET_KEY=...`
- `STRIPE_WEBHOOK_SECRET=...`
- `SES_SMTP_USER=...`
- `SES_SMTP_PASSWORD=...`
- `DEFAULT_FROM_EMAIL=...`
- `REDIS_URL=...` (optional)

## Deploy flow

The API container runs:
- migrations
- `seed_data`
- `seed_quant_models`
- Gunicorn

The web container builds the standalone Next.js app and runs `server.js`.
