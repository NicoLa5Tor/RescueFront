# app.py - Frontend con JWT Backend
from flask import Flask, render_template, request, jsonify, redirect, url_for, abort, Blueprint
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

# ======================== API ENDPOINTS ========================
users_bp = Blueprint('users', __name__, url_prefix='/api/users')
empresas_bp = Blueprint('empresas', __name__, url_prefix='/api/empresas')
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')
empresa_users_bp = Blueprint('empresa_users', __name__, url_prefix='/empresas')

# In-memory storage for demonstration
users = {}
companies = {}
company_users = {}
user_id_counter = 1
company_id_counter = 1


@users_bp.route('/', methods=['GET'])
def list_users():
    return jsonify(list(users.values()))


@users_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = users.get(user_id)
    if not user:
        abort(404)
    return jsonify(user)


@users_bp.route('/', methods=['POST'])
def create_user():
    data = request.get_json(force=True)
    global user_id_counter
    user = {
        'id': user_id_counter,
        'name': data.get('name'),
        'email': data.get('email'),
        'age': data.get('age'),
    }
    users[user_id_counter] = user
    user_id_counter += 1
    return jsonify(user), 201


@users_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = users.get(user_id)
    if not user:
        abort(404)
    data = request.get_json(force=True)
    for field in ['name', 'email', 'age']:
        if field in data:
            user[field] = data[field]
    return jsonify(user)


@users_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    if user_id not in users:
        abort(404)
    users.pop(user_id)
    for cu in company_users.values():
        cu.pop(user_id, None)
    return '', 204


@users_bp.route('/age-range', methods=['GET'])
def users_age_range():
    min_age = int(request.args.get('min_age', 0))
    max_age = int(request.args.get('max_age', 200))
    filtered = [u for u in users.values() if min_age <= u.get('age', 0) <= max_age]
    return jsonify(filtered)


@empresas_bp.route('/', methods=['GET'])
def list_companies():
    return jsonify(list(companies.values()))


@empresas_bp.route('/<int:empresa_id>', methods=['GET'])
def get_company(empresa_id):
    company = companies.get(empresa_id)
    if not company:
        abort(404)
    return jsonify(company)


@empresas_bp.route('/', methods=['POST'])
def create_company():
    data = request.get_json(force=True)
    global company_id_counter
    company = {
        'id': company_id_counter,
        'nombre': data.get('nombre'),
        'ubicacion': data.get('ubicacion'),
    }
    companies[company_id_counter] = company
    company_users[company_id_counter] = {}
    company_id_counter += 1
    return jsonify(company), 201


@empresas_bp.route('/<int:empresa_id>', methods=['PUT'])
def update_company(empresa_id):
    company = companies.get(empresa_id)
    if not company:
        abort(404)
    data = request.get_json(force=True)
    for field in ['nombre', 'ubicacion']:
        if field in data:
            company[field] = data[field]
    return jsonify(company)


@empresas_bp.route('/<int:empresa_id>', methods=['DELETE'])
def delete_company(empresa_id):
    if empresa_id not in companies:
        abort(404)
    companies.pop(empresa_id)
    company_users.pop(empresa_id, None)
    return '', 204


@empresas_bp.route('/mis-empresas', methods=['GET'])
def my_companies():
    return jsonify(list(companies.values()))


@empresas_bp.route('/buscar-por-ubicacion', methods=['GET'])
def company_by_location():
    loc = request.args.get('ubicacion')
    filtered = [c for c in companies.values() if loc is None or c.get('ubicacion') == loc]
    return jsonify(filtered)


@empresas_bp.route('/estadisticas', methods=['GET'])
def company_stats():
    return jsonify({'total_empresas': len(companies)})


WEEK_LABELS = ["L", "M", "X", "J", "V", "S", "D"]


def _generate_activity(count: int):
    """Return a list of 7 numbers for demo activity charts."""
    return [count for _ in WEEK_LABELS]


@admin_bp.route('/activity', methods=['GET'])
def admin_activity():
    """Actividad general para el dashboard."""
    data = {
        "labels": WEEK_LABELS,
        "values": _generate_activity(len(users)),
        "label": "Actividad",
    }
    return jsonify({"success": True, "data": data})


@admin_bp.route('/distribution', methods=['GET'])
def admin_distribution():
    """Distribución de empresas registradas."""
    data = {
        "labels": ["Empresas Registradas"],
        "values": [len(companies)],
    }
    return jsonify({"success": True, "data": data})


@empresas_bp.route('/<int:empresa_id>/activity', methods=['GET'])
def empresa_activity(empresa_id):
    """Actividad específica de una empresa."""
    if empresa_id not in companies:
        abort(404)
    count = len(company_users.get(empresa_id, {}))
    data = {
        "labels": WEEK_LABELS,
        "values": _generate_activity(count),
        "label": "Actividad",
    }
    return jsonify({"success": True, "data": data})


@empresa_users_bp.route('/<int:empresa_id>/usuarios', methods=['GET'])
def list_empresa_users(empresa_id):
    if empresa_id not in company_users:
        abort(404)
    return jsonify(list(company_users[empresa_id].values()))


@empresa_users_bp.route('/<int:empresa_id>/usuarios/<int:user_id>', methods=['GET'])
def get_empresa_user(empresa_id, user_id):
    if empresa_id not in company_users or user_id not in company_users[empresa_id]:
        abort(404)
    return jsonify(company_users[empresa_id][user_id])


@empresa_users_bp.route('/<int:empresa_id>/usuarios', methods=['POST'])
def create_empresa_user(empresa_id):
    if empresa_id not in company_users:
        abort(404)
    data = request.get_json(force=True)
    global user_id_counter
    user = {
        'id': user_id_counter,
        'name': data.get('name'),
        'email': data.get('email'),
    }
    users[user_id_counter] = user
    company_users[empresa_id][user_id_counter] = user
    user_id_counter += 1
    return jsonify(user), 201


@empresa_users_bp.route('/<int:empresa_id>/usuarios/<int:user_id>', methods=['PUT'])
def update_empresa_user(empresa_id, user_id):
    if empresa_id not in company_users or user_id not in company_users[empresa_id]:
        abort(404)
    data = request.get_json(force=True)
    user = company_users[empresa_id][user_id]
    for field in ['name', 'email']:
        if field in data:
            user[field] = data[field]
    users[user_id].update(user)
    return jsonify(user)


@empresa_users_bp.route('/<int:empresa_id>/usuarios/<int:user_id>', methods=['DELETE'])
def delete_empresa_user(empresa_id, user_id):
    if empresa_id not in company_users or user_id not in company_users[empresa_id]:
        abort(404)
    company_users[empresa_id].pop(user_id)
    users.pop(user_id, None)
    return '', 204


app.register_blueprint(users_bp)
app.register_blueprint(empresas_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(empresa_users_bp)

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
