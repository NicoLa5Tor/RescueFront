function initTheme() {
  const html = document.documentElement;
  const storedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
  html.classList.toggle('dark', isDark);

  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.classList.toggle('fa-moon', !isDark);
    icon.classList.toggle('fa-sun', isDark);
  }

  const toggle = document.getElementById('themeToggle');
  toggle?.addEventListener('click', () => toggleTheme('themeIcon'));
}

function toggleTheme(iconId) {
  const html = document.documentElement;
  const icon = document.getElementById(iconId);
  const isDark = html.classList.contains('dark');
  html.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  if (icon) {
    icon.classList.toggle('fa-moon', isDark);
    icon.classList.toggle('fa-sun', !isDark);
  }

  if (window.gsap) {
    gsap.to('body', {
      backgroundColor: isDark ? '#f9fafb' : '#111827',
      duration: 0.3
    });
    setTimeout(() => {
      if (typeof initializeCharts === 'function') {
        initializeCharts();
      }
    }, 300);
  }
}

document.addEventListener('DOMContentLoaded', initTheme);
