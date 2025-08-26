type Listener = () => void;
const listeners: Listener[] = [];
const companyListeners: Listener[] = [];

export const onAuthFailure = (cb: Listener) => {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
};

export const triggerAuthFailure = () => {
  for (const cb of [...listeners]) {
    try { cb(); } catch { /* noop */ }
  }
};

export const onCompanyRequired = (cb: Listener) => {
  companyListeners.push(cb);
  return () => {
    const idx = companyListeners.indexOf(cb);
    if (idx >= 0) companyListeners.splice(idx, 1);
  };
};

export const triggerCompanyRequired = () => {
  for (const cb of [...companyListeners]) {
    try { cb(); } catch { /* noop */ }
  }
};
