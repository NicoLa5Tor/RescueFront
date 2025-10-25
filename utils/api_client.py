# -*- coding: utf-8 -*-
"""
Simple API Client - Frontend utilities

Un cliente API simplificado que maneja la autenticación y las llamadas
más comunes al backend de forma consistente y reutilizable.
"""

import requests
from typing import Dict, Any, Optional, List
from flask import request, g
from datetime import datetime


class APIClient:
    """Cliente API simplificado para el frontend"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
    
    def _get_auth_cookies(self) -> Dict[str, str]:
        """Obtiene las cookies de autenticación considerando tokens refrescados"""
        cached_cookies = getattr(g, 'cached_auth_cookies', {})
        auth_cookies: Dict[str, str] = {}
        for cookie_name in ('auth_token', 'refresh_token'):
            cookie_value = cached_cookies.get(cookie_name) or request.cookies.get(cookie_name)
            if cookie_value:
                auth_cookies[cookie_name] = cookie_value
        return auth_cookies

    def _normalize_date(self, value: Any) -> str:
        if not value:
            return ''
        try:
            return datetime.fromisoformat(str(value).replace('Z', '+00:00')).isoformat()
        except (ValueError, TypeError):
            return str(value)
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Hace una petición HTTP con autenticación automática"""
        raw_kwargs = dict(kwargs)
        retry_attempted = raw_kwargs.pop('_retry_attempted', False)

        if endpoint.startswith(('http://', 'https://')):
            url = endpoint
            normalized_endpoint = endpoint
        else:
            normalized_endpoint = endpoint if endpoint.startswith('/') else f'/{endpoint}'
            url = f"{self.base_url}{normalized_endpoint}"

        extra_cookies = raw_kwargs.pop('cookies', None)
        cookies = self._get_auth_cookies()
        if extra_cookies:
            cookies.update(extra_cookies)

        headers = dict(raw_kwargs.pop('headers', {}))
        headers.setdefault('Content-Type', 'application/json')

        auth_token = cookies.get('auth_token') or request.cookies.get('auth_token')
        if auth_token and 'Authorization' not in headers:
            headers['Authorization'] = f'Bearer {auth_token}'

        request_kwargs = dict(raw_kwargs)
        request_kwargs['cookies'] = cookies
        request_kwargs['headers'] = headers

        response = requests.request(
            method=method,
            url=url,
            **request_kwargs
        )

        if (
            response.status_code == 401
            and self._should_attempt_refresh(normalized_endpoint, retry_attempted, cookies)
        ):
            refreshed_cookies = self._refresh_token(cookies)
            if refreshed_cookies:
                retry_headers = dict(headers)
                new_auth_token = refreshed_cookies.get('auth_token')
                if new_auth_token:
                    retry_headers['Authorization'] = f'Bearer {new_auth_token}'
                else:
                    retry_headers.pop('Authorization', None)

                retry_kwargs = dict(raw_kwargs)
                retry_kwargs['cookies'] = refreshed_cookies
                retry_kwargs['headers'] = retry_headers
                response = requests.request(
                    method=method,
                    url=url,
                    **retry_kwargs
                )
            else:
                # Limpia tokens cacheados si el refresh falla para evitar bucles
                if hasattr(g, 'cached_auth_cookies'):
                    g.cached_auth_cookies.clear()

        return response

    def _should_attempt_refresh(self, endpoint: str, retry_attempted: bool, cookies: Dict[str, str]) -> bool:
        if retry_attempted:
            return False

        normalized = endpoint if endpoint.startswith('/') else f'/{endpoint}'
        if normalized in ('/auth/login', '/auth/refresh'):
            return False

        refresh_token = cookies.get('refresh_token') or request.cookies.get('refresh_token')
        return bool(refresh_token)

    def _store_refreshed_cookies(self, cookie_jar) -> None:
        if not cookie_jar:
            return

        cached = dict(getattr(g, 'cached_auth_cookies', {}))
        stored: List[Dict[str, str]] = list(getattr(g, 'backend_refreshed_cookies', []))

        for cookie in cookie_jar:
            if not cookie.value:
                continue
            cached[cookie.name] = cookie.value
            stored.append({'name': cookie.name, 'value': cookie.value})

        g.cached_auth_cookies = cached
        g.backend_refreshed_cookies = stored

    def _refresh_token(self, cookies: Dict[str, str]) -> Optional[Dict[str, str]]:
        refresh_token = cookies.get('refresh_token') or request.cookies.get('refresh_token')
        if not refresh_token:
            return None

        refresh_url = f"{self.base_url}/auth/refresh"
        headers = {'Content-Type': 'application/json'}

        if cookies.get('auth_token'):
            headers['Authorization'] = f"Bearer {cookies['auth_token']}"

        try:
            refresh_response = requests.post(
                refresh_url,
                cookies=cookies,
                headers=headers
            )
        except Exception as exc:  # noqa: BLE001
            print(f"❌ Error refreshing token: {exc}")
            return None

        if refresh_response.ok:
            refreshed = dict(cookies)
            for cookie in refresh_response.cookies:
                if cookie.value:
                    refreshed[cookie.name] = cookie.value

            self._store_refreshed_cookies(refresh_response.cookies)
            return refreshed

        # Si el backend reporta sesión inválida, limpia la caché local
        if hasattr(g, 'cached_auth_cookies'):
            g.cached_auth_cookies.clear()

        try:
            error_payload = refresh_response.json()
            print(f"⚠️ Refresh token failed: {error_payload}")
        except Exception:
            print(f"⚠️ Refresh token failed with status {refresh_response.status_code}")

        return None

    def request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Permite realizar peticiones con método dinámico"""
        return self._make_request(method.upper(), endpoint, **kwargs)
    
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

    def patch(self, endpoint: str, **kwargs) -> requests.Response:
        """PATCH request con autenticación"""
        return self._make_request('PATCH', endpoint, **kwargs)
    
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

    def get_alert_types(
        self,
        page: int = 1,
        limit: int = 10,
        status: str = 'active'
    ) -> Dict[str, Any]:
        """Obtiene tipos de alerta con paginación y filtros por estado"""

        def _map_severity(raw_value: Optional[str]) -> str:
            if not raw_value:
                return 'desconocida'
            normalized = str(raw_value).strip().upper()
            mapping = {
                'ROJO': 'critica',
                'NARANJA': 'alta',
                'AMARILLO': 'media',
                'VERDE': 'baja',
            }
            return mapping.get(normalized, normalized.lower())

        try:
            normalized_status = (status or 'active').strip().lower()
            if normalized_status not in {'active', 'inactive', 'all'}:
                normalized_status = 'active'

            params = {
                'page': max(page, 1),
                'limit': max(limit, 1)
            }

            endpoint_map = {
                'active': '/api/tipos-alarma/activos',
                'inactive': '/api/tipos-alarma/inactivos',
                'all': '/api/tipos-alarma',
            }
            endpoint = endpoint_map.get(normalized_status, '/api/tipos-alarma')
            response = self.get(endpoint, params=params)
            if not response.ok:
                raise Exception(f"HTTP {response.status_code}: {response.text}")

            payload = response.json()
            if not payload.get('success'):
                raise Exception(f"Backend error: {payload}")

            raw_items = payload.get('data', []) or []
            pagination = payload.get('pagination', {}) or {}

            mapped_items = []
            for raw in raw_items:
                severity = _map_severity(raw.get('tipo_alerta'))
                color_value = raw.get('color_alerta')
                if isinstance(color_value, str):
                    color_value = color_value.strip()
                else:
                    color_value = ''
                mapped_items.append({
                    'id': str(raw.get('_id', '')),
                    'name': raw.get('nombre', ''),
                    'description': raw.get('descripcion', ''),
                    'severity': severity,
                    'color': color_value,
                    'image': raw.get('imagen_base64'),
                    'sound': raw.get('sonido_link'),
                    'recommendations': raw.get('recomendaciones', []) or [],
                    'equipment': raw.get('implementos_necesarios', []) or [],
                    'company_id': raw.get('empresa_id'),
                    'active': bool(raw.get('activo', True)),
                    'sla_minutes': raw.get('sla_minutos') or raw.get('sla') or 0,
                    'created_at': self._normalize_date(raw.get('fecha_creacion')),
                    'updated_at': self._normalize_date(raw.get('fecha_actualizacion')),
                })

            total = pagination.get('total', len(mapped_items))
            active = sum(1 for item in mapped_items if item.get('active'))
            stats = {
                'total_types': total,
                'active_types': active,
                'inactive_types': max(total - active, 0),
                'critical_types': sum(1 for item in mapped_items if item.get('severity') == 'critica'),
                'avg_sla_minutes': 0,
            }

            return {
                'alert_types': mapped_items,
                'alert_types_stats': stats,
                'pagination': {
                    'page': pagination.get('page', params['page']),
                    'limit': pagination.get('limit', params['limit']),
                    'total': total,
                    'pages': pagination.get('pages') or (
                        (total + pagination.get('limit', params['limit']) - 1)
                        // pagination.get('limit', params['limit'])
                        if total and pagination.get('limit', params['limit'])
                        else 1
                    )
                },
                'filter_status': normalized_status
            }

        except Exception as exc:
            print(f"Error getting alert types data: {exc}")
            return {
                'alert_types': [],
                'alert_types_stats': {
                    'total_types': 0,
                    'active_types': 0,
                    'inactive_types': 0,
                    'critical_types': 0,
                    'avg_sla_minutes': 0,
                },
                'pagination': {
                    'page': max(page, 1),
                    'limit': max(limit, 1),
                    'total': 0,
                    'pages': 1,
                },
                'filter_status': normalized_status
            }

    def get_alert_type(self, alert_type_id: str) -> Dict[str, Any]:
        """Obtiene el detalle de un tipo de alerta por ID"""
        if not alert_type_id:
            return {'success': False, 'message': 'ID inválido', 'data': None}

        def _map_severity(raw_value: Optional[str]) -> str:
            if not raw_value:
                return 'desconocida'
            normalized = str(raw_value).strip().upper()
            mapping = {
                'ROJO': 'critica',
                'NARANJA': 'alta',
                'AMARILLO': 'media',
                'VERDE': 'baja',
            }
            return mapping.get(normalized, normalized.lower())

        try:
            response = self.get(f"/api/tipos-alarma/{alert_type_id}")
            if not response.ok:
                raise Exception(f"HTTP {response.status_code}: {response.text}")

            payload = response.json()
            if not payload.get('success'):
                raise Exception(payload.get('message') or 'Respuesta sin éxito')

            data = payload.get('data') or {}
            mapped = {
                'id': str(data.get('_id', '')),
                'name': data.get('nombre', ''),
                'description': data.get('descripcion', ''),
                'severity': _map_severity(data.get('tipo_alerta')),
                'color': (data.get('color_alerta') or '').strip(),
                'image': data.get('imagen_base64'),
                'recommendations': data.get('recomendaciones', []) or [],
                'equipment': data.get('implementos_necesarios', []) or [],
                'sound': data.get('sonido_link'),
                'company_id': data.get('empresa_id'),
                'active': bool(data.get('activo', True)),
                'created_at': self._normalize_date(data.get('fecha_creacion')),
                'updated_at': self._normalize_date(data.get('fecha_actualizacion')),
            }

            return {
                'success': True,
                'data': mapped,
                'raw': data,
            }
        except Exception as exc:
            print(f"Error getting alert type detail: {exc}")
            return {
                'success': False,
                'message': str(exc),
                'data': None,
            }
    def create_alert_type(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Crea un nuevo tipo de alerta"""
        try:
            response = self.post('/api/tipos-alarma', json=payload)
            data = response.json()
            success = response.ok and data.get('success', False)
            return {
                'success': success,
                'data': data.get('data'),
                'message': data.get('message') or data.get('error') or '',
                'status_code': response.status_code
            }
        except Exception as exc:
            print(f"Error creating alert type: {exc}")
            return {
                'success': False,
                'data': None,
                'message': str(exc),
                'status_code': 500
            }

    def update_alert_type(self, alert_type_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Actualiza un tipo de alerta existente"""
        try:
            endpoint = f"/api/tipos-alarma/{alert_type_id}"
            response = self.put(endpoint, json=payload)
            data = response.json()
            success = response.ok and data.get('success', False)
            return {
                'success': success,
                'data': data.get('data'),
                'message': data.get('message') or data.get('error') or '',
                'status_code': response.status_code,
                'payload': data
            }
        except Exception as exc:
            print(f"Error updating alert type: {exc}")
            return {
                'success': False,
                'data': None,
                'message': str(exc),
                'status_code': 500
            }

    def deactivate_alert_type(self, alert_type_id: str, motivo: Optional[str] = '') -> Dict[str, Any]:
        """Desactiva un tipo de alerta, especificando el motivo."""
        try:
            endpoint = f"/api/tipos-alarma/{alert_type_id}/toggle-status"
            payload = {'accion': 'deactivate'}
            if motivo:
                payload['motivo'] = motivo
            response = self.patch(endpoint, json=payload)
            data = response.json()
            success = response.ok and data.get('success', False)
            return {
                'success': success,
                'data': data.get('data'),
                'message': data.get('message') or data.get('error') or '',
                'status_code': response.status_code,
                'payload': data
            }
        except Exception as exc:
            print(f"Error deactivating alert type: {exc}")
            return {
                'success': False,
                'data': None,
                'message': str(exc),
                'status_code': 500
            }

    def toggle_alert_type_status(self, alert_type_id: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Alterna el estado activo/inactivo de un tipo de alerta."""
        try:
            endpoint = f"/api/tipos-alarma/{alert_type_id}/toggle-status"
            request_kwargs: Dict[str, Any] = {}
            if payload:
                request_kwargs['json'] = payload
            response = self.patch(endpoint, **request_kwargs)
            data = response.json()
            success = response.ok and data.get('success', False)
            return {
                'success': success,
                'data': data.get('data'),
                'message': data.get('message') or data.get('error') or '',
                'status_code': response.status_code,
                'payload': data
            }
        except Exception as exc:
            print(f"Error toggling alert type status: {exc}")
            return {
                'success': False,
                'data': None,
                'message': str(exc),
                'status_code': 500
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
