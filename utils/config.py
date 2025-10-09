# -*- coding: utf-8 -*-
"""
Configuración centralizada para el frontend ECOES
Todas las variables de configuración necesarias para el funcionamiento del sistema
"""

import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# ========== CONFIGURACIÓN DE BACKEND - URL ÚNICA ==========
# Simplificado: Una sola URL de backend configurable
BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://localhost:5002')

# ========== CONFIGURACIÓN DE WEBSOCKET ==========
WEBSOCKET_URL = os.getenv('WEBSOCKET_URL', 'ws://localhost:8080')

# ========== CONFIGURACIÓN DE FRONTEND ==========
PROXY_PREFIX = '/proxy'  # Prefijo para el proxy interno

# ========== CONFIGURACIÓN DE SEGURIDAD ==========
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
SESSION_LIFETIME = int(os.getenv('SESSION_LIFETIME', '604800'))  # 7 días por defecto (igual que refresh token)

# ========== CONFIGURACIÓN DE DEBUG ==========
DEBUG_MODE = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes', 'on')

# ========== CONFIGURACIÓN DE CORS ==========
CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')

# ========== SERVICIO DE IMÁGENES ==========
IMAGES_SERVICE_BASE_URL = os.getenv(
    'IMAGES_SERVICE_BASE_URL',
    'https://images-service.rescue.com.co'
)

# ========== CONFIGURACIÓN PÚBLICA DE CONTACTO ==========
# Variables seguras para exponer al frontend
PUBLIC_CONTACT_CONFIG = {
    'recipientEmail': os.getenv('RECIPIENT_EMAIL'),
    'companyPhone': os.getenv('COMPANY_PHONE'),
    'emailSubject': os.getenv('EMAIL_SUBJECT'),
    'whatsappMessage': os.getenv('WHATSAPP_MESSAGE'),
    'emailBodyMessage': os.getenv('EMAIL_BODY_MESSAGE'),
    'apiUrl': '/proxy/api/contact/send'  # Endpoint para envío de emails
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
                validated_config[key] = '/proxy/api/contact/send'
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
        ('SECRET_KEY', SECRET_KEY),
    ]
    
    missing_vars = []
    for var_name, var_value in required_vars:
        if not var_value or var_value.startswith('None'):
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
    print(f"🔗 Proxy Prefix: {PROXY_PREFIX}")
    print(f"🖼️  Images Service: {IMAGES_SERVICE_BASE_URL}")
    print(f"🐛 Debug Mode: {DEBUG_MODE}")
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
