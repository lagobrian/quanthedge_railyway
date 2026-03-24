"""Fetch economic data from FRED (Federal Reserve Economic Data)."""
import os
from datetime import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from models.models import MacroDataPoint, DataFetchLog

# Key FRED series to track
FRED_SERIES = {
    # Interest Rates
    'DGS10': 'US 10-Year Treasury Yield',
    'DGS2': 'US 2-Year Treasury Yield',
    'DFF': 'Federal Funds Effective Rate',
    'T10Y2Y': '10Y-2Y Treasury Spread (Yield Curve)',
    'T10Y3M': '10Y-3M Treasury Spread',
    # Inflation
    'CPIAUCSL': 'CPI (All Urban Consumers)',
    'CPILFESL': 'Core CPI (Ex Food & Energy)',
    'PCEPI': 'PCE Price Index',
    'PCEPILFE': 'Core PCE Price Index',
    'MICH': 'Michigan Consumer Inflation Expectations',
    # Employment
    'UNRATE': 'Unemployment Rate',
    'PAYEMS': 'Total Nonfarm Payrolls',
    'ICSA': 'Initial Jobless Claims',
    'CCSA': 'Continued Jobless Claims',
    # GDP & Growth
    'GDP': 'Gross Domestic Product',
    'GDPC1': 'Real GDP',
    # Money Supply & Liquidity
    'M2SL': 'M2 Money Supply',
    'WALCL': 'Fed Balance Sheet (Total Assets)',
    'RRPONTSYD': 'Reverse Repo (ON RRP)',
    # Market Indicators
    'VIXCLS': 'VIX (CBOE Volatility Index)',
    'BAMLH0A0HYM2': 'High Yield OAS Spread',
    'DTWEXBGS': 'US Dollar Index (Trade Weighted)',
    # Housing
    'CSUSHPINSA': 'Case-Shiller Home Price Index',
    'MORTGAGE30US': '30-Year Mortgage Rate',
    # Consumer
    'UMCSENT': 'Michigan Consumer Sentiment',
    'RSXFS': 'Retail Sales (Ex Food Services)',
    # Manufacturing
    'MANEMP': 'Manufacturing Employment',
    'INDPRO': 'Industrial Production Index',
}


class Command(BaseCommand):
    help = 'Fetch economic data from FRED API'

    def add_arguments(self, parser):
        parser.add_argument('--series', nargs='+', help='Specific series IDs to fetch')
        parser.add_argument('--days', type=int, default=365, help='Days of history to fetch')

    def handle(self, *args, **options):
        api_key = os.environ.get('FRED_API_KEY', '')
        if not api_key:
            self.stderr.write('FRED_API_KEY not set. Get one at https://fred.stlouisfed.org/docs/api/api_key.html')
            return

        log = DataFetchLog.objects.create(source='fred', command='fetch_fred', status='running')

        try:
            from fredapi import Fred
            fred = Fred(api_key=api_key)

            series_to_fetch = options.get('series') or list(FRED_SERIES.keys())
            total = 0

            for series_id in series_to_fetch:
                try:
                    name = FRED_SERIES.get(series_id, series_id)
                    self.stdout.write(f'  Fetching {series_id} ({name})...')
                    data = fred.get_series(series_id, observation_start=f'{datetime.now().year - 1}-01-01')

                    count = 0
                    for date, value in data.items():
                        if value is not None and str(value) != 'nan':
                            MacroDataPoint.objects.update_or_create(
                                source='fred', series_id=series_id, date=date.date(),
                                defaults={'value': float(value), 'series_name': name, 'country': 'US'}
                            )
                            count += 1
                    total += count
                    self.stdout.write(f'    → {count} points')
                except Exception as e:
                    self.stderr.write(f'    Error: {e}')

            log.status = 'success'
            log.records_fetched = total
            log.completed_at = timezone.now()
            log.save()
            self.stdout.write(self.style.SUCCESS(f'FRED: {total} data points saved'))

        except Exception as e:
            log.status = 'failed'
            log.error_message = str(e)
            log.completed_at = timezone.now()
            log.save()
            self.stderr.write(f'FRED fetch failed: {e}')
