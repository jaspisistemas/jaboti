let accessToken: string | null = null;
let refreshToken: string | null = null;

// Initialize from localStorage (survive hard refresh)
try {
  const at = localStorage.getItem('accessToken');
  const rt = localStorage.getItem('refreshToken');
  accessToken = at || null;
  refreshToken = rt || null;
} catch (_) {
  // ignore if storage not available
}

export const setTokens = (access: string | null, refresh?: string | null) => {
  accessToken = access;
  if (refresh !== undefined) refreshToken = refresh;
  try {
    if (access !== undefined) {
      if (access) localStorage.setItem('accessToken', access); else localStorage.removeItem('accessToken');
    }
    if (refresh !== undefined) {
      if (refresh) localStorage.setItem('refreshToken', refresh); else localStorage.removeItem('refreshToken');
    }
  } catch (_) { /* no-op */ }
};

export const getAccessToken = () => {
  if (accessToken) return accessToken;
  try { return localStorage.getItem('accessToken'); } catch { return null; }
};
export const getRefreshToken = () => {
  if (refreshToken) return refreshToken;
  try { return localStorage.getItem('refreshToken'); } catch { return null; }
};
export const clearTokens = () => {
  accessToken = null; refreshToken = null;
  try { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); } catch { /* no-op */ }
};

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}
