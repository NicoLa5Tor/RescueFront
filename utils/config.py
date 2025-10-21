# -*- coding: utf-8 -*-
"""
Configuración centralizada para el frontend ECOES
Todas las variables de configuración necesarias para el funcionamiento del sistema
"""

import os
from typing import Optional

from dotenv import load_dotenv, find_dotenv


def _load_environment() -> None:
    """Carga el archivo `.env` detectado, forzando sobrescribir variables previas."""
    dotenv_path = find_dotenv()
    if dotenv_path:
        load_dotenv(dotenv_path=dotenv_path, override=True)
    else:
        load_dotenv(override=True)


def _get_env_var(name: str, *, required: bool = False, default: Optional[str] = None) -> Optional[str]:
    """Obtiene la variable de entorno, validando presencia cuando es obligatoria."""
    value = os.getenv(name, default)
    if required and (value is None or str(value).strip() == ''):
        raise ValueError(f"Falta configurar la variable obligatoria `{name}` en el entorno")
    return value


_load_environment()

# ========== CONFIGURACIÓN DE BACKEND - URL ÚNICA ==========
BACKEND_API_URL = _get_env_var('BACKEND_API_URL', required=True)

# ========== CONFIGURACIÓN DE WEBSOCKET ==========
WEBSOCKET_URL = _get_env_var('WEBSOCKET_URL', required=True)

# ========== CONFIGURACIÓN DE FRONTEND ==========
PROXY_PREFIX = _get_env_var('PROXY_PREFIX', required=True)

# ========== CONFIGURACIÓN DE SEGURIDAD ==========
SECRET_KEY = _get_env_var('SECRET_KEY', required=True)
SESSION_LIFETIME = int(_get_env_var('SESSION_LIFETIME', required=True))

# ========== CONFIGURACIÓN DE DEBUG ==========
DEBUG_MODE = _get_env_var('DEBUG', required=True).lower() in ('true', '1', 'yes', 'on')

# ========== CONFIGURACIÓN DE CORS ==========
CORS_ORIGINS = [origin.strip() for origin in _get_env_var('CORS_ORIGINS', required=True).split(',') if origin.strip()]

# ========== SERVICIO DE IMÁGENES ==========
IMAGES_SERVICE_BASE_URL = _get_env_var('IMAGES_SERVICE_BASE_URL', required=True)

# ========== CONFIGURACIÓN PÚBLICA DE CONTACTO ==========
# Variables seguras para exponer al frontend
PUBLIC_CONTACT_CONFIG = {
    'recipientEmail': _get_env_var('RECIPIENT_EMAIL', default=''),
    'companyPhone': _get_env_var('COMPANY_PHONE', default=''),
    'emailSubject': _get_env_var('EMAIL_SUBJECT', default=''),
    'whatsappMessage': _get_env_var('WHATSAPP_MESSAGE', default=''),
    'emailBodyMessage': _get_env_var('EMAIL_BODY_MESSAGE', default=''),
    'apiUrl': f"{PROXY_PREFIX.rstrip('/')}/api/contact/send"  # Endpoint para envío de emails
}

# ========== FUNCIONES DE SEGURIDAD PARA CONFIGURACIÓN PÚBLICA ==========
def get_public_config():
    """Devuelve solo la configuración pública validada y segura para el frontend"""
    import json
    
    # Las variables de contacto son OPCIONALES
    validated_config = {}
    
    for key, value in PUBLIC_CONTACT_CONFIG.items():
        if value:  # Solo incluir si tiene valor
            # Sanitizar valor para prevenir XSS
            sanitized_value = str(value).replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
            validated_config[key] = sanitized_value
        else:
            # Valores por defecto para variables de contacto
            if key == 'apiUrl':
                validated_config[key] = f"{PROXY_PREFIX.rstrip('/')}/api/contact/send"
            else:
                validated_config[key] = ''  # Valor vacío si no está configurado
    
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
        ('WEBSOCKET_URL', WEBSOCKET_URL),
        ('PROXY_PREFIX', PROXY_PREFIX),
        ('SECRET_KEY', SECRET_KEY),
        ('SESSION_LIFETIME', SESSION_LIFETIME),
        ('IMAGES_SERVICE_BASE_URL', IMAGES_SERVICE_BASE_URL),
    ]

    missing_vars = []
    for var_name, var_value in required_vars:
        if var_value is None:
            missing_vars.append(var_name)
        elif isinstance(var_value, str) and (var_value.strip() == '' or var_value.strip().lower().startswith('none')):
            missing_vars.append(var_name)

    if missing_vars:
        raise ValueError(f"Variables de configuración faltantes: {', '.join(missing_vars)}")

    return True

# ========== FUNCIÓN DE AYUDA PARA DEBUGGING ==========
def print_config():
    """Imprime la configuración actual para debugging"""
    print("🔧 CONFIGURACIÓN ACTUAL:")
    print("=" * 50)
    print(f"🏗️  Backend URL: {BACKEND_API_URL}")
    print(f"📡  Websocket URL: {WEBSOCKET_URL}")
    print(f"🔗 Proxy Prefix: {PROXY_PREFIX}")
    print(f"🖼️  Images Service: {IMAGES_SERVICE_BASE_URL}")
    print(f"🐛 Debug Mode: {DEBUG_MODE}")
    print(f"🌐 CORS Origins: {', '.join(CORS_ORIGINS) if CORS_ORIGINS else '-'}")
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
