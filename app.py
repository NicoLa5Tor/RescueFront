# app.py
from flask import Flask, render_template, session, redirect, url_for, request, jsonify
from flask_cors import CORS
from functools import wraps
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Crear la aplicación Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False  # Cambiar a True en producción con HTTPS
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 horas

# Habilitar CORS
CORS(app, supports_credentials=True)

# Configuración del backend API
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:5000')

# Decorador para rutas protegidas
def login_required(role=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                if request.is_json:
                    return jsonify({'error': 'No autorizado'}), 401
                return redirect(url_for('login', next=request.url))
            
            if role and session.get('user_role') != role:
                if request.is_json:
                    return jsonify({'error': 'Acceso denegado'}), 403
                return redirect(url_for('index'))
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ========== RUTAS PÚBLICAS ==========
@app.route('/')
def index():
    """Página principal - Landing page"""
    return render_template('index.html')

@app.route('/login')
def login():
    """Página de login"""
    if 'user_id' in session:
        if session.get('user_role') == 'admin':
            return redirect(url_for('admin_dashboard'))
        else:
            return redirect(url_for('empresa_dashboard'))
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Cerrar sesión"""
    session.clear()
    return redirect(url_for('index'))

# ========== RUTAS DE ADMINISTRADOR ==========
@app.route('/admin')
@login_required(role='admin')
def admin_dashboard():
    """Dashboard del administrador"""
    return render_template('admin/dashboard.html', api_url=API_BASE_URL)

@app.route('/admin/users')
@login_required(role='admin')
def admin_users():
    """Gestión de usuarios - Admin"""
    return render_template('admin/users.html', api_url=API_BASE_URL)

@app.route('/admin/empresas')
@login_required(role='admin')
def admin_empresas():
    """Gestión de empresas - Admin"""
    return render_template('admin/empresas.html', api_url=API_BASE_URL)

@app.route('/admin/stats')
@login_required(role='admin')
def admin_stats():
    """Estadísticas - Admin"""
    return render_template('admin/stats.html', api_url=API_BASE_URL)

# ========== RUTAS DE EMPRESA ==========
@app.route('/empresa')
@login_required(role='empresa')
def empresa_dashboard():
    """Dashboard de la empresa"""
    empresa_id = session.get('empresa_id')
    return render_template('empresa/dashboard.html', 
                         api_url=API_BASE_URL, 
                         empresa_id=empresa_id)

@app.route('/empresa/empleados')
@login_required(role='empresa')
def empresa_empleados():
    """Gestión de empleados - Empresa"""
    empresa_id = session.get('empresa_id')
    return render_template('empresa/empleados.html', 
                         api_url=API_BASE_URL, 
                         empresa_id=empresa_id)

@app.route('/empresa/perfil')
@login_required(role='empresa')
def empresa_perfil():
    """Perfil de la empresa"""
    empresa_id = session.get('empresa_id')
    return render_template('empresa/perfil.html', 
                         api_url=API_BASE_URL, 
                         empresa_id=empresa_id)

# ========== API DE AUTENTICACIÓN ==========
@app.route('/api/login', methods=['POST'])
def api_login():
    """Endpoint de login"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('user_type')
    
    # Aquí deberías validar con tu API backend real
    # Por ahora simulamos el login
    if email and password:
        # Simulación de respuesta del backend
        if user_type == 'admin':
            session['user_id'] = 1
            session['user_email'] = email
            session['user_role'] = 'admin'
            session['user_name'] = 'Administrador'
        else:
            session['user_id'] = 1
            session['user_email'] = email
            session['user_role'] = 'empresa'
            session['empresa_id'] = 1  # ID de la empresa
            session['empresa_name'] = 'Mi Empresa S.A.'
        
        return jsonify({
            'success': True,
            'role': session['user_role'],
            'redirect': url_for('admin_dashboard' if user_type == 'admin' else 'empresa_dashboard')
        })
    
    return jsonify({'success': False, 'message': 'Credenciales inválidas'}), 401

# ========== CONTEXTO GLOBAL ==========
@app.context_processor
def inject_user():
    """Inyectar datos del usuario en todas las plantillas"""
    return dict(
        current_user={
            'id': session.get('user_id'),
            'email': session.get('user_email'),
            'role': session.get('user_role'),
            'name': session.get('user_name'),
            'empresa_id': session.get('empresa_id'),
            'empresa_name': session.get('empresa_name')
        } if 'user_id' in session else None
    )
#=========== RUTAS DE PRUEBA ============
@app.route("/pruebas")
def pruebas():
    return render_template("GSAP_Templates/funcion.html")

# ========== MANEJO DE ERRORES ==========
@app.errorhandler(404)
def not_found(error):
    return render_template('errors/404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('errors/500.html'), 500

# ========== CONFIGURACIÓN DE JINJA2 ==========
@app.template_filter('currency')
def currency_filter(value):
    """Filtro para formatear moneda"""
    return f"${value:,.2f}"

@app.template_filter('date_format')
def date_format_filter(value, format='%d/%m/%Y'):
    """Filtro para formatear fechas"""
    if value:
        return value.strftime(format)
    return ''

if __name__ == '__main__':
    app.run(debug=True, port=5050)