# Quant (h)Edge — Updates 2: New Features & Models Backlog

> **What this page is:** New features and original Q(h)Edge models to build — informed by the 11 platforms reviewed and the AI Companion trend. The models section is grounded in existing research. Everything here is detailed enough to hand directly to Claude Code.

> **Already built / researched (excluded from proposals below):**
> - ✅ Crypto Breadth, Altcoin 100 Index, BTC Dominance & Global Metrics (live on site)
> - ✅ Equity Breadth — S&P 500 % above 50/100/200 DMA (backtested in R, Oct 2024 post)
> - ✅ % of Outperforming Constituents (researched, noisy but useful at extremes)
> - ✅ Sector Representatives via Vine Copulas (single-name proxies per sector)
> - ✅ FX Volatility Profiles (session/calendar/weekday/hour for 10 major pairs)
> - ✅ Crypto New Listings study (8,000+ coins, Jan 2025 post)
> - ✅ BTC vs Altcoin leadership (Jan 2025 post)
> - ✅ CFTC data backtest (multi-strategy, multi-asset, multi-timeframe — to be published)
> - ✅ VIX / Markov / stochastic process research (ongoing series)

---

## 🤖 Section A — The Q(h)Edge AI Companion

*Inspired by MMT's "Companion" — an AI agent that lives alongside your data and charts, powered by Claude Sonnet.*

### A1. AI Companion — Core Implementation

**What it is:** A persistent chat panel on every model page and dashboard. User asks questions in natural language. Has context about: (1) current model, (2) current signal, (3) user's watchlist, (4) all published Q(h)Edge research.

**Stack:**
- Backend: `/api/companion/chat/` → proxies to Anthropic API (claude-sonnet-4-6)
- Dynamic system prompt injects: model data, user watchlist, Q(h)Edge research principles, active signals
- Frontend: sliding panel (right side, ~400px), markdown rendering, SSE streaming
- Rate limiting: Free 10 msg/day, Premium 100/day via `CompanionUsage` model

**System prompt structure:**
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

Answer as a precise, data-grounded quant analyst. Be direct. Never hallucinate market data.
```

**UI:** 💬 icon fixed bottom-right. On model pages: "Ask Companion" button below chart.

### A2. Companion — Chart Markup Feature

AI returns structured JSON overlays for TradingView charts:
```json
{
  "chart_overlays": [
    {"type": "horizontal_line", "price": 69000, "label": "Monthly POC", "color": "#FF6B35"},
    {"type": "horizontal_line", "price": 71500, "label": "Resistance", "color": "#FF0000"},
    {"type": "label", "price": 70000, "text": "Watch this zone", "color": "#00FF00"}
  ]
}
```

### A3. Companion — Model Q&A Training

`CompanionKnowledgeBase` model: `topic`, `question`, `answer`, `is_active`. Seed with Q&As from Substack research. Keyword-match top 5 relevant entries into system prompt.

---

## 🏠 Section B — Homepage Dashboard

### B1. Homepage Dashboard — Full Layout Spec

**Route:** `/` (move current homepage to `/about/`)

**Layout (3-column on desktop):**
```
┌─────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                          │
├────────────────────────┬────────────────────────┬───────────────┤
│  TradingView Chart     │  Model Confluence      │  AI Companion │
│  (user-selectable)     │  Dashboard             │  Panel        │
│  [2/3 width]           │  [1/3 width]           │  [Slide-over] │
├────────────────────────┴────────────────────────┴───────────────┤
│  WATCHLIST TABLE: ticker | price | 24h% | 7d% | Model Signal   │
├─────────────────────────────────────────────────────────────────┤
│  LATEST NEWSLETTERS (3 most recent posts)                        │
└─────────────────────────────────────────────────────────────────┘
```

- TradingView Advanced Chart widget (free), user-selectable ticker
- Model Confluence: compact cards per model with signal, confluence score
- Watchlist: user-configurable, default BTC/ETH/SPX/DXY/GOLD/OIL
- `UserWatchlist` model: user, ticker, order
- `UserPreferences` model: last_viewed_ticker

---

## 🔔 Section C — Alert System

### C1. Alert Data Models

```python
class AlertSubscription(models.Model):
    user = ForeignKey(User)
    model = ForeignKey(QuantModel)
    trigger_type = CharField(choices=['any_signal', 'bullish_only', 'bearish_only', 'threshold_cross', 'extreme'])
    threshold_value = FloatField(null=True)
    channel_email = BooleanField(default=True)
    channel_telegram = BooleanField(default=False)
    channel_whatsapp = BooleanField(default=False)
    channel_discord = BooleanField(default=False)
    frequency = CharField(choices=['immediate', 'daily_digest', 'weekly_digest'])

class UserNotificationSettings(models.Model):
    user = OneToOneField(User)
    telegram_chat_id = CharField(blank=True)
    whatsapp_number = CharField(blank=True)
    discord_webhook_url = CharField(blank=True)
```

### C2. Alert Delivery Channels

| Channel | Provider | Cost | Setup |
|---------|----------|------|-------|
| Email | Amazon SES (existing) | ~Free | Already done |
| Telegram | python-telegram-bot | Free | Create bot via BotFather |
| Discord | Webhooks | Free | User pastes webhook URL |
| WhatsApp | Twilio / Meta Cloud API | ~$0.005/msg | User enters phone number |
| SMS | Twilio | ~$0.01/msg | Reserve for extremes only |
| Web Push | pywebpush | Free | Browser permission |

### C3. Alert Settings Page

**Route:** `/settings/notifications/`
- Connected channels with connect/disconnect
- Model alert subscriptions table (add/edit/delete)
- Global preferences (frequency, quiet hours, max alerts/day)

---

## ⏱️ Section D — Trial Period System

### D1. Implementation

- 7-day free trial on registration (no credit card required)
- `UserSubscription` model: user, plan (free/trial/basic/premium), trial_start, trial_end, stripe IDs
- Trial emails: Day 0 (welcome), Day 5 (ending soon), Day 7 (expired)
- Daily Celery task to downgrade expired trials
- `PromoCode` model: code, discount_type, max_redemptions, extends_trial_days

---

## 🔐 Section E — Social Login & OAuth

### E1. OAuth Providers

Priority order: Google → Twitter/X → Discord → GitHub → Apple

Using `django-allauth`. On first OAuth login: auto-assign funny username, DiceBear avatar, start 7-day trial, skip email verification.

**Crypto wallet (SIWE):** "Connect Wallet" button, MetaMask signature verification via `siwe-py`.

---

## ₿ Section F — Pay With Crypto

### F1. NOWPayments Integration

- 300+ cryptocurrencies, ~0.5% fee, no KYC
- User selects coin → gets wallet address + QR code → payment confirmed via IPN webhook
- Manual renewal for now (no auto-renew with crypto)

---

## 🆕 Section G — New Original Models

### G1. Equity Breadth (research done, build website version)
- Daily: fetch S&P 500 constituents, calculate % above 50/100/200 DMA
- Divergence Alert: SPX new high but breadth lower than previous high

### G2. Sector Rotation Model
- Weekly: 4w and 12w relative strength for 11 sector ETFs vs SPY
- Quadrant classification: Leading/Weakening/Lagging/Improving
- 2x2 quadrant chart with rotation paths

### G3. CFTC COT Live Model (backtest done)
- Weekly: fetch COT data, calculate positioning percentile per asset
- Contrarian signals at extremes (10th/90th percentile)

### G4. Retail Sentiment Extremes Model (new research)
- Sources: AAII Survey, CNN Fear & Greed, CBOE Put/Call, NAAIM Exposure
- Composite 0-100 score, weighted average
- Extreme Bullish > 75, Extreme Bearish < 25

### G5. FX Session Volatility (interactive tool)
- Port R results to `FXVolatilityProfile` model
- Interactive calculator: pair + session + day → expected move
- Volatility regime flag: current vs historical median

---

## 📊 Section H — Model Confluence Dashboard

**Route:** `/confluence/`

All models on one page. Confluence score: "6 of 8 models Bullish". Filter by asset class. History chart: % bullish over time overlaid with SPX/BTC.

Free to view (marketing tool). Individual model detail pages are premium.

`ConfluenceSnapshot` model: date, n_bullish, n_bearish, n_neutral, total_models, asset_class

---

## ⚡ Section I — Quick Wins

| # | Task | How |
|---|------|-----|
| QW1 | Cookie consent banner | `django-cookie-consent` |
| QW2 | Terms checkbox on signup | `terms_accepted_at` field |
| QW3 | reCAPTCHA v3 | `django-recaptcha` (invisible) |
| QW4 | TradingView chart templates per model | `tradingview_symbol` + `tradingview_indicators` fields on QuantModel |
| QW5 | Comment emoji reactions on model pages | Extend PostReactions to model pages |

---

## 🚀 Master Priority Order

| # | Item | Section | Effort | Why First |
|---|------|---------|--------|-----------|
| 1 | Equity Breadth — website build | G1 | Low | Research done. Biggest gap. |
| 2 | Homepage Dashboard | B1 | Medium | Front door of the product |
| 3 | AI Companion — core chat | A1 | Medium | Differentiator |
| 4 | Social login (Google + Twitter) | E1 | Low | Reduces signup friction |
| 5 | Trial period system | D1 | Low | Can't monetise without it |
| 6 | Alert system — email + Telegram | C1-C2 | Medium | Most-requested feature |
| 7 | CFTC COT live model | G3 | Medium | Backtest done |
| 8 | Model Confluence Dashboard | H | Low | Reuses existing data |
| 9 | Retail Sentiment Model | G4 | Medium | New research + model |
| 10 | Sector Rotation Model | G2 | Medium | Completes Vine Copula research |
| 11 | Pay with Crypto | F1 | Medium | Unique to audience |
| 12 | FX Session Volatility interactive | G5 | Low | Productises existing research |
| 13 | AI Companion — chart markup | A2 | High | Needs A1 first |
| 14 | WhatsApp + SMS alerts | C2 | Medium | After Telegram proven |
| 15 | Crypto wallet login (SIWE) | E1 | High | Nice-to-have, complex |
