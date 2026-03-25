# Quant (h)Edge — Design Inspiration & Implementation Notes

> From AskLivermore, TradingRiot, and similar platforms. Date: 24 March 2026

---

## 1. Weekly Auto-Generated Snapshot Newsletter
- Cron job (weekly, Monday morning) that:
  - Queries all models for current signals + last week's changes
  - Generates matplotlib chart thumbnails for each model
  - Creates a draft Post with the charts arranged in a grid layout
  - Author/analyst edits the draft, adds commentary, publishes
- Template: "Q(h)Edge Weekly Snapshot — Week of {date}"
- Charts arranged 2x2 or 3-column grid in the email HTML

## 2. Seasonality Research (user will provide model logic)
- Placeholder for when user builds the seasonality Jupyter notebook
- Will integrate like other models once logic is provided

## 3. Translucent Glass-Effect Cards
- Cards with: `backdrop-blur`, `bg-card/60`, `border border-border/50`
- Semi-transparent backgrounds that let the page gradient show through
- Subtle border, no heavy shadows
- Apply across: model cards, stats cards, dashboard panels

## 4. Live Signal Indicator
- Green blinking dot next to "LIVE" text on model cards
- Shows the most recent signal for that model
- CSS animation: `@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }`
- Display: `🟢 LIVE · Bullish` or `🔴 LIVE · Bearish`

## 5. Paywall Preview (show 2-3 results, blur the rest)
- On model listing cards, show 2-3 sample results visible
- Rest of the list fades/blurs with a gradient overlay
- "Unlock all signals" CTA button over the blur
- More compelling than just a lock icon

## 6. Custom TradingView Chart Styling
- TradingView widget supports custom `overrides` for colors:
  - Background: match our theme `#061829` dark / `#f8f9fc` light
  - Candle colors: our palette (green `#00FF9D`, red `#ff2400`)
  - Grid: `#413510` dark / `#e0e4ea` light
- Pass via widget URL params or `studies_overrides`

## 7. Login/Signup Toggle (single page)
- Single page with email + password fields
- Toggle between "Log In" and "Sign Up" without clearing fields
- Minimal design: just email, password, and the toggle
- No full name on signup (collect later via profile completion)

## 8. Backtest Panel with Dropdown
- Backtest results page has a dropdown selector at the top
- Select: instrument, model, or parameter set
- Results update below: stats cards + equity chart + trades table
- Compact layout, everything visible without scrolling
