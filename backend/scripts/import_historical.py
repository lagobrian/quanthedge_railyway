"""
import_historical.py
Import historical crypto data from parquet/xlsx files into the Django database.
Then compute all indicators (breadth, altcoin index, etc.)
"""
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

import pandas as pd
import numpy as np
from models.models import CryptoBreadth, CryptoPrice, CryptoIndex

DATA_DIR = BACKEND_DIR / 'data' / 'historical'

EXCLUDE_SYMBOLS = {
    'USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'FDUSD', 'USDD', 'PYUSD',
    'WBTC', 'WETH', 'STETH', 'WBNB', 'CBETH', 'RETH',
}


def import_breadth_from_xlsx():
    """Import pre-computed breadth data from the xlsx files."""
    print("Importing breadth data from xlsx files...")

    breadth_data = {}
    for lookback, filename in [(50, 'above50dma.xlsx'), (100, 'above100dma.xlsx'), (200, 'above200dma.xlsx')]:
        filepath = DATA_DIR / filename
        if not filepath.exists():
            print(f"  {filename} not found, skipping.")
            continue
        df = pd.read_excel(filepath, index_col=0)
        col = df.columns[0] if len(df.columns) == 1 else df.iloc[:, 0]
        for date_val, pct_val in zip(df.index, col if isinstance(col, pd.Series) else df.iloc[:, 0]):
            try:
                d = pd.to_datetime(date_val).date()
            except Exception:
                continue
            if d not in breadth_data:
                breadth_data[d] = {'pct_above_50dma': 0, 'pct_above_100dma': 0, 'pct_above_200dma': 0}
            breadth_data[d][f'pct_above_{lookback}dma'] = round(float(pct_val), 2) if not pd.isna(pct_val) else 0

    count = 0
    for d, vals in breadth_data.items():
        CryptoBreadth.objects.update_or_create(date=d, defaults=vals)
        count += 1

    print(f"  Imported {count} breadth records")


def import_prices_from_parquet():
    """Import price data from crypto_prices.parquet (wide format: date index, symbol columns)."""
    prices_file = DATA_DIR / 'crypto_prices.parquet'
    mcap_file = DATA_DIR / 'market_caps.parquet'

    if not prices_file.exists():
        print("crypto_prices.parquet not found, skipping.")
        return

    print("Reading crypto_prices.parquet...")
    prices_df = pd.read_parquet(prices_file)
    print(f"  Shape: {prices_df.shape}")

    mcap_df = None
    if mcap_file.exists():
        print("Reading market_caps.parquet...")
        mcap_df = pd.read_parquet(mcap_file)

    # Sample: import every 7th day to keep DB size manageable
    # (full daily data for thousands of coins would be millions of rows)
    dates = sorted(prices_df.index)
    sampled_dates = dates[::7]  # Every 7 days
    # Always include the last date
    if dates[-1] not in sampled_dates:
        sampled_dates.append(dates[-1])

    print(f"  Importing {len(sampled_dates)} sampled dates (every 7 days) for top 200 coins...")

    count = 0
    for date_val in sampled_dates:
        try:
            d = pd.to_datetime(date_val).date()
        except Exception:
            continue

        row = prices_df.loc[date_val].dropna()
        # Get top 200 by market cap if available, otherwise by price
        if mcap_df is not None and date_val in mcap_df.index:
            mcap_row = mcap_df.loc[date_val].dropna()
            top_symbols = mcap_row.nlargest(200).index.tolist()
        else:
            top_symbols = row.nlargest(200).index.tolist()

        for symbol in top_symbols:
            if symbol in EXCLUDE_SYMBOLS:
                continue
            close_val = row.get(symbol)
            if close_val is None or pd.isna(close_val):
                continue
            mcap_val = None
            if mcap_df is not None and date_val in mcap_df.index:
                mcap_val = mcap_df.loc[date_val].get(symbol)
                if mcap_val is not None and pd.isna(mcap_val):
                    mcap_val = None

            CryptoPrice.objects.update_or_create(
                symbol=str(symbol), date=d,
                defaults={
                    'name': str(symbol),
                    'close': float(close_val),
                    'market_cap': float(mcap_val) if mcap_val else None,
                }
            )
            count += 1

    print(f"  Imported {count} price records")


def compute_altcoin_index_from_parquet():
    """Compute Altcoin 100 Index directly from parquet data for maximum accuracy."""
    prices_file = DATA_DIR / 'crypto_prices.parquet'
    mcap_file = DATA_DIR / 'market_caps.parquet'

    if not prices_file.exists() or not mcap_file.exists():
        print("Parquet files not found, skipping index computation.")
        return

    print("Computing Altcoin 100 Index from parquet data...")
    prices_df = pd.read_parquet(prices_file)
    mcap_df = pd.read_parquet(mcap_file)

    # Drop stablecoins and BTC
    exclude = EXCLUDE_SYMBOLS | {'BTC'}
    keep_cols = [c for c in prices_df.columns if c not in exclude]
    prices_df = prices_df[keep_cols]
    mcap_df = mcap_df[[c for c in keep_cols if c in mcap_df.columns]]

    returns = prices_df.pct_change().clip(-0.5, 5.0)  # Cap at -50% to +500% per day
    dates = sorted(prices_df.index)

    # Use monthly rebalancing like the notebook
    monthly_mcap = mcap_df.copy()
    monthly_mcap.index = pd.to_datetime(mcap_df.index).to_period('M')

    index_value = 100.0
    records = []
    current_weights = None
    current_month = None

    for i, date_val in enumerate(dates):
        try:
            d = pd.to_datetime(date_val).date()
            month = pd.to_datetime(date_val).to_period('M')
        except Exception:
            continue

        # Rebalance monthly: pick top 100 by market cap
        if current_month is None or month != current_month:
            if date_val in mcap_df.index:
                day_mcap = mcap_df.loc[date_val].dropna()
                day_mcap = day_mcap[day_mcap > 0]
                top100 = day_mcap.nlargest(min(100, len(day_mcap)))
                if len(top100) >= 5:
                    total_mcap = top100.sum()
                    current_weights = top100 / total_mcap
                    current_month = month

        if current_weights is None:
            continue

        if i == 0 or len(records) == 0:
            records.append({'date': d, 'value': 100.0, 'daily_return': 0, 'num': len(current_weights)})
            continue

        day_returns = returns.loc[date_val]
        available = current_weights.index.intersection(day_returns.dropna().index)
        if len(available) < 5:
            continue

        weighted_ret = (day_returns[available] * current_weights[available]).sum()
        if np.isnan(weighted_ret) or np.isinf(weighted_ret) or abs(weighted_ret) > 0.5:
            weighted_ret = 0  # Skip extreme days

        index_value = index_value * (1 + weighted_ret)
        records.append({
            'date': d,
            'value': round(index_value, 4),
            'daily_return': round(weighted_ret * 100, 4),
            'num': len(available),
        })

    # Save to DB
    for rec in records:
        CryptoIndex.objects.update_or_create(
            index_name='alt100', date=rec['date'],
            defaults={
                'value': rec['value'],
                'daily_return': rec['daily_return'],
                'num_constituents': rec['num'],
            }
        )

    print(f"  Altcoin 100 Index: {len(records)} dates, final value: {records[-1]['value']:.2f}")


def main():
    print("=" * 60)
    print("Historical Data Import")
    print("=" * 60)

    # 1. Import pre-computed breadth from xlsx
    import_breadth_from_xlsx()

    # 2. Import sampled price data from parquet
    import_prices_from_parquet()

    # 3. Compute Altcoin 100 Index from full parquet data
    compute_altcoin_index_from_parquet()

    print(f"\nFinal counts:")
    print(f"  CryptoBreadth: {CryptoBreadth.objects.count()}")
    print(f"  CryptoPrice: {CryptoPrice.objects.count()}")
    print(f"  CryptoIndex: {CryptoIndex.objects.count()}")
    print("=" * 60)


if __name__ == '__main__':
    main()
