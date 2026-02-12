(function() {
  const userLocale = navigator.language || 'es-ES';
  const userZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  window.detectedUserLocale = userLocale;
  window.detectedUserZone = userZone;

  function parseISODate(isoString) {
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

  function formatDateTimeForUser(isoString, options = { dateStyle: 'short', timeStyle: 'short' }) {
    const date = parseISODate(isoString);
    if (!date) return '';
    try {
      if (userZone && userZone !== 'UTC') {
        return new Intl.DateTimeFormat(userLocale, { ...options, timeZone: userZone }).format(date);
      }
      return date.toLocaleString(userLocale, options);
    } catch (e) {
      return '';
    }
  }

  window.formatDateTimeForUser = formatDateTimeForUser;
  window.parseISODate = parseISODate;
})();
