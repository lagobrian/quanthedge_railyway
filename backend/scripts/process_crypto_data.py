"""
process_crypto_data.py
Reads CSV files produced by fetch_crypto_data.R,
computes breadth indicators and market-cap weighted indices,
and writes results into the Django database.
"""
import os
import sys
import subprocess
from pathlib import Path
from datetime import date

# Setup Django
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

import pandas as pd
import numpy as np
from models.models import CryptoBreadth, CryptoPrice, CryptoIndex, CryptoGlobalQuote

DATA_DIR = BACKEND_DIR / 'data'
RSCRIPT_PATH = Path(__file__).parent / 'fetch_crypto_data.R'

# Stablecoins and wrapped tokens to exclude from breadth/index
EXCLUDE_SYMBOLS = {
    'USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'FDUSD', 'USDD', 'PYUSD',
    'WBTC', 'WETH', 'STETH', 'WBNB', 'CBETH', 'RETH',
}


def run_r_fetch():
    """Run the R script to fetch fresh data from CoinMarketCap."""
    print("Running R data fetch script...")
    rscript = _find_rscript()
    if not rscript:
        print("ERROR: Rscript not found. Install R and crypto2 package.")
        return False
    result = subprocess.run(
        [rscript, str(RSCRIPT_PATH), str(DATA_DIR)],
        capture_output=True, text=True, timeout=600
    )
    print(result.stdout)
    if result.returncode != 0:
        print(f"R script error:\n{result.stderr}")
        return False
    return True


def _find_rscript():
    """Find Rscript executable on Windows."""
    # Check PATH first
    for name in ['Rscript', 'Rscript.exe']:
        from shutil import which
        path = which(name)
        if path:
            return path
    # Check common Windows R install locations
    for base in [r'C:\Program Files\R', r'C:\Program Files (x86)\R']:
        if os.path.isdir(base):
            for d in sorted(os.listdir(base), reverse=True):
                candidate = os.path.join(base, d, 'bin', 'Rscript.exe')
                if os.path.isfile(candidate):
                    return candidate
    return None


def process_listings():
    """Process latest_listings.csv -> CryptoPrice records + breadth + index."""
    listings_file = DATA_DIR / 'latest_listings.csv'
    if not listings_file.exists():
        print("No latest_listings.csv found, skipping.")
        return

    df = pd.read_csv(listings_file)
    print(f"Processing {len(df)} listings...")

    today = date.today()

    # Save prices
    for _, row in df.iterrows():
        symbol = str(row.get('symbol', '')).upper()
        if not symbol or symbol in EXCLUDE_SYMBOLS:
            continue
        CryptoPrice.objects.update_or_create(
            symbol=symbol, date=today,
            defaults={
                'name': row.get('name', ''),
                'close': row.get('price', None),
                'market_cap': row.get('market_cap', None),
                'volume': row.get('volume_24h', None),
            }
        )

    print(f"  Saved {len(df)} price records for {today}")


def process_price_history():
    """Process recent_prices.csv -> CryptoPrice records."""
    prices_file = DATA_DIR / 'recent_prices.csv'
    if not prices_file.exists():
        print("No recent_prices.csv found, skipping.")
        return

    df = pd.read_csv(prices_file)
    print(f"Processing {len(df)} historical price records...")

    count = 0
    for _, row in df.iterrows():
        symbol = str(row.get('symbol', '')).upper()
        if not symbol or symbol in EXCLUDE_SYMBOLS:
            continue
        ts = row.get('timestamp', row.get('time_close', ''))
        if pd.isna(ts) or not ts:
            continue
        try:
            d = pd.to_datetime(ts).date()
        except Exception:
            continue
        CryptoPrice.objects.update_or_create(
            symbol=symbol, date=d,
            defaults={
                'name': row.get('name', ''),
                'open': row.get('open', None) if not pd.isna(row.get('open', None)) else None,
                'high': row.get('high', None) if not pd.isna(row.get('high', None)) else None,
                'low': row.get('low', None) if not pd.isna(row.get('low', None)) else None,
                'close': row.get('close', None) if not pd.isna(row.get('close', None)) else None,
                'volume': row.get('volume', None) if not pd.isna(row.get('volume', None)) else None,
                'market_cap': row.get('market_cap', None) if not pd.isna(row.get('market_cap', None)) else None,
            }
        )
        count += 1

    print(f"  Saved {count} historical price records")


def compute_breadth():
    """Compute % above 50/100/200 DMA from stored CryptoPrice data."""
    print("Computing breadth indicators...")

    prices_qs = CryptoPrice.objects.exclude(
        symbol__in=EXCLUDE_SYMBOLS
    ).exclude(close__isnull=True).values('symbol', 'date', 'close').order_by('symbol', 'date')

    if not prices_qs.exists():
        print("  No price data available for breadth computation.")
        return

    df = pd.DataFrame(list(prices_qs))
    pivot = df.pivot_table(index='date', columns='symbol', values='close')
    pivot = pivot.sort_index()

    if len(pivot) < 10:
        print(f"  Only {len(pivot)} dates of data, need more for meaningful DMAs.")
        return

    for lookback in [50, 100, 200]:
        ma = pivot.rolling(lookback, min_periods=max(1, lookback // 2)).mean()
        above = (pivot > ma).astype(int)
        # For each date, % of coins with data that are above their DMA
        total_coins = pivot.notna().sum(axis=1)
        pct_above = (above.sum(axis=1) / total_coins * 100).round(2)
        pct_above = pct_above.replace([np.inf, -np.inf], np.nan).dropna()

        col_name = f'pct_above_{lookback}dma'
        for d, val in pct_above.items():
            defaults = {col_name: val}
            obj, created = CryptoBreadth.objects.get_or_create(
                date=d, defaults={
                    'pct_above_50dma': 0, 'pct_above_100dma': 0, 'pct_above_200dma': 0
                }
            )
            setattr(obj, col_name, val)
            obj.save()

    print(f"  Breadth computed for {len(pivot)} dates")


def compute_altcoin_index():
    """Compute market-cap weighted Altcoin 100 Index from stored prices."""
    print("Computing Altcoin 100 market-cap weighted index...")

    prices_qs = CryptoPrice.objects.exclude(
        symbol__in=EXCLUDE_SYMBOLS | {'BTC'}
    ).exclude(close__isnull=True).exclude(market_cap__isnull=True).values(
        'symbol', 'date', 'close', 'market_cap'
    ).order_by('date', 'symbol')

    if not prices_qs.exists():
        print("  No price data for index computation.")
        return

    df = pd.DataFrame(list(prices_qs))
    dates = sorted(df['date'].unique())

    index_values = []
    prev_value = 100.0  # Start index at 100

    for i, d in enumerate(dates):
        day_data = df[df['date'] == d].copy()
        # Take top 100 by market cap
        top100 = day_data.nlargest(100, 'market_cap')

        if len(top100) < 5:
            continue

        # Market-cap weights
        total_mcap = top100['market_cap'].sum()
        top100['weight'] = top100['market_cap'] / total_mcap

        if i == 0:
            index_values.append({'date': d, 'value': 100.0, 'daily_return': 0, 'num': len(top100)})
            continue

        # Get previous day's prices for the same symbols
        prev_date = dates[i - 1]
        prev_data = df[(df['date'] == prev_date) & (df['symbol'].isin(top100['symbol']))]
        if prev_data.empty:
            continue

        merged = top100.merge(prev_data[['symbol', 'close']], on='symbol', suffixes=('', '_prev'))
        merged = merged.dropna(subset=['close', 'close_prev'])
        merged = merged[merged['close_prev'] > 0]

        if merged.empty:
            continue

        merged['return'] = (merged['close'] / merged['close_prev']) - 1
        weighted_return = (merged['return'] * merged['weight']).sum()
        prev_value = prev_value * (1 + weighted_return)

        index_values.append({
            'date': d, 'value': round(prev_value, 4),
            'daily_return': round(weighted_return * 100, 4),
            'num': len(top100)
        })

    for iv in index_values:
        CryptoIndex.objects.update_or_create(
            index_name='alt100', date=iv['date'],
            defaults={
                'value': iv['value'],
                'daily_return': iv['daily_return'],
                'num_constituents': iv['num'],
            }
        )

    print(f"  Altcoin 100 Index computed for {len(index_values)} dates")


def process_global_quotes():
    """Process global_quotes.csv -> CryptoGlobalQuote records."""
    gq_file = DATA_DIR / 'global_quotes.csv'
    if not gq_file.exists():
        print("No global_quotes.csv found, skipping.")
        return

    df = pd.read_csv(gq_file)
    print(f"Processing {len(df)} global quote records...")

    for _, row in df.iterrows():
        ts = row.get('last_updated', row.get('timestamp', ''))
        if pd.isna(ts) or not ts:
            continue
        try:
            d = pd.to_datetime(ts).date()
        except Exception:
            continue

        CryptoGlobalQuote.objects.update_or_create(
            date=d,
            defaults={
                'btc_dominance': row.get('btc_dominance', None),
                'eth_dominance': row.get('eth_dominance', None),
                'active_cryptocurrencies': int(row.get('active_cryptocurrencies', 0)) if not pd.isna(row.get('active_cryptocurrencies', 0)) else None,
                'total_market_cap': row.get('total_market_cap', None),
                'total_volume_24h': row.get('total_volume_24h', None),
                'altcoin_market_cap': row.get('altcoin_market_cap', None),
            }
        )

    print(f"  Saved global quotes")


def main():
    print(f"{'='*60}")
    print(f"Crypto Data Pipeline - {date.today()}")
    print(f"{'='*60}")

    # Step 1: Fetch data from CMC via R
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    fetch_ok = run_r_fetch()

    if not fetch_ok:
        print("\nR fetch failed. Processing any existing CSV data...")

    # Step 2: Process CSVs into Django DB
    process_listings()
    process_price_history()
    process_global_quotes()

    # Step 3: Compute derived indicators
    compute_breadth()
    compute_altcoin_index()

    print(f"\n{'='*60}")
    print("Pipeline complete.")
    print(f"  CryptoPrice records: {CryptoPrice.objects.count()}")
    print(f"  CryptoBreadth records: {CryptoBreadth.objects.count()}")
    print(f"  CryptoIndex records: {CryptoIndex.objects.count()}")
    print(f"  CryptoGlobalQuote records: {CryptoGlobalQuote.objects.count()}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
