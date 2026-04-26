# syntax=docker/dockerfile:1

# 1) Builder: instala dependencias (cache por lockfile)
FROM python:3.12-slim AS builder

WORKDIR /app

# gcc es necesario para compilar python-bcrypt (extensión C)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# 2) Runner: imagen mínima de producción
FROM python:3.12-slim AS runner

WORKDIR /app

# Usuario no root
RUN addgroup --gid 1001 appgroup \
    && adduser --uid 1001 --gid 1001 --disabled-password --gecos "" appuser

# Copia solo dependencias instaladas (sin herramientas de build)
COPY --from=builder /install /usr/local

# Copia código fuente
COPY --chown=appuser:appgroup . .

USER appuser
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
