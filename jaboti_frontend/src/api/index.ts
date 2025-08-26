import axios, { AxiosError } from 'axios';
import { triggerAuthFailure, triggerCompanyRequired } from '../auth/events';
import { clearAppContext } from './appContext';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenManager';
import { debugAuthLog, maskToken, shouldDebugAuth } from '../utils/debug';

function computeBaseURL(): string {
  const raw = (import.meta.env as any).VITE_API_BASE_URL as string | undefined;
  
  // Se VITE_API_BASE_URL estiver definido, use-o
  if (raw) {
    return raw.replace(/\/+$/, '');
  }
  
  try {
    const proto = (typeof window !== 'undefined' ? window.location.protocol : 'http:') || 'http:';
    const host = (typeof window !== 'undefined' ? window.location.hostname : 'localhost') || 'localhost';
    
    // Para desenvolvimento, sempre usar localhost para a API
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3523';
    }
    
    // Caso contrário, use o host atual com porta 3523
    return `${proto}//${host}:3523`;
  } catch {
    return 'http://localhost:3523';
  }
}

const api = axios.create({
  baseURL: computeBaseURL(),
  timeout: 15000,
});

api.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (shouldDebugAuth()) {
    debugAuthLog('REQ', { url: `${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, hasBearer: !!token });
  }
  return config;
});

let isRefreshing = false;
let queue: { resolve: (token: string|null)=>void; reject: (err: any)=>void }[] = [];

const processQueue = (token: string | null, error: any) => {
  queue.forEach(p => token ? p.resolve(token) : p.reject(error));
  queue = [];
};

api.interceptors.response.use(r => r, async (error: AxiosError) => {
  const original: any = error.config;
  // Detect company-required condition (403 with specific message)
  if (error.response?.status === 403) {
    const msg = (error.response.data as any)?.message || (error.response.data as any)?.error || '';
    const txt = String(msg || '').toLowerCase();
    if (txt.includes('active company required') || txt.includes('empresa ativa obrigatória') || txt.includes('active company')) {
      try { triggerCompanyRequired(); } catch {}
    }
  }
  if (error.response?.status === 401 && !original._retry) {
    // If the failing request is the refresh itself, don't try to refresh again
    const url = (original?.url || '') as string;
    if (url.includes('/auth/refresh')) {
      clearTokens();
      try { triggerAuthFailure(); } catch {}
      return Promise.reject(error);
    }
    original._retry = true;
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve: (token) => {
          if (token && original.headers) original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        }, reject });
      });
    }
    isRefreshing = true;
    try {
      const refresh = getRefreshToken();
      if (!refresh) throw error;
      debugAuthLog('REFRESH START', { refresh: maskToken(refresh) });
      const resp = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: refresh });
      const { accessToken, refreshToken } = resp.data || {};
      debugAuthLog('REFRESH OK', { access: maskToken(accessToken), refresh: maskToken(refreshToken) });
      if (accessToken) setTokens(accessToken, refreshToken);
      processQueue(accessToken || null, null);
      if (original.headers && accessToken) original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);
    } catch (err) {
      debugAuthLog('REFRESH FAIL', { err: (err as any)?.message || 'error', code: (err as any)?.code });
      clearTokens();
  try { clearAppContext(); } catch {}
      processQueue(null, err);
  // Notify app to navigate via React
  try { triggerAuthFailure(); } catch {}
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
  return Promise.reject(error);
});

export default api;
