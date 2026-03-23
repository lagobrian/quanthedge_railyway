# Quant (h)Edge — Website Dev Backlog
> Last updated: 23rd March 2026
> Stack: Next.js (frontend), Django REST Framework (backend), PostgreSQL, Python, R
> Ordered by priority: Foundation → Core UX → Content & Models → Growth & Monetisation → Advanced Infrastructure

---

## 🔴 Phase 1 — Foundation & Stability ✅ COMPLETE
> Must be done first. Everything else breaks or is pointless without these.

| # | Task | Status |
|---|------|--------|
| 1 | Email Verification on Signup | ✅ Done |
| 2 | Fix Newsletter Subscribe Button UX | ✅ Done |
| 3 | Never Show Subscribe/Padlock to Premium Members | ✅ Done |
| 4 | Health Check Endpoint + Error Handling | ✅ Done |

---

### 1. Email Verification on Signup

**What:** Users who register must verify their email before they can log in or access any content.

**Implementation:**
- On registration, generate a signed token using Django's `django.core.signing` module
- Email the token to the user as a verification link: `/verify-email/<token>/`
- Create a `verify_email` view that activates `user.is_active = True` on valid token click
- Block login for unverified accounts — show message: *"Please verify your email. [Resend verification email]"*
- Add a resend verification email button on the login page
- Tokens expire after 24 hours
- Use Django's existing email backend (configure SMTP settings in `.env`)

---

### 2. Fix Newsletter Subscribe Button UX [Bug]

**What:** When a user subscribes to the newsletter, the card should disappear and show a thank-you message. Currently nothing visible happens.

**Implementation:**
- On successful POST to the subscribe endpoint, return a JSON success response `{"status": "ok"}`
- In the frontend (JS or HTMX), on success swap the subscription card HTML with: `"Thanks for subscribing! 🎉 You're on the list."`
- The card must not reappear on page refresh:
  - For logged-in users: store `newsletter_subscribed = True` on the user profile
  - For anonymous users: set a `newsletter_subscribed` cookie (expires 1 year)
- Audit all pages/templates where the subscribe card appears and apply the same suppression logic

---

### 3. Never Show Subscribe Cards or Padlock Icons to Premium Members

**What:** Any card, banner, or prompt urging users to subscribe must be completely hidden from premium subscribers. Premium users currently still see padlock icons and subscribe prompts.

**Implementation:**
- Add a `is_premium` boolean property to the user model (or derive from active subscription status)
- Add a template context processor that injects `user.is_premium` into every request context
- In all templates, wrap every subscribe CTA, padlock icon, and upgrade prompt with `{% if not user.is_premium %}`
- For premium users, replace locked padlock icons 🔒 with unlocked 🔓 or remove entirely
- Do a full audit: search all templates for the strings `subscribe`, `upgrade`, `padlock`, `premium` and verify each one is gated correctly

---

### 4. Fallbacks, Rollbacks, and Error Handling — Always On

**What:** Every deployment must have a rollback strategy. Every external data fetch must have a fallback so the site never breaks silently.

**Implementation:**
- **Database backups:** Set up daily automated PostgreSQL dumps (pg_dump) to S3 or DigitalOcean Spaces via cron
- **Pre-deploy backup:** Run a DB snapshot before every deployment
- **External API fallbacks:** Wrap all external API calls (market data, etc.) in `try/except`. On failure, serve last cached data with a timestamp banner: *"Data last updated: [time]. Live feed temporarily unavailable."*
- **Error tracking:** Integrate Sentry (`sentry-sdk`) — add DSN to `.env`, configure in `settings.py`
- **Rollback procedure:** Document in `DEPLOYMENT.md`:
  1. `git checkout <previous-tag>`
  2. Restore DB from snapshot: `pg_restore -d quanthedge backup.dump`
  3. Restart server
- **Health check endpoint:** Add `/health/` view that returns `{"status": "ok", "db": "ok", "cache": "ok"}` — use for uptime monitoring

---

### 5. Local Development Environment Matches Production (Docker)

**What:** Local copy should run identically to production — same DB schema, same codebase as GitHub. One-command setup using Docker Compose.

**Implementation:**
- Create `docker-compose.yml` with services:
  - `web`: Django app (gunicorn in prod, `runserver` locally)
  - `db`: PostgreSQL (same version as production)
  - `redis`: For caching and Celery
  - `pgadmin`: pgAdmin 4 for DB inspection at `localhost:5050`
  - `celery`: Celery worker
  - `celerybeat`: Celery Beat scheduler
- Create `.env.example` documenting all required environment variables (no values)
- Write `scripts/sync_prod_db.sh`:
  ```bash
  pg_dump $PROD_DATABASE_URL > backup.dump
  pg_restore -d $LOCAL_DATABASE_URL backup.dump
  ```
- Add `Makefile` with:
  ```makefile
  up:        docker-compose up
  down:      docker-compose down
  shell:     docker-compose exec web python manage.py shell
  sync-db:   bash scripts/sync_prod_db.sh
  migrate:   docker-compose exec web python manage.py migrate
  ```
- Ensure `DEBUG=True` locally, static files served by Django dev server
- Add `.dockerignore` to exclude `__pycache__`, `.env`, `node_modules`

---

### 6. Two-Factor Authentication (2FA)

**What:** Users can optionally enable 2FA (TOTP) for their accounts.

**Implementation:**
- Install `django-two-factor-auth` and `django-otp`
- Support TOTP (compatible with Google Authenticator, Authy, 1Password)
- Add 2FA setup page under `/account/security/`:
  1. Show QR code (generated with `qrcode` library)
  2. User scans and enters a 6-digit confirmation code to activate
- On login: if `user.totpdevice_set.filter(confirmed=True).exists()`, redirect to `/account/two-factor/` for code entry before granting access
- Generate 8 one-time backup codes on setup — store hashed in DB. Allow regeneration from security settings
- Show "2FA enabled ✅" badge on account settings page

---

## 🟠 Phase 2 — Core UX & Design
> Site needs to feel polished and professional before pushing for subscribers.

---

### 7. Responsive Design — All Devices

**What:** The entire site must look and work correctly on mobile, tablet, and desktop.

**Implementation:**
- Audit every page at breakpoints: 375px (iPhone SE), 768px (iPad), 1280px, 1920px
- Use Tailwind CSS responsive prefixes (`sm:`, `md:`, `lg:`) or CSS media queries consistently
- Navigation collapses to hamburger menu on mobile — use a `<details>` toggle or JS drawer
- All tables (drivers, backtest results, signal tables) must be horizontally scrollable on mobile: wrap in `overflow-x: auto`
- TradingView chart embeds must have `width: 100%` and responsive container
- Test on: Chrome (desktop + mobile), Firefox, Safari (iOS)
- Minimum tap target size: 44×44px on all interactive elements

---

### 8. Rename Blog Section to Newsletters

**What:** Every user-facing reference to "Blog" must say "Newsletters".

**Implementation:**
- Update navbar link text: `Blog` → `Newsletters`
- Update URL patterns: `/blog/` → `/newsletters/` — add 301 redirect from old URL:
  ```python
  path('blog/', RedirectView.as_view(url='/newsletters/', permanent=True)),
  path('blog/<slug:slug>/', RedirectView.as_view(pattern_name='newsletter-detail', permanent=True)),
  ```
- Update `<title>` tags, breadcrumbs, page headings, meta descriptions
- Update Django model `verbose_name` if the app is named `blog`: `verbose_name = "Newsletter"`, `verbose_name_plural = "Newsletters"`
- Run: `grep -ri "blog" templates/` and `grep -ri "blog" */urls.py` to find all remaining references

---

### 9. Improve Comment Section (Substack-Inspired)

**What:** Comment section should feel modern, readable, and threaded.

**Implementation:**
- **Threading:** Support nested replies, 2 levels deep maximum. `Comment` model: add `parent = ForeignKey('self', null=True, blank=True)`
- **Avatar:** Show user avatar (or DiceBear placeholder — see item 13) next to each comment
- **Timestamps:** Display as relative time ("3 hours ago") using a JS library (e.g. `dayjs`). Show full datetime on hover via `title` attribute
- **Reactions on comments:** Upvote button with count (simple thumbs up, not full emoji set)
- **Reply button:** Inline under each comment, opens a reply textarea beneath that comment
- **Comment input:** Simple rich text (bold, italic, links) — use a lightweight editor or `contenteditable` with a small toolbar
- **Comment count:** Show total count in heading: `Comments (12)`
- **Pagination:** Load 20 comments at a time, "Load more" button — no infinite scroll
- **Sorting:** Default newest first, option to sort by top (most upvoted)

---

### 10. Post Reactions — Discord-Style

**What:** Posts can be reacted to with multiple emoji reactions (Discord-style), showing counts.

**Implementation:**
- Fixed reaction set: 🔥 💡 📈 🤔 💎 🙏 (configurable in Django admin via a `ReactionType` model)
- **DB model:**
  ```python
  class PostReaction(models.Model):
      user = ForeignKey(User, on_delete=CASCADE)
      post = ForeignKey(Post, on_delete=CASCADE)
      reaction_type = ForeignKey(ReactionType, on_delete=CASCADE)
      class Meta:
          unique_together = ('user', 'post', 'reaction_type')
  ```
- One reaction per type per user per post. Clicking again removes it (toggle)
- Display below post content: `🔥 12  💡 4  📈 7`
- Clicking a reaction fires a POST to `/api/reactions/toggle/` and updates the count inline (no page reload) — use HTMX or fetch API
- Anonymous users see reactions but cannot add them — hovering shows tooltip: *"Sign in to react"*

---

### 11. Rich Text Editor (Substack/Notion/Ghost Quality)

**What:** Replace the current post editor with a proper rich text experience.

**Implementation:**
- Use **Tiptap** (recommended) — Vue/React/vanilla JS, highly extensible, used by Notion-like tools
- Alternatively: **Quill** or **ProseMirror**
- Required extensions:
  - Text formatting: Bold, Italic, Underline, Strikethrough
  - Structure: Heading (H1–H3), Bullet list, Ordered list, Blockquote
  - Code: Inline code, Code block with syntax highlighting (`lowlight` extension)
  - Media: Image upload (POST to `/api/upload/`, store in S3/DO Spaces, return URL), image resize
  - Other: Links, Horizontal rule, Tables
- Nice to have: TradingView embed, YouTube embed, Twitter/X embed
- Store content as **Tiptap JSON** in a `JSONField` in the DB. Render to HTML at display time using Tiptap's server-side renderer or a JS renderer
- Sanitize rendered HTML before display using `bleach` (Python) — whitelist safe tags
- **Autosave:** Every 30 seconds, POST draft content to `/api/posts/<id>/autosave/`. Show "Saved" indicator

---

### 12. Typography, Spacing, and Reading Time

**What:** Post body should be comfortable to read. Each post should show estimated reading time.

**Implementation:**
- **Font:** Use `Inter` (sans-serif) or `Lora` (serif) for post body. Load via Google Fonts or self-host
- **Body text styles:**
  ```css
  .post-body {
    font-size: 17px;
    line-height: 1.75;
    max-width: 680px;
    margin: 0 auto;
    color: #1a1a1a;
  }
  ```
- Mobile: `font-size: 16px`
- **Reading time calculation:**
  ```python
  import math
  def calculate_reading_time(content: str) -> int:
      word_count = len(content.split())
      return max(1, math.ceil(word_count / 200))  # 200 WPM average
  ```
- Store as `reading_time_minutes` on the `Post` model (computed on save via `post_save` signal)
- Display below post title: `5 min read ·  March 23, 2026`

---

### 13. Default Placeholder Avatars and Funny Financial Usernames

**What:** Users with no profile picture get a fun generated avatar. Users with no display name get a randomly assigned funny financial username.

**Implementation:**
- Create `constants/usernames.py` with a list of ~100 usernames:
  ```python
  FUNNY_USERNAMES = [
      "oil_buffet", "druckenmillers_nemesis", "vol_surface_enjoyer",
      "carry_trade_survivor", "long_only_larry", "gamma_scalper_99",
      "fed_watching_karen", "yield_curve_watcher", "basis_trader_bob",
      "dark_pool_denise", "macro_tourist_mike", "vix_whisperer",
      # ... add ~90 more
  ]
  ```
- On user creation (`post_save` signal): if no username, randomly pick from list. If taken, append random 3-digit number
- **Avatars:** Use DiceBear API — deterministic, no storage needed:
  ```python
  def get_avatar_url(username):
      return f"https://api.dicebear.com/7.x/bottts/svg?seed={username}"
  ```
- Render this URL as the `<img src>` in all avatar displays when user has no uploaded photo

---

### 14. Profile Completion Prompts

**What:** After signup, nudge users to complete their profile.

**Implementation:**
- Add fields to user profile model: `display_name`, `bio` (TextField), `avatar` (ImageField), `profile_complete` (BooleanField, default False)
- **Completion criteria:** display_name set + avatar uploaded + bio added
- **Banner:** Show a dismissible yellow banner at the top of all pages for incomplete profiles:
  *"Complete your profile to get the most out of Quant (h)Edge → [Complete Profile]"*
- **Checklist widget** on profile settings page with progress bar:
  - ✅ Email verified
  - ✅ Display name set
  - ☐ Profile photo uploaded
  - ☐ Bio added
- When all 4 are complete, set `profile_complete = True` and hide banner permanently
- Banner has an "X" dismiss button — store dismissed state in session (reappears after 7 days if still incomplete)

---

### 15. Social Media and Crypto Wallet Signup Options

**What:** Support Google, Twitter/X, GitHub OAuth, and Ethereum wallet sign-in (Sign-In With Ethereum).

**Implementation:**
- Install `django-allauth`
- Configure in `settings.py`:
  ```python
  INSTALLED_APPS += ['allauth', 'allauth.account', 'allauth.socialaccount',
                     'allauth.socialaccount.providers.google',
                     'allauth.socialaccount.providers.twitter_oauth2',
                     'allauth.socialaccount.providers.github']
  ```
- Add OAuth credentials for each provider to `.env`
- **Sign-In With Ethereum (SIWE):**
  - Install `siwe` Python library
  - Frontend: add "Connect Wallet" button using `ethers.js` or `web3modal`
  - Flow: generate a nonce → user signs a message with MetaMask → verify signature server-side with `siwe.SiweMessage.verify()`
  - On first login, create a user account linked to the wallet address
- **Login page buttons:** "Continue with Google", "Continue with Twitter", "Continue with GitHub", "Connect Wallet"
- On first OAuth login: auto-assign a funny financial username (item 13) and DiceBear avatar
- Email verification: Google guarantees verified email (skip verification step). Twitter/GitHub — still require verification unless provider confirms it

---

## 🟡 Phase 3 — Content, Models & Backtests
> The core intellectual product of the site.

---

### 16. Standardised Model Framework in Django

**What:** A repeatable, documented pattern for adding a new quantitative model to the site — from data ingestion to frontend display.

**Implementation:**
- Create a `quant_models` Django app
- **Base model:**
  ```python
  class QuantModel(models.Model):
      name = CharField(max_length=200)
      slug = SlugField(unique=True)
      description = TextField()
      methodology = JSONField()  # Rich text stored as Tiptap JSON
      asset_class = CharField(choices=['equity','crypto','fx','macro','commodity'])
      frequency = CharField(choices=['tick','hourly','daily','weekly','monthly'])
      last_updated = DateTimeField(auto_now=True)
      is_published = BooleanField(default=False)
      analysts = ManyToManyField(User, blank=True, related_name='assigned_models')
  
  class ModelDataPoint(models.Model):
      model = ForeignKey(QuantModel, on_delete=CASCADE, related_name='data_points')
      timestamp = DateTimeField(db_index=True)
      value = FloatField()
      signal = CharField(choices=['bullish','bearish','neutral'], null=True)
      metadata = JSONField(default=dict)  # store extra context per model
  ```
- Each concrete model (e.g. `CryptoBreadth`) is a subclass or registered instance of `QuantModel`
- Write `docs/HOW_TO_ADD_A_MODEL.md` (see item 30) explaining the full process

---

### 17. Model Display Page with Analyst Dashboard

**What:** Each model has a public page with chart, description, and signal table. Analysts can edit descriptive text without touching code.

**Implementation:**
- **URL:** `/models/<slug>/`
- **Page layout:**
  1. Chart (Chart.js or Plotly, data fetched from `/api/models/<slug>/data/`)
  2. Editable section: "What is this model?", "What does it show?", "How to trade it"
  3. Signal results table (see item 18)
  4. Methodology notes (rich text)
  5. Latest data point + current signal badge (🟢 Bullish / 🔴 Bearish / ⚪ Neutral)
- **Analyst edit mode:**
  - Users with `is_analyst=True` AND assigned to this model see an "Edit" button on sections 2 and 4
  - Clicking "Edit" reveals a Tiptap editor inline. Saving POSTs to `/api/models/<slug>/update-description/`
  - Non-analysts never see edit buttons
- **Model listing page:** `/models/` — grid of model cards with name, asset class, last signal, last updated

---

### 18. Configurable Signal Results Table per Model

**What:** Each model page shows a table of forward returns after a signal fires. Time intervals are configurable per model.

**Implementation:**
- **DB model:**
  ```python
  class ModelSignalResult(models.Model):
      model = ForeignKey(QuantModel, on_delete=CASCADE)
      signal_type = CharField(choices=['bullish','bearish'])
      interval_label = CharField(max_length=20)  # e.g. "1D", "1W", "1M", "3M"
      interval_days = IntegerField()
      avg_return_pct = FloatField()
      hit_rate_pct = FloatField()
      sample_size = IntegerField()
      last_updated = DateTimeField(auto_now=True)
  ```
- In Django admin or the analyst dashboard, define which intervals to show per model
- Example for crypto breadth: 1D, 2D, 3D, 5D, 1W, 2W, 1M, 3M, 1Y
- **Table rendering:**
  - Rows: each interval
  - Columns: Signal Type | Interval | Avg Return | Hit Rate | Sample Size (n)
  - Colour coding: green background for positive avg_return, red for negative
  - Example row: `Bullish | 1 Month | +8.3% | 73% | n=47`

---

### 19. Backtest Pipeline: VectorBT → DB → Website

**What:** Standardised pipeline to push VectorBT (Jupyter) backtest results to the DB and render them as interactive dashboards on the site.

**Implementation:**
- **Standardised backtest output format** (Python dict/JSON):
  ```python
  backtest_result = {
      "name": "Crypto Breadth Mean Reversion",
      "slug": "crypto-breadth-mean-reversion",
      "instrument": "BTCUSDT",
      "start_date": "2018-01-01",
      "end_date": "2026-01-01",
      "parameters": {"threshold": 20, "lookback": 14},
      "stats": {
          "total_return_pct": 342.5,
          "sharpe_ratio": 1.87,
          "max_drawdown_pct": -28.3,
          "win_rate_pct": 61.2,
          "total_trades": 47,
          "avg_trade_duration_days": 12.4
      },
      "equity_curve": [[timestamp, value], ...],  # list of [unix_ts, portfolio_value]
      "drawdown_curve": [[timestamp, drawdown_pct], ...],
      "trades": [{"entry_date": ..., "exit_date": ..., "return_pct": ...}, ...]
  }
  ```
- **Push script** `scripts/push_backtest.py`:
  - Accepts the dict above
  - POSTs to `/api/backtests/upload/` (authenticated endpoint with API key)
  - Server creates `Backtest` DB record and associated `EquityPoint` / `Trade` records
  - Optionally creates a linked draft newsletter post
- **Backtest display page** `/backtests/<slug>/`:
  - Key stats cards (total return, Sharpe, max drawdown, win rate)
  - Equity curve chart (Chart.js line chart)
  - Drawdown chart
  - Trades table (entry, exit, return, duration)
  - Dropdown: select instrument, date range, parameter set (if multiple stored)
- Reference post format: https://quanthedge.substack.com/p/your-new-best-friend-in-crypto-trading

---

### 20. Cron Jobs for Data Fetching (Celery Beat)

**What:** Automated scheduled jobs that fetch market data and update model data points.

**Implementation:**
- Use **Celery + Celery Beat** with Redis as broker
- Each model has a task in its app's `tasks.py`:
  ```python
  @shared_task(bind=True, max_retries=3)
  def update_crypto_breadth(self):
      try:
          data = fetch_from_coingecko()
          save_to_model_data_points(data)
      except Exception as exc:
          raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
  ```
- **Retry logic:** 3 retries with exponential backoff (1 min, 2 min, 4 min). After all retries fail: send alert email to admin
- **Data sources:**
  - CoinGecko / CoinMarketCap (crypto breadth, dominance, volumes)
  - `yfinance` or Alpha Vantage (equities, FX, indices)
  - FRED API (macro: CPI, unemployment, yield curve)
  - Custom scrapers where needed
- **Celery Beat schedule** in `settings.py`:
  ```python
  CELERY_BEAT_SCHEDULE = {
      'update-crypto-breadth-daily': {
          'task': 'quant_models.tasks.update_crypto_breadth',
          'schedule': crontab(hour=6, minute=0),  # 06:00 UTC daily
      },
  }
  ```
- Store raw fetched data in a `RawDataPoint` staging table before processing
- All cron jobs documented in master doc (item 30)

---

### 21. Discord Shop-Talk Channel → Quant (h)Edge Daily Dossier

**What:** Export `#shop-talk` Discord channel history and publish as the **Quant (h)Edge Daily Dossier** newsletter series, and/or display as a Discord-like lounge on the site.

**Implementation:**
- **Export script** `scripts/export_discord.py`:
  - Use Discord API with a bot token and `discord.py` or direct REST calls
  - Paginate through `#shop-talk` message history (Discord API: `GET /channels/{channel_id}/messages`)
  - Clean and structure: group by date, strip bot messages, preserve links and formatting
  - Export to JSON: `[{"date": "2025-10-13", "messages": [{"author": ..., "content": ..., "timestamp": ...}]}]`
- **Option A — Daily Dossier Newsletter:**
  - For each day's messages, create a draft `Post` in the Newsletters section with category `Daily Dossier`
  - Auto-format: date as headline, messages as body
  - Review and publish manually
- **Option B — Lounge:**
  - Build a `/lounge/` page with a Discord-like read-only UI
  - Messages grouped by day, user avatars + names, timestamps, clickable links
  - Load messages via AJAX pagination (50 per page)
- **Recommended:** Build both — Lounge for community feel, Daily Dossier as a published archive

---

## 🟢 Phase 4 — Growth & Monetisation
> Once the product is solid, these unlock revenue.

---

### 22. Paywall — Full Access for Premium, Teaser for Others

**What:** Premium posts show full content to subscribers. Non-subscribers see a teaser and a subscribe CTA.

**Implementation:**
- Add `is_premium = BooleanField(default=False)` to `Post` model
- For non-authenticated or non-premium users viewing a premium post:
  - Show first 20% of content
  - Fade/blur the rest with CSS: `mask-image: linear-gradient(to bottom, black 60%, transparent 100%)`
  - Overlay a subscribe card below the fade
- For premium users: full content, zero padlock icons, zero subscribe prompts
- Add a padlock icon 🔒 on premium post cards in listing views for non-premium users
- Test the full flow: anonymous → partial view → subscribe → full access (immediately, no page reload)
- Never show subscribe cards to premium users anywhere (cross-reference with item 3)

---

### 23. Discount Codes and Trial Periods

**What:** Generate discount codes (% or fixed amount) and free trial periods for subscriptions.

**Implementation (Stripe):**
- Use Stripe Coupons API for discount codes
- **Admin UI** at `/dashboard/coupons/`:
  - Create coupon: name, `percent_off` or `amount_off`, duration (once/repeating/forever), expiry date, max redemptions
  - View coupon usage: how many times redeemed, by whom
- At checkout: add "Have a promo code?" collapsible field. On submit, validate coupon via Stripe API before creating subscription
- **Trial periods:** Set `trial_period_days` on `stripe.Subscription.create()`. Display clearly: *"Your 14-day free trial ends on April 6, 2026"*
- Store coupon usage in `CouponRedemption` model: `user`, `coupon_code`, `redeemed_at`
- Show "Trial ends in X days" banner to users in trial period

---

### 24. Ad Sections in Posts (HTML Embeds)

**What:** Insert sponsored ad sections (HTML embeds) at top, bottom, or a specified position within a post.

**Implementation:**
- **`Ad` model:**
  ```python
  class Ad(models.Model):
      name = CharField(max_length=200)
      html_content = TextField()  # The embed HTML
      is_active = BooleanField(default=True)
      placement = CharField(choices=['top','middle','bottom'])
      start_date = DateField(null=True, blank=True)
      end_date = DateField(null=True, blank=True)
  ```
- In the Tiptap editor, add an "Insert Ad Slot" button that inserts `[AD_SLOT]` at cursor position
- At render time, replace `[AD_SLOT]` with the active ad's HTML using string replacement in the view
- Admin can assign a specific ad to a specific post (ForeignKey), or set a default run-of-site ad (used when no post-specific ad is set)
- **Security:** Sanitize ad HTML using `bleach`. Whitelist: `<a>`, `<img>`, `<iframe>` (from a whitelist of trusted domains only), `<p>`, `<div>`, `<span>`. Strip all `<script>` tags

---

### 25. Email Notifications for Model Updates (User-Configurable)

**What:** Users subscribe to email alerts for specific models with configurable triggers.

**Implementation:**
- **`ModelSubscription` model:**
  ```python
  class ModelSubscription(models.Model):
      user = ForeignKey(User, on_delete=CASCADE)
      model = ForeignKey(QuantModel, on_delete=CASCADE)
      notification_type = CharField(choices=['on_update','on_condition','scheduled'])
      condition_field = CharField(null=True)  # e.g. "value"
      condition_operator = CharField(choices=['gt','lt','crosses_above','crosses_below'], null=True)
      condition_value = FloatField(null=True)
      frequency = CharField(choices=['immediate','daily_digest','weekly_digest'])
      last_notified = DateTimeField(null=True)
  ```
- **UI:** "🔔 Get alerts for this model" button on each model page → opens a modal:
  - Notification type selector
  - Condition builder (if `on_condition`): "Notify me when [value] [crosses above] [20]"
  - Frequency selector
- **Celery task:** After each model update (post-cron), query subscriptions for that model and fire emails where conditions are met
- **Email template:** Branded, shows chart thumbnail (generated via matplotlib/Plotly → PNG), current value, signal, link back to model page
- **Subscription management:** `/account/alerts/` page lists all active subscriptions with edit/delete

---

### 26. Twitter/X Bot — Auto-Post Chart Updates

**What:** A bot that auto-tweets chart images with commentary when a model updates or a notable signal fires.

**Implementation:**
- Install `tweepy` and configure Twitter API v2 credentials in `.env`
- After each model update (post-cron task), check if signal is notable (configurable threshold per model)
- **Chart image generation:**
  ```python
  import plotly.graph_objects as go
  fig = go.Figure(...)
  img_bytes = fig.to_image(format="png", width=800, height=400)
  ```
- **Tweet format:**
  ```
  {Model Name} Update 📊
  
  {Dynamic commentary e.g. "Crypto breadth is atrocious today! Only 12% of coins above 50DMA."}
  
  Current value: {value}
  Signal: 🔴 Bearish
  
  Full analysis → quanthedge.com/models/{slug}
  ```
- Commentary: use a template string with values filled in, or optionally call Claude API for one-line commentary
- Store tweet IDs in `ModelTweet` table to prevent duplicate tweets
- Add `enable_twitter_bot = BooleanField(default=False)` to `QuantModel` — opt-in per model

---

### 27. Subscriber API with Tiered Rate Limits

**What:** Subscribers can generate API keys and access Q(h)E model data programmatically. Rate limits depend on subscription tier.

**Implementation:**
- Use **Django REST Framework (DRF)**
- **`APIKey` model:**
  ```python
  class APIKey(models.Model):
      user = ForeignKey(User, on_delete=CASCADE)
      key_hash = CharField(max_length=64)  # SHA-256 hash — never store plaintext
      prefix = CharField(max_length=8)    # Show prefix to user for identification
      created_at = DateTimeField(auto_now_add=True)
      last_used = DateTimeField(null=True)
      is_active = BooleanField(default=True)
  ```
- Key generation: user visits `/account/api-keys/`, clicks "Generate New Key". Key is shown **once only** (like GitHub tokens). Store only the hash
- **Rate limits** via DRF throttling:
  - Free: 100 requests/day
  - Basic subscriber: 1,000 requests/day
  - Premium subscriber: 10,000 requests/day
- **Endpoints:**
  - `GET /api/v1/models/` — list all published models
  - `GET /api/v1/models/{slug}/data/` — paginated data points
  - `GET /api/v1/models/{slug}/signals/` — signal history
  - `GET /api/v1/backtests/{slug}/` — backtest results
- **API documentation:** Auto-generate with `drf-spectacular` → Swagger UI at `/api/docs/`

---

## 🔵 Phase 5 — Advanced Infrastructure
> Post-launch. Do these after the site has subscribers and traction.

---

### 5. Local Development Environment Matches Production (Docker)
> Moved from Phase 1 — not blocking, do when PostgreSQL is set up locally.

*(Implementation details unchanged — see original item 5 above)*

---

### 6. Two-Factor Authentication (2FA)
> Moved from Phase 1 — important but not blocking launch.

*(Implementation details unchanged — see original item 6 above)*

---

### 28. Front Page Redesign — Live Dashboard

**What:** Current homepage becomes `/about/`. New homepage is a live dashboard: TradingView charts, pinned models, real-time watchlist.

**Implementation:**
- Move current homepage content to `/about/` with a 301 redirect from `/` for existing bookmarks
- **New `/` page layout:**
  - Top: TradingView Advanced Chart widget (user can change symbol via search)
  - Middle: "My Models" — user-pinned models showing latest signal and value. Default (non-logged-in): show 3 featured models
  - Bottom: Watchlist table — tickers with real-time price, % change, volume (use TradingView Market Overview widget or lightweight WebSocket)
- For non-logged-in users: show default instruments (BTC, ETH, SPX, EURUSD, Gold) with a "Sign in to customise" prompt
- **User preferences:** `UserDashboard` model with `pinned_models` (ManyToMany to QuantModel), `watchlist_tickers` (JSONField array of ticker strings)
- Store and restore preferences on login

---

### 29. Hosting Review — DigitalOcean vs AWS

**Recommendation:**

| | DigitalOcean | AWS |
|---|---|---|
| **Cost** | ~$27/month (Droplet $12 + Managed PG $15) | $60–120+/month |
| **Complexity** | Low — simple to manage | High — many services to configure |
| **Performance** | Excellent for current scale | Overkill until bot funds |
| **Verdict** | ✅ Use now | Use when bot funds go live |

**Actions:**
- Ensure site is behind **Cloudflare** (free tier) for CDN, DDoS protection, and SSL
- Set up DigitalOcean Spaces for static files and media uploads (S3-compatible, cheaper than AWS S3)
- Configure `django-storages` with DO Spaces backend
- Set up DigitalOcean Managed PostgreSQL for automated backups and failover
- Revisit AWS when needing auto-scaling for bot fund execution infrastructure

---

### 30. Master Technical Documentation

**What:** A single document explaining the entire site architecture, stack, and codebase — hand to any developer or AI to get them up to speed immediately.

**Contents:**
1. **Tech stack overview:** Django version, Python version, PostgreSQL version, Redis version, frontend framework, hosting provider, CDN
2. **Repository structure:** annotated directory tree of the entire project
3. **Django apps:** list of all apps, what each one does, key models
4. **Data flow diagrams:**
   - How a new newsletter post is created and published
   - How a model fetches and stores data via cron
   - How a user signs up, verifies email, and subscribes
5. **Environment variables:** full list with descriptions (no values) — mirrors `.env.example`
6. **Deployment process:** step-by-step (Git tag → backup DB → deploy → health check → rollback if needed)
7. **Cron jobs:** what runs, when, where in the codebase, what to check if it fails
8. **How to add a new model:** step-by-step with code examples
9. **How to add a new backtest:** step-by-step with the push script
10. **Known issues and quirks**

*Generate this doc by pointing Claude Code at the full codebase with the prompt: "Generate a complete technical documentation file covering all the above sections."*

---

### 31. Performance Optimisation — Real-Time Data Feeds

**What:** Architecture recommendations for speed on real-time and high-frequency data paths.

**Recommendations:**
- **Django Channels + WebSockets** for real-time watchlist price updates — push prices to the frontend instead of polling
- **Redis caching:** Cache model chart data with TTL matching update frequency (daily models: 1-hour TTL). Use `django-redis`
- **Precompute on write:** When a cron job saves new model data, trigger a Celery task to pre-render chart JSON and cache it. Page load just reads from cache — no DB query
- **Profiling:** Use `django-silk` in development to find slow views and N+1 queries. Fix all N+1 with `select_related` / `prefetch_related`
- **FastAPI microservice:** For pure data API endpoints needing sub-100ms response, consider a lightweight FastAPI service (async, much faster than Django for data-only endpoints)
- **Rust via PyO3 (future):** For bot fund execution-critical paths (order routing, risk checks) — write in Rust, call from Python via PyO3 bindings. Do this only when bot funds go live

---

### 32. Bot Funds — AI Trading Agents

**What:** Users invest in algorithmic funds that apply Q(h)E models to live markets. Minimum $100, configurable lock period.

> ⚠️ **Design phase only. Do NOT build until:** site has paying subscribers, models have a live track record, and legal structure is in place.

**High-level design:**
- Each fund maps to a specific model/strategy
- **Fund accounting:** `Fund` model with NAV, `FundAllocation` per user (amount, join date, lock expiry)
- **Lock period:** Configurable per fund (e.g. 30 days). Withdrawal requests queued, processed on unlock date
- **Execution layer:** Celery tasks interface with exchange APIs (Binance, IBKR) to place orders based on model signals
- **Infrastructure stack for execution:**
  - Signal generation: Python/Django (existing stack)
  - Message queue: RabbitMQ or Kafka between signal and execution
  - Order execution: Rust service (low latency) or Go
  - Risk checks: synchronous, in Rust
- **Legal note:** This is a regulated activity (collective investment scheme) in most jurisdictions. Obtain legal advice before launch.

---

## ⚡ Quick Fixes
> These are small, do them anytime — under 1 hour each.

| # | Task | Details |
|---|---|---|
| QF1 | Rename Blog → Newsletters | Navbar, URLs (301 redirect), titles, model `verbose_name` |
| QF2 | Reading time on posts | `ceil(word_count / 200)` → "X min read" below post title |
| QF3 | High granularity data across all models | Ensure cron jobs store raw data at highest available frequency, not just daily closes |
| QF4 | Docker for local dev, not Kubernetes | Docker Compose for local/staging. Kubernetes is overkill until bot funds — revisit then |

---

## Reference Links
- Substack post (backtest format inspiration): https://quanthedge.substack.com/p/your-new-best-friend-in-crypto-trading
- DiceBear Avatars API: https://api.dicebear.com/
- Tiptap editor: https://tiptap.dev/
- Django Two Factor Auth: https://django-two-factor-auth.readthedocs.io/
- Sign-In With Ethereum: https://docs.login.xyz/
- DRF Spectacular (API docs): https://drf-spectacular.readthedocs.io/
