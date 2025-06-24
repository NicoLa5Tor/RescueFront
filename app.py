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

# Cargar variables de entorno
load_dotenv()

# Crear la aplicación Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Habilitar CORS
CORS(app, supports_credentials=True)

# Configuración del backend API JWT
BACKEND_API_URL = os.getenv('API_BASE_URL', 'http://localhost:5000')
# Prefijo interno para las llamadas desde el frontend (proxy)
PROXY_PREFIX = '/proxy'

# Inicializar cliente de API antes de cada request
@app.before_request
def attach_api_client():
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
    if request.method == 'POST':
        usuario = request.form.get('usuario')
        password = request.form.get('password')
        client = EndpointTestClient(BACKEND_API_URL)
        res = client.login(usuario, password)
        if res.ok:
            data = res.json()
            session['token'] = data.get('token')
            session['user'] = data.get('user')
            return redirect(url_for('admin_dashboard'))
        error = res.json().get('message', 'Credenciales inválidas')
        return render_template('login.html', api_url=PROXY_PREFIX, error=error)
    return render_template('login.html', api_url=PROXY_PREFIX)

@app.route('/logout')
def logout():
    """Cerrar sesión - Redirect para limpiar estados"""
    session.clear()
    return redirect(url_for('login'))

# Proxy de todas las peticiones hacia el backend
@app.route(f'{PROXY_PREFIX}/<path:endpoint>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy_api(endpoint):
    if 'token' not in session:
        return jsonify({'error': 'No autenticado'}), 401

    data = None
    if request.method in ['POST', 'PUT']:
        data = request.get_json(silent=True)

    resp = g.api_client._request(request.method, f'/{endpoint}', params=request.args, data=data)
    return (resp.content, resp.status_code, resp.headers.items())

# ========== RUTAS DEL DASHBOARD - SIN PROTECCIÓN DE SESSIONS ==========
# La protección la maneja el JavaScript con JWT

@app.route('/admin')
def admin_dashboard():
    """Dashboard principal - Protegido por JWT en frontend"""
    if 'token' not in session:
        return redirect(url_for('login'))
    user = session.get('user', {})
    empresa_id = user.get('empresa_id')
    activity_data = {}
    if empresa_id:
        res = g.api_client.get_empresa_activity(empresa_id)
        if res.ok:
            activity_data = res.json().get('data', {})

    top_activity = []
    if user.get('tipo') == 'admin':
        res = g.api_client.get_admin_activity_only()
        if res.ok:
            logs = res.json().get('data', [])
            from collections import Counter
            counts = Counter(log.get('empresa_id') for log in logs)
            top_activity = [
                {'empresa_id': eid, 'count': cnt}
                for eid, cnt in counts.most_common(10)
            ]

    return render_template(
        'admin/dashboard.html',
        api_url=PROXY_PREFIX,
        activity_data=activity_data,
        top_activity=top_activity,
    )

@app.route('/admin/users')
def admin_users():
    """Gestión de usuarios - Protegido por JWT en frontend"""
    if 'token' not in session:
        return redirect(url_for('login'))
    return render_template('users.html', api_url=PROXY_PREFIX)

@app.route('/admin/empresas')
def admin_empresas():
    """Gestión de empresas - Protegido por JWT en frontend"""
    if 'token' not in session:
        return redirect(url_for('login'))
    return render_template('admin/empresas.html', api_url=PROXY_PREFIX)

@app.route('/admin/stats')
def admin_stats():
    """Estadísticas - Protegido por JWT en frontend"""
    if 'token' not in session:
        return redirect(url_for('login'))
    return render_template('stats.html', api_url=PROXY_PREFIX)

# ========== RUTAS DE EMPRESA (FUTURO) ==========
@app.route('/empresa')
def empresa_dashboard():
    """Dashboard de empresa - Protegido por JWT en frontend"""
    if 'token' not in session:
        return redirect(url_for('login'))
    return render_template('empresa/dashboard.html', api_url=PROXY_PREFIX)

@app.route('/empresa/empleados')
def empresa_empleados():
    """Gestión de empleados - Protegido por JWT en frontend"""
    if 'token' not in session:
        return redirect(url_for('login'))
    return render_template('empresa/empleados.html', api_url=PROXY_PREFIX)

@app.route('/empresa/perfil')
def empresa_perfil():
    """Perfil de empresa - Protegido por JWT en frontend"""
    if 'token' not in session:
        return redirect(url_for('login'))
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
    try:
        return f"${value:,.2f}"
    except (ValueError, TypeError):
        return f"${0:,.2f}"

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
    print(f"🌐 Frontend URL: http://localhost:5050")
    print("🔐 Autenticación: manejada por Flask y proxy interno")
    print("=" * 50)
    
    # Configuración de desarrollo
    app.run(
        debug=True, 
        port=5050,
        host='0.0.0.0',  # Permitir conexiones externas en desarrollo
        threaded=True    # Mejorar performance en desarrollo
    )
