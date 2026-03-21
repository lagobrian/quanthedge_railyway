"""Django management command to run the crypto data pipeline."""
import subprocess
import sys
from pathlib import Path
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Fetch crypto data from CoinMarketCap and compute indicators'

    def handle(self, *args, **kwargs):
        script = Path(__file__).resolve().parent.parent.parent.parent / 'scripts' / 'process_crypto_data.py'
        self.stdout.write(f"Running {script}...")
        result = subprocess.run(
            [sys.executable, str(script)],
            capture_output=True, text=True
        )
        self.stdout.write(result.stdout)
        if result.stderr:
            self.stderr.write(result.stderr)
        if result.returncode == 0:
            self.stdout.write(self.style.SUCCESS('Crypto data update complete.'))
        else:
            self.stdout.write(self.style.ERROR('Crypto data update failed.'))
