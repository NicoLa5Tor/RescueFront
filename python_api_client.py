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

    def __init__(self, base_url: str = "http://localhost:5000", token: Optional[str] = None) -> None:
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
        print("se usa el get activity")
        return self._request("GET", f"/api/empresas/{empresa_id}/activity")

    # ------------------------------------------------------------------
    # Admin endpoints
    # ------------------------------------------------------------------
    def get_admin_activity(self) -> requests.Response:
        return self._request("GET", "/api/admin/activity")

    def get_admin_distribution(self) -> requests.Response:
        return self._request("GET", "/api/admin/distribution")

    def get_admin_activity_only(self) -> requests.Response:
        """GET /api/admin/activity-admin - Ver logs solo para admins"""
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
    # Public utilities
    # ------------------------------------------------------------------
    def set_token(self, token: str) -> None:
        self.token = token

    def pretty_response(self, response: requests.Response) -> str:
        try:
            return json.dumps(response.json(), indent=2, ensure_ascii=False)
        except ValueError:
            return response.text

