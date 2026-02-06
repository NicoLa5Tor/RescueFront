(() => {
  const usuariosDataElement = document.getElementById('usuariosData');
  if (!usuariosDataElement) {
    return;
  }

  try {
    const usuariosDataText = usuariosDataElement.textContent;
    window.USUARIOS_DATA = usuariosDataText && usuariosDataText !== 'null'
      ? JSON.parse(usuariosDataText)
      : null;
  } catch (error) {
    window.USUARIOS_DATA = null;
  }
})();
