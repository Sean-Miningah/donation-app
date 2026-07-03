#!/bin/bash
set -e

# Install Python deps with uv
uv sync

# Collect static files (needed for admin in production/Docker)
uv run python manage.py collectstatic --noinput || true

# Run migrations
uv run python manage.py migrate --noinput

# Create default superuser
uv run python manage.py shell -c "
from django.contrib.auth.models import User
import os
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'adminpass123')
    print('Superuser created: admin / adminpass123')
else:
    print('Superuser already exists')
"

# Start gunicorn
exec uv run gunicorn donation_project.wsgi:application --bind 0.0.0.0:8000 --workers 3