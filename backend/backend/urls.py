from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def health_check(request):
    """Health check endpoint for uptime monitoring."""
    health = {'status': 'ok'}
    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        health['db'] = 'ok'
    except Exception:
        health['db'] = 'error'
        health['status'] = 'degraded'
    return JsonResponse(health)


urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('api.urls')),
    path('api/models/', include('models.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
