"""Fetch economic data from World Bank API."""
import requests
from datetime import date
from django.core.management.base import BaseCommand
from django.utils import timezone
from models.models import MacroDataPoint, DataFetchLog

# Key World Bank indicators
WB_INDICATORS = {
    'NY.GDP.MKTP.CD': ('GDP (current USD)', 'WLD'),
    'NY.GDP.MKTP.KD.ZG': ('GDP Growth (%)', 'WLD'),
    'FP.CPI.TOTL.ZG': ('Inflation, consumer prices (%)', 'WLD'),
    'SL.UEM.TOTL.ZS': ('Unemployment (%)', 'WLD'),
    'BN.CAB.XOKA.CD': ('Current Account Balance', 'USA'),
    'GC.DOD.TOTL.GD.ZS': ('Government Debt (% GDP)', 'USA'),
    'FR.INR.RINR': ('Real Interest Rate (%)', 'USA'),
    'BX.KLT.DINV.CD.WD': ('FDI Net Inflows', 'WLD'),
    'CM.MKT.LCAP.CD': ('Market Cap Listed Companies', 'USA'),
    'NY.GDP.PCAP.CD': ('GDP per Capita', 'USA'),
    'PA.NUS.FCRF': ('Exchange Rate (LCU per USD)', 'EMU'),
    'FI.RES.TOTL.CD': ('Total Reserves (incl Gold)', 'WLD'),
}

# Also fetch for key economies
COUNTRIES = ['USA', 'CHN', 'JPN', 'DEU', 'GBR', 'IND', 'BRA', 'KEN']


class Command(BaseCommand):
    help = 'Fetch economic data from World Bank API'

    def add_arguments(self, parser):
        parser.add_argument('--years', type=int, default=5, help='Years of history')

    def handle(self, *args, **options):
        log = DataFetchLog.objects.create(source='worldbank', command='fetch_worldbank', status='running')
        years = options['years']
        start_year = date.today().year - years
        total = 0

        try:
            for indicator, (name, default_country) in WB_INDICATORS.items():
                countries = [default_country] if default_country != 'WLD' else ['WLD']
                if default_country == 'USA':
                    countries = ['USA']

                for country in countries:
                    try:
                        self.stdout.write(f'  Fetching {indicator} for {country}...')
                        url = f'https://api.worldbank.org/v2/country/{country}/indicator/{indicator}'
                        params = {
                            'format': 'json',
                            'date': f'{start_year}:{date.today().year}',
                            'per_page': 500,
                        }
                        res = requests.get(url, params=params, timeout=30)
                        if res.status_code != 200:
                            self.stderr.write(f'    HTTP {res.status_code}')
                            continue

                        data = res.json()
                        if len(data) < 2 or not data[1]:
                            self.stdout.write(f'    No data')
                            continue

                        count = 0
                        for entry in data[1]:
                            if entry.get('value') is not None:
                                MacroDataPoint.objects.update_or_create(
                                    source='worldbank',
                                    series_id=indicator,
                                    date=date(int(entry['date']), 12, 31),
                                    defaults={
                                        'value': float(entry['value']),
                                        'series_name': name,
                                        'country': entry.get('country', {}).get('id', country),
                                        'unit': entry.get('unit', ''),
                                    }
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
            self.stdout.write(self.style.SUCCESS(f'World Bank: {total} data points saved'))

        except Exception as e:
            log.status = 'failed'
            log.error_message = str(e)
            log.completed_at = timezone.now()
            log.save()
            self.stderr.write(f'World Bank fetch failed: {e}')
