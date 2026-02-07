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
    make_response,
)
from flask_cors import CORS
import requests
import os
import json
import re
from dotenv import load_dotenv
from utils.api_client import APIClient

# Importar configuración centralizada
from utils.config import (
    BACKEND_API_URL, 
    WEBSOCKET_URL,
    PROXY_PREFIX, 
    SECRET_KEY, 
    SESSION_LIFETIME,
    DEBUG_MODE,
    CORS_ORIGINS,
    validate_config,
    print_config
)
from utils.images_service import (
    fetch_image_folders,
    fetch_folder_files,
    create_image_folder,
    delete_image_folder,
    upload_image_file,
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
app.config['SESSION_COOKIE_SECURE'] = not DEBUG_MODE  # True en producción con HTTPS
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Habilitar CORS
CORS(app, supports_credentials=True, origins=CORS_ORIGINS)

FOLDER_SLUG_PATTERN = re.compile(r'^[\w-]{1,50}$')
FILE_BASENAME_PATTERN = re.compile(r'^[\w-]{1,120}$')

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
                ##print(f"❌ No auth token or session found for route {request.endpoint}")
                return redirect(url_for('login'))
            
            # If we have cookie but no session, we need to validate the cookie
            if auth_token and not user_data:
                try:
                    # Validate token with backend
                    client = getattr(g, 'api_client', APIClient(BACKEND_API_URL))
                    response = client.get('/health')
                    if not response.ok:
                        #print(f"❌ Invalid auth token for route {request.endpoint}")
                        return redirect(url_for('login'))
                    
                    # Token is valid but we don't have user data in session
                    # This is OK - the backend will handle authorization
                    #print(f"✅ Valid auth token found for route {request.endpoint}")
                    # Continue with the request - backend will validate role
                    return f(*args, **kwargs)
                except Exception as e:
                    #print(f"❌ Error validating auth token: {e}")
                    return redirect(url_for('login'))
            
            # If we have session data, validate role
            if user_data:
                user_role = user_data.get('role')
                #print(f"🔍 User role: {user_role}, Required roles: {allowed_roles}, Route: {request.endpoint}")
                
                # Validate that user role is one of the valid roles in our system
                valid_roles = ['empresa', 'super_admin']
                if user_role not in valid_roles:
                    #print(f"❌ Invalid role {user_role} for user")
                    session.clear()  # Clear invalid session
                    return redirect(url_for('login'))
                
                # Check if user has required role
                if user_role not in allowed_roles:
                    #print(f"❌ Access denied. User role {user_role} not in {allowed_roles}")
                    # Redirect based on role - users can only access their allowed areas
                    if user_role == 'empresa':
                        return redirect(url_for('empresa_dashboard'))
                    elif user_role == 'super_admin':
                        return redirect(url_for('admin_dashboard'))
                    else:
                        # Unknown role, redirect to login
                        return redirect(url_for('login'))
                
                #print(f"✅ Access granted for {user_role} to {request.endpoint}")
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Validar conectividad con backend
def validate_backend_connection():
    """Valida si el backend está disponible"""
    try:
        client = APIClient(BACKEND_API_URL)
        response = client.get('/health')
        return response.ok
    except Exception as e:
        #print(f"❌ Backend no disponible: {e}")
        return False

# Inicializar cliente de API antes de cada request
@app.before_request
def attach_api_client():
    # Validar conectividad con backend para rutas protegidas (solo admin routes)
    protected_routes = [
        'admin_dashboard',
        'super_admin_dashboard',
        'admin_users',
        'admin_empresas',
        'admin_hardware',
        'admin_alert_types',
        'admin_imagenes'
    ]
    if request.endpoint in protected_routes:
        if not validate_backend_connection():
            #print("❌ Backend no disponible, limpiando sesión")
            session.clear()
            return redirect(url_for('login', error='backend_unavailable'))
    
    # Inicializar cliente API simplificado
    g.api_client = APIClient(BACKEND_API_URL)

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
        
        # Hacer la petición al backend Y transferir cookies
        res = requests.post(f"{BACKEND_API_URL}/auth/login", 
                           json={"usuario": usuario, "password": password})
        
        if res.ok:
            data = res.json()
            print("=== LOGIN DEBUG ===")
            print(f"Backend cookies found: {len(list(res.cookies))}")
            for cookie in res.cookies:
                print(f"Cookie: {cookie.name} = {cookie.value[:50]}...")
            print("=" * 20)
            
            session['user'] = data.get('user')
            session.permanent = True  # Hacer que la sesión dure tanto como el refresh token
            
            # Crear respuesta de redirect
            user_role = data.get('user', {}).get('role')
            if user_role == 'empresa':
                response = make_response(redirect(url_for('empresa_dashboard')))
            else:
                response = make_response(redirect(url_for('admin_dashboard')))
            
            # TRANSFERIR las cookies del backend usando requests.cookies
            for cookie in res.cookies:
                if cookie.name in ['auth_token', 'refresh_token']:
                    response.set_cookie(
                        cookie.name,
                        cookie.value,
                        httponly=True,
                        secure=False,  # False para desarrollo
                        samesite='Lax',
                        path='/'
                    )
            
            return response
        else:
            try:
                error = res.json().get('message', 'Credenciales inválidas')
            except:
                error = 'Credenciales inválidas'
        
        return render_template('login.html', api_url=PROXY_PREFIX, error=error)
    
    return render_template('login.html', api_url=PROXY_PREFIX, error=initial_error)

@app.route('/logout')
def logout():
    """Cerrar sesión - Redirect para limpiar estados"""
    session.clear()
    return redirect(url_for('login'))

@app.route('/health')
def health_check():
    """Health check endpoint para Docker y monitoreo"""
    try:
        # Verificar conectividad con backend
        backend_status = validate_backend_connection()
        
        return jsonify({
            'status': 'healthy' if backend_status else 'degraded',
            'frontend': 'running',
            'backend_connection': 'connected' if backend_status else 'disconnected',
            'timestamp': os.environ.get('HOSTNAME', 'unknown'),
            'version': '1.0.0'
        }), 200 if backend_status else 503
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': os.environ.get('HOSTNAME', 'unknown')
        }), 503
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
        
        #print(f"SYNC: Token recibido - Body: {bool(data.get('token'))}, Cookie: {bool(request.cookies.get('auth_token'))}")
        #print(f"SYNC: Datos completos del body: {str(data)[:200]}...")
        #print(f"SYNC: Cookies completas: {dict(request.cookies)}")
        #print(f"SYNC: user_data presente: {bool(user_data)}")
        
        if user_data:
            # NO almacenar token en sesión - debe venir en cookie HTTPOnly
            # session['token'] = token or 'cookie_auth'  # Comentado - token en cookie
            session['user'] = user_data
            session.permanent = True  # Hacer que la sesión dure tanto como el refresh token
            
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
        # Verificar que tengamos token de autenticación para endpoints protegidos
        if not request.cookies.get('auth_token'):
            return jsonify({'error': 'No autenticado'}), 401

    #print(f"PROXY: {request.method} /{endpoint} - Session valid: {bool(session.get('user'))}")
    #print(f"PROXY: Request cookies: {dict(request.cookies)}")
    auth_cookie = request.cookies.get('auth_token')
    #print(f"PROXY: Cookie auth_token: {auth_cookie[:50] if auth_cookie else 'None'}...")
    
    # # Debug especial para toggle-status
    # if 'toggle-status' in endpoint:
    #     #print(f"TOGGLE DEBUG:")
    #     #print(f"  - Endpoint completo: /{endpoint}")
    #     #print(f"  - Método: {request.method}")
    #     #print(f"  - Headers: {dict(request.headers)}")
    #     #print(f"  - Usuario: {session.get('user', {}).get('username', 'NO USER')}")
    
    data = None
    if request.method in ['POST', 'PUT', 'PATCH']:
        data = request.get_json(silent=True)
        #print(f"PROXY DATA: PROXY: Datos enviados - {data}")

    try:
        headers = {'Content-Type': 'application/json'}
        extra_cookies = dict(request.cookies)

        # Agregar User-Agent específico para endpoint de contacto
        if endpoint == 'api/contact/send':
            headers['User-Agent'] = 'RESCUE-Frontend/1.0'

        backend_endpoint = f"/{endpoint}" if not endpoint.startswith('/') else endpoint
        resp = g.api_client.request(
            request.method,
            backend_endpoint,
            params=request.args,
            json=data,
            headers=headers,
            cookies=extra_cookies
        )
        #print(f"PROXY RESPONSE: PROXY: Respuesta del backend - Status: {resp.status_code}, Content-Length: {len(resp.content) if resp.content else 0}")
        
        # Log del contenido para endpoints críticos
        if endpoint in ['api/hardware', 'api/empresas', 'api/hardware-types'] or 'toggle-status' in endpoint:
            try:
                content_json = resp.json()
                #print(f"PROXY CONTENT: PROXY: Contenido de /{endpoint}:")
                #print(f"  - Success: {content_json.get('success', 'N/A')}")
                #print(f"  - Count: {content_json.get('count', 'N/A')}")
                #print(f"  - Data length: {len(content_json.get('data', [])) if content_json.get('data') else 0}")
                if content_json.get('data') and len(content_json.get('data', [])) > 0:
                    first_item = content_json['data'][0]
                    #print(f"  - Primer elemento: {list(first_item.keys()) if hasattr(first_item, 'keys') else type(first_item)}")
                    
                # Log especial para toggle-status
                if 'toggle-status' in endpoint:
                    #print(f"  - Message: {content_json.get('message', 'N/A')}")
                    print(f"  - Errors: {content_json.get('errors', 'N/A')}")
            except Exception as e:
                print(f"PROXY ERROR: PROXY: No se pudo parsear JSON de /{endpoint}: {e}")
        
        # SOLO transferir cookies si hay cookies que transferir
        if resp.cookies:
            # Crear respuesta Flask para transferir cookies del backend al navegador
            flask_response = make_response(resp.content, resp.status_code)
            
            # Transferir headers (excepto Set-Cookie que se maneja separadamente)
            for name, value in resp.headers.items():
                if name.lower() not in ['set-cookie', 'content-length']:
                    flask_response.headers[name] = value
            
            # TRANSFERIR COOKIES del backend al navegador
            for cookie in resp.cookies:
                flask_response.set_cookie(
                    cookie.name,
                    cookie.value,
                    httponly=True,
                    secure=False,
                    samesite='Lax',
                    path='/'
                )
            
            return flask_response
        else:
            # Sin cookies, devolver respuesta normal
            return (resp.content, resp.status_code, resp.headers.items())
    except Exception as e:
        #print(f"PROXY ERROR: PROXY ERROR en /{endpoint}: {e}")
        return jsonify({'error': 'Error del servidor'}), 500

# ========== RUTAS DEL DASHBOARD - PROTEGIDAS POR SESION Y ROL ==========

@app.route('/admin')
@require_role(['super_admin'])
def admin_dashboard():
    """Dashboard principal SPA (maqueta)"""
    return render_template('admin/spa_dashboard.html')

@app.route('/admin/super-dashboard')
@require_role(['super_admin'])
def super_admin_dashboard():
    """Legacy dashboard - redirige a la SPA admin."""
    return redirect(url_for('admin_dashboard'))

    #print(f"🔥 SUPER ADMIN DASHBOARD: Iniciando carga de datos REALES...")
    try:
        auth_token = request.cookies.get('auth_token')
        if not auth_token:
            raise RuntimeError('Missing auth token for dashboard data')

        dashboard_stats_response = g.api_client.get('/api/dashboard/stats')
        performance_response = g.api_client.get('/api/dashboard/system-performance')
        
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
            #print(f"📊 Stats Response RAW: {stats_data}")
            #print(f"📊 Stats Response TYPE: {type(stats_data)}")
            #print(f"📊 Stats Response KEYS: {list(stats_data.keys()) if isinstance(stats_data, dict) else 'NOT A DICT'}")
            
            # Extraer datos de stats según la estructura real {'success': True, 'data': {...}}
            if stats_data.get('success') and 'data' in stats_data:
                dashboard_data['summary_stats'] = stats_data['data']
                #print(f"✅ Summary stats loaded successfully: {dashboard_data['summary_stats']}")
                #print(f"✅ Summary stats keys: {list(dashboard_data['summary_stats'].keys()) if isinstance(dashboard_data['summary_stats'], dict) else 'NOT A DICT'}")
            else:
                #print(f"❌ Stats response format unexpected: {stats_data}")
                #print(f"❌ Success field: {stats_data.get('success')}")
                #print(f"❌ Has data field: {'data' in stats_data}")
                # Intentar usar los datos directamente si no hay wrapper
                if isinstance(stats_data, dict) and any(key in stats_data for key in ['total_empresas', 'total_users', 'total_hardware']):
                    #print(f"🔄 Trying to use stats data directly without wrapper...")
                    dashboard_data['summary_stats'] = stats_data
                    #print(f"✅ Summary stats loaded directly: {dashboard_data['summary_stats']}")
        else:
            #print(f"❌ Failed to load dashboard stats: {dashboard_stats_response.status_code}")
            print(f"❌ Response text: {dashboard_stats_response.text[:500] if hasattr(dashboard_stats_response, 'text') else 'NO TEXT'}")
        
        # Procesar métricas de performance
        if performance_response.ok:
            perf_data = performance_response.json()
            #print(f"⚡ Performance Response: {perf_data}")
            
            # Las métricas de performance vienen directamente según la estructura: 
            # {'uptime_percentage': 99.01, 'response_time': 151, ...}
            dashboard_data['performance_metrics'] = perf_data
            #print(f"✅ Performance metrics loaded: {dashboard_data['performance_metrics']}")
        else:
            print(f"❌ Failed to load performance metrics: {performance_response.status_code}")
        
        # Obtener companies y users recientes usando el cliente autenticado
        try:
            companies_response = g.api_client.get('/api/dashboard/recent-companies')
            if companies_response.ok:
                companies_data = companies_response.json()
                if companies_data.get('success') and 'data' in companies_data:
                    dashboard_data['recent_companies'] = companies_data['data']
                    #print(f"✅ Recent companies loaded: {len(dashboard_data['recent_companies'])} items")
        except Exception as e:
            print(f"⚠️ Error loading recent companies: {e}")
        
        try:
            users_response = g.api_client.get('/api/dashboard/recent-users')
            if users_response.ok:
                users_data = users_response.json()
                if users_data.get('success') and 'data' in users_data:
                    dashboard_data['recent_users'] = users_data['data']
                    #print(f"✅ Recent users loaded: {len(dashboard_data['recent_users'])} items")
        except Exception as e:
            print(f"⚠️ Error loading recent users: {e}")
        
        # Obtener gráficos usando el cliente autenticado
        try:
            activity_response = g.api_client.get('/api/dashboard/activity-chart')
            if activity_response.ok:
                activity_data = activity_response.json()
                if activity_data.get('success') and 'data' in activity_data:
                    dashboard_data['activity_chart'] = activity_data['data']
                    #print(f"✅ Activity chart loaded")
        except Exception as e:
            print(f"⚠️ Error loading activity chart: {e}")
        
        try:
            distribution_response = g.api_client.get('/api/dashboard/distribution-chart')
            if distribution_response.ok:
                distribution_data = distribution_response.json()
                if distribution_data.get('success') and 'data' in distribution_data:
                    dashboard_data['distribution_chart'] = distribution_data['data']
                    #print(f"✅ Distribution chart loaded")
        except Exception as e:
            print(f"⚠️ Error loading distribution chart: {e}")
        
        #print(f"🔥 SUPER ADMIN DASHBOARD: Datos finales para renderizar:")
        #print(f"  - Summary Stats: {dashboard_data.get('summary_stats', {})}")
        #print(f"  - Recent Companies count: {len(dashboard_data.get('recent_companies', []))}")
        #print(f"  - Recent Users count: {len(dashboard_data.get('recent_users', []))}")
        #print(f"  - Performance Metrics: {dashboard_data.get('performance_metrics', {})}")
        
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
        usuarios_data = g.api_client.get_usuarios_by_empresa(empresa_id)

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
    companies_data = g.api_client.get_empresas(include_inactive=True)

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
    hardware_data = g.api_client.get_hardware()
    
    return render_template(
        'admin/hardware.html', 
        api_url=PROXY_PREFIX, 
        hardware_data=hardware_data,
        active_page='hardware'
    )


@app.route('/admin/alert-types')
@require_role(['super_admin'])
def admin_alert_types():
    """Gestión de tipos de alertas - Solo para super_admin."""
    fallback_types = [
        {
            'id': 'sample-critical',
            'name': 'Alerta crítica',
            'description': 'Activada ante riesgos inmediatos para la vida o infraestructura crítica.',
            'severity': 'critica',
            'color': '#ef4444',
            'sla_minutes': 2,
            'channels': ['SMS', 'Llamada automática', 'Tablero web'],
            'owner': 'Coordinación general',
            'updated_at': '2024-01-10 14:30',
            'trigger_examples': [
                'Botón de pánico activado',
                'Sensor estructural excedido',
                'Incendio detectado por hardware'
            ],
            'tags': ['prioridad-1', 'respuesta-inmediata'],
            'active': True,
            'icon': 'fas fa-triangle-exclamation',
            'recommendations': [
                'Evacuar la zona afectada',
                'Contactar a bomberos locales',
                'Activar protocolos de emergencia'
            ],
            'equipment': [
                'Extintores tipo ABC',
                'Sistema de rociadores',
                'Kit de primeros auxilios'
            ],
            'sound': 'https://assets.rescue.com.co/sonidos/incendio.mp3'
        },
        {
            'id': 'sample-high',
            'name': 'Alerta operativa alta',
            'description': 'Afectaciones severas al servicio que requieren coordinación inmediata.',
            'severity': 'alta',
            'color': '#f97316',
            'sla_minutes': 10,
            'channels': ['Correo', 'Push móvil', 'Panel web'],
            'owner': 'Operaciones',
            'updated_at': '2024-02-02 09:15',
            'trigger_examples': [
                'Corte eléctrico extendido',
                'Falla regional de comunicaciones',
                'Bloqueo de acceso en sitio'
            ],
            'tags': ['prioridad-2', 'coordinación'],
            'active': True,
            'icon': 'fas fa-bolt',
            'recommendations': [
                'Activar plan de contingencia',
                'Escalar al equipo de operaciones',
                'Verificar disponibilidad de personal'
            ],
            'equipment': [
                'Radios portátiles',
                'Vehículos de apoyo',
                'Kit de herramientas'
            ],
            'sound': 'https://assets.rescue.com.co/sonidos/operativa.mp3'
        },
        {
            'id': 'sample-informative',
            'name': 'Alerta informativa',
            'description': 'Eventos monitoreados sin impacto crítico que requieren seguimiento.',
            'severity': 'media',
            'color': '#facc15',
            'sla_minutes': 30,
            'channels': ['Correo', 'Panel web'],
            'owner': 'Monitoreo',
            'updated_at': '2023-12-20 08:00',
            'trigger_examples': [
                'Prueba de sistemas programada',
                'Aviso meteorológico preventivo'
            ],
            'tags': ['prioridad-3'],
            'active': False,
            'icon': 'fas fa-info-circle',
            'recommendations': [
                'Monitorear evolución del evento',
                'Mantener comunicación con proveedores',
                'Informar novedades al panel central'
            ],
            'equipment': [
                'Panel de control web',
                'Sistema de comunicaciones',
                'Dashboard de métricas'
            ],
            'sound': 'https://assets.rescue.com.co/sonidos/informativa.mp3'
        }
    ]

    def build_stats(types):
        total = len(types)
        active = sum(1 for t in types if t.get('active', True))
        inactive = max(total - active, 0)
        critical = sum(1 for t in types if (t.get('severity') or '').lower() == 'critica')
        sla_values = [t.get('sla_minutes') for t in types if isinstance(t.get('sla_minutes'), (int, float))]
        avg_sla = round(sum(sla_values) / len(sla_values)) if sla_values else 0
        return {
            'total_types': total,
            'active_types': active,
            'inactive_types': inactive,
            'critical_types': critical,
            'avg_sla_minutes': avg_sla,
        }

    def apply_status_filter(types, status):
        if status == 'active':
            return [t for t in types if t.get('active', True)]
        if status == 'inactive':
            return [t for t in types if not t.get('active', True)]
        return types

    page = max(int(request.args.get('page', 1) or 1), 1)
    limit = request.args.get('limit', 4)
    try:
        limit = int(limit)
    except (TypeError, ValueError):
        limit = 10
    limit = min(max(limit, 1), 50)

    requested_status = (request.args.get('status') or 'active').strip().lower()
    if requested_status not in {'active', 'inactive', 'all'}:
        requested_status = 'active'

    fallback_filtered = apply_status_filter(fallback_types, requested_status)

    alert_types_data = {
        'alert_types': fallback_filtered,
        'alert_types_stats': build_stats(fallback_filtered),
        'pagination': {
            'page': page,
            'limit': limit,
            'total': len(fallback_filtered),
            'pages': max(1, (len(fallback_filtered) + limit - 1) // limit),
        },
        'filter_status': requested_status,
    }

    api_fetch = getattr(g.api_client, 'get_alert_types', None)
    if callable(api_fetch):
        try:
            api_data = api_fetch(page=page, limit=limit, status=requested_status) or {}
            alert_types = api_data.get('alert_types', [])
            alert_types_stats = api_data.get('alert_types_stats', build_stats(alert_types))
            pagination = api_data.get('pagination') or {
                'page': page,
                'limit': limit,
                'total': len(alert_types),
                'pages': 1,
            }
            filter_status = api_data.get('filter_status', requested_status)

            alert_types_data = {
                'alert_types': alert_types,
                'alert_types_stats': alert_types_stats,
                'pagination': pagination,
                'filter_status': filter_status,
            }
            requested_status = filter_status
        except Exception as exc:
            app.logger.warning('Falling back to sample alert types due to error: %s', exc)

    return render_template(
        'admin/alert_types.html',
        alert_types_data=alert_types_data,
        active_page='alert_types',
        api_url=PROXY_PREFIX,
        dashboard_data={},
        activity_data=None,
        selected_status=requested_status
    )


@app.route('/admin/alert-types/create', methods=['POST'])
@require_role(['super_admin'])
def admin_create_alert_type():
    payload = request.get_json(silent=True) or {}

    required_fields = ['nombre', 'descripcion', 'tipo_alerta', 'color_alerta']
    missing = [field for field in required_fields if not str(payload.get(field, '')).strip()]
    if missing:
        return jsonify({
            'success': False,
            'message': f"Faltan campos obligatorios: {', '.join(missing)}"
        }), 400

    raw_empresa_id = payload.get('empresa_id')
    empresa_id = str(raw_empresa_id).strip() if raw_empresa_id is not None else ''
    payload['empresa_id'] = empresa_id

    api_response = g.api_client.create_alert_type(payload)
    status_code = api_response.get('status_code', 500 if not api_response.get('success') else 201)

    if api_response.get('success'):
        return jsonify({
            'success': True,
            'message': api_response.get('message') or 'Tipo de alerta creado exitosamente',
            'data': api_response.get('data')
        }), status_code

    return jsonify({
        'success': False,
        'message': api_response.get('message') or 'No se pudo crear el tipo de alerta'
    }), status_code


@app.route('/admin/alert-types/<alert_type_id>/deactivate', methods=['PATCH'])
@require_role(['super_admin'])
def admin_deactivate_alert_type(alert_type_id: str):
    payload = request.get_json(silent=True) or {}
    motivo = str(payload.get('motivo', '')).strip()

    api_response = g.api_client.deactivate_alert_type(alert_type_id, motivo)
    status_code = api_response.get('status_code', 500)

    if api_response.get('success'):
        return jsonify({
            'success': True,
            'message': api_response.get('message') or 'Tipo de alerta desactivado exitosamente',
            'motivo': motivo,
            'data': api_response.get('data')
        }), status_code

    return jsonify({
        'success': False,
        'message': api_response.get('message') or 'No se pudo desactivar el tipo de alerta'
    }), status_code


@app.route('/admin/alert-types/<alert_type_id>/toggle', methods=['PATCH'])
@require_role(['super_admin'])
def admin_toggle_alert_type(alert_type_id: str):
    payload = request.get_json(silent=True) or {}
    motivo = str(payload.get('motivo', '')).strip()
    accion = str(payload.get('accion', '')).strip() if payload.get('accion') else ''

    api_payload = {}
    if accion:
        api_payload['accion'] = accion
    if motivo:
        api_payload['motivo'] = motivo

    api_response = g.api_client.toggle_alert_type_status(
        alert_type_id,
        api_payload if api_payload else None
    )
    status_code = api_response.get('status_code', 500)

    if api_response.get('success'):
        return jsonify({
            'success': True,
            'message': api_response.get('message') or 'Estado del tipo de alerta actualizado correctamente',
            'data': api_response.get('data')
        }), status_code

    return jsonify({
        'success': False,
        'message': api_response.get('message') or 'No se pudo actualizar el estado del tipo de alerta'
    }), status_code


@app.route('/admin/alert-types/<alert_type_id>/update', methods=['PUT'])
@require_role(['super_admin'])
def admin_update_alert_type(alert_type_id: str):
    payload = request.get_json(silent=True) or {}

    required_fields = ['nombre', 'descripcion', 'tipo_alerta', 'color_alerta']
    missing = [field for field in required_fields if not str(payload.get(field, '')).strip()]
    if missing:
        return jsonify({
            'success': False,
            'message': f"Faltan campos obligatorios: {', '.join(missing)}"
        }), 400

    raw_empresa_id = payload.get('empresa_id')
    empresa_id = str(raw_empresa_id).strip() if raw_empresa_id is not None else ''
    payload['empresa_id'] = empresa_id

    api_response = g.api_client.update_alert_type(alert_type_id, payload)
    status_code = api_response.get('status_code', 500 if not api_response.get('success') else 200)

    if api_response.get('success'):
        return jsonify({
            'success': True,
            'message': api_response.get('message') or 'Tipo de alerta actualizado exitosamente',
            'data': api_response.get('data')
        }), status_code

    return jsonify({
        'success': False,
        'message': api_response.get('message') or 'No se pudo actualizar el tipo de alerta'
    }), status_code


@app.route('/admin/alert-types/<alert_type_id>/detail', methods=['GET'])
@require_role(['super_admin'])
def admin_alert_type_detail(alert_type_id: str):
    api_fetch = getattr(g.api_client, 'get_alert_type', None)
    if not callable(api_fetch):
        return jsonify({
            'success': False,
            'message': 'Servicio no disponible.'
        }), 503

    result = api_fetch(alert_type_id)
    if result.get('success'):
        return jsonify({
            'success': True,
            'data': result.get('data')
        })

    message = result.get('message') or 'No se encontró el tipo de alerta.'
    status_code = 404 if 'HTTP 404' in message or 'not found' in message.lower() else 400
    return jsonify({
        'success': False,
        'message': message
    }), status_code


@app.route('/admin/alert-types/<alert_type_id>/delete', methods=['DELETE'])
@require_role(['super_admin'])
def admin_delete_alert_type(alert_type_id: str):
    api_response = g.api_client.delete_alert_type(alert_type_id)
    status_code = api_response.get('status_code', 500)

    if api_response.get('success'):
        return jsonify({
            'success': True,
            'message': api_response.get('message') or 'Tipo de alerta eliminado correctamente'
        }), status_code

    return jsonify({
        'success': False,
        'message': api_response.get('message') or 'No se pudo eliminar el tipo de alerta'
    }), status_code


@app.route('/admin/imagenes')
@require_role(['super_admin'])
def admin_imagenes():
    """Gestión visual de carpetas de imágenes - Solo para super_admin."""

    folder_names, error_message, endpoint = fetch_image_folders()

    folders = [
        {
            'name': name,
            'display_name': name.replace('-', ' ').replace('_', ' ').title(),
            'initials': ''.join(part[0].upper() for part in name.split('-')[:2] if part) or 'FD'
        }
        for name in folder_names
    ]

    images_data = {
        'folders': folders,
        'error': error_message or None,
        'service_url': endpoint
    }

    return render_template(
        'admin/imagenes.html',
        api_url=PROXY_PREFIX,
        images_data=images_data,
        active_page='imagenes'
    )

@app.route('/admin/imagenes/<path:folder_name>/files')
@require_role(['super_admin'])
def admin_imagenes_folder_files(folder_name):
    """Devuelve los archivos de una carpeta en formato JSON."""
    files, error_message, endpoint = fetch_folder_files(folder_name)
    success = error_message == ''
    status_code = 200 if success else 502
    return jsonify({
        'success': success,
        'folder': folder_name,
        'files': files,
        'error': error_message or None,
        'service_url': endpoint
    }), status_code


@app.route('/admin/imagenes/upload', methods=['POST'])
@require_role(['super_admin'])
def admin_upload_image_file():
    """Carga un archivo en la carpeta indicada del servicio de imágenes."""
    folder = (request.form.get('folder') or '').strip()
    filename = (request.form.get('filename') or '').strip()
    file_storage = request.files.get('file')

    if not folder or not FOLDER_SLUG_PATTERN.fullmatch(folder):
        return jsonify({
            'success': False,
            'error': 'La carpeta es obligatoria y solo admite letras, números o guiones.'
        }), 400

    if not filename or not FILE_BASENAME_PATTERN.fullmatch(filename):
        return jsonify({
            'success': False,
            'error': 'El nombre base es obligatorio y solo admite letras, números o guiones.'
        }), 400

    if not file_storage or not getattr(file_storage, 'filename', '').strip():
        return jsonify({
            'success': False,
            'error': 'Selecciona un archivo válido para cargar.'
        }), 400

    success, error_message = upload_image_file(folder, filename, file_storage)
    status_code = 201 if success else 502
    response_data = {
        'success': success,
        'folder': folder,
        'filename': filename,
        'error': error_message or None
    }

    if success:
        updated_folders, _, _ = fetch_image_folders()
        response_data['folders'] = updated_folders

    return jsonify(response_data), status_code


def _format_folder_display(folder_name: str) -> str:
    cleaned = (folder_name or '').replace('_', ' ').replace('-', ' ').strip()
    if not cleaned:
        return 'Carpeta'
    return ' '.join(part.capitalize() for part in cleaned.split())


@app.route('/admin/image-assets/folders')
@require_role(['super_admin'])
def admin_image_assets_folders():
    folders, error_message, service_url = fetch_image_folders()
    normalized = [
        {
            'name': name,
            'display_name': _format_folder_display(name)
        }
        for name in folders
    ]

    response_data = {
        'success': error_message == '',
        'folders': normalized,
        'service_url': service_url,
        'error': error_message or None
    }

    status_code = 200 if error_message == '' else 502
    return jsonify(response_data), status_code


@app.route('/admin/image-assets/folders/<path:folder_name>/files')
@require_role(['super_admin'])
def admin_image_assets_folder_files(folder_name):
    files, error_message, service_url = fetch_folder_files(folder_name)
    response_data = {
        'success': error_message == '',
        'folder': folder_name,
        'files': files,
        'service_url': service_url,
        'error': error_message or None
    }
    status_code = 200 if error_message == '' else 502
    return jsonify(response_data), status_code


@app.route('/admin/imagenes/folders', methods=['POST'])
@require_role(['super_admin'])
def admin_create_image_folder():
    """Crea un nuevo directorio en el servicio de imágenes."""
    payload = request.get_json(silent=True) or {}
    name = (payload.get('name') or '').strip()
    if not name:
        return jsonify({
            'success': False,
            'error': 'El nombre del directorio es obligatorio.'
        }), 400

    success, error_message = create_image_folder(name)
    status_code = 201 if success else 502
    response_data = {
        'success': success,
        'name': name,
        'error': error_message or None
    }

    if success:
        updated_folders, _, _ = fetch_image_folders()
        response_data['folders'] = updated_folders

    return jsonify(response_data), status_code


@app.route('/admin/imagenes/folders/<path:folder_name>', methods=['DELETE'])
@require_role(['super_admin'])
def admin_delete_image_folder(folder_name):
    """Elimina un directorio en el servicio de imágenes."""
    success, error_message = delete_image_folder(folder_name)
    status_code = 200 if success else 502
    response_data = {
        'success': success,
        'folder': folder_name,
        'error': error_message or None
    }

    if success:
        updated_folders, _, _ = fetch_image_folders()
        response_data['folders'] = updated_folders

    return jsonify(response_data), status_code


@app.route('/empresa/hardware')
@require_role(['empresa'])
def empresa_hardware():
    return redirect(url_for('empresa_dashboard', view='hardware'))
    """Gestión de hardware para empresa - Función única y simple"""
    empresa_id = session.get('user', {}).get('id')
    empresa_username = session.get('user', {}).get('username')
    
    try:
        # Llamada directa al endpoint de hardware por empresa
        auth_token = request.cookies.get('auth_token')
        if not auth_token:
            raise Exception("No auth token found")

        backend_endpoint = f"/api/hardware/empresa/{empresa_id}"
        response = g.api_client.get(backend_endpoint)

        if response.ok:
            data = response.json()
            if data.get('success'):
                hardware_list = data.get('data', [])

                # Obtener tipos de hardware
                types_response = g.api_client.get('/api/hardware-types')
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
            
    except Exception as e:
        #print(f"Error getting hardware data for empresa {empresa_id}: {e}")
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
    # Get ALL company types from backend
    company_types_data = g.api_client.get_company_types()
    
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
    backend_data = {}
    try:
        if empresa_id:
            auth_token = request.cookies.get('auth_token')
            if not auth_token:
                raise RuntimeError('No auth token found in cookies')

            response = g.api_client.get(f"/api/empresas/{empresa_id}/statistics")
            if response.ok:
                data = response.json()
                if data.get('success'):
                    backend_data = data.get('data', {})
                    empresa_nombre = backend_data.get('empresa', {}).get('nombre', 'Mi Empresa')
                else:
                    raise Exception(f"Backend error: {data.get('errors', [])}")
            else:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Error getting empresa statistics: {e}")

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
    
    if backend_data:
        empresa_data = backend_data.get('empresa', {})
        usuarios_data = backend_data.get('usuarios', {})
        hardware_info = backend_data.get('hardware', {})
        alertas_info = backend_data.get('alertas', {})

        dashboard_summary['kpis'].update({
            'usuarios_total': usuarios_data.get('total_usuarios', 0),
            'usuarios_activos': usuarios_data.get('usuarios_activos', 0),
            'hardware_total': hardware_info.get('total_hardware', 0),
            'alertas_activas': alertas_info.get('alertas_activas', 0)
        })
    else:
        print(f"⚠️ Dashboard KPIs fallback in use for empresa {empresa_id}")

    empresa_statistics = {
        'empresa': {
            'id': empresa_id,
            'nombre': empresa_nombre,
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

    if backend_data:
        empresa_statistics = {
            'empresa': {
                'id': backend_data.get('empresa', {}).get('id', empresa_id),
                'nombre': backend_data.get('empresa', {}).get('nombre', empresa_nombre),
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
                'ultima_actividad': backend_data.get('empresa', {}).get('ultima_actividad', '2024-07-20T10:30:00Z')
            }
        }

    default_view = request.args.get('view') or 'dashboard'
    allowed_views = {'dashboard', 'usuarios', 'hardware', 'stats', 'alertas', 'alertas-inactivas'}
    if default_view not in allowed_views:
        default_view = 'dashboard'

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
        'empresa/dashboard.html',
        api_url=PROXY_PREFIX, 
        dashboard_summary=dashboard_summary,
        empresa_statistics=empresa_statistics,
        active_page=default_view,
        default_view=default_view,
        hardware_data=hardware_data,
        user_role='empresa',
        empresa_id=empresa_id,
        empresa_username=empresa_username
    )

@app.route('/empresa/usuarios')
@require_role(['empresa'])
def empresa_usuarios():
    """Gestión de usuarios - Reutiliza vista admin/users.html"""
    return redirect(url_for('empresa_dashboard'))


@app.route('/empresa/stats')
@require_role(['empresa'])
def empresa_stats():
    """Estadísticas específicas de empresa usando datos reales del backend"""
    return redirect(url_for('empresa_dashboard', view='stats'))
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
            if not auth_token:
                raise RuntimeError('No auth token found in cookies')

            response = g.api_client.get(f"/api/empresas/{empresa_id}/statistics")

            if response.ok:
                data = response.json()
                if data.get('success'):
                    backend_data = data.get('data', {})
                    #print(f"📊 Raw backend data: {backend_data}")

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
                            'ultima_actividad': backend_data.get('empresa', {}).get('ultima_actividad', '2024-07-20T10:30:00Z')
                        }
                    }
                    print(f"✅ Loaded and mapped empresa statistics")
                    #print(f"📋 Mapped data: {empresa_statistics}")
                else:
                    print(f"⚠️ Backend returned error: {data.get('errors', [])}")
            else:
                #print(f"⚠️ Backend statistics not available, using defaults. Status: {response.status_code}")
                if response.status_code == 401:
                    print(f"❌ Unauthorized - token might be invalid or expired")
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
    return redirect(url_for('empresa_dashboard', view='alertas'))
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

@app.route('/empresa/alertas_inactivas')
@require_role(['empresa'])
def empresa_alertas_inactivas():
    return redirect(url_for('empresa_dashboard', view='alertas-inactivas'))
    """Página de alertas inactivas para empresa"""
    # Get empresa info from session
    empresa_id = session.get('user', {}).get('id')
    empresa_username = session.get('user', {}).get('username')
    
    return render_template(
        'empresa/alertas_inactivas.html',
        api_url=PROXY_PREFIX,
        active_page='alertas_inactivas',
        user_role='empresa',
        empresa_id=empresa_id,
        empresa_username=empresa_username
    )

# Rutas alias para mantener compatibilidad
@app.route('/empresa/empleados')
@require_role(['empresa'])
def empresa_empleados():
    """Alias para usuarios - Redirige a empresa_usuarios"""
    return redirect(url_for('empresa_dashboard'))

@app.route('/empresa/perfil')
@require_role(['empresa'])
def empresa_perfil():
    return redirect(url_for('empresa_dashboard'))
    """Perfil de empresa - Redirige a stats por ahora"""
    return redirect(url_for('empresa_stats'))

# ========== CONTEXTO GLOBAL ==========
@app.context_processor
def inject_config():
    """Inyectar configuración en todas las plantillas"""
    import time
    return dict(
        api_url=PROXY_PREFIX,
        websocket_url=WEBSOCKET_URL,
        app_name="Rescue Dashboard",
        version="1.0.0",
        current_user=session.get('user'),
        cache_version=f"v{int(time.time())}"
    )


# ========== MIDDLEWARE Y HEADERS DE SEGURIDAD ==========
@app.after_request
def after_request(response):
    """Headers de seguridad"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'

    # Aplicar cookies refrescadas del backend durante la petición
    refreshed_cookies = getattr(g, 'backend_refreshed_cookies', [])
    for cookie in refreshed_cookies:
        cookie_name = cookie.get('name')
        cookie_value = cookie.get('value')
        if not cookie_name or cookie_value is None:
            continue
        response.set_cookie(
            cookie_name,
            cookie_value,
            httponly=True,
            secure=not DEBUG_MODE,
            samesite='Lax',
            path='/'
        )

    # Headers solo para desarrollo
    if DEBUG_MODE:
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
    
    return response

# ========== ENDPOINTS DE CONFIGURACIÓN DE CONTACTO SEGUROS ==========
from utils.config import get_public_config, validate_contact_config
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
                return datetime.fromisoformat(str(value).replace('Z', '+00:00')).strftime(format)
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
    #print("🚀 Iniciando Rescue Frontend...")
    #print(f"PROXY RESPONSE: Backend API: {BACKEND_API_URL}")
    #print("🌐 Frontend URL: http://localhost:5050")
    #print("🔐 Autenticación: manejada por Flask y proxy interno")
    #print("=" * 50)
    
    # Configuración de desarrollo
    app.run(
        debug=True, 
        port=5050,
        host='0.0.0.0',  # Permitir conexiones externas en desarrollo
        threaded=True    # Mejorar performance en desarrollo
    )
