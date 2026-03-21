from django.urls import path
from .views import (
    CryptoBreadthListCreateView, CryptoBreadthRetrieveView,
    CryptoIndexListView, CryptoGlobalQuoteListView, CryptoPriceListView,
    chart_thumbnail_view,
)

urlpatterns = [
    path('crypto-breadth/', CryptoBreadthListCreateView.as_view(), name='crypto-breadth-list-create'),
    path('crypto-breadth/<date>/', CryptoBreadthRetrieveView.as_view(), name='crypto-breadth-retrieve'),
    path('crypto-index/', CryptoIndexListView.as_view(), name='crypto-index-list'),
    path('crypto-global/', CryptoGlobalQuoteListView.as_view(), name='crypto-global-list'),
    path('crypto-prices/', CryptoPriceListView.as_view(), name='crypto-price-list'),
    path('chart-thumbnail/<str:model_name>/', chart_thumbnail_view, name='chart-thumbnail'),
]
