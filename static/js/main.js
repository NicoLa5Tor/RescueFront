// static/js/main.js

// Inicializar AOS (Animate On Scroll)
AOS.init({
    duration: 1000,
    once: true,
    offset: 100
});

// Configuración global de Axios
axios.defaults.baseURL = window.API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Manejo de errores global
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Clase principal para el manejo de la API
class ApiClient {
    constructor(baseURL = window.API_BASE_URL) {
        this.baseURL = baseURL;
    }

    // ===== USUARIOS =====
    async getUsers() {
        try {
            const response = await axios.get('/api/users');
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getUser(userId) {
        try {
            const response = await axios.get(`/api/users/${userId}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async createUser(userData) {
        try {
            const response = await axios.post('/api/users', userData);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async updateUser(userId, userData) {
        try {
            const response = await axios.put(`/api/users/${userId}`, userData);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async deleteUser(userId) {
        try {
            const response = await axios.delete(`/api/users/${userId}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getUsersByAge(minAge, maxAge) {
        try {
            const response = await axios.get('/api/users/age-range', {
                params: { min_age: minAge, max_age: maxAge }
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    // ===== EMPRESAS =====
    async getEmpresas() {
        try {
            const response = await axios.get('/api/empresas');
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getEmpresa(empresaId) {
        try {
            const response = await axios.get(`/api/empresas/${empresaId}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async createEmpresa(empresaData) {
        try {
            const response = await axios.post('/api/empresas', empresaData);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async updateEmpresa(empresaId, empresaData) {
        try {
            const response = await axios.put(`/api/empresas/${empresaId}`, empresaData);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async deleteEmpresa(empresaId) {
        try {
            const response = await axios.delete(`/api/empresas/${empresaId}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getMyEmpresas() {
        try {
            const response = await axios.get('/api/empresas/mis-empresas');
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async searchEmpresasByUbicacion(ubicacion) {
        try {
            const response = await axios.get('/api/empresas/buscar-por-ubicacion', {
                params: { ubicacion }
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getEmpresaStats() {
        try {
            const response = await axios.get('/api/empresas/estadisticas');
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    // ===== MULTI-TENANT =====
    async getUsuariosByEmpresa(empresaId) {
        try {
            const response = await axios.get(`/empresas/${empresaId}/usuarios`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getUsuarioByEmpresa(empresaId, usuarioId) {
        try {
            const response = await axios.get(`/empresas/${empresaId}/usuarios/${usuarioId}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async createUsuarioForEmpresa(empresaId, usuarioData) {
        try {
            const response = await axios.post(`/empresas/${empresaId}/usuarios`, usuarioData);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async updateUsuarioByEmpresa(empresaId, usuarioId, usuarioData) {
        try {
            const response = await axios.put(`/empresas/${empresaId}/usuarios/${usuarioId}`, usuarioData);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async deleteUsuarioByEmpresa(empresaId, usuarioId) {
        try {
            const response = await axios.delete(`/empresas/${empresaId}/usuarios/${usuarioId}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    // Manejo de errores
    handleError(error) {
        console.error('API Error:', error);
        const message = error.response?.data?.message || 'Error en la operación';
        showNotification(message, 'error');
        throw error;
    }
}

// Instancia global del cliente API
window.apiClient = new ApiClient();

// ===== FUNCIONES UTILITARIAS =====

// Mostrar notificaciones
function showNotification(message, type = 'info') {
    const icons = {
        success: 'success',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };

    Swal.fire({
        icon: icons[type] || 'info',
        title: message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

// Confirmar acción
async function confirmAction(title, text) {
    const result = await Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar'
    });
    return result.isConfirmed;
}

// Mostrar loading
function showLoading(message = 'Cargando...') {
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

// Ocultar loading
function hideLoading() {
    Swal.close();
}

// Formatear fecha
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// ===== EFECTOS VISUALES =====

// Parallax effect
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.parallax-bg');
    
    parallaxElements.forEach(element => {
        const speed = element.dataset.speed || 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });

    // Navbar scroll effect
    const navbar = document.getElementById('mainNav');
    if (navbar) {
        if (scrolled > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== FORMULARIOS =====

// Validación de formularios Bootstrap
(function() {
    'use strict';
    window.addEventListener('load', function() {
        const forms = document.getElementsByClassName('needs-validation');
        Array.prototype.filter.call(forms, function(form) {
            form.addEventListener('submit', function(event) {
                if (form.checkValidity() === false) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });
    }, false);
})();

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            email: formData.get('email'),
            password: formData.get('password'),
            user_type: formData.get('user_type')
        };
        
        try {
            showLoading('Iniciando sesión...');
            const response = await axios.post('/api/login', data);
            
            if (response.data.success) {
                window.location.href = response.data.redirect;
            }
        } catch (error) {
            hideLoading();
            showNotification(error.response?.data?.message || 'Error al iniciar sesión', 'error');
        }
    });
}

// ===== TABLAS DINÁMICAS =====

// Crear tabla con DataTables
function createDataTable(selector, options = {}) {
    const defaultOptions = {
        language: {
            url: '//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json'
        },
        responsive: true,
        pageLength: 10,
        dom: 'Bfrtip',
        buttons: ['copy', 'excel', 'pdf']
    };
    
    return $(selector).DataTable({...defaultOptions, ...options});
}

// ===== GRÁFICOS =====

// Crear gráfico de líneas
function createLineChart(canvasId, labels, data, label = 'Datos') {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}

// Crear gráfico de barras
function createBarChart(canvasId, labels, data, label = 'Datos') {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Crear gráfico de dona
function createDoughnutChart(canvasId, labels, data) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#f093fb',
                    '#4facfe',
                    '#00f2fe'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// ===== INICIALIZACIÓN =====

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Inicializar popovers de Bootstrap
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
});