# app.py - Frontend con JWT Backend
from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_cors import CORS
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
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:5000')  # Backend JWT

# ========== RUTAS PÚBLICAS ==========
@app.route('/')
def index():
    """Página principal - Landing page"""
    return render_template('index.html', api_url=API_BASE_URL)

@app.route('/login')
def login():
    """Página de login - La seguridad la maneja JWT en el frontend"""
    return render_template('login.html', api_url=API_BASE_URL)

@app.route('/logout')
def logout():
    """Cerrar sesión - Redirect para limpiar estados"""
    return redirect(url_for('login'))

# ========== RUTAS DEL DASHBOARD - SIN PROTECCIÓN DE SESSIONS ==========
# La protección la maneja el JavaScript con JWT

@app.route('/admin')
def admin_dashboard():
    """Dashboard principal - Protegido por JWT en frontend"""
    return render_template('admin/dashboard.html', api_url=API_BASE_URL)

@app.route('/admin/users')
def admin_users():
    """Gestión de usuarios - Protegido por JWT en frontend"""
    return render_template('users.html', api_url=API_BASE_URL)

@app.route('/admin/empresas')
def admin_empresas():
    """Gestión de empresas - Protegido por JWT en frontend"""
    return render_template('admin/empresas.html', api_url=API_BASE_URL)

@app.route('/admin/stats')
def admin_stats():
    """Estadísticas - Protegido por JWT en frontend"""
    return render_template('stats.html', api_url=API_BASE_URL)

# ========== RUTAS DE EMPRESA (FUTURO) ==========
@app.route('/empresa')
def empresa_dashboard():
    """Dashboard de empresa - Protegido por JWT en frontend"""
    return render_template('empresa/dashboard.html', api_url=API_BASE_URL)

@app.route('/empresa/empleados')
def empresa_empleados():
    """Gestión de empleados - Protegido por JWT en frontend"""
    return render_template('empresa/empleados.html', api_url=API_BASE_URL)

@app.route('/empresa/perfil')
def empresa_perfil():
    """Perfil de empresa - Protegido por JWT en frontend"""
    return render_template('empresa/perfil.html', api_url=API_BASE_URL)

# ========== CONTEXTO GLOBAL ==========
@app.context_processor
def inject_config():
    """Inyectar configuración en todas las plantillas"""
    return dict(
        api_url=API_BASE_URL,
        app_name="Rescue Dashboard",
        version="1.0.0"
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
    return render_template('errors/404.html', api_url=API_BASE_URL), 404

@app.errorhandler(500)
def internal_error(error):
    """Error interno del servidor"""
    if request.is_json:
        return jsonify({'error': 'Error interno del servidor'}), 500
    return render_template('errors/500.html', api_url=API_BASE_URL), 500

@app.errorhandler(403)
def forbidden(error):
    """Acceso denegado"""
    if request.is_json:
        return jsonify({'error': 'Acceso denegado'}), 403
    return render_template('errors/403.html', api_url=API_BASE_URL), 403

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
    print(f"📡 Backend API: {API_BASE_URL}")
    print(f"🌐 Frontend URL: http://localhost:5050")
    print("🔐 Autenticación: JWT (manejada por JavaScript)")
    print("=" * 50)
    
    # Configuración de desarrollo
    app.run(
        debug=True, 
        port=5050,
        host='0.0.0.0',  # Permitir conexiones externas en desarrollo
        threaded=True    # Mejorar performance en desarrollo
    )
