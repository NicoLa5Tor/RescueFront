(() => {
  const resolveElements = () => ({
    toggle: document.getElementById('themeToggle'),
    icon: document.getElementById('themeIcon')
  });

  const applyTheme = (isDark) => {
    const { icon } = resolveElements();
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      if (icon) icon.className = 'fas fa-sun';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      if (icon) icon.className = 'fas fa-moon';
    }
  };

  const loadTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && systemDark);
    applyTheme(isDark);
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    applyTheme(!isDark);
  };

  window.empresaThemeToggle = toggleTheme;

  document.addEventListener('click', (event) => {
    const target = event.target.closest('#themeToggle');
    if (!target) return;
    toggleTheme();
  });

  loadTheme();
})();
