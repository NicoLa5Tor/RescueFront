class ThemeManager {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.toggleBtn = document.getElementById('themeToggle');
    this.init();
  }

  init() {
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggle());
    }
    this.updateIcon();
  }

  toggle() {
    const newTheme = this.get() === 'dark' ? 'light' : 'dark';
    this.set(newTheme);
  }

  get() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  set(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    this.updateIcon();
  }

  updateIcon() {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    if (this.get() === 'dark') {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
  }
}

window.ThemeManager = ThemeManager;
