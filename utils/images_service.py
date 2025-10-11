"""Helpers para consumir el servicio externo de imágenes."""

from typing import Any, Dict, List, Tuple
from urllib.parse import quote, urljoin

import requests

from utils.config import IMAGES_SERVICE_BASE_URL

DEFAULT_TIMEOUT = 6


def build_images_service_url(path: str = "") -> str:
    """Compone una URL absoluta hacia el servicio de imágenes."""
    base = IMAGES_SERVICE_BASE_URL.rstrip('/') + '/'
    return urljoin(base, path.lstrip('/'))


def _build_file_url(folder_name: str, file_value: str) -> str:
    """Genera la URL absoluta para un archivo concreto."""
    safe_folder = quote(folder_name.strip('/'))
    clean_file = file_value.split('/')[-1]
    safe_file = quote(clean_file)
    return build_images_service_url(f'folders/{safe_folder}/files/{safe_file}')


def _normalize_file_entry(entry: Any, folder_name: str) -> Dict[str, Any]:
    """Normaliza la respuesta del servicio a un formato consistente."""
    if isinstance(entry, dict):
        raw_name = entry.get('name') or entry.get('filename') or entry.get('title')
        raw_path = entry.get('path') or entry.get('url') or entry.get('download_url')

        base_value = raw_name or raw_path or 'archivo'
        file_name = str(base_value).split('/')[-1] or 'archivo'

        url = entry.get('url') or entry.get('download_url') or entry.get('path')
        if url:
            url = str(url)
            if not url.startswith(('http://', 'https://')):
                url = build_images_service_url(url)
        else:
            url = _build_file_url(folder_name, file_name)

        metadata = {
            key: value
            for key, value in entry.items()
            if key not in {'name', 'filename', 'title', 'url', 'path', 'download_url'}
        }

        display_label = entry.get('display_name') or entry.get('label') or raw_name
        if not display_label:
            display_label = raw_path or file_name
        sanitized_display = str(display_label).replace('_', ' ').replace('-', ' ').strip()

        return {
            'name': file_name,
            'display_name': sanitized_display or file_name,
            'url': url,
            'metadata': metadata,
        }

    entry_value = str(entry)
    file_name = entry_value.split('/')[-1] or 'archivo'
    sanitized_display = file_name.replace('_', ' ').replace('-', ' ').strip()

    return {
        'name': file_name,
        'display_name': sanitized_display or file_name,
        'url': _build_file_url(folder_name, entry_value),
        'metadata': {},
    }


def fetch_image_folders() -> Tuple[List[str], str, str]:
    """Obtiene la lista de carpetas disponibles en el servicio de imágenes.

    Returns:
        tuple: (folders, error_message, service_url)
    """
    endpoint = build_images_service_url('folders')
    try:
        response = requests.get(endpoint, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        payload = response.json()

        if isinstance(payload, list):
            folder_names = [str(item) for item in payload]
        elif isinstance(payload, dict):
            data_key = next((key for key in ('folders', 'data', 'items') if key in payload), None)
            folder_names = [str(item) for item in payload.get(data_key, [])] if data_key else []
        else:
            folder_names = []

        return folder_names, '', endpoint
    except Exception as exc:  # noqa: BLE001
        error_message = 'No fue posible sincronizar las carpetas, intenta nuevamente.'
        print(f"⚠️ Error fetching image folders: {exc}")
        return [], error_message, endpoint



def create_image_folder(name: str) -> Tuple[bool, str]:
    """Crea un directorio en el servicio externo."""
    endpoint = build_images_service_url('folders')
    payload = {'name': name}
    try:
        response = requests.post(endpoint, json=payload, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        return True, ''
    except Exception as exc:  # noqa: BLE001
        print(f'⚠️ Error creating image folder: {exc}')
        message = 'No fue posible crear el directorio, intenta nuevamente.'
        return False, message


def upload_image_file(folder: str, filename: str, file_obj) -> Tuple[bool, str]:
    """Carga un archivo hacia el servicio externo."""
    endpoint = build_images_service_url('upload')
    files = {
        'file': (
            getattr(file_obj, 'filename', filename) or filename,
            getattr(file_obj, 'stream', file_obj),
            getattr(file_obj, 'mimetype', 'application/octet-stream')
        )
    }
    data = {
        'folder': folder,
        'filename': filename
    }

    try:
        # Reiniciar el cursor del archivo si es posible
        stream = files['file'][1]
        if hasattr(stream, 'seek'):
            stream.seek(0)

        response = requests.post(endpoint, data=data, files=files, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        return True, ''
    except Exception as exc:  # noqa: BLE001
        print(f'⚠️ Error uploading file {filename} to folder {folder}: {exc}')
        return False, 'No fue posible cargar el archivo, intenta nuevamente.'


def delete_image_folder(folder_name: str) -> Tuple[bool, str]:
    """Elimina un directorio en el servicio externo."""
    encoded = quote(folder_name, safe='')
    endpoint = build_images_service_url(f'folders/{encoded}')
    try:
        response = requests.delete(endpoint, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        return True, ''
    except Exception as exc:  # noqa: BLE001
        print(f'⚠️ Error deleting image folder {folder_name}: {exc}')
        return False, 'No fue posible eliminar el directorio, intenta nuevamente.'


def fetch_folder_files(folder_name: str) -> Tuple[List[Dict[str, Any]], str, str]:
    """Obtiene los archivos de una carpeta específica del servicio."""
    encoded_folder = quote(folder_name, safe='')
    endpoint = build_images_service_url(f'folders/{encoded_folder}/files')

    try:
        response = requests.get(endpoint, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        payload = response.json()

        if isinstance(payload, list):
            raw_items = payload
        elif isinstance(payload, dict):
            data_key = next((key for key in ('files', 'data', 'items') if key in payload), None)
            raw_items = payload.get(data_key, []) if data_key else []
        else:
            raw_items = []

        files = [_normalize_file_entry(item, folder_name) for item in raw_items]
        return files, '', endpoint
    except Exception as exc:  # noqa: BLE001
        error_message = 'No fue posible obtener los archivos de la carpeta seleccionada.'
        print(f"⚠️ Error fetching files for folder {folder_name}: {exc}")
        return [], error_message, endpoint
