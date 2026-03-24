"""Copy all data from SQLite to local PostgreSQL Docker container."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Remove DATABASE_URL so default stays SQLite
if 'DATABASE_URL' in os.environ:
    del os.environ['DATABASE_URL']

os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.settings'

import django
django.setup()

from django.apps import apps
from django.conf import settings
import dj_database_url

# Add PostgreSQL as second database
pg_config = dj_database_url.parse(
    'postgresql://quanthedge:quanthedge_dev_2026@localhost:5432/quanthedge'
)
pg_config['TIME_ZONE'] = None
pg_config['CONN_MAX_AGE'] = 0
pg_config['CONN_HEALTH_CHECKS'] = False
pg_config.setdefault('OPTIONS', {})
pg_config.setdefault('AUTOCOMMIT', True)
settings.DATABASES['postgres'] = pg_config

from django.db import connections
# Force new connection
connections['postgres'].ensure_connection()

def copy_model(model, batch_size=200):
    model_name = f"{model._meta.app_label}.{model.__name__}"
    try:
        objects = list(model.objects.using('default').all())
    except Exception as e:
        print(f"  SKIP {model_name}: {e}")
        return 0

    if not objects:
        print(f"  {model_name}: 0 records")
        return 0

    # Clear target first
    try:
        model.objects.using('postgres').all().delete()
    except Exception:
        pass

    count = 0
    for obj in objects:
        obj._state.adding = True  # Force insert
        try:
            obj.save(using='postgres', force_insert=True)
            count += 1
        except Exception as e:
            if count == 0:
                print(f"    First error in {model_name}: {e}")

    print(f"  {model_name}: {count}/{len(objects)}")
    return count

def main():
    print("=" * 50)
    print("SQLite -> PostgreSQL (Docker)")
    print("=" * 50)

    total = 0

    # Copy User first
    from django.contrib.auth import get_user_model
    User = get_user_model()
    total += copy_model(User)

    # Copy all app models in order
    for app_label in ('api', 'crypto_models'):
        app_config = apps.get_app_config(app_label)
        for model in app_config.get_models():
            if model == User:
                continue
            total += copy_model(model)

    print("=" * 50)
    print(f"Done: {total} total records")
    print("=" * 50)

if __name__ == '__main__':
    main()
