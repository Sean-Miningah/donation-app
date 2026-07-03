#!/bin/bash
set -e

echo "==> Creating migrations..."
uv run python manage.py makemigrations

echo "==> Running migrations..."
uv run python manage.py migrate

echo "==> Creating superuser if not exists..."
uv run python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'adminpass123')
    print('Superuser created: admin / adminpass123')
else:
    print('Superuser already exists')
"

echo "==> Done. Backend is ready."
echo "Run:  uv run python manage.py runserver 0.0.0.0:8000"
echo "Or:  docker compose up backend"