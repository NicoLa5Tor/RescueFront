# app.py - Frontend con JWT Backend
from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    redirect,
    url_for,
    session,
    g,
)
from flask_cors import CORS
from python_api_client import EndpointTestClient
import os
from dotenv import load_dotenv
from dashboard_data_providers import (
    get_dashboard_stats,
    get_companies_stats,
    get_detailed_statistics,
    get_company_types_data,
)

# Importar configuración centralizada
from config import (
    BACKEND_API_URL, 
    PROXY_PREFIX, 
    SECRET_KEY, 
    SESSION_LIFETIME,
    DEBUG_MODE,
    CORS_ORIGINS,
    validate_config,
    print_config
)

# Validar configuración al inicio
validate_config()
print_config()

# Crear la aplicación Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY

# Configurar sesiones temporales (no persistentes)
app.config['PERMANENT_SESSION_LIFETIME'] = SESSION_LIFETIME
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False  # True en producción con HTTPS
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Habilitar CORS
CORS(app, supports_credentials=True, origins=CORS_ORIGINS)

# Helper function to check roles
def require_role(allowed_roles):
    """Decorator to require specific roles for routes"""
    def decorator(f):
        from functools import wraps
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check if user is logged in
            if 'token' not in session or 'user' not in session:
                print(f"❌ No session found for route {request.endpoint}")
                return redirect(url_for('login'))
            
            user_role = session['user'].get('role')
            print(f"🔍 User role: {user_role}, Required roles: {allowed_roles}, Route: {request.endpoint}")
            
            # Validate that user role is one of the valid roles in our system
            valid_roles = ['empresa', 'super_admin']
            if user_role not in valid_roles:
                print(f"❌ Invalid role {user_role} for user")
                session.clear()  # Clear invalid session
                return redirect(url_for('login'))
            
            # Check if user has required role
            if user_role not in allowed_roles:
                print(f"❌ Access denied. User role {user_role} not in {allowed_roles}")
                # Redirect based on role - users can only access their allowed areas
                if user_role == 'empresa':
                    return redirect(url_for('empresa_dashboard'))
                elif user_role == 'super_admin':
                    return redirect(url_for('admin_dashboard'))
                else:
                    # Unknown role, redirect to login
                    return redirect(url_for('login'))
            
            print(f"✅ Access granted for {user_role} to {request.endpoint}")
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Validar conectividad con backend
def validate_backend_connection():
    """Valida si el backend está disponible"""
    try:
        client = EndpointTestClient(BACKEND_API_URL)
        response = client.health()
        return response.ok
    except Exception as e:
        print(f"❌ Backend no disponible: {e}")
        return False

# Inicializar cliente de API antes de cada request
@app.before_request
def attach_api_client():
    # Validar conectividad con backend para rutas protegidas (solo admin routes)
    protected_routes = ['admin_dashboard', 'admin_users', 'admin_empresas', 'admin_stats', 'admin_hardware']
    if request.endpoint in protected_routes:
        if not validate_backend_connection():
            print("❌ Backend no disponible, limpiando sesión")
            session.clear()
            return redirect(url_for('login', error='backend_unavailable'))
    
    token = session.get('token')
    g.api_client = EndpointTestClient(BACKEND_API_URL, token)

# ========== RUTAS PÚBLICAS ==========
@app.route('/')
def index():
    """Página principal - Landing page"""
    return render_template('index.html', api_url=PROXY_PREFIX)

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Página de login con manejo de sesión en servidor"""
    # Verificar si el backend está disponible
    if not validate_backend_connection():
        error = 'El servidor no está disponible. Intenta más tarde.'
        return render_template('login.html', api_url=PROXY_PREFIX, error=error)
    
    # Obtener mensaje de error desde URL params
    error_param = request.args.get('error')
    initial_error = None
    if error_param == 'backend_unavailable':
        initial_error = 'La sesión expiró porque el servidor no está disponible.'
    
    if request.method == 'POST':
        usuario = request.form.get('usuario')
        password = request.form.get('password')
        client = EndpointTestClient(BACKEND_API_URL)
        res = client.login(usuario, password)
        if res.ok:
            data = res.json()
            session['token'] = data.get('token')
            session['user'] = data.get('user')
            # NO hacer la sesión permanente - será temporal por defecto
            session.permanent = False
            
            # Redirect based on user role
            user_role = data.get('user', {}).get('role')
            if user_role == 'empresa':
                return redirect(url_for('empresa_dashboard'))
            else:
                return redirect(url_for('admin_dashboard'))
        error = res.json().get('message', 'Credenciales inválidas')
        return render_template('login.html', api_url=PROXY_PREFIX, error=error)
    
    return render_template('login.html', api_url=PROXY_PREFIX, error=initial_error)

@app.route('/logout')
def logout():
    """Cerrar sesión - Redirect para limpiar estados"""
    session.clear()
    return redirect(url_for('login'))

# Proxy de todas las peticiones hacia el backend
@app.route(f'{PROXY_PREFIX}/<path:endpoint>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def proxy_api(endpoint):
    if 'token' not in session:
        return jsonify({'error': 'No autenticado'}), 401

    print(f"🔄 PROXY: {request.method} /{endpoint} - Token presente: {bool(session.get('token'))}")
    
    # Debug especial para toggle-status
    if 'toggle-status' in endpoint:
        print(f"⚡ TOGGLE DEBUG:")
        print(f"  - Endpoint completo: /{endpoint}")
        print(f"  - Método: {request.method}")
        print(f"  - Headers: {dict(request.headers)}")
        print(f"  - Token en sesión: {session.get('token')[:20] if session.get('token') else 'NO TOKEN'}...")
    
    data = None
    if request.method in ['POST', 'PUT', 'PATCH']:
        data = request.get_json(silent=True)
        print(f"📦 PROXY: Datos enviados - {data}")

    try:
        resp = g.api_client._request(request.method, f'/{endpoint}', params=request.args, data=data)
        print(f"📡 PROXY: Respuesta del backend - Status: {resp.status_code}, Content-Length: {len(resp.content) if resp.content else 0}")
        
        # Log del contenido para endpoints críticos
        if endpoint in ['api/hardware', 'api/empresas', 'api/hardware-types'] or 'toggle-status' in endpoint:
            try:
                content_json = resp.json()
                print(f"📋 PROXY: Contenido de /{endpoint}:")
                print(f"  - Success: {content_json.get('success', 'N/A')}")
                print(f"  - Count: {content_json.get('count', 'N/A')}")
                print(f"  - Data length: {len(content_json.get('data', [])) if content_json.get('data') else 0}")
                if content_json.get('data') and len(content_json.get('data', [])) > 0:
                    first_item = content_json['data'][0]
                    print(f"  - Primer elemento: {list(first_item.keys()) if hasattr(first_item, 'keys') else type(first_item)}")
                    
                # Log especial para toggle-status
                if 'toggle-status' in endpoint:
                    print(f"  - Message: {content_json.get('message', 'N/A')}")
                    print(f"  - Errors: {content_json.get('errors', 'N/A')}")
            except Exception as e:
                print(f"🚨 PROXY: No se pudo parsear JSON de /{endpoint}: {e}")
        
        return (resp.content, resp.status_code, resp.headers.items())
    except Exception as e:
        print(f"💥 PROXY ERROR en /{endpoint}: {e}")
        return jsonify({'error': 'Error del servidor'}), 500

# ========== RUTAS DEL DASHBOARD - PROTEGIDAS POR SESION Y ROL ==========

@app.route('/admin')
@require_role(['super_admin'])
def admin_dashboard():
    """Dashboard principal - Solo para super_admin"""
    # Get dummy data from Python providers
    dashboard_data = get_dashboard_stats()
    
    return render_template(
        'admin/dashboard.html',
        api_url=PROXY_PREFIX,
        dashboard_data=dashboard_data,
        active_page='dashboard'
    )

@app.route('/admin/users')
@require_role(['super_admin', 'empresa'])
def admin_users():
    """Gestión de usuarios - Para super_admin y empresa"""
    return render_template('admin/users.html', api_url=PROXY_PREFIX, active_page='users')

@app.route('/admin/empresas')
@require_role(['super_admin'])
def admin_empresas():
    """Gestión de empresas - Solo para super_admin"""
    
    # Get companies dummy data from Python providers
    companies_data = get_companies_stats()
    
    return render_template(
        'admin/empresas.html', 
        api_url=PROXY_PREFIX, 
        companies_data=companies_data,
        active_page='empresas'
    )

@app.route('/admin/empresas/')
@require_role(['super_admin'])
def admin_empresas_slash():
    """Allow trailing slash for empresas - Solo para super_admin"""
    return redirect(url_for('admin_empresas'))

@app.route('/admin/empresa')
@app.route('/admin/empresa/')
@require_role(['super_admin'])
def admin_empresa_alias():
    """Legacy singular path redirect - Solo para super_admin"""
    return redirect(url_for('admin_empresas'))

@app.route('/admin/stats')
@require_role(['super_admin', 'empresa'])
def admin_stats():
    """Estadísticas - Para super_admin y empresa"""
    # Get detailed statistics dummy data from Python providers
    statistics_data = get_detailed_statistics()
    
    return render_template(
        'admin/stats.html', 
        api_url=PROXY_PREFIX, 
        statistics_data=statistics_data,
        active_page='stats'
    )

@app.route('/admin/hardware')
@require_role(['super_admin', 'empresa'])
def admin_hardware():
    """Gestión de hardware - Para super_admin y empresa"""
    
    # Get real hardware data from backend
    try:
        hardware_data = g.api_client.get_hardware_data_for_frontend()
    except Exception as e:
        print(f"Error getting hardware data: {e}")
        # Fallback to empty data
        hardware_data = {
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
    
    return render_template(
        'admin/hardware.html', 
        api_url=PROXY_PREFIX, 
        hardware_data=hardware_data,
        active_page='hardware'
    )

@app.route('/admin/company-types')
@require_role(['super_admin'])
def admin_company_types():
    """Gestión de tipos de empresa - Solo para super_admin
    
    SIMPLIFIED: Always loads ALL types, frontend handles filtering by active status.
    """
    
    # Check if user wants to include inactive types (for UI state only)
    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
    
    # ALWAYS get ALL company types from backend
    # Frontend will filter by 'activo' field locally
    try:
        # Direct call to dashboard endpoint that brings ALL types
        all_types_response = g.api_client.get_tipos_empresa_dashboard_all()
        stats_response = g.api_client._request("GET", "/api/tipos_empresa/estadisticas")
        
        if all_types_response.ok:
            all_types_data = all_types_response.json()
            if all_types_data.get('success'):
                raw_types = all_types_data.get('data', [])
                
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
                        'created_at': raw_type.get('fecha_creacion', ''),
                        # Add some default styling for frontend
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
                
                company_types_data = {
                    'company_types': mapped_types,  # Mapped types, frontend will filter
                    'company_types_stats': stats
                }
            else:
                raise Exception("Backend response not successful")
        else:
            raise Exception(f"Backend error: {all_types_response.status_code}")
            
    except Exception as e:
        print(f"Error getting company types data: {e}")
        # Fallback to empty data
        company_types_data = {
            'company_types': [],
            'company_types_stats': {
                'total_types': 0,
                'active_types': 0,
                'inactive_types': 0,
                'total_companies': 0,
                'avg_companies_per_type': 0
            }
        }
    
    return render_template(
        'admin/company_types.html', 
        api_url=PROXY_PREFIX, 
        company_types_data=company_types_data,
        include_inactive=include_inactive,
        active_page='company_types'
    )

# ========== RUTAS DE EMPRESA (FUTURO) ==========
@app.route('/empresa')
@require_role(['empresa'])
def empresa_dashboard():
    """Dashboard de empresa - Solo para empresas"""
    return render_template('empresa/dashboard.html', api_url=PROXY_PREFIX)

@app.route('/empresa/empleados')
@require_role(['empresa'])
def empresa_empleados():
    """Gestión de empleados - Solo para empresas"""
    return render_template('empresa/empleados.html', api_url=PROXY_PREFIX)

@app.route('/empresa/perfil')
@require_role(['empresa'])
def empresa_perfil():
    """Perfil de empresa - Solo para empresas"""
    return render_template('empresa/perfil.html', api_url=PROXY_PREFIX)

# ========== CONTEXTO GLOBAL ==========
@app.context_processor
def inject_config():
    """Inyectar configuración en todas las plantillas"""
    return dict(
        api_url=PROXY_PREFIX,
        app_name="Rescue Dashboard",
        version="1.0.0",
        current_user=session.get('user')
    )


# ========== MIDDLEWARE Y HEADERS DE SEGURIDAD ==========
@app.after_request
def after_request(response):
    """Headers de seguridad"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Headers para desarrollo (quitar en producción)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    return response

# ========== MANEJO DE ERRORES ==========
@app.errorhandler(404)
def not_found(error):
    """Página no encontrada"""
    if request.is_json:
        return jsonify({'error': 'Recurso no encontrado'}), 404
    return render_template('errors/404.html', api_url=PROXY_PREFIX), 404

@app.errorhandler(500)
def internal_error(error):
    """Error interno del servidor"""
    if request.is_json:
        return jsonify({'error': 'Error interno del servidor'}), 500
    return render_template('errors/500.html', api_url=PROXY_PREFIX), 500

@app.errorhandler(403)
def forbidden(error):
    """Acceso denegado"""
    if request.is_json:
        return jsonify({'error': 'Acceso denegado'}), 403
    return render_template('errors/403.html', api_url=PROXY_PREFIX), 403

# ========== CONFIGURACIÓN DE JINJA2 ==========
@app.template_filter('currency')
def currency_filter(value):
    """Filtro para formatear moneda"""
    if value is None:
        return "N/A"
    try:
        return f"${value:,.2f}"
    except (ValueError, TypeError):
        return "N/A"

@app.template_filter('date_format')
def date_format_filter(value, format='%d/%m/%Y'):
    """Filtro para formatear fechas"""
    if value:
        try:
            if hasattr(value, 'strftime'):
                return value.strftime(format)
            else:
                from datetime import datetime
                return datetime.fromisoformat(str(value)).strftime(format)
        except (AttributeError, ValueError, TypeError):
            return str(value)
    return ''

@app.template_filter('user_initials')
def user_initials_filter(name):
    """Filtro para obtener iniciales del usuario"""
    if not name:
        return 'U'
    words = str(name).split()
    if len(words) >= 2:
        return f"{words[0][0]}{words[1][0]}".upper()
    return name[0].upper() if name else 'U'

@app.template_filter('truncate_words')
def truncate_words_filter(text, length=50):
    """Filtro para truncar texto por palabras"""
    if not text:
        return ''
    if len(text) <= length:
        return text
    return text[:length].rsplit(' ', 1)[0] + '...'


# ========== CONFIGURACIÓN PARA ARCHIVOS ESTÁTICOS ==========
@app.route('/favicon.ico')
def favicon():
    """Favicon"""
    return app.send_static_file('favicon.ico')

# ========== CONFIGURACIÓN DE DEBUG ==========
if __name__ == '__main__':
    print("🚀 Iniciando Rescue Frontend...")
    print(f"📡 Backend API: {BACKEND_API_URL}")
    print("🌐 Frontend URL: http://localhost:5050")
    print("🔐 Autenticación: manejada por Flask y proxy interno")
    print("=" * 50)
    
    # Configuración de desarrollo
    app.run(
        debug=True, 
        port=5050,
        host='0.0.0.0',  # Permitir conexiones externas en desarrollo
        threaded=True    # Mejorar performance en desarrollo
    )
