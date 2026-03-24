# Quant (h)Edge — Competitor Insights & UX Improvements

> Extracted from analysis of: AskLivermore, Finviz, TradingView, CapitolTrades, Koyfin, AlphaSpread, Quantower
> Date: 24 March 2026

---

## Top 5 Highest-Impact Changes (by effort-to-value)

| # | Change | Inspired By | Effort | Status |
|---|--------|-------------|--------|--------|
| CI-1 | Sync backtest subplots (equity + drawdown shared x-axis) | Koyfin | 30 min | Pending |
| CI-2 | `hovermode: 'x unified'` on all charts + indicator pill toggles above chart | TradingView | 20 min | Pending |
| CI-3 | Colored badges + visual gauges on stat numbers | AlphaSpread + CapitolTrades | 1 hour | Pending |
| CI-4 | Sortable table view toggle on backtests listing | CapitolTrades + AskLivermore | 2 hours | Pending |
| CI-5 | Treemap heat map on crypto breadth (coins above/below DMA) | Finviz | 2 hours | Pending |

---

## Detailed Insights Per Platform

### From Finviz: Treemap Heat Maps
- Add a treemap component to crypto breadth page: rectangle size = market cap, color = above/below DMA
- Plotly has `treemap` trace type built in (already installed)
- No chart chrome — the visualization IS the interface
- Shows "which coins are above/below the 50 DMA right now" at a glance

### From TradingView: Persistent Toolbar + Indicator Overlays
- Replace basic DMA toggles with colored chip/pill bar ABOVE the chart
- Each pill matches the line color, click to toggle visibility
- Add timeframe selector buttons (1D, 1W, 1M, 3M, 1Y, ALL) pinned above chart, not inside Plotly range slider
- Enable `hovermode: 'x unified'` for synced crosshair data readout

### From Koyfin: Multi-Panel Dashboard with Synced Time Axes
- Use Plotly `subplots` with `shared_xaxes: true` to stack equity curve + drawdown into one figure with linked zoom/pan
- Add sticky key metrics bar above charts that stays visible while scrolling
- Comparison mode: overlay strategy vs benchmark as rebased lines (both starting at 100)

### From AlphaSpread: Visual Gauges and Valuation Meters
- Add gauge/meter bars behind stat numbers showing where they fall on a scale
  - Sharpe: <0.5 red, 0.5-1.0 yellow, >1.0 green
  - Max Drawdown: <-10% green, -10 to -30% yellow, >-30% red
  - Win Rate: <40% red, 40-60% yellow, >60% green
- Add summary verdict badge per backtest: "Strategy Rating: A+" or "Risk-Adjusted: Strong"
- Progressive disclosure: show 5-6 key metrics by default, "Show detailed metrics" expander for 20+

### From CapitolTrades: Table + Timeline Hybrid
- Sortable data table view as alternative to cards on backtests page (toggle Card/Table)
- Sortable columns: Strategy | Return | Sharpe | Max DD | Win Rate
- Colored inline badges: Long = blue pill, Short = orange pill
- Entity pages: aggregate pages like "All Crypto Strategies" with comparison tables

### From AskLivermore: Screener with Sparklines
- Inline sparkline thumbnails in model/backtest listing cards showing recent trajectory
- Composite ranking score: single number weighting Sharpe, return, drawdown, win rate
- Instant client-side filtering (no "Apply" button, just click and results update)

### From Quantower: Volume Profile Visualization
- Y-axis histogram showing volume concentration at price levels
- Multi-panel responsive grid: 1920px shows chart + stats side-by-side, 1366px stacks them
- Diverging heatmap color scale (red-white-green centered on zero) with numbers AND colors

---

## Additional Feature Ideas (from competitive analysis)

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| CI-6 | Strategy vs benchmark overlay on backtest equity curve | Medium | Koyfin-style rebased comparison |
| CI-7 | Composite backtest score (single ranking number) | Low | Weight Sharpe/return/drawdown/win rate |
| CI-8 | Progressive disclosure on stat cards | Low | Show 6 key stats, expand for 20+ |
| CI-9 | Entity/category pages for backtests | Medium | "All Crypto Strategies" aggregate view |
| CI-10 | Volume profile y-axis histogram on price models | High | When we have price-based models |
