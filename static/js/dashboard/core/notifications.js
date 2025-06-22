class NotificationManager {
  show(message, type = 'info') {
    if (window.Swal) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: type,
        title: message,
        timer: 3000,
        showConfirmButton: false
      });
    } else {
      console.log(`[${type}] ${message}`);
    }
  }
  hide() {}
  clear() {}
}

window.NotificationManager = NotificationManager;
