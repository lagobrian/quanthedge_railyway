"""
Equity Breadth Pipeline
=======================
Fetches S&P 500 constituent prices via yfinance and computes daily breadth metrics:
  - pct_above_50dma   : % of stocks trading above their 50-day moving average
  - pct_above_100dma  : % of stocks trading above their 100-day moving average
  - pct_above_200dma  : % of stocks trading above their 200-day moving average
  - pct_outperforming_spx : % of stocks whose 1-year return beats SPY

Run from GitHub Actions daily after US market close.
Requires env vars: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
"""

import os
import sys
import datetime
import psycopg2
import pandas as pd
import yfinance as yf

# ── DB connection ──────────────────────────────────────────────────────────────

def get_conn():
    return psycopg2.connect(
        host=os.environ["DB_HOST"],
        port=int(os.environ.get("DB_PORT", 5432)),
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        sslmode="require",
    )

# ── S&P 500 tickers from Wikipedia ────────────────────────────────────────────

def get_sp500_tickers() -> list[str]:
    url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
    tables = pd.read_html(url)
    df = tables[0]
    tickers = df["Symbol"].tolist()
    # yfinance uses "-" not "." for BRK.B, BF.B etc.
    tickers = [t.replace(".", "-") for t in tickers]
    return tickers

# ── Fetch prices ───────────────────────────────────────────────────────────────

def fetch_prices(tickers: list[str], days: int = 252) -> pd.DataFrame:
    """Download adjusted close prices for all tickers over the last `days` calendar days."""
    end = datetime.date.today()
    start = end - datetime.timedelta(days=days + 60)  # buffer for weekends/holidays

    print(f"Downloading {len(tickers)} tickers from {start} to {end} ...")
    raw = yf.download(
        tickers,
        start=str(start),
        end=str(end),
        auto_adjust=True,
        progress=False,
        threads=True,
    )

    if isinstance(raw.columns, pd.MultiIndex):
        prices = raw["Close"]
    else:
        prices = raw[["Close"]].rename(columns={"Close": tickers[0]})

    prices = prices.dropna(how="all")
    print(f"Downloaded {prices.shape[1]} symbols × {prices.shape[0]} rows")
    return prices

# ── Compute breadth ────────────────────────────────────────────────────────────

def compute_breadth(prices: pd.DataFrame) -> pd.DataFrame:
    """Return a DataFrame indexed by date with breadth metrics."""
    results = []

    # SPY for outperformance calc
    spy = prices.get("SPY")

    for dma in [50, 100, 200]:
        dma_col = f"above_{dma}dma"
        ma = prices.rolling(dma, min_periods=dma).mean()
        prices[dma_col] = (prices > ma).astype(float)  # per-ticker boolean

    # Only use dates where we have at least 200 trading days of history
    valid_dates = prices.index[200:]

    for date in valid_dates:
        row = prices.loc[date]
        # drop tickers with NaN on this date
        valid = row.dropna()
        # only count non-indicator columns (actual tickers)
        ticker_mask = ~valid.index.str.startswith("above_")
        tickers_today = valid[ticker_mask].index.tolist()
        n = len(tickers_today)
        if n < 100:
            continue

        def pct(col):
            vals = prices.loc[date, [f"{col}" if col in prices.columns else col]]
            # work per ticker
            above = 0
            total = 0
            for t in tickers_today:
                col_name = col.replace("TICKER", t) if "TICKER" in col else col
                _ = col  # unused
                break
            # simpler approach: column slicing
            return None

        # Cleaner approach: compute % above per date from the boolean above_Xdma matrix
        def pct_above(dma):
            col = f"above_{dma}dma"
            vals = prices.loc[date, tickers_today]  # actual prices not flags
            ma_val = prices[tickers_today].rolling(dma, min_periods=dma).mean().loc[date]
            above = (vals > ma_val).sum()
            total = vals.notna().sum()
            return 100.0 * above / total if total > 0 else None

        # Outperformance vs SPY
        pct_outperf = None
        if spy is not None:
            try:
                spy_1y = spy.loc[date] / spy.iloc[max(0, spy.index.get_loc(date) - 252)] - 1
                stock_1y = prices[tickers_today].iloc[max(0, prices.index.get_loc(date) - 252):prices.index.get_loc(date) + 1]
                returns_1y = stock_1y.iloc[-1] / stock_1y.iloc[0] - 1
                pct_outperf = 100.0 * (returns_1y > spy_1y).sum() / len(returns_1y.dropna())
            except Exception:
                pct_outperf = None

        results.append({
            "date": date.date(),
            "pct_above_50dma": pct_above(50),
            "pct_above_100dma": pct_above(100),
            "pct_above_200dma": pct_above(200),
            "pct_outperforming_spx": pct_outperf,
            "num_constituents": n,
        })

    return pd.DataFrame(results)


def compute_breadth_vectorized(prices: pd.DataFrame) -> pd.DataFrame:
    """Vectorized breadth calculation — much faster than row-by-row."""
    # Separate SPY from the basket
    spy_series = prices.get("SPY")

    # Moving averages
    ma50 = prices.rolling(50, min_periods=50).mean()
    ma100 = prices.rolling(100, min_periods=100).mean()
    ma200 = prices.rolling(200, min_periods=200).mean()

    above50 = (prices > ma50)
    above100 = (prices > ma100)
    above200 = (prices > ma200)

    # Count per row (ignore NaN)
    count = prices.notna().sum(axis=1)
    pct50 = 100.0 * above50.sum(axis=1) / count
    pct100 = 100.0 * above100.sum(axis=1) / count
    pct200 = 100.0 * above200.sum(axis=1) / count

    # Only keep rows with enough history (at least 200 rows prior)
    valid_idx = prices.index[200:]

    # 252-day return for each stock vs SPY
    ret252 = prices / prices.shift(252) - 1
    if spy_series is not None:
        spy_ret = ret252["SPY"]
        beats_spy = (ret252.gt(spy_ret, axis=0)).sum(axis=1)
        pct_outperf = 100.0 * beats_spy / count
    else:
        pct_outperf = pd.Series(index=prices.index, dtype=float)

    df = pd.DataFrame({
        "date": valid_idx.date,
        "pct_above_50dma": pct50.loc[valid_idx].values,
        "pct_above_100dma": pct100.loc[valid_idx].values,
        "pct_above_200dma": pct200.loc[valid_idx].values,
        "pct_outperforming_spx": pct_outperf.loc[valid_idx].values if spy_series is not None else None,
        "num_constituents": count.loc[valid_idx].astype(int).values,
    })
    return df.dropna(subset=["pct_above_200dma"])

# ── Upsert to DB ───────────────────────────────────────────────────────────────

UPSERT_SQL = """
INSERT INTO crypto_models_equitybreadth
    (date, pct_above_50dma, pct_above_100dma, pct_above_200dma, pct_outperforming_spx, num_constituents)
VALUES (%s, %s, %s, %s, %s, %s)
ON CONFLICT (date) DO UPDATE SET
    pct_above_50dma = EXCLUDED.pct_above_50dma,
    pct_above_100dma = EXCLUDED.pct_above_100dma,
    pct_above_200dma = EXCLUDED.pct_above_200dma,
    pct_outperforming_spx = EXCLUDED.pct_outperforming_spx,
    num_constituents = EXCLUDED.num_constituents;
"""

def upsert(conn, df: pd.DataFrame):
    with conn.cursor() as cur:
        rows = [
            (
                row.date,
                float(row.pct_above_50dma),
                float(row.pct_above_100dma),
                float(row.pct_above_200dma),
                float(row.pct_outperforming_spx) if pd.notna(row.pct_outperforming_spx) else None,
                int(row.num_constituents) if pd.notna(row.num_constituents) else None,
            )
            for row in df.itertuples()
        ]
        cur.executemany(UPSERT_SQL, rows)
    conn.commit()
    print(f"Upserted {len(rows)} rows into crypto_models_equitybreadth")

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    tickers = get_sp500_tickers()
    # Always include SPY for outperformance benchmark
    if "SPY" not in tickers:
        tickers.append("SPY")

    prices = fetch_prices(tickers, days=400)  # ~400 cal days ≥ 252 trading days + buffer
    df = compute_breadth_vectorized(prices)

    if df.empty:
        print("No breadth data computed — aborting")
        sys.exit(1)

    print(df.tail(5).to_string())

    conn = get_conn()
    try:
        upsert(conn, df)
    finally:
        conn.close()

    print("Done.")


if __name__ == "__main__":
    main()
