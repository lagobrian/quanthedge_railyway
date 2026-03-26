# Quant (h)Edge

Quant (h)Edge is a full-stack financial research platform built with Next.js, Django, Django REST Framework, and PostgreSQL.

## Stack

- Frontend: Next.js 15, React 18, TypeScript, Tailwind CSS
- Backend: Django 4.2, DRF, Gunicorn
- Data: PostgreSQL, optional Redis
- Deployment target: Railway

## Local Development

### Frontend

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py seed_quant_models
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`.

## Environment

Copy `.env.example` and set the values you need.

Important variables:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quanthedge
SECRET_KEY=change-me
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SITE_URL=http://localhost:3000
```

## Railway Deployment

This repo is structured for two Railway app services:

1. `web`
Use [`Dockerfile.web`](./Dockerfile.web)

2. `api`
Use [`backend/Dockerfile`](./backend/Dockerfile)

Deployment notes are in [`RAILWAY.md`](./RAILWAY.md).
