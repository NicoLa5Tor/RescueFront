(() => {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  if (!themeToggle || !themeIcon) return;

  const applyTheme = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      themeIcon.className = 'fas fa-sun';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      themeIcon.className = 'fas fa-moon';
    }
  };

  const loadTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && systemDark);
    applyTheme(isDark);
  };

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    applyTheme(!isDark);
  });

  loadTheme();
})();
