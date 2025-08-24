(function() {
  function getTimeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return '';
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
