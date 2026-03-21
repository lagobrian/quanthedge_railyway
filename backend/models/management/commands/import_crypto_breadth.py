import os
import pandas as pd
from django.core.management.base import BaseCommand
from models.models import CryptoBreadth


class Command(BaseCommand):
    help = 'Import crypto breadth data from an Excel file and calculate breadth indicators.'

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, help='Path to the Excel file', required=True)

    def handle(self, *args, **kwargs):
        excel_path = kwargs['file']
        self.stdout.write(f"Reading: {excel_path}")
        df = pd.read_excel(excel_path)
        # Normalize columns
        df.columns = [c.lower() for c in df.columns]
        if 'timestamp' in df.columns:
            df['date'] = pd.to_datetime(df['timestamp']).dt.date
        elif 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date']).dt.date
        else:
            raise ValueError('No timestamp/date column found')
        # Ensure required columns
        assert 'symbol' in df.columns and 'close' in df.columns, 'Missing symbol or close column'
        # Sort for rolling
        df = df.sort_values(['symbol', 'date'])
        # Calculate moving averages
        for dma in [50, 100, 200]:
            df[f'dma_{dma}'] = df.groupby('symbol')['close'].transform(lambda x: x.rolling(dma, min_periods=1).mean())
            df[f'above_{dma}dma'] = df['close'] > df[f'dma_{dma}']
        # Aggregate by date
        results = []
        for date, group in df.groupby('date'):
            total = group['symbol'].nunique()
            pct_50 = 100 * group.groupby('symbol')['above_50dma'].last().sum() / total
            pct_100 = 100 * group.groupby('symbol')['above_100dma'].last().sum() / total
            pct_200 = 100 * group.groupby('symbol')['above_200dma'].last().sum() / total
            results.append({
                'date': date,
                'pct_above_50dma': pct_50,
                'pct_above_100dma': pct_100,
                'pct_above_200dma': pct_200
            })
        # Save to DB
        for row in results:
            CryptoBreadth.objects.update_or_create(
                date=row['date'],
                defaults={
                    'pct_above_50dma': row['pct_above_50dma'],
                    'pct_above_100dma': row['pct_above_100dma'],
                    'pct_above_200dma': row['pct_above_200dma'],
                }
            )
        self.stdout.write(self.style.SUCCESS('Successfully imported crypto breadth data.'))
