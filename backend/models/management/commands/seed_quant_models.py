from django.core.management.base import BaseCommand


MODEL_DEFINITIONS = [
    {
        'name': 'Crypto Breadth',
        'slug': 'crypto-breadth',
        'short_description': 'Tracks the percentage of cryptocurrencies trading above key moving averages.',
        'description': 'Tracks the percentage of cryptocurrencies trading above their 50, 100, and 200-day moving averages.',
        'methodology': 'For each date, the model measures the share of tracked cryptocurrencies trading above their 50-day, 100-day, and 200-day moving averages.',
        'how_to_trade': 'Extremely weak breadth can signal washed-out conditions, while broad participation can confirm sustained uptrends.',
        'asset_class': 'crypto',
        'frequency': 'daily',
        'data_source': 'CoinMarketCap',
        'is_published': True,
        'is_premium': False,
        'page_url': '/models/crypto-breadth',
        'data_model': 'CryptoBreadth',
    },
    {
        'name': 'Equity Breadth',
        'slug': 'equity-breadth',
        'short_description': 'Tracks the percentage of S&P 500 stocks above key moving averages.',
        'description': 'Tracks the percentage of S&P 500 stocks trading above their 50, 100, and 200-day moving averages, plus the share outperforming the S&P 500.',
        'methodology': 'The model aggregates daily breadth statistics for S&P 500 constituents, including moving-average participation and relative performance versus the index.',
        'how_to_trade': 'Use it to gauge market participation. Strong breadth tends to confirm rallies, while deteriorating breadth can warn of weak internals.',
        'asset_class': 'equity',
        'frequency': 'daily',
        'data_source': 'Yahoo Finance (yfinance)',
        'is_published': True,
        'is_premium': False,
        'page_url': '/models/equity-breadth',
        'data_model': 'EquityBreadth',
    },
    {
        'name': 'Altcoin 100 Index',
        'slug': 'altcoin-index',
        'short_description': 'Market-cap weighted index of major altcoins versus Bitcoin.',
        'description': 'Live market-cap weighted index of top altcoins versus Bitcoin with charting and constituent weights.',
        'methodology': 'The index combines top altcoin constituents using market-cap weights and live Binance price data to build a synthetic benchmark.',
        'how_to_trade': 'Use the index to compare altcoin beta against Bitcoin and track whether broad alt participation is strengthening or weakening.',
        'asset_class': 'crypto',
        'frequency': 'hourly',
        'data_source': 'Binance + CoinMarketCap',
        'is_published': True,
        'is_premium': False,
        'page_url': '/models/altcoin-index',
        'data_model': 'CryptoIndex',
    },
    {
        'name': 'BTC Dominance & Global Metrics',
        'slug': 'global-metrics',
        'short_description': 'Tracks Bitcoin dominance, total market cap, and global crypto breadth metrics.',
        'description': 'Tracks Bitcoin dominance, Ethereum dominance, total market cap, and broader global crypto market metrics over time.',
        'methodology': 'The model uses aggregated market-wide crypto statistics to monitor shifts in dominance, participation, and total market capitalization.',
        'how_to_trade': 'Use it to judge whether capital is concentrating in large caps like Bitcoin or rotating into the broader crypto market.',
        'asset_class': 'crypto',
        'frequency': 'hourly',
        'data_source': 'CoinMarketCap',
        'is_published': True,
        'is_premium': False,
        'page_url': '/models/global-metrics',
        'data_model': 'CryptoGlobalQuote',
    },
]


class Command(BaseCommand):
    help = 'Seed the QuantModel registry with the core production model entries'

    def handle(self, *args, **kwargs):
        from models.models import QuantModel

        for definition in MODEL_DEFINITIONS:
            slug = definition['slug']
            obj, created = QuantModel.objects.update_or_create(
                slug=slug,
                defaults=definition,
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(f'{status}: {obj.name} ({obj.slug})')

        self.stdout.write(self.style.SUCCESS('Quant model seed complete!'))
