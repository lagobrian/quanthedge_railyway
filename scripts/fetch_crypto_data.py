"""
Crypto Data Pipeline - CoinMarketCap Web API + Binance
=====================================================
Replicates what the crypto2 R package does: scrapes CMC's web API (no API key).
Combines with Binance for OHLCV price data.

Computes and stores:
1. Altcoin 100 Market-Cap Weighted Index (excl BTC, stablecoins, wrapped)
2. Crypto Breadth (% above 50/100/200 DMA)
3. Global Metrics (BTC/ETH dominance, total market cap)

Output: JSON files in data/cmc/models/ for the Next.js frontend to serve.
"""

import os
import sys
import json
import time
import requests
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ============================================================
# CONFIG
# ============================================================

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "cmc")
MODELS_DIR = os.path.join(DATA_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

CMC_BASE = "https://web-api.coinmarketcap.com"
BINANCE_BASE = "https://api.binance.com/api/v3"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
}

# Stablecoins and wrapped tokens to exclude from the index
STABLECOINS = {
    "USDT", "USDC", "DAI", "BUSD", "TUSD", "USDP", "FRAX", "USDD", "GUSD",
    "PYUSD", "FDUSD", "USDJ", "CUSD", "RSV", "SUSD", "LUSD", "MIM", "FEI",
    "ALUSD", "USDN", "HUSD", "OUSD", "DOLA", "EURS", "EURT", "XSGD",
    "UST", "USTC", "USDS", "USDX", "USD0",
}
WRAPPED = {
    "WBTC", "WETH", "WBNB", "STETH", "WSTETH", "RETH", "CBETH", "HBTC",
    "RENBTC", "SBTC", "TBTC", "BTCB", "BETH",
}
EXCLUDE = STABLECOINS | WRAPPED | {"BTC"}

SLEEP_BETWEEN_REQUESTS = 2  # seconds between CMC requests

# ============================================================
# HELPERS
# ============================================================

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def cmc_request(path, params=None, retries=3):
    """Make a request to CMC web API with retry logic."""
    url = f"{CMC_BASE}{path}"
    for attempt in range(retries):
        try:
            resp = requests.get(url, headers=HEADERS, params=params, timeout=30)
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 429:
                wait = 60 * (attempt + 1)
                log(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
            else:
                log(f"  CMC returned {resp.status_code}: {resp.text[:200]}")
                time.sleep(10)
        except Exception as e:
            log(f"  Request error: {e}")
            time.sleep(10)
    return None


def binance_klines(symbol, interval="1d", limit=1000):
    """Fetch klines from Binance."""
    try:
        resp = requests.get(
            f"{BINANCE_BASE}/klines",
            params={"symbol": symbol, "interval": interval, "limit": limit},
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json()
            return [
                {
                    "time": k[0],
                    "date": datetime.utcfromtimestamp(k[0] / 1000).strftime("%Y-%m-%d"),
                    "open": float(k[1]),
                    "high": float(k[2]),
                    "low": float(k[3]),
                    "close": float(k[4]),
                    "volume": float(k[5]),
                }
                for k in data
            ]
    except Exception as e:
        log(f"  Binance error for {symbol}: {e}")
    return None


def save_json(data, filename):
    """Save data as JSON."""
    path = os.path.join(MODELS_DIR, filename)
    with open(path, "w") as f:
        json.dump(data, f)
    log(f"  Saved {path} ({len(data)} records)")


# ============================================================
# 1. FETCH CMC LISTINGS (market cap rankings)
# ============================================================

def fetch_cmc_listings():
    """Fetch latest CMC listings with market cap data."""
    log("Fetching CMC listings (latest)...")
    data = cmc_request("/v1/cryptocurrency/listings/latest", {
        "start": "1",
        "limit": "500",
        "convert": "USD",
        "sortBy": "market_cap",
        "sortType": "desc",
        "cryptocurrency_type": "all",
        "tag": "all",
        "audited": "false",
    })

    if not data or "data" not in data:
        log("  Failed to fetch CMC listings, trying alternative endpoint...")
        data = cmc_request("/v1/cryptocurrency/listings/latest", {
            "start": "1",
            "limit": "500",
            "convert": "USD",
        })

    if not data or "data" not in data:
        log("  ERROR: Could not fetch CMC listings")
        return []

    coins = []
    for coin in data["data"]:
        symbol = coin.get("symbol", "")
        quote = coin.get("quote", {}).get("USD", {})
        coins.append({
            "id": coin.get("id"),
            "name": coin.get("name"),
            "symbol": symbol,
            "slug": coin.get("slug"),
            "cmc_rank": coin.get("cmc_rank"),
            "market_cap": quote.get("market_cap", 0),
            "price": quote.get("price", 0),
            "volume_24h": quote.get("volume_24h", 0),
            "percent_change_24h": quote.get("percent_change_24h", 0),
            "circulating_supply": coin.get("circulating_supply", 0),
        })

    log(f"  Got {len(coins)} coins from CMC")

    # Save raw listings
    listings_path = os.path.join(DATA_DIR, "listings_latest.json")
    with open(listings_path, "w") as f:
        json.dump(coins, f)

    return coins


# ============================================================
# 2. FETCH CMC GLOBAL METRICS (historical)
# ============================================================

def fetch_cmc_global_metrics():
    """Fetch historical global crypto metrics from CMC."""
    log("Fetching CMC global metrics (historical)...")

    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=730)).strftime("%Y-%m-%d")

    data = cmc_request("/v1/global-metrics/quotes/historical", {
        "convert": "USD",
        "format": "chart_crypto_details",
        "interval": "1d",
        "time_end": end_date,
        "time_start": start_date,
    })

    if not data or "data" not in data:
        # Try alternative format
        data = cmc_request("/v1/global-metrics/quotes/historical", {
            "convert": "USD",
            "interval": "1d",
            "time_end": end_date,
            "time_start": start_date,
        })

    if not data or "data" not in data:
        log("  WARNING: Could not fetch CMC global metrics")
        return []

    quotes = data["data"].get("quotes", data["data"])
    if isinstance(quotes, list):
        metrics = []
        for q in quotes:
            quote = q.get("quote", {}).get("USD", q.get("quote", q))
            timestamp = q.get("timestamp", "")
            date = timestamp[:10] if timestamp else ""
            metrics.append({
                "date": date,
                "btc_dominance": q.get("btc_dominance", quote.get("btc_dominance", 0)),
                "eth_dominance": q.get("eth_dominance", quote.get("eth_dominance", 0)),
                "total_market_cap": quote.get("total_market_cap", 0),
                "total_volume_24h": quote.get("total_volume_24h", 0),
                "active_cryptocurrencies": q.get("active_cryptocurrencies", 0),
            })
        return metrics

    log("  WARNING: Unexpected global metrics format")
    return []


# ============================================================
# 3. MAP CMC SYMBOLS TO BINANCE SYMBOLS
# ============================================================

def get_binance_symbols():
    """Fetch all USDT trading pairs from Binance."""
    log("Fetching Binance exchange info...")
    try:
        resp = requests.get(f"{BINANCE_BASE}/exchangeInfo", timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            symbols = {}
            for s in data["symbols"]:
                if s["status"] == "TRADING" and s["quoteAsset"] == "USDT":
                    symbols[s["baseAsset"]] = s["symbol"]
            log(f"  Got {len(symbols)} USDT pairs from Binance")
            return symbols
    except Exception as e:
        log(f"  Error fetching Binance symbols: {e}")
    return {}


# ============================================================
# 4. COMPUTE ALTCOIN 100 INDEX
# ============================================================

def compute_altcoin_index(cmc_coins, binance_symbols):
    """
    Compute market-cap weighted altcoin index.
    Like S&P 500: top 100 altcoins by market cap, weighted by market cap.
    Excludes BTC, stablecoins, and wrapped tokens.
    """
    log("Computing Altcoin 100 Index...")

    # Filter to altcoins only (exclude BTC, stablecoins, wrapped)
    altcoins = [c for c in cmc_coins if c["symbol"] not in EXCLUDE and c["market_cap"] > 0]
    altcoins.sort(key=lambda x: x["market_cap"], reverse=True)
    top100 = altcoins[:100]

    log(f"  Top 100 altcoins selected (top: {top100[0]['symbol']}, bottom: {top100[-1]['symbol']})")

    # Map to Binance symbols and fetch price history
    coin_data = {}
    total_fetched = 0

    for coin in top100:
        sym = coin["symbol"]
        binance_sym = binance_symbols.get(sym)
        if not binance_sym:
            continue

        klines = binance_klines(binance_sym, "1d", 365)
        if klines:
            coin_data[sym] = {
                "market_cap": coin["market_cap"],
                "klines": klines,
            }
            total_fetched += 1

        # Rate limit
        if total_fetched % 20 == 0:
            log(f"  Fetched {total_fetched} coins...")
            time.sleep(1)

    log(f"  Got price data for {total_fetched}/{len(top100)} coins")

    if total_fetched < 10:
        log("  ERROR: Not enough price data for index calculation")
        return []

    # Build date-aligned price dataframe
    all_dates = set()
    for sym, d in coin_data.items():
        for k in d["klines"]:
            all_dates.add(k["date"])

    all_dates = sorted(all_dates)

    # Create price matrix
    prices = {}
    mcaps = {}
    for sym, d in coin_data.items():
        price_map = {k["date"]: k["close"] for k in d["klines"]}
        prices[sym] = [price_map.get(dt) for dt in all_dates]
        mcaps[sym] = d["market_cap"]

    prices_df = pd.DataFrame(prices, index=all_dates).ffill()

    # Compute simple arithmetic returns
    returns_df = prices_df.pct_change()

    # Market-cap weights (fixed at current snapshot, like S&P rebalancing)
    total_mcap = sum(mcaps[s] for s in prices_df.columns if s in mcaps)
    weights = {s: mcaps.get(s, 0) / total_mcap for s in prices_df.columns}
    weight_series = pd.Series(weights)

    # Weighted portfolio return
    weighted_returns = (returns_df * weight_series).sum(axis=1)

    # Cumulative index starting at 100
    index_values = (1 + weighted_returns).cumprod() * 100
    index_values.iloc[0] = 100

    # Build output
    result = []
    for i, date in enumerate(all_dates):
        daily_ret = float(weighted_returns.iloc[i]) * 100 if i > 0 else 0
        result.append({
            "date": date,
            "value": round(float(index_values.iloc[i]), 4),
            "daily_return": round(daily_ret, 4),
            "num_constituents": int((~returns_df.iloc[i].isna()).sum()) if i > 0 else len(prices_df.columns),
        })

    save_json(result, "altcoin_index.json")

    # Also save constituents list
    constituents = [
        {"symbol": sym, "market_cap": mcaps[sym], "weight": round(weights[sym] * 100, 4)}
        for sym in sorted(weights, key=lambda x: weights[x], reverse=True)
    ]
    save_json(constituents, "altcoin_index_constituents.json")

    return result


# ============================================================
# 5. COMPUTE CRYPTO BREADTH
# ============================================================

def compute_crypto_breadth(cmc_coins, binance_symbols):
    """
    Compute % of coins above their 50/100/200 DMA.
    Uses top 100 coins by market cap (incl BTC, excl stablecoins).
    """
    log("Computing Crypto Breadth...")

    # Use top 100 non-stablecoin coins
    valid = [c for c in cmc_coins if c["symbol"] not in STABLECOINS and c["symbol"] not in WRAPPED and c["market_cap"] > 0]
    valid.sort(key=lambda x: x["market_cap"], reverse=True)
    top100 = valid[:100]

    # Fetch price data (need 200+ days for 200 DMA)
    prices_data = {}
    fetched = 0

    for coin in top100:
        sym = coin["symbol"]
        binance_sym = binance_symbols.get(sym)
        if not binance_sym:
            continue

        klines = binance_klines(binance_sym, "1d", 500)
        if klines:
            prices_data[sym] = {k["date"]: k["close"] for k in klines}
            fetched += 1

        if fetched % 20 == 0:
            log(f"  Fetched {fetched} coins for breadth...")
            time.sleep(1)

    log(f"  Got price data for {fetched} coins")

    if fetched < 10:
        log("  ERROR: Not enough data for breadth calculation")
        return []

    # Build price dataframe
    all_dates = sorted(set(d for prices in prices_data.values() for d in prices))
    prices_df = pd.DataFrame(
        {sym: [prices.get(d) for d in all_dates] for sym, prices in prices_data.items()},
        index=all_dates,
    ).astype(float)
    prices_df = prices_df.ffill()

    # Compute DMAs
    sma_50 = prices_df.rolling(50).mean()
    sma_100 = prices_df.rolling(100).mean()
    sma_200 = prices_df.rolling(200).mean()

    # For each date, % of available coins above their DMA
    result = []
    for i, date in enumerate(all_dates):
        row = prices_df.iloc[i]
        valid_mask = row.notna()

        def pct_above(sma_df):
            sma_row = sma_df.iloc[i]
            both_valid = valid_mask & sma_row.notna()
            if both_valid.sum() == 0:
                return None
            above = ((row[both_valid] > sma_row[both_valid]).sum())
            return round(float(above / both_valid.sum() * 100), 2)

        p50 = pct_above(sma_50)
        p100 = pct_above(sma_100)
        p200 = pct_above(sma_200)

        if p50 is not None:
            result.append({
                "date": date,
                "pct_above_50dma": p50,
                "pct_above_100dma": p100 if p100 is not None else 0,
                "pct_above_200dma": p200 if p200 is not None else 0,
            })

    save_json(result, "crypto_breadth.json")
    return result


# ============================================================
# 6. COMPUTE GLOBAL METRICS
# ============================================================

def compute_global_metrics(cmc_global):
    """Process and store global metrics from CMC."""
    log("Processing Global Metrics...")

    if cmc_global:
        save_json(cmc_global, "global_metrics.json")
        log(f"  Saved {len(cmc_global)} days of global metrics from CMC")
        return cmc_global

    # Fallback: compute from Binance data
    log("  Falling back to Binance-based global metrics...")
    btc = binance_klines("BTCUSDT", "1d", 730)
    eth = binance_klines("ETHUSDT", "1d", 730)

    if not btc or not eth:
        log("  ERROR: Could not fetch BTC/ETH data")
        return []

    btc_map = {k["date"]: k for k in btc}
    eth_map = {k["date"]: k for k in eth}
    dates = sorted(set(btc_map.keys()) & set(eth_map.keys()))

    result = []
    for date in dates:
        b = btc_map[date]
        e = eth_map[date]
        # Volume-weighted dominance proxy
        total = b["close"] * b["volume"] + e["close"] * e["volume"]
        result.append({
            "date": date,
            "btc_dominance": round(b["close"] * b["volume"] / total * 100, 2) if total > 0 else 50,
            "eth_dominance": round(e["close"] * e["volume"] / total * 100, 2) if total > 0 else 20,
            "btc_price": b["close"],
            "eth_price": e["close"],
            "total_market_cap": None,
            "active_cryptocurrencies": None,
        })

    save_json(result, "global_metrics.json")
    return result


# ============================================================
# MAIN
# ============================================================

def main():
    start = time.time()
    log("=" * 60)
    log("CRYPTO DATA PIPELINE - Starting")
    log("=" * 60)

    # Step 1: Get CMC listings
    cmc_coins = fetch_cmc_listings()
    time.sleep(SLEEP_BETWEEN_REQUESTS)

    # Step 2: Get CMC global metrics
    cmc_global = fetch_cmc_global_metrics()
    time.sleep(SLEEP_BETWEEN_REQUESTS)

    # Step 3: Get Binance symbol mapping
    binance_syms = get_binance_symbols()

    if not cmc_coins:
        log("WARNING: CMC listings failed, building coin list from Binance...")
        # Fallback: use Binance top coins by volume
        cmc_coins = [
            {"symbol": sym, "market_cap": i, "name": sym.replace("USDT", "")}
            for i, sym in enumerate(["ETH", "BNB", "SOL", "XRP", "DOGE", "ADA",
                "AVAX", "DOT", "TRX", "LINK", "MATIC", "SHIB", "LTC", "BCH",
                "ATOM", "UNI", "XLM", "ETC", "NEAR", "APT", "FIL", "ARB", "OP",
                "MKR", "AAVE", "GRT", "INJ", "FTM", "THETA", "ALGO", "XTZ",
                "SAND", "MANA", "AXS", "EGLD", "FLOW", "CHZ", "APE", "GALA",
                "RUNE", "ENJ", "COMP", "SNX", "YFI", "SUSHI", "CRV", "DYDX",
                "1INCH", "BAT", "BTC"], 0, -1)
        ]

    # Step 4: Compute Altcoin 100 Index
    compute_altcoin_index(cmc_coins, binance_syms)

    # Step 5: Compute Crypto Breadth
    compute_crypto_breadth(cmc_coins, binance_syms)

    # Step 6: Compute Global Metrics
    compute_global_metrics(cmc_global)

    elapsed = time.time() - start
    log("=" * 60)
    log(f"PIPELINE COMPLETE in {elapsed:.0f}s")
    log(f"Output: {MODELS_DIR}")
    log("=" * 60)


if __name__ == "__main__":
    main()
