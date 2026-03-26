# Quant (h)Edge — Master Technical Documentation

> Last updated: 24 March 2026
> Hand this document to any developer or AI to get them up to speed immediately.

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 15.2.0 |
| Frontend Framework | React | 18.2.0 |
| Styling | Tailwind CSS | 3.4.1 |
| State Management | Redux Toolkit | via @reduxjs/toolkit |
| Charts | Plotly.js (react-plotly.js) | Latest |
| Rich Text Editor | TipTap | Latest |
| Backend | Django | 4.2 |
| API | Django REST Framework | 3.14.0 |
| Auth | JWT (djangorestframework-simplejwt) | 5.5+ |
| Payments | Stripe | via stripe Python SDK |
| Email | Amazon SES (SMTP) | — |
| Database (local) | SQLite | — |
| Database (prod) | PostgreSQL (Railway) | — |
| Data Pipeline | R (crypto2), Python (fredapi, yfinance, alpaca-py) | — |
| Hosting | Railway (web + API + DB) | — |
| Source Control | GitHub (lagobrian/quanthedge) | — |

---

## 2. Repository Structure

```
quanthedge/
├── .github/workflows/
│   └── data-pipeline.yml          # Cron: fetches data every 6h
├── backend/
│   ├── api/                       # Django app: users, posts, comments, payments
│   │   ├── models.py              # User, Post, Category, Comment, Like, Bookmark, Notification, PostReaction, NewsletterSubscriber
│   │   ├── views.py               # Auth, posts CRUD, dashboard, newsletter, user mgmt
│   │   ├── serializers.py         # DRF serializers
│   │   ├── stripe_views.py        # Stripe checkout, portal, webhooks
│   │   ├── urls.py                # /api/* routes
│   │   ├── permissions.py         # IsAuthor, IsOwnerOrReadOnly
│   │   ├── constants/usernames.py # Funny financial usernames + DiceBear avatars
│   │   └── management/commands/
│   │       ├── seed_data.py       # Seed categories + admin user
│   │       └── import_substack.py # Not a command, but import logic
│   ├── models/                    # Django app: quantitative models, data, backtests
│   │   ├── models.py              # QuantModel, ModelDataPoint, ModelSignalResult, Backtest, EquityPoint, DrawdownPoint, BacktestTrade, CryptoBreadth, CryptoPrice, CryptoIndex, CryptoGlobalQuote, MacroDataPoint, StockPrice, ModelAlert, APIKey, DataFetchLog
│   │   ├── views.py               # Model registry API, backtest API, data pipeline triggers, chart thumbnails
│   │   ├── serializers.py         # Serializers for all model types
│   │   ├── urls.py                # /api/models/* routes
│   │   └── management/commands/
│   │       ├── fetch_fred.py      # FRED API (30+ macro series)
│   │       ├── fetch_worldbank.py # World Bank API (12 indicators)
│   │       ├── fetch_alpaca.py    # Alpaca/yfinance (50+ tickers)
│   │       ├── fetch_all_data.py  # Master command: runs all fetchers
│   │       └── update_crypto.py   # crypto2 R pipeline
│   ├── scripts/
│   │   ├── fetch_crypto_data.R    # R script using crypto2 package
│   │   ├── process_crypto_data.py # Compute breadth, index from raw data
│   │   ├── sync_to_production.py  # Push local DB to prod via API
│   │   └── import_historical.py   # Import parquet/xlsx historical data
│   ├── templates/                 # Email templates
│   ├── backend/
│   │   ├── settings.py            # Django config (reads from .env)
│   │   ├── urls.py                # Root URL config + health check
│   │   └── wsgi.py
│   ├── requirements.txt
│   ├── build.sh                   # API bootstrapping script
│   ├── Procfile                   # Gunicorn config
│   └── .env                       # Local env vars (NOT committed)
├── src/
│   ├── app/
│   │   ├── page.tsx               # Home page
│   │   ├── layout.tsx             # Root layout (Navbar, ThemeProvider, StoreProvider)
│   │   ├── globals.css            # CSS variables (light/dark), component styles
│   │   ├── blog/
│   │   │   ├── page.tsx           # Newsletter listing (categories, search, pagination, carousel)
│   │   │   └── [slug]/
│   │   │       ├── page.tsx       # Post detail (paywall, reactions, comments)
│   │   │       ├── PostActions.tsx # Like, bookmark, delete
│   │   │       └── BlogShareMenu.tsx
│   │   ├── models/
│   │   │   ├── page.tsx           # Models listing (cards, categories, premium gating)
│   │   │   ├── [slug]/page.tsx    # Dynamic model page (from QuantModel registry)
│   │   │   ├── crypto-breadth/    # Hardcoded Plotly chart page
│   │   │   ├── altcoin-index/     # Hardcoded Plotly chart page
│   │   │   └── global-metrics/    # Hardcoded Plotly chart page
│   │   ├── backtests/
│   │   │   ├── page.tsx           # Backtests listing
│   │   │   └── [slug]/page.tsx    # Backtest detail (equity, drawdown, heatmap, trades)
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # Author dashboard (posts, comments, analytics, users)
│   │   │   ├── models/page.tsx    # Models dashboard (models table + backtests tab)
│   │   │   └── new-post/
│   │   │       ├── page.tsx       # Post editor
│   │   │       └── TipTapEditor.tsx
│   │   ├── pricing/page.tsx       # Stripe checkout integration
│   │   ├── store/page.tsx         # Funded bots + merch (coming soon)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── unsubscribe/page.tsx
│   ├── components/
│   │   ├── Navbar.tsx             # Navigation with theme toggle, dashboard dropdown
│   │   ├── footer.tsx
│   │   ├── CommentSection.tsx     # Threaded comments with avatars
│   │   ├── PostReactions.tsx      # Discord-style emoji reactions
│   │   ├── PostCard.tsx
│   │   ├── NotificationDropdown.tsx
│   │   ├── ProfileCompletionBanner.tsx
│   │   └── ui/                    # Radix UI primitives (button, card, etc.)
│   ├── providers/
│   │   ├── ThemeProvider.tsx       # Light/dark mode (localStorage)
│   │   └── StoreProvider.tsx       # Redux store wrapper
│   ├── store/
│   │   ├── store.ts
│   │   ├── hooks.ts
│   │   └── slices/authSlice.ts    # Auth state (user, isAuthenticated)
│   ├── lib/
│   │   ├── api.ts                 # API_BASE constant
│   │   └── chartTheme.ts          # Plotly chart theme colors
│   └── types/
│       ├── blog.ts
│       └── plotly.d.ts
├── Dockerfile.web                 # Railway web service image
├── RAILWAY.md                     # Railway deployment notes
├── tailwind.config.js
├── next.config.js
├── package.json
└── quanthedge_dev_backlog.md      # Development backlog
```

---

## 3. Django Apps & Models

### `api` app (label: `api`)
| Model | Purpose | Key Fields |
|-------|---------|------------|
| User | Custom user (AbstractUser) | email, full_name, is_premium, is_author, is_analyst, premium_until |
| Category | Newsletter/post categories | title, slug |
| Post | Blog posts/newsletters | title, slug, description, status, is_premium, reading_time, publishing_method |
| Comment | Threaded comments | post, user, parent, content, is_reported |
| Like | Post likes | post, user |
| Bookmark | Post bookmarks | post, user |
| PostReaction | Discord-style emoji reactions | post, user, reaction_type (fire/lightbulb/chart/thinking/diamond/pray) |
| Notification | User notifications | user, type, post |
| NewsletterSubscriber | Email subscribers | email |

### `models` app (label: `crypto_models`)
| Model | Purpose | Key Fields |
|-------|---------|------------|
| QuantModel | Registered quantitative model | name, slug, description, methodology, asset_class, frequency, current_signal |
| ModelDataPoint | Generic time series | model, timestamp, value, signal |
| ModelSignalResult | Forward return stats | model, signal_type, interval_label, avg_return_pct, hit_rate_pct |
| Backtest | Stored backtest result | name, slug, instrument, stats (return, sharpe, drawdown, etc.), heatmap_data |
| EquityPoint | Equity curve point | backtest, timestamp, value |
| DrawdownPoint | Drawdown curve point | backtest, timestamp, drawdown_pct |
| BacktestTrade | Individual trade | backtest, entry_date, exit_date, return_pct, direction |
| CryptoBreadth | % above DMA indicators | date, pct_above_50/100/200dma |
| CryptoPrice | Daily OHLCV per coin | symbol, date, open, high, low, close, volume, market_cap |
| CryptoIndex | Market-cap weighted indices | index_name, date, value, daily_return |
| CryptoGlobalQuote | Global crypto metrics | date, btc_dominance, eth_dominance, total_market_cap |
| MacroDataPoint | FRED/World Bank data | source, series_id, date, value, country |
| StockPrice | Stock/ETF OHLCV | symbol, date, OHLCV, source |
| ModelAlert | User alert subscriptions | user, model, alert_type |
| APIKey | User API keys | user, prefix, key_hash, requests_today |
| DataFetchLog | Data pipeline monitoring | source, status, records_fetched, error_message |

---

## 4. API Endpoints

### Authentication
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | /api/register/ | Public | Register new user (sends verification email) |
| POST | /api/verify-email/ | Public | Verify email with token |
| POST | /api/resend-verification/ | Public | Resend verification email |
| POST | /api/token/ | Public | Get JWT access + refresh tokens |
| POST | /api/token/refresh/ | Public | Refresh JWT token |
| GET/PUT | /api/profile/ | Auth | Get/update user profile |
| POST | /api/password/reset/ | Public | Request password reset |
| POST | /api/password/reset/confirm/ | Public | Confirm password reset |

### Posts & Content
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET/POST | /api/posts/ | Public/Auth | List published posts / Create post |
| GET/PUT/DELETE | /api/posts/{slug}/ | Public/Auth | Post detail / Update / Delete |
| POST | /api/posts/{slug}/like/ | Auth | Toggle like |
| POST | /api/posts/{slug}/bookmark/ | Auth | Toggle bookmark |
| POST | /api/posts/{slug}/react/ | Auth | Toggle reaction (body: {reaction_type}) |
| GET | /api/posts/{slug}/reactions/ | Public | Get reaction counts |
| GET | /api/posts/{slug}/comments/ | Public | List comments |
| POST | /api/posts/{slug}/comment/ | Auth | Create comment |
| POST | /api/comments/{id}/like/ | Auth | Like comment |
| POST | /api/comments/{id}/report/ | Auth | Report comment |
| GET | /api/categories/ | Public | List categories |

### Dashboard
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | /api/dashboard/stats/ | Auth | Dashboard statistics |
| GET | /api/dashboard/posts/ | Auth | Author's posts |
| GET | /api/dashboard/comments/ | Auth | Reported comments |
| GET | /api/dashboard/analytics/ | Auth | Post analytics |
| GET | /api/dashboard/users/ | Auth | User management |
| POST | /api/dashboard/users/grant-premium/ | Auth | Grant premium access |
| POST | /api/dashboard/send-newsletter/{slug}/ | Auth | Send post as email |
| POST | /api/dashboard/import-posts/ | Auth | Import Substack ZIP |

### Models & Data
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | /api/models/crypto-breadth/ | Public | Crypto breadth data |
| GET | /api/models/crypto-index/ | Public | Altcoin index data |
| GET | /api/models/crypto-global/ | Public | Global metrics data |
| GET | /api/models/registry/ | Public | List QuantModel registry |
| GET | /api/models/registry/{slug}/ | Public | Model detail + signal results |
| GET | /api/models/registry/{slug}/data/ | Public | Model data points |
| PUT | /api/models/registry/{slug}/update/ | Auth (analyst) | Update model description |
| POST | /api/models/registry/{slug}/alert/ | Auth | Toggle alert subscription |
| GET | /api/models/alerts/ | Auth | List user's alerts |
| GET | /api/models/backtests/ | Public | List backtests |
| GET | /api/models/backtests/{slug}/ | Public | Backtest detail |
| POST | /api/models/backtests/upload/ | Auth | Upload backtest from notebook |
| POST | /api/models/data/fetch/ | Secret | Trigger data pipeline |
| GET | /api/models/data/status/ | Public | Data fetch logs |

### Payments
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | /api/stripe/create-checkout/ | Auth | Create Stripe checkout session |
| POST | /api/stripe/create-portal/ | Auth | Create Stripe customer portal |
| GET | /api/stripe/subscription-status/ | Auth | Check subscription status |
| POST | /api/stripe/webhook/ | Public | Stripe webhook handler |

### Other
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | /health/ | Public | Health check (DB status) |
| POST | /api/newsletter/subscribe/ | Public | Subscribe to newsletter |
| POST | /api/newsletter/unsubscribe/ | Public | Unsubscribe via token |

---

## 5. Environment Variables

```env
# Django
SECRET_KEY=              # Django secret key
DEBUG=True               # Set False in production
ALLOWED_HOSTS=.railway.app,localhost,127.0.0.1
DATABASE_URL=            # PostgreSQL connection string (production only)

# Email (Amazon SES)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
SES_SMTP_USER=           # IAM SMTP username
SES_SMTP_PASSWORD=       # IAM SMTP password (derived from secret key)
DEFAULT_FROM_EMAIL=LagoBrian@outlook.com

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Data Pipeline
FRED_API_KEY=            # Free from fred.stlouisfed.org
ALPACA_API_KEY=          # From alpaca.markets (optional, falls back to yfinance)
ALPACA_SECRET_KEY=
DATA_FETCH_SECRET=       # Random string for cron trigger auth

# Frontend (baked at build time)
NEXT_PUBLIC_API_URL=https://your-api.railway.app

# Admin
ADMIN_EMAIL=lagobrian@outlook.com
ADMIN_PASSWORD=          # Used by seed_data command
```

---

## 6. Deployment

### Railway Services
1. **api** — Django backend (Gunicorn)
2. **web** — Next.js frontend (standalone)
3. **PostgreSQL** — managed database
4. **Redis** — optional cache

### Deploy Process
1. Push to `main` branch on GitHub
2. Railway deploys each service from the same repo using its assigned Dockerfile
3. Backend container runs `build.sh`, then starts Gunicorn
4. Frontend container builds the standalone Next.js app and starts `server.js`

### Rollback
```bash
git log --oneline -5         # Find commit to revert to
git revert HEAD              # Or: git reset --hard <commit>
git push origin main --force # Force push (careful!)
```

---

## 7. Cron Jobs

| Job | Schedule | Command | Source |
|-----|----------|---------|--------|
| All data | Every 6h | `python manage.py fetch_all_data` | GitHub Actions |
| Crypto (CoinMarketCap) | Every 6h | `python manage.py update_crypto` | Part of fetch_all_data |
| FRED (macro) | Every 6h | `python manage.py fetch_fred` | Part of fetch_all_data |
| World Bank | Every 6h | `python manage.py fetch_worldbank` | Part of fetch_all_data |
| Alpaca/yfinance | Every 6h | `python manage.py fetch_alpaca` | Part of fetch_all_data |

Trigger manually: `POST /api/models/data/fetch/` with `X-Fetch-Secret` header.

---

## 8. How to Add a New Model

1. **Register in DB:**
```python
from models.models import QuantModel
QuantModel.objects.create(
    name='My New Model',
    slug='my-new-model',
    short_description='...',
    description='...',
    asset_class='crypto',
    frequency='daily',
    data_source='CoinGecko',
    is_published=True,
)
```

2. **Add data points:**
```python
from models.models import ModelDataPoint
ModelDataPoint.objects.create(model=model, timestamp=now, value=42.5, signal='bullish')
```

3. **View at:** `/models/my-new-model/` (uses dynamic `[slug]` page)

4. **Add signal results** for the performance table:
```python
from models.models import ModelSignalResult
ModelSignalResult.objects.create(model=model, signal_type='bullish', interval_label='1M', interval_days=30, avg_return_pct=8.3, hit_rate_pct=73.0, sample_size=47)
```

---

## 9. How to Upload a Backtest

From a Jupyter notebook:
```python
import requests

result = {
    "name": "Crypto Breadth Mean Reversion",
    "slug": "crypto-breadth-mean-reversion",
    "instrument": "BTCUSDT",
    "start_date": "2015-01-01",
    "end_date": "2024-12-27",
    "model_slug": "crypto-breadth",  # Optional: link to QuantModel
    "parameters": {"long_threshold": 20, "short_threshold": 80},
    "stats": {
        "total_return_pct": 18904.6,
        "benchmark_return_pct": 30383.9,
        "sharpe_ratio": 1.87,
        "max_drawdown_pct": -113.4,
        "win_rate_pct": 35.5,
        "total_trades": 77,
        "best_trade_pct": 962.4,
        "worst_trade_pct": -59.3,
        "profit_factor": 2.57,
        "start_value": 100,
        "end_value": 19004.62,
    },
    "equity_curve": [["2015-01-01T00:00:00", 100], ...],
    "drawdown_curve": [["2015-01-01T00:00:00", 0], ...],
    "trades": [{"entry_date": "2015-03-01", "exit_date": "2015-04-15", "return_pct": 23.5, "direction": "long"}, ...],
    "heatmap_data": {
        "x_labels": [10, 15, 20, 25, 30, 35],
        "y_labels": [70, 75, 80, 85, 90],
        "values": [[...], [...], ...]
    },
    "is_published": True,
}

res = requests.post(
    "http://127.0.0.1:8000/api/models/backtests/upload/",
    json=result,
    headers={"Authorization": "Bearer YOUR_JWT_TOKEN"}
)
print(res.json())
```

View at: `/backtests/crypto-breadth-mean-reversion/`

---

## 10. Known Issues & Quirks

- **Production blog empty**: Confirm `NEXT_PUBLIC_API_URL` points at the Railway API domain and redeploy the web service after changing it
- **SES sandbox mode**: Can only send emails to verified addresses until production access is approved
- **SQLite locking**: yfinance bulk download can hit "database is locked" locally; not an issue with PostgreSQL
- **Chart.js remnants**: Some old pages may still reference Chart.js; all new charts use Plotly
- **`NEXT_PUBLIC_` vars**: Must rebuild web service after changing (baked at build time)
- **crypto2 R package**: Only works where R is installed; use a dedicated worker or local machine for R-based tasks
