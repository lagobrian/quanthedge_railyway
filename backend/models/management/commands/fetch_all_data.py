"""Master command to fetch data from all sources."""
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Fetch data from all sources (crypto2, FRED, World Bank, Alpaca)'

    def add_arguments(self, parser):
        parser.add_argument('--source', choices=['all', 'crypto', 'fred', 'worldbank', 'alpaca'],
                          default='all', help='Which source to fetch')
        parser.add_argument('--days', type=int, default=30)

    def handle(self, *args, **options):
        source = options['source']

        if source in ('all', 'crypto'):
            self.stdout.write(self.style.MIGRATE_HEADING('=== Crypto (crypto2 + breadth) ==='))
            try:
                call_command('update_crypto')
            except Exception as e:
                self.stderr.write(f'Crypto fetch error: {e}')

        if source in ('all', 'fred'):
            self.stdout.write(self.style.MIGRATE_HEADING('=== FRED ==='))
            try:
                call_command('fetch_fred', days=options['days'])
            except Exception as e:
                self.stderr.write(f'FRED fetch error: {e}')

        if source in ('all', 'worldbank'):
            self.stdout.write(self.style.MIGRATE_HEADING('=== World Bank ==='))
            try:
                call_command('fetch_worldbank')
            except Exception as e:
                self.stderr.write(f'World Bank fetch error: {e}')

        if source in ('all', 'alpaca'):
            self.stdout.write(self.style.MIGRATE_HEADING('=== Alpaca/yfinance ==='))
            try:
                call_command('fetch_alpaca', days=options['days'])
            except Exception as e:
                self.stderr.write(f'Alpaca fetch error: {e}')

        self.stdout.write(self.style.SUCCESS('All data fetches complete.'))
