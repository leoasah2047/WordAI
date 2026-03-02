# Stage 1: Build dependencies
FROM python:3.11-slim as builder

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Pre-download FastEmbed models
RUN pip install --no-cache-dir fastembed && \
    python -c "from fastembed import SparseTextEmbedding; SparseTextEmbedding(model_name='prithivida/Splade_PP_en_v1', cache_dir='/install/model_cache')"

# Stage 2: Final production image
FROM python:3.11-slim

WORKDIR /app

# Copy only the installed packages from the builder stage
COPY --from=builder /install /usr/local
# Copy downloaded models to a stable location
COPY --from=builder /install/model_cache /app/model_cache

# Copy source code
COPY backend/ .

# Expose API port
EXPOSE 8000

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV FASTEMBED_CACHE_PATH /app/model_cache

# Command to run the application using gunicorn with uvicorn workers for production
# Increased timeout for long-running LLM tasks
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--timeout", "120"]
