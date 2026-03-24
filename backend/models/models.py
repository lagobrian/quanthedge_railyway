from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


# ─── Standardised Model Framework ─────────────────────────────────────────────

class QuantModel(models.Model):
    """A registered quantitative model on the platform."""
    ASSET_CLASSES = [
        ('crypto', 'Crypto'),
        ('equity', 'Equity'),
        ('fx', 'FX'),
        ('macro', 'Macro'),
        ('commodity', 'Commodity'),
        ('multi', 'Multi-Asset'),
    ]
    FREQUENCIES = [
        ('tick', 'Tick'),
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    SIGNAL_CHOICES = [
        ('bullish', '🟢 Bullish'),
        ('bearish', '🔴 Bearish'),
        ('neutral', '⚪ Neutral'),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    short_description = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True, help_text='What is this model?')
    methodology = models.TextField(blank=True, help_text='How does it work?')
    how_to_trade = models.TextField(blank=True, help_text='How to use the signals')
    asset_class = models.CharField(max_length=20, choices=ASSET_CLASSES, default='crypto')
    frequency = models.CharField(max_length=20, choices=FREQUENCIES, default='daily')
    data_source = models.CharField(max_length=200, blank=True)
    is_published = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)
    current_signal = models.CharField(max_length=20, choices=SIGNAL_CHOICES, null=True, blank=True)
    current_value = models.FloatField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    analysts = models.ManyToManyField(User, blank=True, related_name='assigned_models')
    # Link to the frontend page (e.g. '/models/crypto-breadth')
    page_url = models.CharField(max_length=200, blank=True)
    # Link to the data table (e.g. 'CryptoBreadth' model name)
    data_model = models.CharField(max_length=100, blank=True, help_text='Django model name for data')

    class Meta:
        ordering = ['name']
        verbose_name = 'Quantitative Model'

    def __str__(self):
        return self.name


class ModelDataPoint(models.Model):
    """Generic data point for any model."""
    model = models.ForeignKey(QuantModel, on_delete=models.CASCADE, related_name='data_points')
    timestamp = models.DateTimeField(db_index=True)
    value = models.FloatField()
    signal = models.CharField(max_length=20, choices=QuantModel.SIGNAL_CHOICES, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [models.Index(fields=['model', 'timestamp'])]

    def __str__(self):
        return f"{self.model.name} {self.timestamp}: {self.value}"


class ModelSignalResult(models.Model):
    """Forward return statistics after a signal fires."""
    model = models.ForeignKey(QuantModel, on_delete=models.CASCADE, related_name='signal_results')
    signal_type = models.CharField(max_length=20, choices=[('bullish', 'Bullish'), ('bearish', 'Bearish')])
    interval_label = models.CharField(max_length=20, help_text='e.g. 1D, 1W, 1M, 3M')
    interval_days = models.IntegerField()
    avg_return_pct = models.FloatField()
    hit_rate_pct = models.FloatField()
    sample_size = models.IntegerField()
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['model', 'signal_type', 'interval_days']
        unique_together = ('model', 'signal_type', 'interval_label')
        verbose_name = 'Signal Result'

    def __str__(self):
        return f"{self.model.name} {self.signal_type} {self.interval_label}: {self.avg_return_pct:+.1f}%"


# ─── Concrete Data Models ─────────────────────────────────────────────────────

class CryptoBreadth(models.Model):
    date = models.DateField(unique=True)
    pct_above_50dma = models.FloatField()
    pct_above_100dma = models.FloatField()
    pct_above_200dma = models.FloatField()

    class Meta:
        ordering = ['-date']
        verbose_name = 'Crypto Breadth Indicator'
        verbose_name_plural = 'Crypto Breadth Indicators'

    def __str__(self):
        return f"Breadth {self.date}: 50DMA={self.pct_above_50dma}%, 100DMA={self.pct_above_100dma}%, 200DMA={self.pct_above_200dma}%"


class CryptoPrice(models.Model):
    """Daily OHLCV price data per coin from CoinMarketCap."""
    symbol = models.CharField(max_length=20, db_index=True)
    name = models.CharField(max_length=200)
    date = models.DateField(db_index=True)
    open = models.FloatField(null=True, blank=True)
    high = models.FloatField(null=True, blank=True)
    low = models.FloatField(null=True, blank=True)
    close = models.FloatField(null=True, blank=True)
    volume = models.FloatField(null=True, blank=True)
    market_cap = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['-date', 'symbol']
        unique_together = ('symbol', 'date')
        verbose_name = 'Crypto Price'
        verbose_name_plural = 'Crypto Prices'

    def __str__(self):
        return f"{self.symbol} {self.date}: {self.close}"


class CryptoIndex(models.Model):
    """Market-cap weighted index values (e.g. Altcoin 100 Index)."""
    INDEX_CHOICES = [
        ('alt100', 'Altcoin 100 Index'),
        ('total', 'Total Market Index'),
    ]
    index_name = models.CharField(max_length=20, choices=INDEX_CHOICES, db_index=True)
    date = models.DateField(db_index=True)
    value = models.FloatField()
    daily_return = models.FloatField(null=True, blank=True)
    num_constituents = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-date']
        unique_together = ('index_name', 'date')
        verbose_name = 'Crypto Index'
        verbose_name_plural = 'Crypto Indices'

    def __str__(self):
        return f"{self.index_name} {self.date}: {self.value}"


class CryptoGlobalQuote(models.Model):
    """Global market metrics from CoinMarketCap."""
    date = models.DateField(unique=True)
    btc_dominance = models.FloatField(null=True, blank=True)
    eth_dominance = models.FloatField(null=True, blank=True)
    active_cryptocurrencies = models.IntegerField(null=True, blank=True)
    total_market_cap = models.FloatField(null=True, blank=True)
    total_volume_24h = models.FloatField(null=True, blank=True)
    altcoin_market_cap = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['-date']
        verbose_name = 'Crypto Global Quote'
        verbose_name_plural = 'Crypto Global Quotes'

    def __str__(self):
        return f"Global {self.date}: BTC={self.btc_dominance}%"
