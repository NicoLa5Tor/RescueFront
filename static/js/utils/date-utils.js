(function() {
  function parseISODate(isoString) {
    if (typeof window !== 'undefined' && window.parseISODate) {
      return window.parseISODate(isoString);
    }
    if (!isoString) return null;
    try {
      let normalized = String(isoString);
      if (!/(Z|[+-]\d{2}:?\d{2})$/.test(normalized)) {
        normalized += 'Z';
      }
      const date = new Date(normalized);
      return isNaN(date) ? null : date;
    } catch (e) {
      return null;
    }
  }

  function getTimeAgo(dateString) {
    const date = parseISODate(dateString);
    if (!date) return '';
    const now = new Date();
    let diff = now - date;
    if (diff < 0) diff = 0;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days} día${days !== 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    return `Hace ${seconds} segundo${seconds !== 1 ? 's' : ''}`;
  }

  window.getTimeAgo = getTimeAgo;
})();
