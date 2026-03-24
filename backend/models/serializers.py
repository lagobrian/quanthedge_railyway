from rest_framework import serializers
from .models import (
    CryptoBreadth, CryptoPrice, CryptoIndex, CryptoGlobalQuote,
    QuantModel, ModelDataPoint, ModelSignalResult,
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
