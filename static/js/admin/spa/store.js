(() => {
  const listeners = new Set();
  let state = {};

  const getState = () => ({ ...state });

  const setState = (patch) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(getState()));
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  window.AdminSpaStore = {
    getState,
    setState,
    subscribe
  };
})();
