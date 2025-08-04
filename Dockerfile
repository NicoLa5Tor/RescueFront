# ==========================================
# Multi-stage Dockerfile para ECOES FrontEnd
# ==========================================

# Stage 1: Build stage para Node.js (Tailwind CSS)
FROM node:18-alpine AS builder

# Instalar dependencias de Node
WORKDIR /build
COPY package.json package-lock.json* ./
RUN npm install

# Copiar archivos CSS y compilar Tailwind
COPY tailwind.config.js ./
COPY static/css/input.css ./static/css/
COPY templates/ ./templates/
COPY static/js/ ./static/js/

# Compilar CSS para producción
RUN npm run build-css-prod

# Stage 2: Production stage con Python
FROM python:3.11-slim AS production

# Información del mantenedor
LABEL maintainer="ECOES Team"
LABEL description="Frontend Flask para sistema ECOES con Tailwind CSS"
LABEL version="2.0"

# Variables de entorno optimizadas
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    FLASK_ENV=production \
    FLASK_DEBUG=0

# Crear usuario no-root para seguridad
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Establecer directorio de trabajo
WORKDIR /app

# Copiar requirements y instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-compile --upgrade pip \
    && pip install --no-compile -r requirements.txt

# Copiar código de la aplicación
COPY . .

# Copiar CSS compilado desde build stage
COPY --from=builder /build/static/css/output.css ./static/css/

# Crear directorios necesarios y ajustar permisos
RUN mkdir -p /app/logs /app/tmp \
    && chown -R appuser:appgroup /app \
    && chmod -R 755 /app \
    && find /app -name "*.py" -exec chmod 644 {} \;

# Cambiar a usuario no-root
USER appuser

# Healthcheck mejorado
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Exponer puerto
EXPOSE 5000

# Configuración optimizada de Gunicorn para producción
CMD ["gunicorn", \
     "--bind", "0.0.0.0:5000", \
     "--workers", "4", \
     "--worker-class", "sync", \
     "--worker-connections", "1000", \
     "--timeout", "60", \
     "--keep-alive", "2", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "50", \
     "--preload", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info", \
     "app:app"]
