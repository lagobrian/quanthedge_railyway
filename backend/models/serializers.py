from rest_framework import serializers
from .models import (
    CryptoBreadth, CryptoPrice, CryptoIndex, CryptoGlobalQuote,
    QuantModel, ModelDataPoint, ModelSignalResult,
    Backtest, EquityPoint, DrawdownPoint, BacktestTrade,
)


class CryptoBreadthSerializer(serializers.ModelSerializer):
    class Meta:
        model = CryptoBreadth
        fields = '__all__'


class CryptoPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CryptoPrice
        fields = '__all__'


class CryptoIndexSerializer(serializers.ModelSerializer):
    class Meta:
        model = CryptoIndex
        fields = '__all__'


class CryptoGlobalQuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CryptoGlobalQuote
        fields = '__all__'


class ModelSignalResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelSignalResult
        fields = ['signal_type', 'interval_label', 'interval_days', 'avg_return_pct', 'hit_rate_pct', 'sample_size', 'last_updated']


class QuantModelListSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuantModel
        fields = ['id', 'name', 'slug', 'short_description', 'asset_class', 'frequency',
                  'data_source', 'is_premium', 'current_signal', 'current_value',
                  'last_updated', 'page_url']


class QuantModelDetailSerializer(serializers.ModelSerializer):
    signal_results = ModelSignalResultSerializer(many=True, read_only=True)
    analysts = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = QuantModel
        fields = ['id', 'name', 'slug', 'short_description', 'description', 'methodology',
                  'how_to_trade', 'asset_class', 'frequency', 'data_source', 'is_premium',
                  'is_published', 'current_signal', 'current_value', 'last_updated',
                  'page_url', 'data_model', 'analysts', 'signal_results']


class ModelDataPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelDataPoint
        fields = ['timestamp', 'value', 'signal', 'metadata']


class BacktestTradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BacktestTrade
        fields = ['entry_date', 'exit_date', 'direction', 'return_pct', 'pnl', 'duration_days']


class BacktestListSerializer(serializers.ModelSerializer):
    model_name = serializers.CharField(source='model.name', read_only=True, default=None)

    class Meta:
        model = Backtest
        fields = ['id', 'name', 'slug', 'instrument', 'model_name', 'start_date', 'end_date',
                  'total_return_pct', 'sharpe_ratio', 'max_drawdown_pct', 'win_rate_pct',
                  'total_trades', 'is_premium', 'created_at']


class BacktestDetailSerializer(serializers.ModelSerializer):
    equity_curve = serializers.SerializerMethodField()
    drawdown_curve = serializers.SerializerMethodField()
    trades = BacktestTradeSerializer(many=True, read_only=True)
    model_name = serializers.CharField(source='model.name', read_only=True, default=None)

    class Meta:
        model = Backtest
        fields = ['id', 'name', 'slug', 'description', 'instrument', 'model_name',
                  'start_date', 'end_date', 'parameters',
                  'total_return_pct', 'benchmark_return_pct', 'sharpe_ratio',
                  'max_drawdown_pct', 'max_drawdown_duration_days',
                  'win_rate_pct', 'total_trades', 'avg_trade_duration_days',
                  'avg_winning_trade_pct', 'avg_losing_trade_pct',
                  'best_trade_pct', 'worst_trade_pct',
                  'profit_factor', 'expectancy', 'start_value', 'end_value',
                  'heatmap_data', 'heatmap_x_label', 'heatmap_y_label',
                  'is_premium', 'is_published', 'created_at',
                  'equity_curve', 'drawdown_curve', 'trades']

    def get_equity_curve(self, obj):
        points = obj.equity_curve.all().values_list('timestamp', 'value')
        return [[str(t), v] for t, v in points]

    def get_drawdown_curve(self, obj):
        points = obj.drawdown_curve.all().values_list('timestamp', 'drawdown_pct')
        return [[str(t), v] for t, v in points]
