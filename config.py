# -*- coding: utf-8 -*-
"""
Configuración centralizada para el frontend
Este archivo contiene todas las variables de configuración para evitar problemas de puertos y URLs
"""

import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# ========== CONFIGURACIÓN DE BACKEND ==========
BACKEND_HOST = os.getenv('BACKEND_HOST', 'localhost')
BACKEND_PORT = os.getenv('BACKEND_PORT', '5002')
BACKEND_PROTOCOL = os.getenv('BACKEND_PROTOCOL', 'http')
BACKEND_API_URL = f"{BACKEND_PROTOCOL}://{BACKEND_HOST}:{BACKEND_PORT}"

# ========== CONFIGURACIÓN DE FRONTEND ==========
FRONTEND_HOST = os.getenv('FRONTEND_HOST', 'localhost')
FRONTEND_PORT = os.getenv('FRONTEND_PORT', '5050')
FRONTEND_PROTOCOL = os.getenv('FRONTEND_PROTOCOL', 'http')
FRONTEND_URL = f"{FRONTEND_PROTOCOL}://{FRONTEND_HOST}:{FRONTEND_PORT}"

# ========== CONFIGURACIÓN DE PROXY ==========
PROXY_PREFIX = '/proxy'

# ========== CONFIGURACIÓN DE SEGURIDAD ==========
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
SESSION_LIFETIME = int(os.getenv('SESSION_LIFETIME', '3600'))  # 1 hora por defecto

# ========== CONFIGURACIÓN DE DEBUG ==========
DEBUG_MODE = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes', 'on')
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# ========== CONFIGURACIÓN DE CORS ==========
CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')

# ========== CONFIGURACIÓN DE BASE DE DATOS (si se necesita en el futuro) ==========
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///app.db')

# ========== CONFIGURACIÓN PÚBLICA DE CONTACTO ==========
# Solo estas variables son seguras para exponer al frontend
PUBLIC_CONTACT_CONFIG = {
    'recipientEmail': os.getenv('RECIPIENT_EMAIL'),
    'companyPhone': os.getenv('COMPANY_PHONE'),
    'emailSubject': os.getenv('EMAIL_SUBJECT'),
    'whatsappMessage': os.getenv('WHATSAPP_MESSAGE'),
    'emailBodyMessage': os.getenv('EMAIL_BODY_MESSAGE'),
    'apiUrl': '/proxy/api/contact/send'  # Endpoint para envío de emails
}

# ========== ENDPOINTS DE HARDWARE ==========
class HardwareEndpoints:
    """Endpoints específicos para hardware"""
    CREATE = "/api/hardware"
    LIST = "/api/hardware"
    DETAIL = "/api/hardware/{id}"
    UPDATE = "/api/hardware/{id}"
    DELETE = "/api/hardware/{id}"
    TOGGLE_STATUS = "/api/hardware/{id}/toggle-status"
    BY_EMPRESA = "/api/hardware/empresa/{empresa_id}"
    ALL_INCLUDING_INACTIVE = "/api/hardware/all-including-inactive"
    BY_EMPRESA_INCLUDING_INACTIVE = "/api/hardware/empresa/{empresa_id}/including-inactive"

# ========== ENDPOINTS DE EMPRESA ==========
class EmpresaEndpoints:
    """Endpoints específicos para empresas"""
    CREATE = "/api/empresas"
    LIST = "/api/empresas"
    DETAIL = "/api/empresas/{id}"
    UPDATE = "/api/empresas/{id}"
    DELETE = "/api/empresas/{id}"
    MY_EMPRESAS = "/api/empresas/mis-empresas"
    SEARCH_BY_UBICACION = "/api/empresas/buscar-por-ubicacion"
    STATS = "/api/empresas/estadisticas"

# ========== ENDPOINTS DE AUTENTICACIÓN ==========
class AuthEndpoints:
    """Endpoints específicos para autenticación"""
    LOGIN = "/auth/login"
    LOGOUT = "/auth/logout"
    HEALTH = "/health"

# ========== FUNCIONES DE SEGURIDAD PARA CONFIGURACIÓN PÚBLICA ==========
def get_public_config():
    """Devuelve solo la configuración pública validada y segura para el frontend"""
    import json
    
    # Validar que todas las variables públicas estén configuradas
    missing_vars = []
    validated_config = {}
    
    for key, value in PUBLIC_CONTACT_CONFIG.items():
        if not value:
            missing_vars.append(key)
        else:
            # Sanitizar valor para prevenir XSS
            sanitized_value = str(value).replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
            validated_config[key] = sanitized_value
    
    if missing_vars:
        raise ValueError(f"Variables públicas faltantes en .env: {', '.join(missing_vars)}")
    
    return validated_config

def validate_contact_config():
    """Valida que la configuración de contacto esté completa"""
    try:
        config = get_public_config()
        print(f"✅ Configuración pública válida: {list(config.keys())}")
        return True
    except ValueError as e:
        print(f"❌ Error en configuración pública: {e}")
        return False

# ========== VALIDACIÓN DE CONFIGURACIÓN ==========
def validate_config():
    """Valida que la configuración esté correctamente definida"""
    required_vars = [
        ('BACKEND_API_URL', BACKEND_API_URL),
        ('FRONTEND_URL', FRONTEND_URL),
        ('SECRET_KEY', SECRET_KEY),
    ]
    
    missing_vars = []
    for var_name, var_value in required_vars:
        if not var_value or var_value.startswith('None'):
            missing_vars.append(var_name)
    
    if missing_vars:
        raise ValueError(f"Variables de configuración faltantes: {', '.join(missing_vars)}")
    
    return True

# ========== CONFIGURACIÓN DE LOGGING ==========
LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'default': {
            'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
        }
    },
    'handlers': {
        'wsgi': {
            'class': 'logging.StreamHandler',
            'stream': 'ext://flask.logging.wsgi_errors_stream',
            'formatter': 'default'
        }
    },
    'root': {
        'level': LOG_LEVEL,
        'handlers': ['wsgi']
    }
}

# ========== FUNCIÓN DE AYUDA PARA DEBUGGING ==========
def print_config():
    """Imprime la configuración actual para debugging"""
    print("🔧 CONFIGURACIÓN ACTUAL:")
    print("=" * 50)
    print(f"🏗️  Backend URL: {BACKEND_API_URL}")
    print(f"🌐 Frontend URL: {FRONTEND_URL}")
    print(f"🔗 Proxy Prefix: {PROXY_PREFIX}")
    print(f"🐛 Debug Mode: {DEBUG_MODE}")
    print(f"📝 Log Level: {LOG_LEVEL}")
    print(f"🔐 Secret Key: {'***' + SECRET_KEY[-4:] if len(SECRET_KEY) > 4 else '****'}")
    print(f"⏰ Session Lifetime: {SESSION_LIFETIME}s")
    print("=" * 50)

if __name__ == "__main__":
    # Ejecutar validación y mostrar configuración cuando se ejecute directamente
    try:
        validate_config()
        print_config()
        print("✅ Configuración válida")
    except ValueError as e:
        print(f"❌ Error de configuración: {e}")
