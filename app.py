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
            # Check if user is logged in - prioritize cookie over session
            auth_token = request.cookies.get('auth_token')
            user_data = session.get('user')
            
            # If no cookie token and no session, redirect to login
            if not auth_token and not user_data:
                print(f"❌ No auth token or session found for route {request.endpoint}")
                return redirect(url_for('login'))
            
            # If we have cookie but no session, we need to validate the cookie
            if auth_token and not user_data:
                try:
                    # Validate token with backend
                    import requests
                    response = requests.get(
                        f"{BACKEND_API_URL}/health",
                        cookies={'auth_token': auth_token}
                    )
                    if not response.ok:
                        print(f"❌ Invalid auth token for route {request.endpoint}")
                        return redirect(url_for('login'))
                    
                    # Token is valid but we don't have user data in session
                    # This is OK - the backend will handle authorization
                    print(f"✅ Valid auth token found for route {request.endpoint}")
                    # Continue with the request - backend will validate role
                    return f(*args, **kwargs)
                except Exception as e:
                    print(f"❌ Error validating auth token: {e}")
                    return redirect(url_for('login'))
            
            # If we have session data, validate role
            if user_data:
                user_role = user_data.get('role')
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
    protected_routes = ['admin_dashboard', 'super_admin_dashboard', 'admin_users', 'admin_empresas', 'admin_hardware']
    if request.endpoint in protected_routes:
        if not validate_backend_connection():
            print("❌ Backend no disponible, limpiando sesión")
            session.clear()
            return redirect(url_for('login', error='backend_unavailable'))
    
    # No usar token de sesión - las cookies HTTPOnly se envían automáticamente
    g.api_client = EndpointTestClient(BACKEND_API_URL, None)

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
        # LIMPIAR COMPLETAMENTE la sesión anterior
        session.clear()
        
        usuario = request.form.get('usuario')
        password = request.form.get('password')
        client = EndpointTestClient(BACKEND_API_URL)
        res = client.login(usuario, password)
        if res.ok:
            data = res.json()
            # NO almacenar token en sesión - debe venir en cookie HTTPOnly
            # session['token'] = data.get('token')  # Comentado - token en cookie
            session['user'] = data.get('user')
            # NO hacer la sesión permanente - será temporal por defecto
            session.permanent = False
            
            # Redirect based on user role
            user_role = data.get('user', {}).get('role')
            if user_role == 'empresa':
                return redirect(url_for('empresa_dashboard'))
            else:
                return redirect(url_for('super_admin_dashboard'))
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
        token = data.get('token')  # Recibir el token desde el frontend
        
        # Si no hay token en el cuerpo, intentar obtenerlo de las cookies
        if not token:
            token = request.cookies.get('auth_token')
        
        print(f"SYNC: Token recibido - Body: {bool(data.get('token'))}, Cookie: {bool(request.cookies.get('auth_token'))}")
        print(f"SYNC: Datos completos del body: {str(data)[:200]}...")
        print(f"SYNC: Cookies completas: {dict(request.cookies)}")
        print(f"SYNC: user_data presente: {bool(user_data)}")
        
        if user_data:
            # NO almacenar token en sesión - debe venir en cookie HTTPOnly
            # session['token'] = token or 'cookie_auth'  # Comentado - token en cookie
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
    # Endpoints públicos que no requieren autenticación
    public_endpoints = ['auth/login', 'api/contact/send']
    
    if endpoint not in public_endpoints:
        # Verificar que tengamos una sesión válida O cookie de autenticación para endpoints protegidos
        if 'user' not in session and not request.cookies.get('auth_token'):
            return jsonify({'error': 'No autenticado'}), 401

    print(f"PROXY: {request.method} /{endpoint} - Session valid: {bool(session.get('user'))}")
    print(f"PROXY: Request cookies: {dict(request.cookies)}")
    auth_cookie = request.cookies.get('auth_token')
    print(f"PROXY: Cookie auth_token: {auth_cookie[:50] if auth_cookie else 'None'}...")
    
    # Debug especial para toggle-status
    if 'toggle-status' in endpoint:
        print(f"TOGGLE DEBUG:")
        print(f"  - Endpoint completo: /{endpoint}")
        print(f"  - Método: {request.method}")
        print(f"  - Headers: {dict(request.headers)}")
        print(f"  - Usuario: {session.get('user', {}).get('username', 'NO USER')}")
    
    data = None
    if request.method in ['POST', 'PUT', 'PATCH']:
        data = request.get_json(silent=True)
        print(f"PROXY DATA: PROXY: Datos enviados - {data}")

    try:
        # Hacer la petición manualmente con las cookies
        import requests
        headers = {'Content-Type': 'application/json'}
        cookies = dict(request.cookies)
        
        # Agregar User-Agent específico para endpoint de contacto
        if endpoint == 'api/contact/send':
            headers['User-Agent'] = 'RESCUE-Frontend/1.0'
        
        print(f"PROXY: Enviando cookies al backend: {cookies}")
        print(f"PROXY: Headers enviados: {headers}")
        
        resp = requests.request(
            request.method,
            f"{BACKEND_API_URL}/{endpoint}",
            params=request.args,
            json=data,
            headers=headers,
            cookies=cookies
        )
        print(f"PROXY RESPONSE: PROXY: Respuesta del backend - Status: {resp.status_code}, Content-Length: {len(resp.content) if resp.content else 0}")
        
        # Log del contenido para endpoints críticos
        if endpoint in ['api/hardware', 'api/empresas', 'api/hardware-types'] or 'toggle-status' in endpoint:
            try:
                content_json = resp.json()
                print(f"PROXY CONTENT: PROXY: Contenido de /{endpoint}:")
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
                print(f"PROXY ERROR: PROXY: No se pudo parsear JSON de /{endpoint}: {e}")
        
        return (resp.content, resp.status_code, resp.headers.items())
    except Exception as e:
        print(f"PROXY ERROR: PROXY ERROR en /{endpoint}: {e}")
        return jsonify({'error': 'Error del servidor'}), 500

# ========== RUTAS DEL DASHBOARD - PROTEGIDAS POR SESION Y ROL ==========

@app.route('/admin')
@require_role(['super_admin'])
def admin_dashboard():
    """Dashboard principal - Redirigir automáticamente al super-dashboard para admin"""
    # Redirigir automáticamente al super-dashboard
    return redirect(url_for('super_admin_dashboard'))

@app.route('/admin/super-dashboard')
@require_role(['super_admin'])
def super_admin_dashboard():
    """Super Admin Dashboard - Exclusivo para super_admin - DATOS REALES ÚNICAMENTE"""
    print(f"🔥 SUPER ADMIN DASHBOARD: Iniciando carga de datos REALES...")
    
    try:
        # Obtener datos reales del backend vía API usando el proxy interno
        # En lugar de usar el cliente API directamente, vamos a usar requests con cookies
        import requests
        
        # Obtener cookies de la petición actual
        cookies = dict(request.cookies)
        headers = {'Content-Type': 'application/json'}
        
        print(f"🍪 Using cookies for API calls: {cookies}")
        
        # Hacer llamadas directas al backend con cookies
        dashboard_stats_response = requests.get(
            f"{BACKEND_API_URL}/api/dashboard/stats",
            cookies=cookies,
            headers=headers
        )
        
        performance_response = requests.get(
            f"{BACKEND_API_URL}/api/dashboard/system-performance",
            cookies=cookies,
            headers=headers
        )
        
        # Inicializar datos con estructura básica
        dashboard_data = {
            'summary_stats': {},
            'recent_companies': [],
            'recent_users': [],
            'activity_chart': {},
            'distribution_chart': {},
            'performance_metrics': {}
        }
        
        # Procesar estadísticas principales
        if dashboard_stats_response.ok:
            stats_data = dashboard_stats_response.json()
            print(f"📊 Stats Response RAW: {stats_data}")
            print(f"📊 Stats Response TYPE: {type(stats_data)}")
            print(f"📊 Stats Response KEYS: {list(stats_data.keys()) if isinstance(stats_data, dict) else 'NOT A DICT'}")
            
            # Extraer datos de stats según la estructura real {'success': True, 'data': {...}}
            if stats_data.get('success') and 'data' in stats_data:
                dashboard_data['summary_stats'] = stats_data['data']
                print(f"✅ Summary stats loaded successfully: {dashboard_data['summary_stats']}")
                print(f"✅ Summary stats keys: {list(dashboard_data['summary_stats'].keys()) if isinstance(dashboard_data['summary_stats'], dict) else 'NOT A DICT'}")
            else:
                print(f"❌ Stats response format unexpected: {stats_data}")
                print(f"❌ Success field: {stats_data.get('success')}")
                print(f"❌ Has data field: {'data' in stats_data}")
                # Intentar usar los datos directamente si no hay wrapper
                if isinstance(stats_data, dict) and any(key in stats_data for key in ['total_empresas', 'total_users', 'total_hardware']):
                    print(f"🔄 Trying to use stats data directly without wrapper...")
                    dashboard_data['summary_stats'] = stats_data
                    print(f"✅ Summary stats loaded directly: {dashboard_data['summary_stats']}")
        else:
            print(f"❌ Failed to load dashboard stats: {dashboard_stats_response.status_code}")
            print(f"❌ Response text: {dashboard_stats_response.text[:500] if hasattr(dashboard_stats_response, 'text') else 'NO TEXT'}")
        
        # Procesar métricas de performance
        if performance_response.ok:
            perf_data = performance_response.json()
            print(f"⚡ Performance Response: {perf_data}")
            
            # Las métricas de performance vienen directamente según la estructura: 
            # {'uptime_percentage': 99.01, 'response_time': 151, ...}
            dashboard_data['performance_metrics'] = perf_data
            print(f"✅ Performance metrics loaded: {dashboard_data['performance_metrics']}")
        else:
            print(f"❌ Failed to load performance metrics: {performance_response.status_code}")
        
        # Obtener companies y users recientes usando requests con cookies
        try:
            companies_response = requests.get(
                f"{BACKEND_API_URL}/api/dashboard/recent-companies",
                cookies=cookies,
                headers=headers
            )
            if companies_response.ok:
                companies_data = companies_response.json()
                if companies_data.get('success') and 'data' in companies_data:
                    dashboard_data['recent_companies'] = companies_data['data']
                    print(f"✅ Recent companies loaded: {len(dashboard_data['recent_companies'])} items")
        except Exception as e:
            print(f"⚠️ Error loading recent companies: {e}")
        
        try:
            users_response = requests.get(
                f"{BACKEND_API_URL}/api/dashboard/recent-users",
                cookies=cookies,
                headers=headers
            )
            if users_response.ok:
                users_data = users_response.json()
                if users_data.get('success') and 'data' in users_data:
                    dashboard_data['recent_users'] = users_data['data']
                    print(f"✅ Recent users loaded: {len(dashboard_data['recent_users'])} items")
        except Exception as e:
            print(f"⚠️ Error loading recent users: {e}")
        
        # Obtener gráficos usando requests con cookies
        try:
            activity_response = requests.get(
                f"{BACKEND_API_URL}/api/dashboard/activity-chart",
                cookies=cookies,
                headers=headers
            )
            if activity_response.ok:
                activity_data = activity_response.json()
                if activity_data.get('success') and 'data' in activity_data:
                    dashboard_data['activity_chart'] = activity_data['data']
                    print(f"✅ Activity chart loaded")
        except Exception as e:
            print(f"⚠️ Error loading activity chart: {e}")
        
        try:
            distribution_response = requests.get(
                f"{BACKEND_API_URL}/api/dashboard/distribution-chart",
                cookies=cookies,
                headers=headers
            )
            if distribution_response.ok:
                distribution_data = distribution_response.json()
                if distribution_data.get('success') and 'data' in distribution_data:
                    dashboard_data['distribution_chart'] = distribution_data['data']
                    print(f"✅ Distribution chart loaded")
        except Exception as e:
            print(f"⚠️ Error loading distribution chart: {e}")
        
        print(f"🔥 SUPER ADMIN DASHBOARD: Datos finales para renderizar:")
        print(f"  - Summary Stats: {dashboard_data.get('summary_stats', {})}")
        print(f"  - Recent Companies count: {len(dashboard_data.get('recent_companies', []))}")
        print(f"  - Recent Users count: {len(dashboard_data.get('recent_users', []))}")
        print(f"  - Performance Metrics: {dashboard_data.get('performance_metrics', {})}")
        
    except Exception as e:
        print(f"❌ Critical error loading dashboard data: {e}")
        # En caso de error crítico, usar estructura mínima para evitar fallos de renderizado
        dashboard_data = {
            'summary_stats': {
                'total_empresas': 0,
                'active_empresas': 0,
                'total_users': 0,
                'active_users': 0,
                'total_hardware': 0,
                'available_hardware': 0,
                'performance': 0,
                'avg_performance': 0
            },
            'recent_companies': [],
            'recent_users': [],
            'activity_chart': {},
            'distribution_chart': {},
            'performance_metrics': {}
        }
    
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

    # Crear dashboard_data mínimo para heredar del template base
    dashboard_data = {
        'summary_stats': {
            'total_empresas': 0,
            'active_empresas': 0,
            'total_users': initial_total_users,
            'active_users': initial_active_users,
            'total_hardware': 0,
            'available_hardware': 0,
            'performance': 0,
            'avg_performance': 0
        },
        'recent_companies': [],
        'recent_users': [],
        'activity_chart': {},
        'distribution_chart': {},
        'performance_metrics': {}
    }

    return render_template(
        'admin/users.html',
        api_url=PROXY_PREFIX,
        active_page='users',
        user_role=user_role,
        empresa_view=user_role == 'empresa',
        empresa_id=empresa_id,
        empresa_username=empresa_username,
        usuarios_data=usuarios_data,
        dashboard_data=dashboard_data,
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


@app.route('/admin/hardware')
@require_role(['super_admin'])
def admin_hardware():
    """Gestión de hardware - Solo para super_admin"""
    
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

@app.route('/empresa/hardware')
@require_role(['empresa'])
def empresa_hardware():
    """Gestión de hardware para empresa - Función única y simple"""
    empresa_id = session.get('user', {}).get('id')
    empresa_username = session.get('user', {}).get('username')
    
    try:
        # Llamada directa al endpoint de hardware por empresa
        auth_token = request.cookies.get('auth_token')
        if auth_token:
            import requests
            backend_url = f"{BACKEND_API_URL}/api/hardware/empresa/{empresa_id}"
            cookies = {'auth_token': auth_token}
            response = requests.get(backend_url, cookies=cookies)
            
            if response.ok:
                data = response.json()
                if data.get('success'):
                    hardware_list = data.get('data', [])
                    
                    # Obtener tipos de hardware
                    types_response = requests.get(f"{BACKEND_API_URL}/api/hardware-types", cookies=cookies)
                    hardware_types = []
                    if types_response.ok:
                        types_data = types_response.json()
                        if types_data.get('success'):
                            hardware_types = types_data.get('data', [])
                    
                    hardware_data = {
                        'hardware_list': hardware_list,
                        'hardware_types': hardware_types,
                        'hardware_stats': {
                            'total_items': len(hardware_list),
                            'active_items': len([h for h in hardware_list if h.get('activa', True)]),
                            'inactive_items': len([h for h in hardware_list if not h.get('activa', True)]),
                            'available_items': len([h for h in hardware_list if h.get('activa', True)]),
                            'out_of_stock': len([h for h in hardware_list if not h.get('activa', True)]),
                            'total_value': sum(h.get('datos', {}).get('price', 0) * h.get('datos', {}).get('stock', 0) for h in hardware_list)
                        }
                    }
                else:
                    raise Exception(f"Backend error: {data.get('errors', [])}")
            else:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
        else:
            raise Exception("No auth token found")
            
    except Exception as e:
        print(f"Error getting hardware data for empresa {empresa_id}: {e}")
        hardware_data = {
            'hardware_list': [],
            'hardware_types': [],
            'hardware_stats': {
                'total_items': 0,
                'active_items': 0,
                'inactive_items': 0,
                'available_items': 0,
                'out_of_stock': 0,
                'total_value': 0
            }
        }
    
    return render_template(
        'empresa/hardware.html', 
        api_url=PROXY_PREFIX, 
        hardware_data=hardware_data,
        active_page='hardware',
        user_role='empresa',
        empresa_id=empresa_id,
        empresa_username=empresa_username
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
    """Dashboard de empresa - Resumen ejecutivo con KPIs principales"""
    # Get empresa info from session
    empresa_id = session.get('user', {}).get('id')
    empresa_username = session.get('user', {}).get('username')
    
    # Get real empresa name from backend like in stats
    empresa_nombre = 'Mi Empresa'
    try:
        if empresa_id:
            auth_token = request.cookies.get('auth_token')
            if auth_token:
                import requests
                backend_url = f"{BACKEND_API_URL}/api/empresas/{empresa_id}/statistics"
                cookies = {'auth_token': auth_token}
                response = requests.get(backend_url, cookies=cookies)
                if response.ok:
                    data = response.json()
                    if data.get('success'):
                        backend_data = data.get('data', {})
                        empresa_nombre = backend_data.get('empresa', {}).get('nombre', 'Mi Empresa')
    except Exception as e:
        print(f"Error getting empresa name for dashboard: {e}")
    
    # Get summary data (lighter version for dashboard)
    dashboard_summary = {
        'empresa': {
            'id': empresa_id,
            'nombre': empresa_nombre,
            'activa': True
        },
        'kpis': {
            'usuarios_total': 0,
            'usuarios_activos': 0,
            'hardware_total': 0,
            'alertas_activas': 0
        },
        'quick_access': [
            {'name': 'Gestión de Usuarios', 'url': 'empresa_usuarios', 'icon': 'fas fa-users', 'description': 'Administra usuarios de tu empresa'},
            {'name': 'Estadísticas Avanzadas', 'url': 'empresa_stats', 'icon': 'fas fa-chart-line', 'description': 'Análisis detallado de rendimiento'}
        ]
    }
    
    try:
        if empresa_id:
            # Try to get basic statistics for dashboard KPIs using same method as empresa_stats
            auth_token = request.cookies.get('auth_token')
            if auth_token:
                # Make direct request to backend with cookie authentication
                import requests
                backend_url = f"{BACKEND_API_URL}/api/empresas/{empresa_id}/statistics"
                cookies = {'auth_token': auth_token}
                response = requests.get(backend_url, cookies=cookies)
                
                if response.ok:
                    data = response.json()
                    if data.get('success'):
                        backend_data = data.get('data', {})
                        dashboard_summary['kpis'].update({
                            'usuarios_total': backend_data.get('usuarios', {}).get('total_usuarios', 0),
                            'usuarios_activos': backend_data.get('usuarios', {}).get('usuarios_activos', 0),
                            'hardware_total': backend_data.get('hardware', {}).get('total_hardware', 0),
                            'alertas_activas': backend_data.get('alertas', {}).get('alertas_activas', 0)
                        })
                        print(f"✅ Dashboard KPIs loaded for {empresa_id} using cookies")
                    else:
                        print(f"⚠️ Backend returned error for dashboard KPIs: {data.get('errors', [])}")
                else:
                    print(f"⚠️ Dashboard KPIs request failed. Status: {response.status_code}")
                    if response.status_code == 401:
                        print(f"❌ Unauthorized for dashboard KPIs - token might be invalid")
            else:
                print(f"❌ No auth token found in cookies for dashboard KPIs")
    except Exception as e:
        print(f"⚠️ Error fetching dashboard KPIs: {e}")
    
    return render_template(
        'empresa/dashboard_main.html', 
        api_url=PROXY_PREFIX, 
        dashboard_summary=dashboard_summary,
        active_page='dashboard',
        user_role='empresa',
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
        'empresa/usuarios.html',
        api_url=PROXY_PREFIX,
        active_page='users',
        user_role='empresa',
        empresa_id=empresa_id,
        empresa_username=empresa_username,
        usuarios_data=usuarios_data,
        initial_total_users=initial_total_users,
        initial_active_users=initial_active_users
    )


@app.route('/empresa/stats')
@require_role(['empresa'])
def empresa_stats():
    """Estadísticas específicas de empresa usando datos reales del backend"""
    # Get empresa info from session
    empresa_id = session.get('user', {}).get('id')
    empresa_username = session.get('user', {}).get('username')
    
    # Initialize default data structure matching backend response format
    empresa_statistics = {
        'empresa': {
            'id': empresa_id,
            'nombre': empresa_username or 'Mi Empresa',
            'activa': True,
            'fecha_creacion': '2024-01-01'
        },
        'usuarios': {
            'total': 0,
            'activos': 0,
            'inactivos': 0
        },
        'hardware': {
            'total': 0,
            'activos': 0,
            'inactivos': 0,
            'por_tipo': {
                'botonera': 0,
                'semaforo': 0,
                'pantalla': 0
            }
        },
        'alertas': {
            'total': 0,
            'activas': 0,
            'resueltas': 0,
            'por_prioridad': {
                'alta': 0,
                'media': 0,
                'baja': 0
            }
        },
        'actividad_reciente': {
            'logs_ultimos_30_dias': 0,
            'ultima_actividad': '2024-07-20T10:30:00Z'
        }
    }
    
    try:
        if empresa_id:
            # Try to get real statistics from backend with authentication cookies
            auth_token = request.cookies.get('auth_token')
            if auth_token:
                # Make direct request to backend with cookie authentication
                import requests
                backend_url = f"{BACKEND_API_URL}/api/empresas/{empresa_id}/statistics"
                cookies = {'auth_token': auth_token}
                response = requests.get(backend_url, cookies=cookies)
                
                if response.ok:
                    data = response.json()
                    if data.get('success'):
                        backend_data = data.get('data', {})
                        print(f"📊 Raw backend data: {backend_data}")
                        
                        # Map backend data to frontend expected structure
                        empresa_statistics = {
                            'empresa': {
                                'id': backend_data.get('empresa', {}).get('id', empresa_id),
                                'nombre': backend_data.get('empresa', {}).get('nombre', empresa_username or 'Mi Empresa'),
                                'activa': backend_data.get('empresa', {}).get('activa', True),
                                'fecha_creacion': backend_data.get('empresa', {}).get('fecha_creacion', '2024-01-01')
                            },
                            'usuarios': {
                                'total': backend_data.get('usuarios', {}).get('total_usuarios', 0),
                                'activos': backend_data.get('usuarios', {}).get('usuarios_activos', 0),
                                'inactivos': backend_data.get('usuarios', {}).get('usuarios_inactivos', 0)
                            },
                            'hardware': {
                                'total': backend_data.get('hardware', {}).get('total_hardware', 0),
                                'activos': backend_data.get('hardware', {}).get('hardware_activo', 0),
                                'inactivos': backend_data.get('hardware', {}).get('hardware_inactivo', 0),
                                'por_tipo': backend_data.get('hardware', {}).get('por_tipo', {
                                    'botonera': 0,
                                    'semaforo': 0,
                                    'televisor': 0,
                                    'pantalla': 0
                                })
                            },
                            'alertas': {
                                'total': backend_data.get('alertas', {}).get('total_alertas', 0),
                                'activas': backend_data.get('alertas', {}).get('alertas_activas', 0),
                                'resueltas': backend_data.get('alertas', {}).get('alertas_inactivas', 0),
                                'por_prioridad': {
                                    'critica': backend_data.get('alertas', {}).get('alertas_por_prioridad', {}).get('critica', 0),
                                    'alta': backend_data.get('alertas', {}).get('alertas_por_prioridad', {}).get('alta', 0),
                                    'media': backend_data.get('alertas', {}).get('alertas_por_prioridad', {}).get('media', 0),
                                    'baja': backend_data.get('alertas', {}).get('alertas_por_prioridad', {}).get('baja', 0)
                                }
                            },
                            'actividad_reciente': {
                                'logs_ultimos_30_dias': backend_data.get('alertas', {}).get('alertas_recientes_30d', 0),
                                'ultima_actividad': backend_data.get('empresa', {}).get('fecha_creacion', '2024-07-20T10:30:00Z')
                            }
                        }
                        print(f"✅ Loaded and mapped empresa statistics for {empresa_id}")
                        print(f"📋 Mapped data: {empresa_statistics}")
                    else:
                        print(f"⚠️ Backend returned error: {data.get('errors', [])}")
                else:
                    print(f"⚠️ Backend statistics not available, using defaults. Status: {response.status_code}")
                    if response.status_code == 401:
                        print(f"❌ Unauthorized - token might be invalid or expired")
            else:
                print(f"❌ No auth token found in cookies")
    except Exception as e:
        print(f"❌ Error fetching empresa statistics: {e}")
    
    return render_template(
        'empresa/stats.html', 
        api_url=PROXY_PREFIX, 
        empresa_statistics=empresa_statistics,
        active_page='stats',
        user_role='empresa',
        empresa_id=empresa_id,
        empresa_username=empresa_username
    )

@app.route('/empresa/alertas')
@require_role(['empresa'])
def empresa_alertas():
    """Página de alertas activas para empresa"""
    # Get empresa info from session
    empresa_id = session.get('user', {}).get('id')
    empresa_username = session.get('user', {}).get('username')
    
    return render_template(
        'empresa/alertas.html',
        api_url=PROXY_PREFIX,
        active_page='alertas',
        user_role='empresa',
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

# ========== ENDPOINTS DE CONFIGURACIÓN DE CONTACTO SEGUROS ==========
from config import get_public_config, validate_contact_config
import json

@app.route('/contact')
def contact_page():
    """Página de contacto con configuración dinámica"""
    try:
        config = get_public_config()
        return render_template('contact/contact-main.html', config=config)
    except ValueError as e:
        # Si hay error de configuración, mostrar página de error
        error_msg = f"Error de configuración: {str(e)}"
        return render_template('errors/500.html', 
                             api_url=PROXY_PREFIX, 
                             error_message=error_msg), 500

@app.route('/api/contact/config.js')
def contact_config_js():
    """Endpoint que sirve la configuración como JavaScript seguro"""
    try:
        config = get_public_config()
        
        # Crear JavaScript seguro
        js_config = json.dumps(config, ensure_ascii=True, indent=2)
        js_content = f"""
// Configuración dinámica generada desde .env
// Generado automáticamente - NO editar manualmente
window.RESCUE_CONFIG = {js_config};

// Verificar que la configuración se cargó correctamente
if (window.RESCUE_CONFIG) {{
    console.log('✅ Configuración RESCUE cargada:', Object.keys(window.RESCUE_CONFIG));
}} else {{
    console.error('❌ Error: No se pudo cargar la configuración RESCUE');
}}
"""
        
        # Respuesta con headers de seguridad
        response = app.response_class(
            response=js_content,
            status=200,
            mimetype='application/javascript',
            headers={
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'X-Content-Type-Options': 'nosniff',
                'Content-Security-Policy': "default-src 'self'"
            }
        )
        return response
        
    except ValueError as e:
        # Error de configuración - devolver JavaScript que muestra el error
        error_js = f"""
console.error('Error de configuración RESCUE: {str(e)}');
window.RESCUE_CONFIG_ERROR = '{str(e)}';
// Mostrar mensaje de error en la página
if (typeof document !== 'undefined') {{
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'background: #dc3545; color: white; padding: 1rem; margin: 1rem; border-radius: 4px; font-family: monospace;';
    errorDiv.textContent = 'Error de configuración: {str(e)}';
    document.body?.prepend(errorDiv);
}}
"""
        return app.response_class(
            response=error_js,
            status=500,
            mimetype='application/javascript'
        )

@app.route('/api/contact/config')
def contact_config_json():
    """Endpoint JSON para obtener configuración (para debugging)"""
    try:
        config = get_public_config()
        return jsonify({
            'success': True,
            'config': config,
            'loaded_from': '.env',
            'timestamp': __import__('datetime').datetime.now().isoformat()
        })
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'config': None
        }), 500

# Endpoint para validar configuración (solo desarrollo)
if DEBUG_MODE:
    @app.route('/debug/validate-contact-config')
    def debug_validate_config():
        """Endpoint de debugging para validar configuración"""
        try:
            config = get_public_config()
            return jsonify({
                'status': 'valid',
                'config': config,
                'variables_found': list(config.keys()),
                'backend_url': BACKEND_API_URL
            })
        except ValueError as e:
            return jsonify({
                'status': 'invalid',
                'error': str(e),
                'config': None
            }), 500

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

@app.route('/test-login')
def test_login():
    """Página de test para debugging del login"""
    from flask import send_file
    import os
    return send_file(os.path.join(os.path.dirname(__file__), 'test_login_flow.html'))

# ========== CONFIGURACIÓN DE DEBUG ==========
if __name__ == '__main__':
    print("🚀 Iniciando Rescue Frontend...")
    print(f"PROXY RESPONSE: Backend API: {BACKEND_API_URL}")
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
