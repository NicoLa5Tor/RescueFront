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
                    return redirect(url_for('super_admin_dashboard'))
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
    protected_routes = ['admin_dashboard', 'super_admin_dashboard', 'admin_users', 'admin_empresas', 'admin_stats', 'admin_hardware']
    if request.endpoint in protected_routes:
        if not validate_backend_connection():
            print("❌ Backend no disponible, limpiando sesión")
            session.clear()
            return redirect(url_for('login', error='backend_unavailable'))
    
    # Initialize API client with cookies from the current request
    g.api_client = EndpointTestClient(BACKEND_API_URL, cookies=request.cookies)

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
            session['token'] = 'jwt_cookie_auth'
            session['user'] = data.get('user')
            session.permanent = False

            # Crear respuesta de redirección y propagar cookies del backend
            user_role = data.get('user', {}).get('role')
            redirect_url = url_for('empresa_dashboard') if user_role == 'empresa' else url_for('super_admin_dashboard')
            response = redirect(redirect_url)
            for name, value in res.cookies.items():
                response.set_cookie(name, value, httponly=True, samesite='Lax')
            return response
        error = res.json().get('message', 'Credenciales inválidas')
        return render_template('login.html', api_url=PROXY_PREFIX, error=error)
    
    return render_template('login.html', api_url=PROXY_PREFIX, error=initial_error)

@app.route('/logout')
def logout():
    """Cerrar sesión - Redirect para limpiar estados"""
    session.clear()
    return redirect(url_for('login'))

@app.route('/api/sync-session', methods=['POST'])
def sync_session():
    """Sincroniza la cookie JWT con la sesión Flask"""
    try:
        # Leer datos del JWT desde el cuerpo de la petición
        data = request.get_json() or {}
        user_data = data.get('user')
        
        if user_data:
            # Simular un token para la sesión (no es el JWT real, solo para compatibilidad)
            session['token'] = 'jwt_cookie_auth'
            session['user'] = user_data
            session.permanent = False
            
            return jsonify({
                'success': True,
                'message': 'Sesión sincronizada',
                'user': user_data
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Datos de usuario faltantes'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

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

@app.route('/admin/super-dashboard')
@require_role(['super_admin'])
def super_admin_dashboard():
    """Super Admin Dashboard - Exclusivo para super_admin"""
    # Get real dashboard data using the new provider
    try:
        from dashboard_data_providers import RealDashboardDataProvider
        from config import BACKEND_API_URL
        
        # Use real data provider with auth cookies
        real_provider = RealDashboardDataProvider(BACKEND_API_URL, request.cookies)
        dashboard_data = real_provider.get_dashboard_data()
        
        # Add hardware stats if not already present
        if 'total_hardware' not in dashboard_data.get('summary_stats', {}):
            hardware_stats = real_provider.get_hardware_stats()
            dashboard_data['summary_stats']['total_hardware'] = hardware_stats.get('total_items', 0)
            dashboard_data['summary_stats']['available_hardware'] = hardware_stats.get('available_items', 0)
        
        print(f"✅ Loaded real dashboard data successfully")
        
    except Exception as e:
        print(f"❌ Error loading real dashboard data: {e}")
        # Fallback to dummy data
        dashboard_data = get_dashboard_stats()
        
        # Add hardware stats to the data
        try:
            from dashboard_data_providers import HardwareProvider
            hardware_stats = HardwareProvider.get_hardware_stats()
            dashboard_data['summary_stats']['total_hardware'] = hardware_stats.get('total_items', 0)
            dashboard_data['summary_stats']['available_hardware'] = hardware_stats.get('available_items', 0)
        except Exception as e:
            print(f"Error loading hardware stats: {e}")
            dashboard_data['summary_stats']['total_hardware'] = 0
            dashboard_data['summary_stats']['available_hardware'] = 0
    
    return render_template(
        'admin/super_admin_dashboard.html',
        api_url=PROXY_PREFIX,
        dashboard_data=dashboard_data,
        active_page='dashboard'
    )

@app.route('/admin/users')
@require_role(['super_admin', 'empresa'])
def admin_users():
    """Gestión de usuarios - Para super_admin y empresa"""

    user_role = session.get('user', {}).get('role')
    empresa_id = session.get('user', {}).get('id') if user_role == 'empresa' else None
    empresa_username = session.get('user', {}).get('username') if user_role == 'empresa' else None

    usuarios_data = None
    initial_total_users = 0
    initial_active_users = 0

    if user_role == 'empresa' and empresa_id:
        try:
            usuarios_data = g.api_client.get_usuarios_data_for_frontend(empresa_id)
        except Exception as e:
            print(f"Error getting usuarios data: {e}")
            usuarios_data = {
                'usuarios': [],
                'usuarios_stats': {
                    'total_users': 0,
                    'active_users': 0,
                    'inactive_users': 0
                },
                'count': 0
            }

        stats = usuarios_data.get('usuarios_stats', {})
        usuarios_list = usuarios_data.get('usuarios', [])
        initial_total_users = stats.get('total_users', len(usuarios_list))
        initial_active_users = stats.get('active_users', len([u for u in usuarios_list if u.get('activo')]))

    return render_template(
        'admin/users.html',
        api_url=PROXY_PREFIX,
        active_page='users',
        user_role=user_role,
        empresa_view=user_role == 'empresa',
        empresa_id=empresa_id,
        empresa_username=empresa_username,
        usuarios_data=usuarios_data,
        initial_total_users=initial_total_users,
        initial_active_users=initial_active_users
    )

@app.route('/admin/empresas')
@require_role(['super_admin'])
def admin_empresas():
    """Gestión de empresas - Solo para super_admin"""
    
    # Get companies data from backend to render real stats immediately
    try:
        companies_data = g.api_client.get_empresas_data_for_frontend(include_inactive=True)
    except Exception as e:
        print(f"Error getting empresas data: {e}")
        companies_data = {
            'empresas': [],
            'empresas_stats': {
                'total_empresas': 0,
                'active_empresas': 0,
                'inactive_empresas': 0
            },
            'count': 0
        }

    stats = companies_data.get('empresas_stats', {})
    empresas_list = companies_data.get('empresas', [])
    total_companies = stats.get('total_empresas', len(empresas_list))
    active_companies = stats.get('active_empresas', len([e for e in empresas_list if e.get('activa')]))

    return render_template(
        'admin/empresas.html',
        api_url=PROXY_PREFIX,
        companies_data=companies_data,
        active_page='empresas',
        initial_total_companies=total_companies,
        initial_active_companies=active_companies,
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

# ========== RUTAS DE EMPRESA (REUTILIZANDO VISTAS ADMIN) ==========
@app.route('/empresa')
@require_role(['empresa'])
def empresa_dashboard():
    """Dashboard de empresa - Reutiliza vista admin/stats.html"""
    # Get detailed statistics dummy data from Python providers
    statistics_data = get_detailed_statistics()
    
    # Get empresa info from session
    empresa_id = session.get('user', {}).get('id')
    empresa_username = session.get('user', {}).get('username')
    
    return render_template(
        'admin/stats.html', 
        api_url=PROXY_PREFIX, 
        statistics_data=statistics_data,
        active_page='stats',
        user_role='empresa',
        empresa_view=True,
        empresa_id=empresa_id,
        empresa_username=empresa_username
    )

@app.route('/empresa/usuarios')
@require_role(['empresa'])
def empresa_usuarios():
    """Gestión de usuarios - Reutiliza vista admin/users.html"""
    # Get empresa info from session
    empresa_id = session.get('user', {}).get('id')
    empresa_username = session.get('user', {}).get('username')

    try:
        usuarios_data = g.api_client.get_usuarios_data_for_frontend(empresa_id)
    except Exception as e:
        print(f"Error getting usuarios data: {e}")
        usuarios_data = {
            'usuarios': [],
            'usuarios_stats': {
                'total_users': 0,
                'active_users': 0,
                'inactive_users': 0
            },
            'count': 0
        }

    stats = usuarios_data.get('usuarios_stats', {})
    usuarios_list = usuarios_data.get('usuarios', [])
    initial_total_users = stats.get('total_users', len(usuarios_list))
    initial_active_users = stats.get('active_users', len([u for u in usuarios_list if u.get('activo')]))

    return render_template(
        'admin/users.html',
        api_url=PROXY_PREFIX,
        active_page='users',
        user_role='empresa',
        empresa_view=True,
        empresa_id=empresa_id,
        empresa_username=empresa_username,
        usuarios_data=usuarios_data,
        initial_total_users=initial_total_users,
        initial_active_users=initial_active_users
    )

# Hardware no disponible para empresas

@app.route('/empresa/stats')
@require_role(['empresa'])
def empresa_stats():
    """Estadísticas de empresa - Reutiliza vista admin/stats.html"""
    # Get detailed statistics dummy data from Python providers
    statistics_data = get_detailed_statistics()
    
    # Get empresa info from session
    empresa_id = session.get('user', {}).get('id')
    empresa_username = session.get('user', {}).get('username')
    
    return render_template(
        'admin/stats.html', 
        api_url=PROXY_PREFIX, 
        statistics_data=statistics_data,
        active_page='stats',
        user_role='empresa',
        empresa_view=True,
        empresa_id=empresa_id,
        empresa_username=empresa_username
    )

# Rutas alias para mantener compatibilidad
@app.route('/empresa/empleados')
@require_role(['empresa'])
def empresa_empleados():
    """Alias para usuarios - Redirige a empresa_usuarios"""
    return redirect(url_for('empresa_usuarios'))

@app.route('/empresa/perfil')
@require_role(['empresa'])
def empresa_perfil():
    """Perfil de empresa - Redirige a stats por ahora"""
    return redirect(url_for('empresa_stats'))

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
