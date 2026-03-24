from rest_framework import generics, filters, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes as perm_classes
from rest_framework.response import Response
from .models import (
    CryptoBreadth, CryptoPrice, CryptoIndex, CryptoGlobalQuote,
    QuantModel, ModelDataPoint, ModelSignalResult,
)
from .serializers import (
    CryptoBreadthSerializer, CryptoPriceSerializer,
    CryptoIndexSerializer, CryptoGlobalQuoteSerializer,
    QuantModelListSerializer, QuantModelDetailSerializer,
    ModelDataPointSerializer, ModelSignalResultSerializer,
)


class NoPagination:
    """Disable pagination - return all results at once."""
    pass


class CryptoBreadthListCreateView(generics.ListCreateAPIView):
    queryset = CryptoBreadth.objects.all()
    serializer_class = CryptoBreadthSerializer
    pagination_class = None


class CryptoBreadthRetrieveView(generics.RetrieveAPIView):
    queryset = CryptoBreadth.objects.all()
    serializer_class = CryptoBreadthSerializer
    lookup_field = 'date'


class CryptoIndexListView(generics.ListAPIView):
    serializer_class = CryptoIndexSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = CryptoIndex.objects.all()
        index_name = self.request.query_params.get('index')
        if index_name:
            qs = qs.filter(index_name=index_name)
        return qs


class CryptoGlobalQuoteListView(generics.ListAPIView):
    queryset = CryptoGlobalQuote.objects.all()
    serializer_class = CryptoGlobalQuoteSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class CryptoPriceListView(generics.ListAPIView):
    serializer_class = CryptoPriceSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date', 'symbol']

    def get_queryset(self):
        qs = CryptoPrice.objects.all()
        symbol = self.request.query_params.get('symbol')
        if symbol:
            qs = qs.filter(symbol=symbol.upper())
        return qs


@api_view(['GET'])
@perm_classes([AllowAny])
def chart_thumbnail_view(request, model_name):
    """Generate a chart thumbnail PNG for model cards."""
    import io
    from django.http import HttpResponse

    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        import matplotlib.dates as mdates
        from datetime import timedelta
    except ImportError:
        return HttpResponse(status=501)

    fig, ax = plt.subplots(figsize=(6, 3), dpi=100)
    fig.patch.set_facecolor('#061829')
    ax.set_facecolor('#061829')
    ax.tick_params(colors='#ffffff', labelsize=7)
    for spine in ax.spines.values():
        spine.set_color('#413510')
    ax.grid(True, color='#413510', linewidth=0.5, alpha=0.5)

    if model_name == 'crypto-breadth':
        data = CryptoBreadth.objects.order_by('date').values_list('date', 'pct_above_50dma', 'pct_above_100dma', 'pct_above_200dma')
        if data:
            dates, v50, v100, v200 = zip(*data)
            ax.plot(dates, v50, color='#FF8C00', linewidth=1, alpha=0.9)
            ax.plot(dates, v100, color='#00ced1', linewidth=1, alpha=0.9)
            ax.plot(dates, v200, color='#b091cc', linewidth=1, alpha=0.9)
            ax.set_ylim(0, 100)

    elif model_name == 'altcoin-index':
        data = CryptoIndex.objects.filter(index_name='alt100').order_by('date').values_list('date', 'value')
        if data:
            dates, values = zip(*data)
            ax.plot(dates, values, color='#00FF9D', linewidth=1.2)
            ax.fill_between(dates, values, alpha=0.1, color='#00FF9D')

    elif model_name == 'global-metrics':
        data = CryptoGlobalQuote.objects.order_by('date').values_list('date', 'btc_dominance', 'eth_dominance')
        if data:
            dates, btc, eth = zip(*data)
            ax.plot(dates, btc, color='#FF8C00', linewidth=1.2)
            ax.plot(dates, eth, color='#00ced1', linewidth=1.2)
    else:
        plt.close(fig)
        return HttpResponse(status=404)

    ax.set_xticklabels([])
    ax.set_yticklabels([])
    ax.tick_params(length=0)
    plt.tight_layout(pad=0.3)

    buf = io.BytesIO()
    fig.savefig(buf, format='png', facecolor='#061829', bbox_inches='tight', pad_inches=0.1)
    plt.close(fig)
    buf.seek(0)

    response = HttpResponse(buf.getvalue(), content_type='image/png')
    response['Cache-Control'] = 'public, max-age=3600'
    return response


# ─── QuantModel API ───────────────────────────────────────────────────────────

class QuantModelListView(generics.ListAPIView):
    """List all published models."""
    serializer_class = QuantModelListSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = QuantModel.objects.filter(is_published=True)
        asset_class = self.request.query_params.get('asset_class')
        if asset_class:
            qs = qs.filter(asset_class=asset_class)
        return qs


class QuantModelDetailView(generics.RetrieveAPIView):
    """Get details for a single model including signal results."""
    serializer_class = QuantModelDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    queryset = QuantModel.objects.filter(is_published=True)


@api_view(['GET'])
@perm_classes([AllowAny])
def quant_model_data_view(request, slug):
    """Get data points for a model."""
    try:
        model = QuantModel.objects.get(slug=slug, is_published=True)
    except QuantModel.DoesNotExist:
        return Response({'error': 'Model not found'}, status=404)
    data = ModelDataPoint.objects.filter(model=model).order_by('timestamp')
    limit = request.query_params.get('limit')
    if limit:
        data = data[:int(limit)]
    serializer = ModelDataPointSerializer(data, many=True)
    return Response(serializer.data)


@api_view(['PUT'])
@perm_classes([IsAuthenticated])
def quant_model_update_description_view(request, slug):
    """Analyst can update description/methodology/how_to_trade."""
    try:
        model = QuantModel.objects.get(slug=slug)
    except QuantModel.DoesNotExist:
        return Response({'error': 'Model not found'}, status=404)
    # Check if user is an analyst assigned to this model
    if not (request.user.is_analyst and model.analysts.filter(id=request.user.id).exists()):
        if not request.user.is_superuser:
            return Response({'error': 'Not authorized'}, status=403)
    allowed_fields = ['description', 'methodology', 'how_to_trade']
    for field in allowed_fields:
        if field in request.data:
            setattr(model, field, request.data[field])
    model.save()
    serializer = QuantModelDetailSerializer(model)
    return Response(serializer.data)
