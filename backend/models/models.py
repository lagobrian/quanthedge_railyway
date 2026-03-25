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


# ─── Backtest Framework ───────────────────────────────────────────────────────

class Backtest(models.Model):
    """A stored backtest result."""
    name = models.CharField(max_length=300)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    instrument = models.CharField(max_length=50, help_text='e.g. BTCUSDT, SPY')
    model = models.ForeignKey(QuantModel, on_delete=models.SET_NULL, null=True, blank=True, related_name='backtests')
    start_date = models.DateField()
    end_date = models.DateField()
    parameters = models.JSONField(default=dict, blank=True)

    # Key stats
    total_return_pct = models.FloatField(null=True, blank=True)
    benchmark_return_pct = models.FloatField(null=True, blank=True)
    sharpe_ratio = models.FloatField(null=True, blank=True)
    max_drawdown_pct = models.FloatField(null=True, blank=True)
    max_drawdown_duration_days = models.FloatField(null=True, blank=True)
    win_rate_pct = models.FloatField(null=True, blank=True)
    total_trades = models.IntegerField(null=True, blank=True)
    avg_trade_duration_days = models.FloatField(null=True, blank=True)
    avg_winning_trade_pct = models.FloatField(null=True, blank=True)
    avg_losing_trade_pct = models.FloatField(null=True, blank=True)
    best_trade_pct = models.FloatField(null=True, blank=True)
    worst_trade_pct = models.FloatField(null=True, blank=True)
    profit_factor = models.FloatField(null=True, blank=True)
    expectancy = models.FloatField(null=True, blank=True)
    start_value = models.FloatField(null=True, blank=True, default=100)
    end_value = models.FloatField(null=True, blank=True)

    # Heatmap data: threshold optimization grid
    # Format: {"x_labels": [10,15,20,...], "y_labels": [70,75,80,...], "values": [[...],[...],...]}
    heatmap_data = models.JSONField(null=True, blank=True, help_text='Threshold optimization heatmap')
    heatmap_x_label = models.CharField(max_length=100, blank=True, default='Long Threshold')
    heatmap_y_label = models.CharField(max_length=100, blank=True, default='Short Threshold')

    is_published = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='backtests')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.instrument})"


class EquityPoint(models.Model):
    """Point on the equity curve for a backtest."""
    backtest = models.ForeignKey(Backtest, on_delete=models.CASCADE, related_name='equity_curve')
    timestamp = models.DateTimeField()
    value = models.FloatField()

    class Meta:
        ordering = ['timestamp']
        indexes = [models.Index(fields=['backtest', 'timestamp'])]


class DrawdownPoint(models.Model):
    """Point on the drawdown curve for a backtest."""
    backtest = models.ForeignKey(Backtest, on_delete=models.CASCADE, related_name='drawdown_curve')
    timestamp = models.DateTimeField()
    drawdown_pct = models.FloatField()

    class Meta:
        ordering = ['timestamp']
        indexes = [models.Index(fields=['backtest', 'timestamp'])]


class BacktestTrade(models.Model):
    """Individual trade from a backtest."""
    backtest = models.ForeignKey(Backtest, on_delete=models.CASCADE, related_name='trades')
    entry_date = models.DateTimeField()
    exit_date = models.DateTimeField()
    direction = models.CharField(max_length=10, choices=[('long', 'Long'), ('short', 'Short')], default='long')
    return_pct = models.FloatField()
    pnl = models.FloatField(null=True, blank=True)
    duration_days = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['entry_date']

    def __str__(self):
        return f"{self.backtest.name} trade {self.entry_date.date()}: {self.return_pct:+.1f}%"


# ─── Multi-Source Market Data ──────────────────────────────────────────────────

class MacroDataPoint(models.Model):
    """Economic/macro data from FRED, World Bank, etc."""
    SOURCES = [
        ('fred', 'FRED'),
        ('worldbank', 'World Bank'),
        ('custom', 'Custom'),
    ]
    source = models.CharField(max_length=20, choices=SOURCES, db_index=True)
    series_id = models.CharField(max_length=100, db_index=True, help_text='e.g. FRED: DGS10, WB: NY.GDP.MKTP.CD')
    series_name = models.CharField(max_length=300, blank=True)
    date = models.DateField(db_index=True)
    value = models.FloatField()
    unit = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=10, blank=True, default='US')

    class Meta:
        ordering = ['-date']
        unique_together = ('source', 'series_id', 'date')
        verbose_name = 'Macro Data Point'

    def __str__(self):
        return f"{self.source}:{self.series_id} {self.date}: {self.value}"


class StockPrice(models.Model):
    """Daily OHLCV for stocks/ETFs from Alpaca or yfinance."""
    symbol = models.CharField(max_length=20, db_index=True)
    date = models.DateField(db_index=True)
    open = models.FloatField(null=True, blank=True)
    high = models.FloatField(null=True, blank=True)
    low = models.FloatField(null=True, blank=True)
    close = models.FloatField(null=True, blank=True)
    volume = models.FloatField(null=True, blank=True)
    source = models.CharField(max_length=20, default='alpaca')

    class Meta:
        ordering = ['-date', 'symbol']
        unique_together = ('symbol', 'date', 'source')
        verbose_name = 'Stock Price'

    def __str__(self):
        return f"{self.symbol} {self.date}: {self.close}"


class ModelAlert(models.Model):
    """User subscription to model update alerts."""
    ALERT_TYPES = [
        ('on_update', 'On every update'),
        ('on_signal_change', 'When signal changes'),
        ('daily_digest', 'Daily digest'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='model_alerts')
    model = models.ForeignKey('QuantModel', on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES, default='on_signal_change')
    is_active = models.BooleanField(default=True)
    last_notified = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'model')

    def __str__(self):
        return f"{self.user.email} → {self.model.name} ({self.alert_type})"


class APIKey(models.Model):
    """User API key for programmatic data access."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_keys')
    prefix = models.CharField(max_length=8, db_index=True)
    key_hash = models.CharField(max_length=64)
    name = models.CharField(max_length=100, default='Default')
    is_active = models.BooleanField(default=True)
    last_used = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    requests_today = models.IntegerField(default=0)
    last_reset = models.DateField(auto_now_add=True)

    class Meta:
        verbose_name = 'API Key'

    def __str__(self):
        return f"{self.prefix}... ({self.user.email})"

    def check_rate_limit(self):
        """Check if the user has exceeded their daily rate limit."""
        from datetime import date
        if self.last_reset != date.today():
            self.requests_today = 0
            self.last_reset = date.today()
            self.save(update_fields=['requests_today', 'last_reset'])

        # Rate limits by tier
        if self.user.is_premium:
            limit = 10000
        elif hasattr(self.user, 'is_premium') and not self.user.is_premium:
            limit = 1000  # Basic subscriber
        else:
            limit = 100  # Free tier

        return self.requests_today < limit, limit - self.requests_today


class DataFetchLog(models.Model):
    """Log of data fetch operations for monitoring."""
    source = models.CharField(max_length=50)
    command = models.CharField(max_length=200)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[('running', 'Running'), ('success', 'Success'), ('failed', 'Failed')])
    records_fetched = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.source} {self.started_at}: {self.status}"


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


class EquityBreadth(models.Model):
    """Daily S&P 500 breadth indicators calculated from yfinance price data."""
    date = models.DateField(unique=True)
    pct_above_50dma = models.FloatField()
    pct_above_100dma = models.FloatField()
    pct_above_200dma = models.FloatField()
    pct_outperforming_spx = models.FloatField(null=True, blank=True)
    num_constituents = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-date']
        verbose_name = 'Equity Breadth Indicator'
        verbose_name_plural = 'Equity Breadth Indicators'

    def __str__(self):
        return f"Equity Breadth {self.date}: 50DMA={self.pct_above_50dma:.1f}%, 200DMA={self.pct_above_200dma:.1f}%"


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
