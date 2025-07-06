#!/usr/bin/env python3
"""
Script simple para verificar rutas registradas en el backend
"""

import requests

BACKEND_URL = "http://localhost:5002"

def test_routes():
    print("🔍 Verificando rutas del backend")
    print("=" * 50)
    
    # Lista de rutas a probar
    test_routes = [
        ("GET", "/health"),
        ("GET", "/api/hardware"),
        ("GET", "/api/hardware/123"),
        ("PATCH", "/api/hardware/123/toggle-status"),
        ("POST", "/auth/login"),
    ]
    
    for method, path in test_routes:
        url = f"{BACKEND_URL}{path}"
        print(f"\n🧪 Probando {method} {path}")
        
        try:
            if method == "GET":
                response = requests.get(url, timeout=5)
            elif method == "POST":
                response = requests.post(url, json={}, timeout=5)
            elif method == "PATCH":
                response = requests.patch(url, json={}, timeout=5)
            else:
                response = requests.request(method, url, timeout=5)
            
            print(f"   📡 Status: {response.status_code}")
            
            if response.status_code == 404:
                print("   ❌ Ruta no encontrada")
            elif response.status_code == 405:
                print("   ⚠️ Método no permitido")
                if 'Allow' in response.headers:
                    print(f"   ✅ Métodos permitidos: {response.headers['Allow']}")
            elif response.status_code == 401:
                print("   🔐 Requiere autenticación (esto está bien)")
            elif response.status_code == 500:
                print("   💥 Error interno del servidor")
            else:
                print(f"   ✅ Respuesta válida")
                
        except requests.exceptions.RequestException as e:
            print(f"   💥 Error de conexión: {e}")

def test_flask_routes():
    """Test para verificar rutas de Flask específicamente"""
    print("\n" + "=" * 50)
    print("🧪 Verificando rutas específicas de hardware")
    
    # IDs de hardware reales o de prueba
    test_hardware_ids = [
        "686621192aa9234c2a27d228",  # Del error que viste
        "685dd5cd9e79598d1075b92c",  # Del error que viste
        "test-id"  # ID genérico
    ]
    
    for hardware_id in test_hardware_ids:
        url = f"{BACKEND_URL}/api/hardware/{hardware_id}/toggle-status"
        print(f"\n🎯 PATCH {url}")
        
        try:
            # Probar con y sin datos
            response = requests.patch(url, json={"activa": True}, timeout=5)
            print(f"   📡 Status: {response.status_code}")
            print(f"   📋 Headers: {dict(response.headers)}")
            
            if response.status_code == 405:
                # Probar métodos alternativos
                print("   🔄 Probando otros métodos...")
                for alt_method in ["PUT", "POST"]:
                    alt_response = requests.request(alt_method, url, json={"activa": True}, timeout=5)
                    print(f"   {alt_method}: {alt_response.status_code}")
                    
        except requests.exceptions.RequestException as e:
            print(f"   💥 Error: {e}")

if __name__ == "__main__":
    test_routes()
    test_flask_routes()
