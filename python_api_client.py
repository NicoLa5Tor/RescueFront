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
        data: Optional[Dict[str, Any]] = None,
        cookies: Optional[Dict[str, str]] = None
    ) -> requests.Response:
        url = f"{self.base_url}{endpoint}"
        return requests.request(method, url, params=params, json=data, headers=self._headers(), cookies=cookies)

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

    def get_empresa_statistics(self, empresa_id: str) -> requests.Response:
        """GET /api/empresas/{empresa_id}/statistics - Estadísticas específicas de empresa"""
        return self._request("GET", f"/api/empresas/{empresa_id}/statistics")


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

    def get_usuarios_including_inactive(self, empresa_id: str) -> requests.Response:
        """GET /empresas/{empresa_id}/usuarios/including-inactive"""
        return self._request("GET", f"/empresas/{empresa_id}/usuarios/including-inactive")

    def get_usuarios_data_for_frontend(self, empresa_id: str) -> Dict[str, Any]:
        """Get usuarios data formatted for frontend with statistics from backend."""
        try:
            # Prefer endpoint that includes inactive users and returns stats
            response = self.get_usuarios_including_inactive(empresa_id)

            # Fallback to standard endpoint if the first fails
            if not response.ok:
                response = self.get_usuarios_by_empresa(empresa_id)

            if response.ok:
                data = response.json()
                if data.get('success'):
                    usuarios = data.get('data', [])
                    backend_stats = data.get('stats') or {}

                    # Use stats from backend when available, otherwise compute them
                    total = backend_stats.get('total', len(usuarios))
                    active = backend_stats.get(
                        'activos', len([u for u in usuarios if u.get('activo', True)])
                    )
                    inactive = backend_stats.get(
                        'inactivos', len([u for u in usuarios if not u.get('activo', True)])
                    )

                    stats = {
                        'total_users': total,
                        'active_users': active,
                        'inactive_users': inactive,
                    }

                    return {
                        'usuarios': usuarios,
                        'usuarios_stats': stats,
                        'count': len(usuarios),
                    }
        except Exception as e:
            print(f"Error getting usuarios data: {e}")

        # Fallback empty structure if everything fails
        return {
            'usuarios': [],
            'usuarios_stats': {
                'total_users': 0,
                'active_users': 0,
                'inactive_users': 0,
            },
            'count': 0,
        }

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
    
    def get_hardware_by_empresa_including_inactive(self, empresa_id: str) -> requests.Response:
        """GET /api/hardware/empresa/{empresa_id}/including-inactive - Hardware por empresa incluyendo inactivos"""
        return self._request("GET", f"/api/hardware/empresa/{empresa_id}/including-inactive")
    
    def get_hardware_data_for_empresa_frontend(self, empresa_id: str) -> Dict[str, Any]:
        """Get hardware data for specific empresa formatted for frontend with statistics."""
        try:
            # Prefer endpoint that includes inactive hardware and returns stats
            response = self.get_hardware_by_empresa_including_inactive(empresa_id)
            
            # Fallback to standard endpoint if the first fails
            if not response.ok:
                response = self.get_hardware_by_empresa(empresa_id)
            
            # Also get hardware types
            types_response = self.get_hardware_types()
            
            if response.ok:
                data = response.json()
                types_data = types_response.json() if types_response.ok else {'success': False, 'data': []}
                
                if data.get('success'):
                    hardware_list = data.get('data', [])
                    backend_stats = data.get('stats') or {}
                    
                    # Use stats from backend when available, otherwise compute them
                    total = backend_stats.get('total', len(hardware_list))
                    active = backend_stats.get(
                        'activos', len([h for h in hardware_list if h.get('activa', True)])
                    )
                    inactive = backend_stats.get(
                        'inactivos', len([h for h in hardware_list if not h.get('activa', True)])
                    )
                    
                    # Calculate additional stats
                    available_items = len([h for h in hardware_list if h.get('datos', {}).get('status') == 'available'])
                    out_of_stock = len([h for h in hardware_list if h.get('datos', {}).get('status') == 'out_of_stock'])
                    
                    # Calculate total value
                    total_value = sum(
                        (h.get('datos', {}).get('price', 0) or 0) * (h.get('datos', {}).get('stock', 0) or 0) 
                        for h in hardware_list
                    )
                    
                    stats = {
                        'total_items': total,
                        'active_items': active,
                        'inactive_items': inactive,
                        'available_items': available_items or active,  # Fallback to active count
                        'out_of_stock': out_of_stock or inactive,  # Fallback to inactive count
                        'total_value': total_value,
                    }
                    
                    return {
                        'hardware_list': hardware_list,
                        'hardware_types': types_data.get('data', []) if types_data.get('success') else [],
                        'hardware_stats': stats,
                        'count': len(hardware_list),
                    }
        except Exception as e:
            print(f"Error getting empresa hardware data: {e}")
        
        # Fallback empty structure if everything fails
        return {
            'hardware_list': [],
            'hardware_types': [],
            'hardware_stats': {
                'total_items': 0,
                'active_items': 0,
                'inactive_items': 0,
                'available_items': 0,
                'out_of_stock': 0,
                'total_value': 0,
            },
            'count': 0,
        }

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
    
    # ------------------------------------------------------------------
    # Super Admin Dashboard endpoints
    # ------------------------------------------------------------------
    def get_dashboard_stats(self) -> requests.Response:
        """GET /api/dashboard/stats - Estadísticas generales del sistema"""
        return self._request("GET", "/api/dashboard/stats")
    
    def get_dashboard_recent_companies(self, limit: int = 5) -> requests.Response:
        """GET /api/dashboard/recent-companies - Empresas recientes"""
        params = {"limit": limit} if limit != 5 else None
        return self._request("GET", "/api/dashboard/recent-companies", params=params)
    
    def get_dashboard_recent_users(self, limit: int = 5) -> requests.Response:
        """GET /api/dashboard/recent-users - Usuarios recientes"""
        params = {"limit": limit} if limit != 5 else None
        return self._request("GET", "/api/dashboard/recent-users", params=params)
    
    def get_dashboard_activity_chart(self, period: str = "30d", limit: int = 8) -> requests.Response:
        """GET /api/dashboard/activity-chart - Datos para gráfico de actividad"""
        params = {}
        if period != "30d":
            params["period"] = period
        if limit != 8:
            params["limit"] = limit
        return self._request("GET", "/api/dashboard/activity-chart", params=params if params else None)
    
    def get_dashboard_distribution_chart(self) -> requests.Response:
        """GET /api/dashboard/distribution-chart - Datos para gráfico de distribución"""
        return self._request("GET", "/api/dashboard/distribution-chart")
    
    def get_dashboard_hardware_stats(self) -> requests.Response:
        """GET /api/dashboard/hardware-stats - Estadísticas de hardware"""
        return self._request("GET", "/api/dashboard/hardware-stats")
    
    def get_dashboard_system_performance(self) -> requests.Response:
        """GET /api/dashboard/system-performance - Rendimiento del sistema"""
        return self._request("GET", "/api/dashboard/system-performance")

    # ------------------------------------------------------------------
    # Company Types endpoints
    # ------------------------------------------------------------------
    def create_company_type(self, data: Dict[str, Any]) -> requests.Response:
        """POST /api/tipos_empresa - Crear tipo de empresa"""
        return self._request("POST", "/api/tipos_empresa", data=data)

    def get_company_types(self, skip: int = 0, limit: int = 100) -> requests.Response:
        """GET /api/tipos_empresa - Obtener tipos de empresa"""
        params = {"skip": skip, "limit": limit}
        return self._request("GET", "/api/tipos_empresa", params=params)

    def get_company_type(self, type_id: str) -> requests.Response:
        """GET /api/tipos_empresa/{id} - Obtener tipo específico"""
        return self._request("GET", f"/api/tipos_empresa/{type_id}")

    def update_company_type(self, type_id: str, data: Dict[str, Any]) -> requests.Response:
        """PUT /api/tipos_empresa/{id} - Actualizar tipo de empresa"""
        return self._request("PUT", f"/api/tipos_empresa/{type_id}", data=data)

    def delete_company_type(self, type_id: str) -> requests.Response:
        """DELETE /api/tipos_empresa/{id} - Eliminar tipo de empresa"""
        return self._request("DELETE", f"/api/tipos_empresa/{type_id}")

    def search_company_types(self, query: str, skip: int = 0, limit: int = 100) -> requests.Response:
        """GET /api/tipos_empresa/search - Buscar tipos de empresa"""
        params = {"query": query, "skip": skip, "limit": limit}
        return self._request("GET", "/api/tipos_empresa/search", params=params)

    def get_active_company_types(self):
        """GET /api/tipos_empresa/activos - Obtener tipos activos"""
        return self._request("GET", "/api/tipos_empresa/activos")
    
    def toggle_company_type_status(self, type_id: str):
        """PATCH /api/tipos_empresa/{id}/toggle-status - Activar/desactivar tipo de empresa"""
        return self._request("PATCH", f"/api/tipos_empresa/{type_id}/toggle-status")
    
    def get_empresas_dashboard_all(self):
        """GET /api/empresas/dashboard/all - Obtener TODAS las empresas (activas e inactivas) para dashboards"""
        return self._request("GET", "/api/empresas/dashboard/all")
    
    def get_tipos_empresa_dashboard_all(self):
        """GET /api/tipos_empresa/dashboard/all - Obtener TODOS los tipos de empresa (activos e inactivos) para dashboards"""
        return self._request("GET", "/api/tipos_empresa/dashboard/all")
    
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
    
    def get_empresas_data_for_frontend(self, include_inactive: bool = False) -> Dict[str, Any]:
        """Get empresas data formatted for frontend
        
        Args:
            include_inactive: If True, includes inactive empresas. Default False (only active empresas).
        """
        try:
            # Get empresas from backend - use dashboard endpoint for complete data
            if include_inactive:
                # Use dashboard endpoint that returns ALL empresas (active + inactive)
                empresas_response = self.get_empresas_dashboard_all()
            else:
                empresas_response = self.get_empresas()  # Get only active empresas
            
            if empresas_response.ok:
                empresas_data = empresas_response.json()
                if empresas_data.get('success'):
                    raw_empresas = empresas_data.get('data', [])
                    
                    # Calculate stats
                    stats = {
                        'total_empresas': len(raw_empresas),
                        'active_empresas': len([e for e in raw_empresas if e.get('activa', True)]),
                        'inactive_empresas': len([e for e in raw_empresas if not e.get('activa', True)])
                    }
                    
                    return {
                        'empresas': raw_empresas,
                        'empresas_stats': stats,
                        'count': len(raw_empresas)
                    }
            
            # Fallback data
            return {
                'empresas': [],
                'empresas_stats': {
                    'total_empresas': 0,
                    'active_empresas': 0,
                    'inactive_empresas': 0
                },
                'count': 0
            }
            
        except Exception as e:
            print(f"Error getting empresas data: {e}")
            return {
                'empresas': [],
                'empresas_stats': {
                    'total_empresas': 0,
                    'active_empresas': 0,
                    'inactive_empresas': 0
                },
                'count': 0
            }
    
    def get_company_types_data_for_frontend(self, include_inactive: bool = False) -> Dict[str, Any]:
        """Get company types data formatted for frontend with iOS enhancements
        
        OPTIMIZED: Always fetches ALL types from backend and filters in frontend to avoid double queries.
        
        Args:
            include_inactive: If True, includes inactive company types. Default False (only active types).
        """
        try:
            # Always use dashboard endpoint that returns ALL types (active + inactive)
            # Then filter in frontend to avoid double database queries
            types_response = self._request("GET", "/api/tipos_empresa/dashboard/all")
            stats_response = self._request("GET", "/api/tipos_empresa/estadisticas")  # Get real stats
            
            if types_response.ok:
                types_data = types_response.json()
                if types_data.get('success'):
                    all_types = types_data.get('data', [])
                    
                    # Filter in frontend based on include_inactive parameter
                    if include_inactive:
                        # Return all types (active + inactive)
                        raw_types = all_types
                    else:
                        # Filter to only active types
                        raw_types = [t for t in all_types if t.get('activo', True)]
                    
                    # Enrich data with iOS styling for frontend
                    enriched_types = self._enrich_company_types_for_ios(raw_types)
                    
                    # Get real stats from backend if available
                    stats = {
                        'total_types': 0,
                        'active_types': 0,
                        'inactive_types': 0,
                        'total_companies': 0,
                        'avg_companies_per_type': 0
                    }
                    
                    if stats_response.ok:
                        stats_data = stats_response.json()
                        if stats_data.get('success'):
                            backend_stats = stats_data.get('data', {})
                            stats.update({
                                'total_types': backend_stats.get('total_types', 0),
                                'active_types': backend_stats.get('active_types', 0),
                                'inactive_types': backend_stats.get('inactive_types', 0),
                                'total_companies': backend_stats.get('total_companies', 0),
                                'avg_companies_per_type': backend_stats.get('avg_companies_per_type', 0)
                            })
                    
                    # Fallback to calculated stats if backend stats not available
                    if stats['total_types'] == 0 and enriched_types:
                        stats['total_types'] = len(enriched_types)
                        stats['active_types'] = len([t for t in enriched_types if t['active']])
                        stats['inactive_types'] = stats['total_types'] - stats['active_types']
                        stats['total_companies'] = sum(t.get('companies_count', 0) for t in enriched_types)
                        stats['avg_companies_per_type'] = stats['total_companies'] // stats['total_types'] if stats['total_types'] > 0 else 0
                    
                    return {
                        'company_types': enriched_types,
                        'company_types_stats': stats
                    }
            
            # Fallback data
            return {
                'company_types': [],
                'company_types_stats': {
                    'total_types': 0,
                    'active_types': 0,
                    'inactive_types': 0,
                    'total_companies': 0,
                    'avg_companies_per_type': 0
                }
            }
            
        except Exception as e:
            print(f"Error getting company types data: {e}")
            return {
                'company_types': [],
                'company_types_stats': {
                    'total_types': 0,
                    'active_types': 0,
                    'inactive_types': 0,
                    'total_companies': 0,
                    'avg_companies_per_type': 0
                }
            }
    
    def _enrich_company_types_for_ios(self, raw_types: list) -> list:
        """Enrich backend data with iOS styling and additional fields"""
        import random
        from datetime import datetime
        
        # Predefined iOS styling options
        ios_styles = {
            'tecnología': {'color': '#8b5cf6', 'icon': 'fas fa-laptop-code'},
            'servicios': {'color': '#f472b6', 'icon': 'fas fa-handshake'},
            'manufactura': {'color': '#60a5fa', 'icon': 'fas fa-industry'},
            'retail': {'color': '#34d399', 'icon': 'fas fa-store'},
            'salud': {'color': '#fbbf24', 'icon': 'fas fa-heart'},
            'educación': {'color': '#ef4444', 'icon': 'fas fa-graduation-cap'},
            'finanzas': {'color': '#06b6d4', 'icon': 'fas fa-chart-line'},
            'corporativo': {'color': '#84cc16', 'icon': 'fas fa-building'},
            'industrial': {'color': '#f97316', 'icon': 'fas fa-cogs'},
            'sostenible': {'color': '#10b981', 'icon': 'fas fa-leaf'}
        }
        
        # Default styles
        default_colors = ['#8b5cf6', '#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#ef4444']
        default_icons = ['fas fa-building', 'fas fa-briefcase', 'fas fa-chart-pie']
        
        enriched = []
        
        for raw_type in raw_types:
            # Get style based on name or use default
            name_key = raw_type.get('nombre', '').lower()
            style = ios_styles.get(name_key, {
                'color': random.choice(default_colors),
                'icon': random.choice(default_icons)
            })
            
            # Format date
            created_at = raw_type.get('fecha_creacion')
            if isinstance(created_at, str):
                try:
                    created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    formatted_date = created_date.strftime('%Y-%m-%d')
                except:
                    formatted_date = created_at[:10] if len(created_at) >= 10 else created_at
            else:
                formatted_date = datetime.now().strftime('%Y-%m-%d')
            
                    # Use real features from backend
            features = raw_type.get('caracteristicas', [])
            
            enriched_type = {
                'id': str(raw_type.get('_id', '')),
                'name': raw_type.get('nombre', ''),
                'description': raw_type.get('descripcion', ''),
                'color': style['color'],
                'icon': style['icon'],
                'created_at': formatted_date,
                'companies_count': raw_type.get('empresas_count', 0),  # Real count from backend
                'active': raw_type.get('activo', True),
                'features': features
            }
            
            enriched.append(enriched_type)
        
        return enriched
    

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

