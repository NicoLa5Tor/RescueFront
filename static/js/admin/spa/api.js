(() => {
  const buildApiUrl = window.__buildApiUrl || ((path = '') => {
    const base = window.__APP_CONFIG && window.__APP_CONFIG.apiUrl;
    if (!base) {
      throw new Error('API URL no configurada');
    }
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    if (!path) {
      return normalizedBase;
    }
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  });

  const getClient = () => {
    if (window.apiClient) {
      return window.apiClient;
    }
    if (typeof window.EndpointTestClient !== 'undefined') {
      window.apiClient = new window.EndpointTestClient();
      return window.apiClient;
    }
    return null;
  };

  const request = (path, options = {}) => {
    const url = buildApiUrl(path);
    return fetch(url, { credentials: 'include', ...options });
  };

  window.AdminSpaApi = {
    buildApiUrl,
    getClient,
    request
  };
})();
