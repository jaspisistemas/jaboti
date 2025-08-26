export const shouldDebugAuth = () => String(import.meta.env.VITE_DEBUG_AUTH || '').toLowerCase() === 'true';

export const maskToken = (t?: string | null) => {
  if (!t) return 'null';
  const s = String(t);
  if (s.length <= 10) return `${s.substring(0, 2)}…${s.substring(s.length - 2)}`;
  return `${s.substring(0, 4)}…${s.substring(s.length - 6)}`;
};

export function debugAuthLog(label: string, payload?: Record<string, unknown>) {
  if (!shouldDebugAuth()) return;
  // eslint-disable-next-line no-console
  console.log(`[AUTH-DEBUG] ${label}`, payload || '');
}
