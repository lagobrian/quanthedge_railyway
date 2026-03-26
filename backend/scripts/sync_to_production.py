"""
Push local database data to production via the bulk upload API.

Usage:
    python scripts/sync_to_production.py

Set these environment variables:
    PROD_API_URL  - Production API URL
    PROD_EMAIL    - Admin email for login
    PROD_PASSWORD - Admin password
"""
import os
import sys
import json
import requests

# Config
PROD_API = os.environ.get('PROD_API_URL', '').rstrip('/')
EMAIL = os.environ.get('PROD_EMAIL', 'lagobrian@outlook.com')
PASSWORD = os.environ.get('PROD_PASSWORD', '')

if not PROD_API:
    print('Set PROD_API_URL to the target API base URL, e.g. https://your-api.up.railway.app')
    sys.exit(1)

if not PASSWORD:
    PASSWORD = input('Enter your production admin password: ')

# Setup Django for local DB access
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.settings'
import django
django.setup()


def get_token():
    """Login and get JWT token."""
    r = requests.post(f'{PROD_API}/api/token/', json={'email': EMAIL, 'password': PASSWORD})
    if r.status_code != 200:
        print(f'Login failed: {r.status_code} {r.text}')
        sys.exit(1)
    token = r.json()['access']
    print(f'Logged in as {EMAIL}')
    return token


def upload(token, model, records, batch_size=500):
    """Upload records in batches."""
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    total = len(records)
    uploaded = 0

    for i in range(0, total, batch_size):
        batch = records[i:i + batch_size]
        r = requests.post(
            f'{PROD_API}/api/sync/bulk-upload/',
            headers=headers,
            json={'model': model, 'records': batch},
            timeout=120,
        )
        if r.status_code == 200:
            result = r.json()
            uploaded += result.get('created', 0)
            print(f'  {model}: batch {i // batch_size + 1} - {result["message"]}')
        else:
            print(f'  ERROR: {r.status_code} {r.text[:200]}')
            break

    print(f'  {model}: {uploaded}/{total} new records uploaded')


def sync_breadth(token):
    """Sync crypto breadth data."""
    from models.models import CryptoBreadth
    qs = CryptoBreadth.objects.all().order_by('date')
    records = [{
        'date': str(r.date),
        'pct_above_50dma': r.pct_above_50dma,
        'pct_above_100dma': r.pct_above_100dma,
        'pct_above_200dma': r.pct_above_200dma,
    } for r in qs]
    print(f'Syncing {len(records)} breadth records...')
    upload(token, 'crypto_breadth', records)


def sync_index(token):
    """Sync crypto index data."""
    from models.models import CryptoIndex
    qs = CryptoIndex.objects.all().order_by('date')
    records = [{
        'index_name': r.index_name,
        'date': str(r.date),
        'value': r.value,
        'daily_return': r.daily_return,
        'num_constituents': r.num_constituents,
    } for r in qs]
    print(f'Syncing {len(records)} index records...')
    upload(token, 'crypto_index', records)


def sync_global_quotes(token):
    """Sync global quotes."""
    from models.models import CryptoGlobalQuote
    qs = CryptoGlobalQuote.objects.all().order_by('date')
    records = [{
        'date': str(r.date),
        'btc_dominance': r.btc_dominance,
        'eth_dominance': r.eth_dominance,
        'active_cryptocurrencies': r.active_cryptocurrencies,
        'total_market_cap': r.total_market_cap,
        'total_volume_24h': r.total_volume_24h,
        'altcoin_market_cap': r.altcoin_market_cap,
    } for r in qs]
    print(f'Syncing {len(records)} global quote records...')
    upload(token, 'crypto_global_quote', records)


def sync_posts(token):
    """Sync blog posts."""
    from api.models import Post
    qs = Post.objects.select_related('category').all().order_by('date')
    records = [{
        'title': p.title,
        'description': p.description,
        'excerpt': p.excerpt or '',
        'image_url': p.image_url or '',
        'category_slug': p.category.slug if p.category else '',
        'is_premium': p.is_premium,
        'tags': p.tags or '',
    } for p in qs]
    print(f'Syncing {len(records)} blog posts...')
    upload(token, 'posts', records, batch_size=50)


if __name__ == '__main__':
    token = get_token()

    print('\n=== Syncing data to production ===')
    sync_breadth(token)
    sync_index(token)
    sync_global_quotes(token)
    sync_posts(token)
    print('\n=== Sync complete! ===')
