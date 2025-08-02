# ==========================================
# Dockerfile para ECOES FrontEnd (Flask)
# ==========================================

# Usar Python 3.11 slim como base para mejor rendimiento
FROM python:3.11-slim

# Información del mantenedor
LABEL maintainer="ECOES Team"
LABEL description="Frontend Flask para sistema ECOES"
LABEL version="1.0"

# Variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Crear usuario no-root para seguridad
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copiar requirements primero para aprovechar cache de Docker
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Copiar el código de la aplicación
COPY . .

# Crear directorio para logs y cambiar permisos
RUN mkdir -p /app/logs \
    && chown -R appuser:appgroup /app \
    && chmod -R 755 /app

# Cambiar a usuario no-root
USER appuser

# Healthcheck para verificar que la app esté funcionando
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Exponer puerto
EXPOSE 5000

# Comando por defecto - usar Gunicorn para producción
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "60", "--keep-alive", "2", "--max-requests", "1000", "--max-requests-jitter", "50", "app:app"]
