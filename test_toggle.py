#!/usr/bin/env python3
"""
Script de prueba para verificar el endpoint toggle-status
"""

import requests
import json
from python_api_client import EndpointTestClient

# Configuración
BACKEND_URL = "http://localhost:5002"
# Probar con diferentes usuarios comunes
TEST_USERS = [
    ("admin01", "admin123"),
    ("admin", "admin123"),
    ("superadmin", "admin123"),
    ("admin01", "password123"),
    ("test", "test123")
]

def test_toggle_endpoint():
    print("🧪 Probando endpoint toggle-status")
    print("=" * 50)
    
    # Inicializar cliente
    client = EndpointTestClient(BACKEND_URL)
    
    # 1. Hacer login - probar múltiples usuarios
    print("🔐 1. Intentando login...")
    login_data = None
    
    for username, password in TEST_USERS:
        print(f"   Probando: {username}")
        login_response = client.login(username, password)
        
        if login_response.ok:
            login_data = login_response.json()
            print(f"✅ Login exitoso con {username}")
            break
        else:
            print(f"   ❌ Falló: {login_response.status_code}")
    
    if not login_data:
        print("❌ Ningún usuario funcionó")
        return
    
    login_data = login_response.json()
    print(f"✅ Login exitoso. Usuario: {login_data.get('user', {}).get('usuario')}")
    print(f"   Role: {login_data.get('user', {}).get('role')}")
    
    # 2. Obtener token
    token = login_data.get('token')
    if not token:
        print("❌ No se obtuvo token")
        return
    
    client.token = token
    print(f"🎫 Token obtenido: {token[:20]}...")
    
    # 3. Obtener lista de hardware
    print("\n📋 2. Obteniendo lista de hardware...")
    hardware_response = client.get_hardware_list()
    
    if not hardware_response.ok:
        print(f"❌ Error obteniendo hardware: {hardware_response.status_code}")
        print(f"   Respuesta: {hardware_response.text}")
        return
    
    hardware_data = hardware_response.json()
    hardware_list = hardware_data.get('data', [])
    
    if not hardware_list:
        print("❌ No hay hardware disponible para probar")
        return
    
    test_hardware = hardware_list[0]
    hardware_id = test_hardware.get('_id')
    current_status = test_hardware.get('activa', True)
    
    print(f"✅ Hardware encontrado: {test_hardware.get('nombre')}")
    print(f"   ID: {hardware_id}")
    print(f"   Estado actual: {'Activo' if current_status else 'Inactivo'}")
    
    # 4. Probar toggle
    print(f"\n⚡ 3. Probando toggle (cambiar a {'Inactivo' if current_status else 'Activo'})...")
    
    new_status = not current_status
    toggle_data = {"activa": new_status}
    
    print(f"📤 Enviando PATCH a /api/hardware/{hardware_id}/toggle-status")
    print(f"📦 Datos: {toggle_data}")
    
    # Hacer la petición directa
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    url = f"{BACKEND_URL}/api/hardware/{hardware_id}/toggle-status"
    response = requests.patch(url, headers=headers, json=toggle_data)
    
    print(f"📡 Respuesta: {response.status_code}")
    print(f"📋 Headers: {dict(response.headers)}")
    
    if response.ok:
        result = response.json()
        print(f"✅ Toggle exitoso!")
        print(f"   Mensaje: {result.get('message')}")
        print(f"   Nuevo estado: {result.get('data', {}).get('activa')}")
    else:
        print(f"❌ Toggle falló: {response.status_code}")
        print(f"   Respuesta: {response.text}")
        
        # Debugging adicional
        if response.status_code == 405:
            print("\n🔍 Error 405 - Método no permitido")
            print("   Verificando si el endpoint existe...")
            
            # Probar OPTIONS
            options_response = requests.options(url, headers=headers)
            print(f"   OPTIONS response: {options_response.status_code}")
            if 'Allow' in options_response.headers:
                print(f"   Métodos permitidos: {options_response.headers['Allow']}")

if __name__ == "__main__":
    test_toggle_endpoint()
