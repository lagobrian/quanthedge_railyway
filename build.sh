#!/usr/bin/env bash
set -o errexit

# Install Python dependencies
pip install -r backend/requirements.txt

# Run Django migrations
cd backend
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py seed_data
