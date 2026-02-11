(() => {
  let isFetching = false;
  let lastFetchAt = 0;

  const getEmpresaId = () => window.EMPRESA_ID || window.empresaId || '';

  const setText = (id, value) => {
    const target = document.getElementById(id);
    if (target) {
      target.textContent = value;
    }
  };

  const formatDate = (value) => {
    if (!value) return '';
    return String(value).slice(0, 19).replace('T', ' ');
  };

  const normalizeStats = (data) => {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const empresa = data.empresa || {};
    const usuarios = data.usuarios || {};
    const hardware = data.hardware || {};
    const alertas = data.alertas || {};

    const usuariosTotal = usuarios.total ?? usuarios.total_usuarios ?? 0;
    const usuariosActivos = usuarios.activos ?? usuarios.usuarios_activos ?? 0;
    const usuariosInactivos = usuarios.inactivos ?? usuarios.usuarios_inactivos ?? 0;

    const hardwareTotal = hardware.total ?? hardware.total_hardware ?? 0;
    const hardwareActivos = hardware.activos ?? hardware.hardware_activo ?? 0;
    const hardwareInactivos = hardware.inactivos ?? hardware.hardware_inactivo ?? 0;

    const alertasTotal = alertas.total ?? alertas.total_alertas ?? 0;
    const alertasActivas = alertas.activas ?? alertas.alertas_activas ?? 0;
    const alertasInactivas = alertas.resueltas ?? alertas.alertas_inactivas ?? 0;

    const actividad30d = alertas.alertas_recientes_30d ?? 0;

    return {
      empresa: {
        id: empresa.id || empresa._id || '',
        nombre: empresa.nombre || '',
        activa: empresa.activa ?? true,
        fecha_creacion: empresa.fecha_creacion || ''
      },
      usuarios: {
        total: usuariosTotal,
        activos: usuariosActivos,
        inactivos: usuariosInactivos
      },
      hardware: {
        total: hardwareTotal,
        activos: hardwareActivos,
        inactivos: hardwareInactivos,
        por_tipo: hardware.por_tipo || {}
      },
      alertas: {
        total: alertasTotal,
        activas: alertasActivas,
        resueltas: alertasInactivas,
        por_prioridad: alertas.alertas_por_prioridad || {}
      },
      actividad_reciente: {
        logs_ultimos_30_dias: actividad30d,
        ultima_actividad: empresa.ultima_actividad || ''
      }
    };
  };

  const updateStatsView = (stats) => {
    if (!stats || typeof stats !== 'object') {
      return;
    }

    const empresa = stats.empresa || {};
    const usuarios = stats.usuarios || {};
    const hardware = stats.hardware || {};
    const alertas = stats.alertas || {};
    const actividad = stats.actividad_reciente || {};

    const empresaName = empresa.nombre || '';
    setText('empresaStatsName', empresaName);
    setText('empresaStatsTitle', empresaName);
    setText('empresaStatsInitials', empresaName.slice(0, 2).toUpperCase() || 'EM');
    setText('empresaStatsCreated', (empresa.fecha_creacion || '').slice(0, 10));
    setText('empresaStatsStatus', empresa.activa ? 'ACTIVA' : 'INACTIVA');

    setText('empresaStatsUsuariosTotal', usuarios.total ?? 0);
    setText('empresaStatsUsuariosActivos', usuarios.activos ?? 0);
    setText('empresaStatsHardwareTotal', hardware.total ?? 0);
    setText('empresaStatsHardwareActivos', hardware.activos ?? 0);
    setText('empresaStatsAlertasTotal', alertas.total ?? 0);
    setText('empresaStatsAlertasActivas', alertas.activas ?? 0);
    setText('empresaStatsActividad30d', actividad.logs_ultimos_30_dias ?? 0);

    setText('empresaStatsUsuariosActivosDetail', usuarios.activos ?? 0);
    setText('empresaStatsUsuariosInactivos', usuarios.inactivos ?? 0);
    setText('empresaStatsUsuariosTotalDetail', usuarios.total ?? 0);
    setText('empresaStatsLogs30d', actividad.logs_ultimos_30_dias ?? 0);
    setText('empresaStatsLastActivity', formatDate(actividad.ultima_actividad));

    const hardwareList = document.getElementById('empresaStatsHardwareTipos');
    if (hardwareList) {
      hardwareList.innerHTML = '';
      const porTipo = hardware.por_tipo || {};
      Object.entries(porTipo).forEach(([tipo, cantidad]) => {
        const row = document.createElement('div');
        row.className = 'flex justify-between text-sm';
        row.innerHTML = `
          <span class="text-gray-600 dark:text-white/70">${tipo}</span>
          <span class="text-black dark:text-white font-semibold">${cantidad}</span>
        `;
        hardwareList.appendChild(row);
      });
    }

    const alertasList = document.getElementById('empresaStatsAlertasPrioridad');
    if (alertasList) {
      alertasList.innerHTML = '';
      const porPrioridad = alertas.por_prioridad || {};
      Object.entries(porPrioridad).forEach(([prioridad, cantidad]) => {
        const row = document.createElement('div');
        row.className = 'flex justify-between text-sm';
        row.innerHTML = `
          <span class="text-gray-600 dark:text-white/70">${prioridad}</span>
          <span class="text-black dark:text-white font-semibold">${cantidad}</span>
        `;
        alertasList.appendChild(row);
      });
    }
  };

  const fetchStats = async () => {
    if (isFetching) {
      return;
    }

    const now = Date.now();
    if (now - lastFetchAt < 500) {
      return;
    }

    const empresaId = getEmpresaId();
    if (!empresaId) {
      return;
    }

    try {
      isFetching = true;
      lastFetchAt = now;

      const endpoint = `/api/empresas/${empresaId}/statistics`;
      const api = window.EmpresaSpaApi || null;
      let response;

      if (api?.request) {
        response = await api.request(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        const buildApiUrl = typeof window.__buildApiUrl === 'function'
          ? window.__buildApiUrl
          : null;
        const baseUrl = buildApiUrl ? buildApiUrl('') : (window.__APP_CONFIG?.apiUrl || '');
        if (!baseUrl && !buildApiUrl) {
          return;
        }
        const url = buildApiUrl ? buildApiUrl(endpoint) : `${baseUrl}${endpoint}`;
        response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      if (payload?.success && payload.data) {
        const normalized = normalizeStats(payload.data);
        updateStatsView(normalized || payload.data);
      }
    } catch (error) {
    } finally {
      isFetching = false;
    }
  };

  window.exportEmpresaStats = () => {
    alert('Funcionalidad de exportación en desarrollo');
  };

  const viewName = 'stats';

  const mount = () => {
    fetchStats();
  };

  const unmount = () => {};

  window.EmpresaSpaViews = window.EmpresaSpaViews || {};
  const existing = window.EmpresaSpaViews[viewName];
  if (Array.isArray(existing)) {
    existing.push({ mount, unmount });
  } else if (existing) {
    window.EmpresaSpaViews[viewName] = [existing, { mount, unmount }];
  } else {
    window.EmpresaSpaViews[viewName] = [{ mount, unmount }];
  }

  if (!window.EMPRESA_SPA_MANUAL_INIT) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount, { once: true });
    } else {
      mount();
    }
  }

})();
