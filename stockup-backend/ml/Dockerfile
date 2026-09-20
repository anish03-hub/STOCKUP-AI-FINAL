FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for OpenMP (XGBoost/LightGBM) and healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY ml/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt uvicorn fastapi pydantic

# Copy ML application code and model artifacts
COPY ml ./ml

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

EXPOSE 8001

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=15s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8001/health || exit 1

CMD ["python", "-m", "uvicorn", "ml.api.app:app", "--host", "0.0.0.0", "--port", "8001"]
