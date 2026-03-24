from django.urls import path
from .views import (
    CryptoBreadthListCreateView, CryptoBreadthRetrieveView,
    CryptoIndexListView, CryptoGlobalQuoteListView, CryptoPriceListView,
    chart_thumbnail_view,
    QuantModelListView, QuantModelDetailView,
    quant_model_data_view, quant_model_update_description_view,
    BacktestListView, BacktestDetailView, backtest_upload_view,
    trigger_data_fetch_view, data_fetch_status_view,
    model_alert_toggle_view, model_alerts_list_view,
)

urlpatterns = [
    # Concrete data endpoints
    path('crypto-breadth/', CryptoBreadthListCreateView.as_view(), name='crypto-breadth-list-create'),
    path('crypto-breadth/<date>/', CryptoBreadthRetrieveView.as_view(), name='crypto-breadth-retrieve'),
    path('crypto-index/', CryptoIndexListView.as_view(), name='crypto-index-list'),
    path('crypto-global/', CryptoGlobalQuoteListView.as_view(), name='crypto-global-list'),
    path('crypto-prices/', CryptoPriceListView.as_view(), name='crypto-price-list'),
    path('chart-thumbnail/<str:model_name>/', chart_thumbnail_view, name='chart-thumbnail'),

    # QuantModel framework endpoints
    path('registry/', QuantModelListView.as_view(), name='model-registry-list'),
    path('registry/<slug:slug>/', QuantModelDetailView.as_view(), name='model-registry-detail'),
    path('registry/<slug:slug>/data/', quant_model_data_view, name='model-registry-data'),
    path('registry/<slug:slug>/update/', quant_model_update_description_view, name='model-registry-update'),

    # Backtest endpoints
    path('backtests/', BacktestListView.as_view(), name='backtest-list'),
    path('backtests/<slug:slug>/', BacktestDetailView.as_view(), name='backtest-detail'),
    path('backtests/upload/', backtest_upload_view, name='backtest-upload'),

    # Data pipeline
    path('data/fetch/', trigger_data_fetch_view, name='data-fetch-trigger'),
    path('data/status/', data_fetch_status_view, name='data-fetch-status'),

    # Model alerts
    path('registry/<slug:slug>/alert/', model_alert_toggle_view, name='model-alert-toggle'),
    path('alerts/', model_alerts_list_view, name='model-alerts-list'),
]
