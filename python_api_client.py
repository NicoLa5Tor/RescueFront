# -*- coding: utf-8 -*-
"""Simple Python client for interacting with the backend API.

This module provides the `EndpointTestClient` class which mirrors the
JavaScript API client but uses Python's `requests` library. It can be
used in scripts or tests to interact with the Flask backend.
"""

from typing import Any, Dict, Optional
import json
import requests


class EndpointTestClient:
    """Client for performing requests against the backend API."""

    def __init__(self, base_url: str = "http://localhost:5002", token: Optional[str] = None) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token

    # ------------------------------------------------------------------
    # Internal utilities
    # ------------------------------------------------------------------
    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _request(
        self,
        method: str,
        endpoint: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None
    ) -> requests.Response:
        url = f"{self.base_url}{endpoint}"
        return requests.request(method, url, params=params, json=data, headers=self._headers())

    # ------------------------------------------------------------------
    # Authentication and health endpoints
    # ------------------------------------------------------------------
    def login(self, usuario: str, password: str) -> requests.Response:
        return self._request("POST", "/auth/login", data={"usuario": usuario, "password": password})

    def health(self) -> requests.Response:
        return self._request("GET", "/health")

    def index(self) -> requests.Response:
        return self._request("GET", "/")

    # ------------------------------------------------------------------
    # User endpoints
    # ------------------------------------------------------------------
    def create_user(self, data: Dict[str, Any]) -> requests.Response:
        return self._request("POST", "/api/users", data=data)

    def get_users(self) -> requests.Response:
        return self._request("GET", "/api/users")

    def get_user(self, user_id: str) -> requests.Response:
        return self._request("GET", f"/api/users/{user_id}")

    def update_user(self, user_id: str, data: Dict[str, Any]) -> requests.Response:
        return self._request("PUT", f"/api/users/{user_id}", data=data)

    def delete_user(self, user_id: str) -> requests.Response:
        return self._request("DELETE", f"/api/users/{user_id}")

    def get_users_by_age(self, min_age: int, max_age: int) -> requests.Response:
        params = {"min_age": min_age, "max_age": max_age}
        return self._request("GET", "/api/users/age-range", params=params)

    def get_user_by_phone(self, telefono: str) -> requests.Response:
        return self._request("GET", "/api/users/buscar-por-telefono", params={"telefono": telefono})

    # ------------------------------------------------------------------
    # Company endpoints
    # ------------------------------------------------------------------
    def create_empresa(self, data: Dict[str, Any]) -> requests.Response:
        return self._request("POST", "/api/empresas", data=data)

    def get_empresas(self, include_inactive: bool = False) -> requests.Response:
        params = {"include_inactive": str(include_inactive).lower()} if include_inactive else None
        return self._request("GET", "/api/empresas", params=params)

    def get_empresa(self, empresa_id: str) -> requests.Response:
        return self._request("GET", f"/api/empresas/{empresa_id}")

    def update_empresa(self, empresa_id: str, data: Dict[str, Any]) -> requests.Response:
        return self._request("PUT", f"/api/empresas/{empresa_id}", data=data)

    def delete_empresa(self, empresa_id: str) -> requests.Response:
        return self._request("DELETE", f"/api/empresas/{empresa_id}")

    def get_my_empresas(self) -> requests.Response:
        return self._request("GET", "/api/empresas/mis-empresas")

    def search_empresas_by_ubicacion(self, ubicacion: str) -> requests.Response:
        return self._request("GET", "/api/empresas/buscar-por-ubicacion", params={"ubicacion": ubicacion})

    def get_empresa_stats(self) -> requests.Response:
        return self._request("GET", "/api/empresas/estadisticas")

    def get_empresa_activity(self, empresa_id: str) -> requests.Response:
        """GET /api/empresas/{empresa_id}/activity - Actividad de empresa"""
        return self._request("GET", f"/api/empresas/{empresa_id}/activity")


    # ------------------------------------------------------------------
    # Admin endpoints
    # ------------------------------------------------------------------
    def get_admin_activity(self) -> requests.Response:
        return self._request("GET", "/api/admin/activity")

    def get_admin_distribution(self) -> requests.Response:
        return self._request("GET", "/api/admin/distribution")

    def get_admin_activity_only(self) -> requests.Response:
        """GET /api/admin/activity-admin - Actividad detallada de empresas"""
        return self._request("GET", "/api/admin/activity-admin")

    # ------------------------------------------------------------------
    # Multi-tenant endpoints
    # ------------------------------------------------------------------
    def create_usuario_for_empresa(self, empresa_id: str, data: Dict[str, Any]) -> requests.Response:
        return self._request("POST", f"/empresas/{empresa_id}/usuarios", data=data)

    def get_usuarios_by_empresa(self, empresa_id: str) -> requests.Response:
        return self._request("GET", f"/empresas/{empresa_id}/usuarios")

    def get_usuario_by_empresa(self, empresa_id: str, usuario_id: str) -> requests.Response:
        return self._request("GET", f"/empresas/{empresa_id}/usuarios/{usuario_id}")

    def update_usuario_by_empresa(self, empresa_id: str, usuario_id: str, data: Dict[str, Any]) -> requests.Response:
        return self._request("PUT", f"/empresas/{empresa_id}/usuarios/{usuario_id}", data=data)

    def delete_usuario_by_empresa(self, empresa_id: str, usuario_id: str) -> requests.Response:
        return self._request("DELETE", f"/empresas/{empresa_id}/usuarios/{usuario_id}")

    # ------------------------------------------------------------------
    # Hardware endpoints
    # ------------------------------------------------------------------
    def create_hardware(self, data: Dict[str, Any]) -> requests.Response:
        """POST /api/hardware - Crear hardware"""
        return self._request("POST", "/api/hardware", data=data)

    def get_hardware_list(self) -> requests.Response:
        """GET /api/hardware - Obtener lista de hardware"""
        return self._request("GET", "/api/hardware")

    def get_hardware(self, hardware_id: str) -> requests.Response:
        """GET /api/hardware/{id} - Obtener hardware por ID"""
        return self._request("GET", f"/api/hardware/{hardware_id}")

    def update_hardware(self, hardware_id: str, data: Dict[str, Any]) -> requests.Response:
        """PUT /api/hardware/{id} - Actualizar hardware"""
        return self._request("PUT", f"/api/hardware/{hardware_id}", data=data)

    def delete_hardware(self, hardware_id: str) -> requests.Response:
        """DELETE /api/hardware/{id} - Eliminar hardware"""
        return self._request("DELETE", f"/api/hardware/{hardware_id}")

    def get_hardware_by_empresa(self, empresa_id: str) -> requests.Response:
        """GET /api/hardware/empresa/{empresa_id} - Obtener hardware por empresa"""
        return self._request("GET", f"/api/hardware/empresa/{empresa_id}")

    # ------------------------------------------------------------------
    # Hardware types endpoints
    # ------------------------------------------------------------------
    def get_hardware_types(self) -> requests.Response:
        """GET /api/hardware-types - Obtener tipos de hardware"""
        return self._request("GET", "/api/hardware-types")

    def create_hardware_type(self, data: Dict[str, Any]) -> requests.Response:
        """POST /api/hardware-types - Crear tipo de hardware"""
        return self._request("POST", "/api/hardware-types", data=data)

    def update_hardware_type(self, type_id: str, data: Dict[str, Any]) -> requests.Response:
        """PUT /api/hardware-types/{id} - Actualizar tipo de hardware"""
        return self._request("PUT", f"/api/hardware-types/{type_id}", data=data)

    def delete_hardware_type(self, type_id: str) -> requests.Response:
        """DELETE /api/hardware-types/{id} - Eliminar tipo de hardware"""
        return self._request("DELETE", f"/api/hardware-types/{type_id}")
    
    def toggle_hardware_status(self, hardware_id: str, activa: bool) -> requests.Response:
        """PATCH /api/hardware/{id}/toggle-status - Activar/desactivar hardware"""
        return self._request("PATCH", f"/api/hardware/{hardware_id}/toggle-status", data={"activa": activa})
    
    # Helper methods for frontend
    def get_hardware_data_for_frontend(self) -> Dict[str, Any]:
        """Get all hardware data formatted for frontend"""
        try:
            hardware_response = self.get_hardware_list()
            types_response = self.get_hardware_types()
            
            hardware_data = hardware_response.json() if hardware_response.ok else {'success': False, 'data': []}
            types_data = types_response.json() if types_response.ok else {'success': False, 'data': []}
            
            if hardware_data.get('success') and types_data.get('success'):
                hardware_list = hardware_data.get('data', [])
                
                # Calculate stats - check different possible status values
                total_items = len(hardware_list)
                
                # Count items based on different status indicators
                available_items = 0
                out_of_stock = 0
                
                for h in hardware_list:
                    # Check for status in datos field
                    status = h.get('datos', {}).get('status')
                    # Also check for stock levels
                    stock = h.get('datos', {}).get('stock', 0)
                    
                    # Consider available if status is available or if stock > 0
                    if status == 'available' or (status is None and stock > 0):
                        available_items += 1
                    elif status == 'out_of_stock' or stock == 0:
                        out_of_stock += 1
                
                # If no explicit status info, assume all items with stock > 0 are available
                if available_items == 0 and out_of_stock == 0 and total_items > 0:
                    available_items = len([h for h in hardware_list if h.get('datos', {}).get('stock', 0) > 0])
                    out_of_stock = total_items - available_items
                
                # Calculate total value
                total_value = sum(
                    (h.get('datos', {}).get('price', 0) or 0) * (h.get('datos', {}).get('stock', 0) or 0) 
                    for h in hardware_list
                )
                
                # Calculate average price
                prices = [h.get('datos', {}).get('price', 0) for h in hardware_list if h.get('datos', {}).get('price')]
                avg_price = sum(prices) / len(prices) if prices else 0
                
                return {
                    'hardware_list': hardware_list,
                    'hardware_types': types_data.get('data', []),
                    'hardware_stats': {
                        'total_items': total_items,
                        'available_items': available_items,
                        'out_of_stock': out_of_stock,
                        'total_value': total_value,
                        'avg_price': avg_price
                    }
                }
            else:
                return {
                    'hardware_list': [],
                    'hardware_types': [],
                    'hardware_stats': {
                        'total_items': 0,
                        'available_items': 0,
                        'out_of_stock': 0,
                        'total_value': 0,
                        'avg_price': 0
                    }
                }
        except Exception as e:
            print(f"Error getting hardware data: {e}")
            return {
                'hardware_list': [],
                'hardware_types': [],
                'hardware_stats': {
                    'total_items': 0,
                    'available_items': 0,
                    'out_of_stock': 0,
                    'total_value': 0,
                    'avg_price': 0
                }
            }

    # ------------------------------------------------------------------
    # Public utilities
    # ------------------------------------------------------------------
    def set_token(self, token: str) -> None:
        self.token = token

    def pretty_response(self, response: requests.Response) -> str:
        try:
            return json.dumps(response.json(), indent=2, ensure_ascii=False)
        except ValueError:
            return response.text

