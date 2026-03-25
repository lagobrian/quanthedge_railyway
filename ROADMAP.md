# Q(h)Edge Product Roadmap

## Already Built / Researched
- ✅ Crypto Breadth, Altcoin 100 Index, BTC Dominance & Global Metrics (live)
- ✅ Equity Breadth — S&P 500 % above 50/100/200 DMA (backtested in R, Oct 2024 post)
- ✅ % of Outperforming Constituents (researched, noisy but useful at extremes)
- ✅ Sector Representatives via Vine Copulas (single-name proxies per sector)
- ✅ FX Volatility Profiles (session/calendar/weekday/hour for 10 major pairs)
- ✅ Crypto New Listings study (8,000+ coins, Jan 2025 post)
- ✅ BTC vs Altcoin leadership (Jan 2025 post)
- ✅ CFTC data backtest (multi-strategy, multi-asset, multi-timeframe — to be published)
- ✅ VIX / Markov / stochastic process research (ongoing series)

---

## Master Priority Order

| Priority | Item | Section | Effort | Why First |
|----------|------|---------|--------|-----------|
| 1 | Equity Breadth — website build | G1 | Low | Research done. Biggest gap. |
| 2 | Homepage Dashboard | B1 | Medium | Front door of the product |
| 3 | AI Companion — core chat | A1 | Medium | Differentiator. Everything else builds on it. |
| 4 | Social login (Google + Twitter) | E1 | Low | Reduces signup friction immediately |
| 5 | Trial period system | D1 | Low | Can't monetise without it |
| 6 | Alert system — email + Telegram | C1–C2 | Medium | Most-requested feature for model subscribers |
| 7 | CFTC COT live model | G3 | Medium | Backtest done, just build the display |
| 8 | Model Confluence Dashboard | H | Low | Reuses existing data, huge UX value |
| 9 | Retail Sentiment Model | G4 | Medium | New research + model build |
| 10 | Sector Rotation Model | G2 | Medium | Completes the Vine Copula research |
| 11 | Pay with Crypto | F1 | Medium | Unique to your audience |
| 12 | FX Session Volatility interactive | G5 | Low | Productises existing research |
| 13 | AI Companion — chart markup | A2 | High | High wow-factor, needs A1 first |
| 14 | WhatsApp + SMS alerts | C2 | Medium | After Telegram proven to work |
| 15 | Crypto wallet login (SIWE) | E1 | High | Nice-to-have, complex |

---

## Section A — The Q(h)Edge AI Companion

### A1. AI Companion — Core Implementation

**What it is:** A persistent chat panel on every model page and the dashboard. The user asks questions in natural language. It has context about: (1) the current model, (2) the current signal, (3) the user's watchlist, and (4) all published Q(h)Edge research.

**Stack:**
- Backend: Django view at `/api/companion/chat/` — POST `{message, context}` → proxies to Anthropic API (`claude-sonnet-4-6`)
- System prompt constructed server-side, injects:
  - Current model name, methodology, signal, last 30 data points (JSON)
  - User's watchlist tickers (if logged in)
  - Condensed Q(h)Edge research principles
  - Today's date and active signals across all models
- Frontend: sliding panel (right side, ~400px). Renders markdown. Streams token-by-token via SSE.
- Rate limiting: `CompanionUsage` model (`user`, `date`, `message_count`). Free: 10/day. Premium: 100/day.

**System prompt:**
```
You are the Q(h)Edge AI Companion — a quant analyst trained on the Q(h)Edge research methodology.

Current context:
- Model being viewed: {model_name}
- Current signal: {signal} (as of {last_updated})
- Recent data: {last_30_datapoints_json}
- User's watchlist: {watchlist_tickers}
- Active signals across all models today: {active_signals_summary}

Q(h)Edge philosophy:
- We build original quantitative models, not copy-paste indicators
- We are contrarian — extreme sentiment is a signal, not confirmation
- We combine breadth, sentiment, and macro — no single input is ever enough
- We always show the backtest, not just the signal

Answer the user's question as a precise, data-grounded quant analyst. Be direct. If you don't have the data to answer, say so. Never hallucinate market data.
```

**UI placement:** Fixed icon (💬) bottom-right of every page. On model pages, also an "Ask Companion" button directly below the chart.

---

### A2. Companion — Chart Markup Feature

**What it is:** When a user asks about a chart, the Companion returns structured overlay data the frontend uses to draw on the TradingView chart.

**How it works:**
- Companion response includes a hidden JSON block alongside its text:
```json
{
  "chart_overlays": [
    {"type": "horizontal_line", "price": 69000, "label": "Monthly POC", "color": "#FF6B35"},
    {"type": "horizontal_line", "price": 71500, "label": "Resistance", "color": "#FF0000"},
    {"type": "label", "price": 70000, "text": "Watch this zone", "color": "#00FF00"}
  ]
}
```
- Frontend JS parses this block and applies overlays via TradingView's `createStudy` API or Pine Script injection
- Fallback: render levels as a clean table below the chat response

**Phase 1 overlays:**
- Horizontal support/resistance levels
- Key moving averages (50, 200 DMA) vs current price
- Q(h)Edge model signal dates
- Volume profile Point of Control from last 30 days

---

### A3. Companion — Model Q&A Training

**What it is:** Curated Q&A pairs loaded into the system prompt as few-shot examples.

**Django model:** `CompanionKnowledgeBase`: `topic`, `question`, `answer`, `is_active`

**Implementation:** On each request, fetch the 5 most relevant entries via keyword matching against the user's question and include them as examples in the system prompt.

**Seed entries:**
- Q: "Why does the 50-DMA breadth indicator hit extremes before the market turns?" → A: Based on the Oct 2024 backtest, the 50-DMA breadth peaked at 92.5% in Jan 2024 before the market diverged — extreme sentiment, not momentum reversal.
- Q: "What is a Vine Copula and why did you use it for sectors?" → A: [condensed from Sep 2024 post]
- Q: "What happened to most new crypto listings?" → A: [from Jan 2025 study — 79% are below starting price]

---

## Section B — Homepage Dashboard

### B1. Homepage Dashboard — Full Layout Spec

**Route:** `/` (move current homepage to `/about/`)

**Layout (desktop 3-column, mobile stacked):**
```
┌─────────────────────────────────────────────────────────────────┐
│  NAVBAR: Quant (h)Edge | Models | Backtests | Newsletters | Pricing | [💬] | Login │
├────────────────────────┬────────────────────────┬───────────────┤
│                        │                        │               │
│  TradingView Chart     │  Model Confluence      │  AI Companion │
│  (user-selectable      │  Dashboard             │  Panel        │
│   ticker, default BTC) │  (all model signals)   │  (chat panel) │
│  [2/3 width]           │  [1/3 width, top]      │  [Slide-over] │
│                        ├────────────────────────┤               │
│                        │  Active Alerts         │               │
│                        │  [1/3 width, bottom]   │               │
├────────────────────────┴────────────────────────┴───────────────┤
│  WATCHLIST TABLE: ticker | price | 24h% | 7d% | Model Signal   │
│  (user-configurable, default: BTC ETH SPX DXY GOLD OIL)        │
├─────────────────────────────────────────────────────────────────┤
│  LATEST NEWSLETTERS (3 most recent posts, preview cards)        │
└─────────────────────────────────────────────────────────────────┘
```

**TradingView chart panel:**
- Embed TradingView advanced chart widget (free)
- Ticker selector: type or pick from watchlist. Default: `BTCUSD`
- For logged-in users: remember last-viewed ticker in `UserPreferences`
- Below chart: "Ask Companion about this chart" button → opens Companion with ticker in context

**Model Confluence panel:**
- Compact card per model: `[●] Model Name — 🟢 Bullish — Updated Xh ago`
- Sorted by most recently updated
- Top: `Confluence: 6 of 8 models Bullish` with progress bar
- Filter by asset class: All | Crypto | Equities | Macro

**Watchlist table:**
- Columns: Ticker | Price | 24h% | 7d% | Q(h)Edge Signal | Actions
- Price data: yfinance polling every 5 min, cached in Redis
- `UserWatchlist` model: `user`, `ticker`, `order`
- Default (logged-out): BTC, ETH, SPX, DXY, XAU, OIL

**Implementation notes:**
- HTMX for partial page refreshes (no full reload on ticker switch or price update)
- Watchlist auto-refreshes every 5 min via HTMX polling (`hx-trigger="every 5s"`)
- Mobile: Chart → Confluence → Watchlist → Newsletters (stacked)

---

## Section C — Alert System

### C1. Alert System — Data Models

```python
class AlertSubscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    model = models.ForeignKey(QuantModel, on_delete=models.CASCADE)

    trigger_type = models.CharField(choices=[
        ('any_signal', 'Any signal change'),
        ('bullish_only', 'Bullish signals only'),
        ('bearish_only', 'Bearish signals only'),
        ('threshold_cross', 'Value crosses threshold'),
        ('extreme', 'Extreme reading (top/bottom 10%)'),
    ])
    threshold_value = models.FloatField(null=True, blank=True)
    threshold_direction = models.CharField(choices=['above', 'below'], null=True)

    channel_email = models.BooleanField(default=True)
    channel_telegram = models.BooleanField(default=False)
    channel_whatsapp = models.BooleanField(default=False)
    channel_discord = models.BooleanField(default=False)
    channel_sms = models.BooleanField(default=False)
    channel_push = models.BooleanField(default=False)

    frequency = models.CharField(choices=['immediate', 'daily_digest', 'weekly_digest'])
    last_triggered = models.DateTimeField(null=True)
    is_active = models.BooleanField(default=True)

class UserNotificationSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    telegram_chat_id = models.CharField(blank=True)
    whatsapp_number = models.CharField(blank=True)   # E.164: +254...
    discord_webhook_url = models.CharField(blank=True)
    phone_number = models.CharField(blank=True)
    push_subscription_json = models.JSONField(null=True)
```

### C2. Alert Delivery — Per Channel

**Email:** Django email backend. Template: model name, signal, chart thumbnail, link. Subject: `[Q(h)Edge Alert] {Model Name} just turned {Bullish/Bearish}`

**Telegram:**
- Create bot via BotFather. Use `python-telegram-bot`.
- User links account: Settings → Connect Telegram → deep link `https://t.me/QhEdgeBot?start=<token>` → verification code
- Message: `📊 Q(h)Edge Alert\n\n{Model Name} — 🟢 BULLISH\nValue: {x}\n\nWhat this means: {interpretation}\n\n🔗 {url}`

**Discord:** Webhooks (no bot needed). User pastes webhook URL. Send via `requests.post`. Green embed for bullish, red for bearish.

**WhatsApp:** Twilio or Meta Cloud API (free up to 1,000 conversations/month). E.164 number, verification required. Pre-approved message template.

**SMS:** Twilio. Max 1 SMS/hour per user. Reserve for "extreme" readings only.

**Web Push:** `pywebpush` + `django-webpush`. VAPID keys. Works Chrome/Firefox/Edge.

**In-app:** `AlertLog` model: `user`, `subscription`, `triggered_at`, `message`, `is_read`. Bell icon 🔔 in navbar with unread count.

### C3. Alert Settings Page

**Route:** `/settings/notifications/`

```
NOTIFICATION SETTINGS
─────────────────────────────────────────
📡 Connected Channels
  ✅ Email (lago@example.com)              [Change]
  ✅ Telegram (@LagoBrian)                 [Disconnect]
  ❌ Discord                               [Connect — paste webhook URL]
  ❌ WhatsApp                              [Connect — enter number]
  ❌ SMS                                   [Connect — enter number]
  ❌ Browser Push                          [Enable]

─────────────────────────────────────────
📊 Model Alert Subscriptions
  [+ Add Alert]

  Crypto Breadth     Any signal change    Email + Telegram    [Edit] [Delete]
  Equity Breadth     Extreme reading      Email only          [Edit] [Delete]

─────────────────────────────────────────
⚙️ Global Preferences
  Frequency:    ○ Immediate  ● Daily digest  ○ Weekly digest
  Quiet hours:  22:00 — 07:00 (auto-detected timezone)
  Max alerts:   [10] per day (SMS/WhatsApp max: 3/day)
```

**"Add Alert" modal fields:** Model (dropdown) → Trigger type → Channels (checkboxes) → Save

---

## Section D — Trial Period System

### D1. Trial Period — Implementation

**Flow:**
1. User registers → `plan='trial'`, `trial_end = now() + 7 days`
2. Immediate email: "Your 7-day free trial has started"
3. Day 5 email: "Your trial ends in 2 days"
4. Day 7 email: "Your trial has ended. Upgrade to keep access."
5. Daily Celery task checks expired trials → downgrade to `plan='free'`

**Django model:**
```python
class UserSubscription(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    plan = models.CharField(choices=['free', 'trial', 'basic', 'premium'], default='trial')
    trial_start = models.DateTimeField(null=True)
    trial_end = models.DateTimeField(null=True)
    stripe_customer_id = models.CharField(blank=True)
    stripe_subscription_id = models.CharField(blank=True)
    crypto_payment_id = models.CharField(blank=True)

    @property
    def is_premium(self):
        if self.plan == 'premium':
            return True
        if self.plan == 'trial' and self.trial_end > timezone.now():
            return True
        return False

    @property
    def trial_days_remaining(self):
        if self.plan != 'trial':
            return 0
        return max(0, (self.trial_end - timezone.now()).days)
```

**Trial banner (shown on every page):**
```
🎁 Trial: X days remaining  |  Upgrade to keep access →  [View Plans]  [×]
```
Yellow/amber background. Reappears each new session (dismissal stored in session only).

**Promo codes:** `PromoCode` model: `code`, `discount_type`, `discount_value`, `max_redemptions`, `redemptions_used`, `valid_until`, `extends_trial_days`. Validate via AJAX: `POST /api/validate-promo/`.

---

## Section E — Social Media & OAuth Login

### E1. OAuth Providers

**Package:** `django-allauth`

**Priority order:**
1. Google — broadest coverage
2. Twitter/X — your audience lives there
3. Discord — overlaps with crypto/finance crowd
4. GitHub — for quant/developer users
5. Apple — leave for App Store compliance later

**settings.py additions:**
```python
INSTALLED_APPS += [
    'allauth', 'allauth.account', 'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.twitter_oauth2',
    'allauth.socialaccount.providers.discord',
    'allauth.socialaccount.providers.github',
]

SOCIALACCOUNT_PROVIDERS = {
    'google': {'SCOPE': ['profile', 'email'], 'AUTH_PARAMS': {'access_type': 'online'}},
    'twitter_oauth2': {'SCOPE': ['tweet.read', 'users.read']},
    'discord': {'SCOPE': ['identify', 'email']},
}

ACCOUNT_EMAIL_VERIFICATION = 'optional'
SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_EMAIL_REQUIRED = False
LOGIN_REDIRECT_URL = '/dashboard/'
```

**Login page layout:**
```
─────────────────────────────────
Continue with [G] Google
Continue with [𝕏] Twitter / X
Continue with [⬡] Discord
Continue with [⌘] GitHub
─────────────────────────────────
        or sign up with email
─────────────────────────────────
Email:        [________________]
Password:     [________________]
              [Create Account →]
─────────────────────────────────
```

**On first OAuth login:** Auto-assign funny financial username, auto-generate DiceBear avatar, start 7-day trial, skip email verification.

**Crypto wallet sign-in (SIWE):** `siwe-py` library. "Connect Wallet" button → MetaMask/WalletConnect → sign message → verify signature. Prompt to optionally link email for notifications.

---

## Section F — Pay With Crypto

### F1. Crypto Payments — Implementation

**Provider:** NOWPayments (nowpayments.io) — 300+ coins, ~0.5% fee, no KYC. Fallback: Coinbase Commerce.

**Django implementation:**
```python
def create_crypto_payment(user, plan, promo_code=None):
    amount_usd = get_plan_price(plan, promo_code)
    response = requests.post('https://api.nowpayments.io/v1/payment',
        headers={'x-api-key': settings.NOWPAYMENTS_API_KEY},
        json={
            'price_amount': amount_usd,
            'price_currency': 'usd',
            'pay_currency': 'btc',
            'order_id': f'qhe-{user.id}-{int(time.time())}',
            'order_description': f'Q(h)Edge {plan} subscription',
            'ipn_callback_url': f'{settings.SITE_URL}/api/crypto-payment-webhook/',
        }
    )
    return response.json()  # Contains payment_address, payment_amount, pay_currency
```

**IPN Webhook:**
```python
@csrf_exempt
def crypto_payment_webhook(request):
    data = json.loads(request.body)
    if data['payment_status'] == 'finished':
        sub = UserSubscription.objects.get(crypto_payment_id=data['payment_id'])
        sub.plan = 'premium'
        sub.save()
        # Send welcome email
```

**Checkout UI:**
```
PAY WITH CRYPTO
──────────────────────────────────
Select currency: [BTC] [ETH] [SOL] [USDT] [USDC] [+ 295 more →]

Amount to pay:  0.00042 BTC  ≈ $18.00 USD

Send to:  [bc1q... wallet address]  [Copy]  [QR code]

Status: ⏳ Waiting for payment...  Expires in: 20:00

✅ Payment confirmed automatically within 1-2 block confirmations.
──────────────────────────────────
```

---

## Section G — New Original Models

### G1. Equity Breadth Model — Website Build

**Research:** Oct 2024 Substack post. R code. Backtested Jan 2021–Oct 2024.

**Daily Celery task:**
- Fetch S&P 500 constituents (Wikipedia scrape or static quarterly list)
- Fetch 200 days of price history via yfinance
- Calculate: `pct_above_50dma`, `pct_above_100dma`, `pct_above_200dma`, `pct_outperforming_spx`
- Store in `ModelDataPoint`

**Divergence Alert:** Fires when SPX makes new 52-week high but `pct_above_200dma` is lower than at the previous 52-week high. Key insight from Oct 2024 research.

**Display:** Same format as Crypto Breadth. Four chart lines. Signal table with historical return stats at extremes (>80% = overbought, <20% = oversold).

---

### G2. Sector Rotation Model

**Research:** Vine Copula sector representatives (Sep 2024).

**Weekly Celery task:**
- Calculate 4-week and 12-week relative strength for 11 sector ETFs vs SPY: XLK, XLF, XLE, XLV, XLY, XLP, XLI, XLB, XLRE, XLU, XLC
- Classify into quadrant using RS rate of change (not just level):
  - **Leading:** high RS, improving
  - **Weakening:** high RS, declining
  - **Lagging:** low RS, declining
  - **Improving:** low RS, turning up
- `SectorRotation` model: `sector`, `etf`, `rs_4w`, `rs_12w`, `quadrant`, `quadrant_changed`, `date`
- Signal fires on `quadrant_changed=True` when new quadrant is `Improving` (rotation in) or `Weakening` (rotation out)

**Display:** 2x2 quadrant chart (Chart.js bubble). Historical rotation path as line (last 4 weeks). Single-name representative per sector (from Vine Copula research) with current performance.

---

### G3. CFTC Commitment of Traders (COT) Live Model

**Research:** Multi-strategy, multi-asset, multi-timeframe CFTC backtest complete.

**Weekly Celery task (Saturday, after CFTC Friday 3:30pm ET release):**
- Fetch from `https://www.cftc.gov/dea/newcot/` (free CSV)
- Parse net positioning for: EUR, GBP, JPY, CHF, AUD, CAD, Gold, Silver, Crude, Nat Gas, S&P 500 futures, Nasdaq 100 futures, Bitcoin
- Calculate Positioning Extreme Score: percentile of current net positioning in historical distribution
- **Signal:** Bullish contrarian when net short is in bottom 10th percentile. Bearish when net long is in top 90th percentile.
- `COTDataPoint` model: `asset`, `date`, `net_positioning`, `percentile_rank`, `signal`

**Display:** Net positioning history chart with ±1 SD bands. Current reading with colour-coded extreme flag. Signal table with forward returns from backtest.

---

### G4. Retail Sentiment Extremes Model

**Research:** New — first new research project.

**Data sources (all free):**
- AAII Sentiment Survey: weekly CSV from `https://www.aaii.com/sentimentsurvey/sent_results`
- CNN Fear & Greed: `https://production.dataviz.cnn.io/index/fearandgreed/graphdata`
- CBOE Put/Call Ratio: `https://cdn.cboe.com/api/global/us_indices/daily_prices/PCCE_History.csv`
- NAAIM Exposure Index: scrape table from `https://www.naaim.org/programs/naaim-exposure-index/`

**Composite construction:**
- Normalise each to 0–100 (min-max over rolling 3-year window)
- Composite = AAII (30%) + Fear&Greed (25%) + Put/Call inverted (25%) + NAAIM (20%)
- Extreme Bullish: composite > 75. Extreme Bearish: composite < 25.

**Backtest task:** `scripts/backtest_sentiment_composite.py` using VectorBT. Strategy on SPY from 2010: buy when composite < 25, sell when composite > 60. Output: total return, Sharpe, max drawdown, win rate, equity curve.

---

### G5. FX Session Volatility Model — Interactive Tool

**Research:** Published Sep 2024. Expected moves by session/weekday/hour for 10 major FX pairs.

**Implementation:**
- `FXVolatilityProfile` model: `pair`, `session`, `weekday`, `hour`, `avg_range_pips`, `median_range_pips`, `p10_range_pips`, `p90_range_pips`
- Populate once via `manage.py` command from existing R results. Update quarterly.
- Interactive calculator: user selects pair + session + day/hour (auto-filled) → returns expected move with percentile range
- **Volatility Regime flag:** Is today's actual range above or below historical median for this session? Green = below (quiet, potential breakout). Red = above (extended, fade).

---

## Section H — Model Confluence Dashboard

**Route:** `/confluence/`

**Layout:**
```
QUANT (h)EDGE — MODEL CONFLUENCE
─────────────────────────────────
Overall: 🟢 6 of 8 models Bullish
[Filter: All | Crypto | Equities | Macro | FX]

CRYPTO
  🟢 Crypto Breadth      Bullish   Value: 67.3%   Updated: 2h ago    [View →]
  🟢 Altcoin 100 Index   Bullish   Value: 142.8   Updated: 1h ago    [View →]
  🟡 BTC Dominance       Neutral   Value: 54.2%   Updated: 1h ago    [View →]

EQUITIES
  🟢 Equity Breadth      Bullish   Value: 71.2%   Updated: 6h ago    [View →]
  🔴 Retail Sentiment    Bearish   Value: 78.1    Updated: 8h ago    [View →]
  🟢 Sector Rotation     Improving — XLK, XLF     Updated: 2d ago    [View →]

MACRO / FX
  🟢 CFTC COT            Bullish   BTC net long   Updated: 3d ago    [View →]
  ⚪ FX Volatility        Neutral   —              Updated: 6h ago    [View →]

─────────────────────────────────
CONFLUENCE HISTORY
[Chart: % models bullish over time, overlaid with SPX/BTC price]
```

**Implementation:**
- Single Django view queries all published `QuantModel` objects, gets latest `ModelDataPoint`, computes signal for each
- `ConfluenceSnapshot` model: `date`, `n_bullish`, `n_bearish`, `n_neutral`, `total_models`, `asset_class`
- **This page is free (non-premium)** — it's a marketing tool. Individual model detail pages are premium.

---

## Section I — Data Architecture

### I1. Data Sources by Category

**Market Prices (OHLCV):**
- **yfinance** (free) — daily historical for stocks, ETFs, FX, crypto. Use for all existing models.
- **Polygon.io** ($29/month) — reliable real-time US equities + crypto. Upgrade path when scale demands.
- **Binance WebSocket** (free) — real-time crypto. No API key for public streams. Use for dashboard watchlist.
- **CoinGecko** (free: 30 calls/min) — market cap, dominance, global metrics, coin list.

**Fundamentals:**
- **Financial Modeling Prep** ($15/month) — income statements, ratios, earnings surprises, analyst estimates.
- **SEC EDGAR** (free) — 10-K, 10-Q, insider transactions.

**Options & Volatility:**
- **CBOE** (free) — VIX history, Put/Call ratio CSV endpoints.
- **Tradier** ($10/month) — options chains with Greeks. Not needed yet.

**Macro & Sentiment (all free):**

| Source | Data | Endpoint |
|--------|------|----------|
| FRED API | M2, CPI, unemployment, yields | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=M2SL` |
| AAII | Weekly bull/bear survey | `https://www.aaii.com/sentimentsurvey/sent_results` |
| CNN Fear & Greed | Daily composite | `https://production.dataviz.cnn.io/index/fearandgreed/graphdata` |
| NAAIM | Fund manager equity allocation | `https://www.naaim.org/programs/naaim-exposure-index/` |
| CFTC | Weekly COT positioning | `https://www.cftc.gov/dea/newcot/` |
| US Treasury | Yield curve | `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/` |

**Alternative Data:**
- **QuiverQuant** ($20/month) — congressional trades, insider trades, lobbying, government contracts.

---

### I2. Dashboard Architecture (How to Make It Fast)

**The rule: no calculation happens at page load time. Everything is pre-computed.**

**Layer 1 — Celery Beat Schedule:**
```
Every hour:
  - update_crypto_prices()       → CoinGecko/Binance → DB
  - update_watchlist_prices()    → yfinance/Polygon → Redis

Every day at 06:00 UTC:
  - update_crypto_breadth()
  - update_equity_breadth()
  - update_sector_rotation()
  - update_retail_sentiment()
  - check_alert_subscriptions()
  - check_expired_trials()

Every Saturday:
  - update_cot_positioning()

Every Monday:
  - update_new_crypto_listings()
```

**Layer 2 — Redis Cache:**
```python
# After computing a model, write to Redis with TTL:
r.setex('model:equity_breadth:latest', 3600, json.dumps(result))

# Django view reads from Redis — no DB query:
def equity_breadth_api(request):
    cached = r.get('model:equity_breadth:latest')
    if cached:
        return JsonResponse(json.loads(cached))  # <5ms
    return compute_from_db()  # fallback
```

**Layer 3 — Pre-serialised Chart JSON:**
```python
# In Celery task, store chart data directly on the model:
model.chart_data_json = json.dumps({
    'labels': ['2024-01-01', ...],
    'datasets': [
        {'label': '% Above 50 DMA', 'data': [72.1, ...]},
        {'label': '% Above 200 DMA', 'data': [68.4, ...]},
    ]
})
model.save(update_fields=['chart_data_json', 'last_updated'])
# View returns model.chart_data_json directly → <100ms total
```

**Layer 4 — WebSockets (Django Channels) for real-time prices:**
```python
class PriceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add('price_updates', self.channel_name)
        await self.accept()

    async def price_update(self, event):
        await self.send(text_data=json.dumps(event['data']))

# In Celery price task:
async_to_sync(channel_layer.group_send)('price_updates', {
    'type': 'price_update',
    'data': {'BTC': 85420, 'ETH': 3210}
})
```

**Layer 5 — Cloudflare (free tier):** CDN for static assets (~20ms globally). Long cache headers. DDoS protection + SSL.

---

### I3. Frontend Stack

**Chart library by type:**

| Chart Type | Library | Why |
|-----------|---------|-----|
| Candlestick / OHLCV | TradingView widget | Free embed, unbeatable for candles |
| Line charts (model history) | Chart.js | Lightweight (60kb), fast, great defaults |
| Scatter / quant charts | Plotly.js | Scientific charts with hover tooltips |
| Sector rotation quadrant | Chart.js bubble | Sectors as bubbles in 2x2 quadrant |
| Heat maps | Chart.js matrix or custom SVG | Full control |
| Confluence grid | Plain HTML/CSS | No chart library needed |

**Design tokens:**
```css
:root {
  --bg-primary: #0a0a0f;
  --bg-card: #111118;
  --bg-card-hover: #16161f;
  --bg-border: #1e1e2e;
  --accent: #00d4aa;
  --accent-dim: #00d4aa22;
  --signal-bull: #00c853;
  --signal-bear: #d50000;
  --signal-neutral: #666680;
  --text-primary: #e8e8f0;
  --text-secondary: #888899;
  --text-muted: #444455;
  --chart-1: #00d4aa;
  --chart-2: #6c8ebf;
  --chart-3: #ff9f40;
  --chart-4: #ff6384;
}
```

**Skeleton loaders (shimmer on load):**
```css
.skeleton {
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-hover) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

**HTMX lazy load with skeleton:**
```html
<div hx-get="/api/models/equity-breadth/chart/"
     hx-trigger="load"
     hx-swap="outerHTML">
  <div class="skeleton" style="height: 300px;"></div>
</div>
```

**Fonts:** Inter (UI) + JetBrains Mono (prices/numbers/code)

---

### I4. Data Cost Summary

| Service | Use Case | Cost |
|---------|---------|------|
| yfinance | Daily OHLCV for all models | Free |
| CoinGecko | Crypto prices and metadata | Free |
| Binance WebSocket | Real-time crypto prices | Free |
| FRED API | Macro data | Free |
| CFTC | COT positioning | Free |
| AAII / CNN / NAAIM | Sentiment inputs | Free |
| Financial Modeling Prep | Fundamentals + earnings | $15/month |
| QuiverQuant | Congressional trades | $20/month |
| Redis (managed) | Caching layer | ~$15/month |
| **Total today** | | **$50/month** |
| Polygon.io (upgrade path) | Real-time US equities | +$29/month |
| **Total at scale** | | **$79/month** |

> For reference: TradingRiot, AskLivermore, and Koyfin run on data stacks costing $200–2,000/month. Q(h)Edge can replicate 80% of their functionality for $50/month because your models are macro/daily-frequency, not options/tick-level.

---

## Section J — Quick Wins (< 1 day each)

| # | Task | How |
|---|------|-----|
| QW1 | Cookies banner | `django-cookie-consent`. GDPR-compliant. One template include. |
| QW2 | Disclaimer on signup | Checkbox: "I accept the Terms of Service." Store `terms_accepted_at` in `UserProfile`. |
| QW3 | reCAPTCHA v3 | `django-recaptcha`. v3 is invisible — no friction. |
| QW4 | TradingView chart templates per model | Add `tradingview_symbol` and `tradingview_indicators` JSONField to `QuantModel`. Inject into widget `studies` config. |
| QW5 | Comment emoji reactions | Also add to model pages, not just newsletter posts. |
