(function() {
  const userLocale = navigator.language || 'es-ES';
  const userZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function formatDateTimeForUser(isoString, options = { dateStyle: 'short', timeStyle: 'short' }) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date)) return '';
      return new Intl.DateTimeFormat(userLocale, { ...options, timeZone: userZone }).format(date);
    } catch (e) {
      return '';
    }
  }

  window.formatDateTimeForUser = formatDateTimeForUser;
})();
