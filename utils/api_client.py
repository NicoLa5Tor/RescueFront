# -*- coding: utf-8 -*-
"""
Simple API Client - Frontend utilities

Un cliente API simplificado que maneja la autenticación y las llamadas
más comunes al backend de forma consistente y reutilizable.
"""

import requests
from typing import Dict, Any, Optional
from flask import request
from datetime import datetime


class APIClient:
    """Cliente API simplificado para el frontend"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
    
    def _get_auth_cookies(self) -> Dict[str, str]:
        """Obtiene las cookies de autenticación de la petición actual"""
        return {'auth_token': request.cookies.get('auth_token')} if request.cookies.get('auth_token') else {}

    def _normalize_date(self, value: Any) -> str:
        if not value:
            return ''
        try:
            return datetime.fromisoformat(str(value).replace('Z', '+00:00')).isoformat()
        except (ValueError, TypeError):
            return str(value)
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Hace una petición HTTP con autenticación automática"""
        url = f"{self.base_url}{endpoint}"
        cookies = self._get_auth_cookies()
        headers = kwargs.pop('headers', {})
        headers.setdefault('Content-Type', 'application/json')
        
        return requests.request(
            method=method,
            url=url,
            cookies=cookies,
            headers=headers,
            **kwargs
        )
    
    def get(self, endpoint: str, **kwargs) -> requests.Response:
        """GET request con autenticación"""
        return self._make_request('GET', endpoint, **kwargs)
    
    def post(self, endpoint: str, **kwargs) -> requests.Response:
        """POST request con autenticación"""
        return self._make_request('POST', endpoint, **kwargs)
    
    def put(self, endpoint: str, **kwargs) -> requests.Response:
        """PUT request con autenticación"""
        return self._make_request('PUT', endpoint, **kwargs)
    
    def delete(self, endpoint: str, **kwargs) -> requests.Response:
        """DELETE request con autenticación"""
        return self._make_request('DELETE', endpoint, **kwargs)
    
    # Métodos específicos del dominio - solo los que realmente usas
    
    def get_usuarios_by_empresa(self, empresa_id: str) -> Dict[str, Any]:
        """Obtiene usuarios de una empresa específica"""
        try:
            response = self.get(f"/api/users/empresa/{empresa_id}")
            if response.ok:
                data = response.json()
                print(f"DEBUG: Usuarios response data: {data}")
                print(f"DEBUG: Usuarios response data type: {type(data)}")
                
                if data.get('success'):
                    backend_data = data.get('data', {})
                    
                    # Si los datos vienen como lista, necesitamos transformarlos
                    if isinstance(backend_data, list):
                        usuarios_list = backend_data
                        # Calcular estadísticas desde la lista
                        total_users = len(usuarios_list)
                        active_users = len([u for u in usuarios_list if u.get('activo', True) == True])
                        inactive_users = total_users - active_users
                        
                        return {
                            'usuarios': usuarios_list,
                            'usuarios_stats': {
                                'total_users': total_users,
                                'active_users': active_users,
                                'inactive_users': inactive_users
                            },
                            'count': total_users
                        }
                    # Si los datos vienen como diccionario, usarlos directamente
                    elif isinstance(backend_data, dict):
                        return backend_data
                    else:
                        print(f"WARNING: Unexpected usuarios data format: {type(backend_data)}")
                        raise Exception(f"Unexpected data format: {type(backend_data)}")
                else:
                    raise Exception(f"Backend error: {data.get('errors', [])}")
            else:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Error getting usuarios data: {e}")
            return {
                'usuarios': [],
                'usuarios_stats': {
                    'total_users': 0,
                    'active_users': 0,
                    'inactive_users': 0
                },
                'count': 0
            }
    
    def get_empresas(self, include_inactive: bool = False) -> Dict[str, Any]:
        """Obtiene la lista de empresas"""
        try:
            params = {'include_inactive': 'true'} if include_inactive else {}
            response = self.get("/api/empresas", params=params)
            if response.ok:
                data = response.json()
                print(f"DEBUG: Empresas response data: {data}")
                print(f"DEBUG: Empresas response data type: {type(data)}")
                
                if data.get('success'):
                    backend_data = data.get('data', {})
                    
                    # Si los datos vienen como lista, necesitamos transformarlos
                    if isinstance(backend_data, list):
                        empresas_list = backend_data
                        # Calcular estadísticas desde la lista
                        total_empresas = len(empresas_list)
                        active_empresas = len([e for e in empresas_list if e.get('activa', True) == True])
                        inactive_empresas = total_empresas - active_empresas
                        
                        return {
                            'empresas': empresas_list,
                            'empresas_stats': {
                                'total_empresas': total_empresas,
                                'active_empresas': active_empresas,
                                'inactive_empresas': inactive_empresas
                            },
                            'count': total_empresas
                        }
                    # Si los datos vienen como diccionario, usarlos directamente
                    elif isinstance(backend_data, dict):
                        return backend_data
                    else:
                        print(f"WARNING: Unexpected data format from backend: {type(backend_data)}")
                        raise Exception(f"Unexpected data format: {type(backend_data)}")
                else:
                    raise Exception(f"Backend error: {data.get('errors', [])}")
            else:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
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
    
    def get_hardware(self) -> Dict[str, Any]:
        """Obtiene la lista de hardware"""
        try:
            response = self.get("/api/hardware")
            if response.ok:
                data = response.json()
                print(f"DEBUG: Hardware response data: {data}")
                print(f"DEBUG: Hardware response data type: {type(data)}")
                
                if data.get('success'):
                    backend_data = data.get('data', {})
                    
                    # Si los datos vienen como lista, necesitamos transformarlos
                    if isinstance(backend_data, list):
                        hardware_list = backend_data
                        # Calcular estadísticas desde la lista
                        total_items = len(hardware_list)
                        available_items = len([h for h in hardware_list if h.get('activa', True) == True])
                        out_of_stock = total_items - available_items
                        
                        return {
                            'hardware_list': hardware_list,
                            'hardware_types': [],  # Esto necesitaría otra llamada
                            'hardware_stats': {
                                'total_items': total_items,
                                'available_items': available_items,
                                'out_of_stock': out_of_stock,
                                'total_value': 0,  # Calcular si existe el campo
                                'avg_price': 0
                            }
                        }
                    # Si los datos vienen como diccionario, usarlos directamente
                    elif isinstance(backend_data, dict):
                        return backend_data
                    else:
                        print(f"WARNING: Unexpected hardware data format: {type(backend_data)}")
                        raise Exception(f"Unexpected data format: {type(backend_data)}")
                else:
                    raise Exception(f"Backend error: {data.get('errors', [])}")
            else:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
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
    
    def get_company_types(self) -> Dict[str, Any]:
        """Obtiene los tipos de empresa"""
        try:
            response = self.get("/api/tipos_empresa/dashboard/all")
            if response.ok:
                data = response.json()
                if data.get('success'):
                    raw_types = data.get('data', [])
                    
                    # Map backend fields to frontend expected fields
                    mapped_types = []
                    for raw_type in raw_types:
                        mapped_type = {
                            'id': str(raw_type.get('_id', '')),
                            'name': raw_type.get('nombre', ''),
                            'description': raw_type.get('descripcion', ''),
                            'active': raw_type.get('activo', True),
                            'companies_count': raw_type.get('empresas_count', 0),
                            'features': raw_type.get('caracteristicas', []),
                            'created_at': self._normalize_date(raw_type.get('fecha_creacion')),
                            'color': '#8b5cf6',  # Default purple
                            'icon': 'fas fa-building'  # Default icon
                        }
                        mapped_types.append(mapped_type)
                    
                    # Calculate stats from all types
                    stats = {
                        'total_types': len(mapped_types),
                        'active_types': len([t for t in mapped_types if t.get('active', True)]),
                        'inactive_types': len([t for t in mapped_types if not t.get('active', True)]),
                        'total_companies': sum(t.get('companies_count', 0) for t in mapped_types),
                        'avg_companies_per_type': 0
                    }
                    
                    if stats['total_types'] > 0:
                        stats['avg_companies_per_type'] = round(stats['total_companies'] / stats['total_types'], 1)
                    
                    return {
                        'company_types': mapped_types,
                        'company_types_stats': stats
                    }
                else:
                    raise Exception("Backend response not successful")
            else:
                raise Exception(f"Backend error: {response.status_code}")
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
    
    def get_empresa_statistics(self, empresa_id: str) -> Dict[str, Any]:
        """Obtiene estadísticas de una empresa específica"""
        try:
            response = self.get(f"/api/empresas/{empresa_id}/statistics")
            if response.ok:
                data = response.json()
                if data.get('success'):
                    return data.get('data', {})
                else:
                    raise Exception(f"Backend error: {data.get('errors', [])}")
            else:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Error getting empresa statistics: {e}")
            return {}
    
    def health_check(self) -> bool:
        """Verifica si el backend está disponible"""
        try:
            response = self.get("/health")
            return response.ok
        except Exception as e:
            print(f"Backend health check failed: {e}")
            return False
