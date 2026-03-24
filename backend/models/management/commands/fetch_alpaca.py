"""Fetch stock/ETF/crypto prices from Alpaca Markets API."""
import os
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from models.models import StockPrice, DataFetchLog

# Key tickers to track
STOCK_TICKERS = [
    # Major indices ETFs
    'SPY', 'QQQ', 'IWM', 'DIA',
    # Sector ETFs
    'XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'XLP', 'XLU', 'XLRE', 'XLB', 'XLC', 'XLY',
    # International
    'EEM', 'EFA', 'VWO', 'FXI',
    # Bonds
    'TLT', 'IEF', 'SHY', 'HYG', 'LQD', 'AGG',
    # Commodities
    'GLD', 'SLV', 'USO', 'UNG',
    # Volatility
    'VIXY',
    # Mega caps
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
    # Crypto ETFs
    'IBIT', 'FBTC', 'ETHE',
]

CRYPTO_TICKERS = [
    'BTC/USD', 'ETH/USD', 'SOL/USD', 'DOGE/USD', 'ADA/USD',
    'AVAX/USD', 'DOT/USD', 'LINK/USD', 'MATIC/USD', 'UNI/USD',
]


class Command(BaseCommand):
    help = 'Fetch stock and crypto prices from Alpaca Markets'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=30, help='Days of history')
        parser.add_argument('--stocks-only', action='store_true')
        parser.add_argument('--crypto-only', action='store_true')

    def handle(self, *args, **options):
        api_key = os.environ.get('ALPACA_API_KEY', '')
        api_secret = os.environ.get('ALPACA_SECRET_KEY', '')

        if not api_key or not api_secret:
            self.stdout.write('ALPACA_API_KEY/ALPACA_SECRET_KEY not set. Falling back to yfinance...')
            self._fetch_yfinance(options)
            return

        log = DataFetchLog.objects.create(source='alpaca', command='fetch_alpaca', status='running')

        try:
            from alpaca.data.historical import StockHistoricalDataClient, CryptoHistoricalDataClient
            from alpaca.data.requests import StockBarsRequest, CryptoBarsRequest
            from alpaca.data.timeframe import TimeFrame

            days = options['days']
            start = datetime.now() - timedelta(days=days)
            total = 0

            # Stocks
            if not options.get('crypto_only'):
                self.stdout.write('Fetching stock prices...')
                stock_client = StockHistoricalDataClient(api_key, api_secret)
                try:
                    request = StockBarsRequest(
                        symbol_or_symbols=STOCK_TICKERS,
                        timeframe=TimeFrame.Day,
                        start=start,
                    )
                    bars = stock_client.get_stock_bars(request)
                    for bar in bars.data.values():
                        for b in bar:
                            StockPrice.objects.update_or_create(
                                symbol=b.symbol, date=b.timestamp.date(), source='alpaca',
                                defaults={
                                    'open': float(b.open), 'high': float(b.high),
                                    'low': float(b.low), 'close': float(b.close),
                                    'volume': float(b.volume),
                                }
                            )
                            total += 1
                    self.stdout.write(f'  Stocks: {total} bars')
                except Exception as e:
                    self.stderr.write(f'  Stock error: {e}')

            # Crypto
            if not options.get('stocks_only'):
                self.stdout.write('Fetching crypto prices...')
                crypto_client = CryptoHistoricalDataClient()
                try:
                    request = CryptoBarsRequest(
                        symbol_or_symbols=CRYPTO_TICKERS,
                        timeframe=TimeFrame.Day,
                        start=start,
                    )
                    bars = crypto_client.get_crypto_bars(request)
                    crypto_count = 0
                    for bar in bars.data.values():
                        for b in bar:
                            sym = b.symbol.replace('/', '')
                            StockPrice.objects.update_or_create(
                                symbol=sym, date=b.timestamp.date(), source='alpaca',
                                defaults={
                                    'open': float(b.open), 'high': float(b.high),
                                    'low': float(b.low), 'close': float(b.close),
                                    'volume': float(b.volume),
                                }
                            )
                            crypto_count += 1
                    total += crypto_count
                    self.stdout.write(f'  Crypto: {crypto_count} bars')
                except Exception as e:
                    self.stderr.write(f'  Crypto error: {e}')

            log.status = 'success'
            log.records_fetched = total
            log.completed_at = timezone.now()
            log.save()
            self.stdout.write(self.style.SUCCESS(f'Alpaca: {total} price bars saved'))

        except Exception as e:
            log.status = 'failed'
            log.error_message = str(e)
            log.completed_at = timezone.now()
            log.save()
            self.stderr.write(f'Alpaca fetch failed: {e}')

    def _fetch_yfinance(self, options):
        """Fallback to yfinance when Alpaca keys aren't available."""
        log = DataFetchLog.objects.create(source='yfinance', command='fetch_alpaca(yfinance)', status='running')
        try:
            import yfinance as yf
            days = options['days']
            period = f'{days}d'
            tickers = STOCK_TICKERS
            total = 0

            self.stdout.write(f'Fetching {len(tickers)} tickers via yfinance ({period})...')
            data = yf.download(tickers, period=period, group_by='ticker', threads=True)

            for ticker in tickers:
                try:
                    if len(tickers) == 1:
                        df = data
                    else:
                        df = data[ticker]
                    df = df.dropna(subset=['Close'])
                    for idx, row in df.iterrows():
                        StockPrice.objects.update_or_create(
                            symbol=ticker, date=idx.date(), source='yfinance',
                            defaults={
                                'open': float(row.get('Open', 0) or 0),
                                'high': float(row.get('High', 0) or 0),
                                'low': float(row.get('Low', 0) or 0),
                                'close': float(row['Close']),
                                'volume': float(row.get('Volume', 0) or 0),
                            }
                        )
                        total += 1
                except Exception as e:
                    self.stderr.write(f'  {ticker}: {e}')

            log.status = 'success'
            log.records_fetched = total
            log.completed_at = timezone.now()
            log.save()
            self.stdout.write(self.style.SUCCESS(f'yfinance: {total} price bars saved'))

        except Exception as e:
            log.status = 'failed'
            log.error_message = str(e)
            log.completed_at = timezone.now()
            log.save()
            self.stderr.write(f'yfinance fetch failed: {e}')
