FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install system deps (for SQLite + pip builds)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files first for better layer caching
COPY pyproject.toml ./
COPY uv.lock* ./

# Install dependencies (no project install yet)
RUN uv sync --no-install-project

# Copy project files
COPY . .

# Install the project itself + create venv
RUN uv sync

# Ensure entrypoint is executable
RUN chmod +x entrypoint.sh

# Collect static files
RUN uv run python manage.py collectstatic --noinput || true

EXPOSE 8000

CMD ["./entrypoint.sh"]