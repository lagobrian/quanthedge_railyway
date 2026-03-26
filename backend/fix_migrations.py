"""
One-time pre-migrate fix for Railway deployment.

When the DB was partially restored from Render, some tables already exist
but django_migrations is empty. Running `migrate` normally would crash on
duplicate-table errors. This script detects that situation and drops the
conflicting tables so Django can run all migrations cleanly from scratch.

After the first successful deploy, django_migrations will be populated and
this script becomes a safe no-op on every subsequent deploy.
"""
import os
import sys

import psycopg2

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

# Check whether django_migrations has any rows yet
try:
    cur.execute("SELECT COUNT(*) FROM django_migrations")
    count = cur.fetchone()[0]
except psycopg2.errors.UndefinedTable:
    count = 0

if count > 0:
    print(f"fix_migrations: {count} migration(s) already recorded — nothing to do.")
    cur.close()
    conn.close()
    sys.exit(0)

# django_migrations is empty but some tables from the partial restore exist.
# Drop them (CASCADE handles FK references) so migrate can start clean.
CONFLICTING_TABLES = [
    # api app (from targeted restore)
    "api_user",
    "api_post",
    "api_category",
    # crypto_models app (from targeted restore — legacy names from Render)
    "crypto_models_cryptobreadth",
    "crypto_global_metrics",
]

dropped = []
for table in CONFLICTING_TABLES:
    try:
        cur.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE')
        dropped.append(table)
    except Exception as e:
        print(f"fix_migrations: could not drop {table}: {e}")

if dropped:
    print(f"fix_migrations: dropped {dropped} — migrations will now run from scratch.")
else:
    print("fix_migrations: no conflicting tables found — proceeding normally.")

cur.close()
conn.close()
