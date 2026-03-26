"""
Pre-migrate fix for Railway deployment.

The DB was partially restored from Render: some app tables exist but their
migrations are not recorded in django_migrations. This script detects any
app whose initial migration is unrecorded yet whose tables already exist,
then drops those conflicting tables so `manage.py migrate` can run clean.

On every subsequent deploy the migrations ARE recorded so this script is
a guaranteed no-op.
"""
import os
import sys

import psycopg2
from psycopg2 import sql as pgsql

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("fix_migrations: DATABASE_URL not set, skipping.")
    sys.exit(0)

try:
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()
except Exception as e:
    print(f"fix_migrations: cannot connect to DB ({e}), skipping.")
    sys.exit(0)


def migration_recorded(app, name):
    try:
        cur.execute(
            "SELECT 1 FROM django_migrations WHERE app = %s AND name = %s",
            (app, name),
        )
        return cur.fetchone() is not None
    except psycopg2.errors.UndefinedTable:
        return False


def table_exists(table_name):
    cur.execute(
        "SELECT 1 FROM information_schema.tables "
        "WHERE table_schema = 'public' AND table_name = %s",
        (table_name,),
    )
    return cur.fetchone() is not None


def drop_table(table_name):
    if table_exists(table_name):
        cur.execute(f'DROP TABLE IF EXISTS "{table_name}" CASCADE')
        print(f"fix_migrations: dropped {table_name}")


# --- api app ---
if not migration_recorded("api", "0001_initial"):
    if table_exists("api_user"):
        print("fix_migrations: api.0001_initial missing but api_user exists — dropping conflicting tables.")
        for t in ["api_user", "api_post", "api_category",
                  "api_comment", "api_like", "api_commentlike",
                  "api_bookmark", "api_notification",
                  "api_newslettersubscriber", "api_postreaction"]:
            drop_table(t)
    else:
        print("fix_migrations: api.0001_initial not recorded, no conflicting tables found.")
else:
    print("fix_migrations: api.0001_initial already recorded — skipping api.")

# --- crypto_models app ---
if not migration_recorded("crypto_models", "0001_initial"):
    if table_exists("crypto_models_cryptobreadth"):
        print("fix_migrations: crypto_models.0001_initial missing but table exists — dropping conflicting tables.")
        for t in ["crypto_models_cryptobreadth", "crypto_global_metrics"]:
            drop_table(t)
    else:
        print("fix_migrations: crypto_models.0001_initial not recorded, no conflicting tables found.")
else:
    print("fix_migrations: crypto_models.0001_initial already recorded — skipping crypto_models.")

cur.close()
conn.close()
print("fix_migrations: done.")
