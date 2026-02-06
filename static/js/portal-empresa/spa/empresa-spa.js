(() => {
  const container = document.querySelector('[data-empresa-spa]');
  if (!container) {
    return;
  }

  window.empresaSpa = {
    setContent: (html) => {
      container.innerHTML = html;
    },
    getContainer: () => container
  };
})();
