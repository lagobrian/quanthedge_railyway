from django.db import models


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
