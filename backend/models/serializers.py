from rest_framework import serializers
from .models import CryptoBreadth, CryptoPrice, CryptoIndex, CryptoGlobalQuote


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
